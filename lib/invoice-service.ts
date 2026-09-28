import { prisma } from '@/lib/prisma';
import { AuditService } from '@/lib/audit';
import { DocumentNumberService } from '@/lib/sequence';
import { calculateLineItem, calculateDocumentTotals, LineItemInput } from '@/lib/money';
import { InvoiceStatus, Prisma } from '@prisma/client';

export class InvoiceService {
  static async getInvoices(params: {
    search?: string;
    status?: string;
    customerId?: string;
  }) {
    const where: any = {};
    
    if (params.search) {
      where.OR = [
        { number: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    
    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }
    
    if (params.customerId && params.customerId !== 'ALL') {
      where.customerId = params.customerId;
    }

    return await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        salesOrder: true,
        quotation: true,
      },
      orderBy: { date: 'desc' }
    });
  }

  static async getById(id: string) {
    return await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
        salesOrder: true,
        quotation: true,
        creditNotes: true,
        allocations: {
          include: { payment: true }
        },
      }
    });
  }

  static async cancel(id: string, userId: string, reason: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!invoice) throw new Error("Invoice not found");

    if (invoice.status === 'PAID') {
      throw new Error("Cannot cancel a paid invoice");
    }

    return await prisma.$transaction(async (tx) => {
      const cancelled = await tx.invoice.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledBy: userId,
        }
      });

      // Restore Sales Order quantities if this invoice came from an SO
      if (invoice.salesOrderId) {
        for (const item of invoice.items) {
          if (item.salesOrderItemId) {
            const soItem = await tx.salesOrderItem.findUnique({ where: { id: item.salesOrderItemId } });
            if (soItem) {
              await tx.salesOrderItem.update({
                where: { id: item.salesOrderItemId },
                data: {
                  invoicedQty: soItem.invoicedQty.toNumber() - item.quantity.toNumber(),
                  remainingQty: soItem.remainingQty.toNumber() + item.quantity.toNumber(),
                }
              });
            }
          }
        }

        // Revert SO status if it was FULFILLED and now there are remaining quantities
        const so = await tx.salesOrder.findUnique({ where: { id: invoice.salesOrderId }, include: { items: true } });
        if (so && so.status === 'FULFILLED') {
          const hasRemaining = so.items.some(i => i.remainingQty.toNumber() > 0);
          if (hasRemaining) {
            await tx.salesOrder.update({
              where: { id: so.id },
              data: { status: 'CONFIRMED' }
            });
          }
        }
      }

      await AuditService.log({
        userId,
        module: 'INVOICE',
        entityType: 'INVOICE',
        entityId: id,
        action: 'CANCEL',
        description: `Invoice ${invoice.number} cancelled. Reason: ${reason}`
      }, tx);

      return cancelled;
    });
  }

  static async calculateOutstanding(id: string, txClient: any = prisma): Promise<number> {
    const inv = await txClient.invoice.findUnique({
      where: { id },
      include: { 
        creditNotes: true,
        allocations: { where: { isReversed: false } }
      }
    });
    if (!inv) throw new Error("Invoice not found");
    if (inv.status === 'CANCELLED') return 0;

    const cnTotal = inv.creditNotes.reduce((sum: number, cn: any) => sum + cn.grandTotal.toNumber(), 0);
    const paymentsTotal = inv.allocations.reduce((sum: number, a: any) => sum + a.amount.toNumber(), 0); 
    
    return inv.grandTotal.toNumber() - cnTotal - paymentsTotal;
  }
}

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    customer: true,
    salesOrder: true,
    quotation: true,
  }
}>;

export type InvoiceDetails = Prisma.InvoiceGetPayload<{
  include: {
    customer: true,
    items: {
      include: { product: true }
    },
    salesOrder: true,
    quotation: true,
    creditNotes: true,
    allocations: {
      include: { payment: true }
    },
  }
}>;
