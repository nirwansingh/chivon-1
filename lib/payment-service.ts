import { prisma } from '@/lib/prisma';
import { AuditService } from '@/lib/audit';
import { DocumentNumberService } from '@/lib/sequence';
import { InvoiceService } from '@/lib/invoice-service';
import { Decimal } from 'decimal.js';

export interface PaymentCreateInput {
  customerId: string;
  amount: number;
  paymentMethod: string; // 'Bank Transfer' | 'Cash' | 'Cheque' | 'Card'
  paymentDate?: Date;
  referenceNumber?: string;
  bank?: string;
  chequeNumber?: string;
  notes?: string;
  allocations?: { invoiceId: string; amount: number }[];
}

export class PaymentService {
  static async create(input: PaymentCreateInput, userId: string) {
    if (input.amount <= 0) throw new Error("Payment amount must be greater than 0");

    const paymentNum = await DocumentNumberService.generateNextNumber('PAY');

    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          number: paymentNum,
          customerId: input.customerId,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          paymentDate: input.paymentDate || new Date(),
          referenceNumber: input.referenceNumber,
          bank: input.bank,
          chequeNumber: input.chequeNumber,
          notes: input.notes,
          createdById: userId,
          status: 'UNALLOCATED',
        }
      });

      if (input.allocations && input.allocations.length > 0) {
        await this.internalAllocate(tx, payment.id, input.allocations, userId);
      }

      await AuditService.log({
        userId,
        module: 'PAYMENT',
        entityType: 'PAYMENT',
        entityId: payment.id,
        action: 'CREATE',
        description: `Payment ${paymentNum} recorded for AED ${input.amount}`
      });

      return payment;
    });
  }

  static async allocate(paymentId: string, allocations: { invoiceId: string; amount: number }[], userId: string) {
    return await prisma.$transaction(async (tx) => {
      await this.internalAllocate(tx, paymentId, allocations, userId);
      
      await AuditService.log({
        userId,
        module: 'PAYMENT',
        entityType: 'PAYMENT',
        entityId: paymentId,
        action: 'ALLOCATE',
        description: `Payment allocated to ${allocations.length} invoices`
      });

      return await tx.payment.findUnique({ where: { id: paymentId }, include: { allocations: true } });
    });
  }

  private static async internalAllocate(
    tx: any, 
    paymentId: string, 
    allocations: { invoiceId: string; amount: number }[],
    userId: string
  ) {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { allocations: { where: { isReversed: false } } }
    });

    if (!payment) throw new Error("Payment not found");
    if (payment.isReversed) throw new Error("Cannot allocate a reversed payment");

    const currentlyAllocated = payment.allocations.reduce((sum: number, a: any) => sum + a.amount.toNumber(), 0);
    const newAllocationTotal = allocations.reduce((sum, a) => sum + a.amount, 0);

    if (currentlyAllocated + newAllocationTotal > payment.amount.toNumber()) {
      throw new Error("Total allocations exceed payment amount");
    }

    for (const alloc of allocations) {
      if (alloc.amount <= 0) continue;

      // Ensure invoice outstanding is sufficient
      const outstanding = await InvoiceService.calculateOutstanding(alloc.invoiceId, tx);
      if (alloc.amount > outstanding) {
        throw new Error(`Allocation (${alloc.amount}) exceeds outstanding balance (${outstanding}) for invoice ${alloc.invoiceId}`);
      }

      await tx.paymentAllocation.create({
        data: {
          paymentId,
          invoiceId: alloc.invoiceId,
          amount: alloc.amount
        }
      });

      await this.updateInvoiceStatus(tx, alloc.invoiceId);
    }

    // Update payment status
    const totalAllocated = currentlyAllocated + newAllocationTotal;
    let newStatus = 'UNALLOCATED';
    if (totalAllocated > 0) {
      if (Math.abs(totalAllocated - payment.amount.toNumber()) < 0.01) {
        newStatus = 'FULLY_ALLOCATED';
      } else {
        newStatus = 'PARTIALLY_ALLOCATED';
      }
    }

    if (payment.status !== newStatus) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: newStatus }
      });
    }
  }

  static async reversePayment(paymentId: string, reason: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { allocations: { where: { isReversed: false } } }
      });

      if (!payment) throw new Error("Payment not found");
      if (payment.isReversed) throw new Error("Payment is already reversed");

      // Mark payment reversed
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          isReversed: true,
          reversalReason: reason,
          reversedById: userId,
          reversedAt: new Date()
        }
      });

      // Reverse allocations
      for (const alloc of payment.allocations) {
        await tx.paymentAllocation.update({
          where: { id: alloc.id },
          data: { isReversed: true }
        });
        await this.updateInvoiceStatus(tx, alloc.invoiceId);
      }

      await AuditService.log({
        userId,
        module: 'PAYMENT',
        entityType: 'PAYMENT',
        entityId: paymentId,
        action: 'REVERSE',
        description: `Payment ${payment.number} reversed. Reason: ${reason}`
      });

      return payment;
    });
  }

  private static async updateInvoiceStatus(tx: any, invoiceId: string) {
    const inv = await tx.invoice.findUnique({ where: { id: invoiceId } });
    if (!inv || inv.status === 'CANCELLED') return;

    const outstanding = await InvoiceService.calculateOutstanding(invoiceId, tx);
    
    let newStatus = inv.status;
    if (outstanding <= 0.01) {
      newStatus = 'PAID';
    } else if (outstanding < inv.grandTotal.toNumber() && outstanding > 0.01) {
      newStatus = 'PARTIALLY_PAID';
    } else if (inv.status === 'PAID' || inv.status === 'PARTIALLY_PAID') {
      // Reverted all payments
      newStatus = 'ISSUED';
    }

    if (inv.status !== newStatus) {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus }
      });
    }
  }
}
