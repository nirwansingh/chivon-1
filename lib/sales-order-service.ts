import { prisma } from '@/lib/prisma';
import { SalesOrderFormValues } from '@/app/dashboard/sales-orders/schema';
import { AuditService } from '@/lib/audit';
import { DocumentNumberService } from '@/lib/sequence';
import { calculateLineItem, calculateDocumentTotals, LineItemInput, LineItemResult } from '@/lib/money';
import { SalesOrderStatus, Prisma } from '@prisma/client';

export class SalesOrderService {
  static async create(data: SalesOrderFormValues, userId: string) {
    const rawCalcResults: LineItemResult[] = [];
    
    const calculatedItems = data.items.map(item => {
      const discountTypeMap: Record<string, 'PERCENTAGE' | 'FIXED_AMOUNT'> = {
        percentage: 'PERCENTAGE',
        fixed: 'FIXED_AMOUNT',
      };
      
      const calcInput: LineItemInput = {
        quantity: item.orderedQty,
        rate: item.rate,
        discountType: item.discountType ? discountTypeMap[item.discountType] : null,
        discountValue: item.discountValue,
        vatRate: item.vatRate,
      };

      const res = calculateLineItem(calcInput);
      rawCalcResults.push(res);

      return {
        ...item,
        discountType: item.discountType || null,
        discountValue: item.discountValue || 0,
        discountAmount: res.discountAmount.toNumber(),
        lineSubtotal: res.lineSubtotal.toNumber(),
        taxableAmount: res.taxableAmount.toNumber(),
        vatAmount: res.vatAmount.toNumber(),
        lineTotal: res.lineTotal.toNumber(),
      };
    });
    
    const totals = calculateDocumentTotals(rawCalcResults);

    const soNumber = await DocumentNumberService.generateNextNumber('SO');

    const salesOrder = await prisma.salesOrder.create({
      data: {
        number: soNumber,
        customerId: data.customerId,
        status: 'DRAFT',
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxableAmount: totals.taxableAmount,
        vatAmount: totals.vatAmount,
        grandTotal: totals.grandTotal,
        notes: data.notes,
        terms: data.terms,
        createdById: userId,
        items: {
          create: calculatedItems.map(item => ({
            productId: item.productId,
            description: item.description,
            orderedQty: item.orderedQty,
            remainingQty: item.orderedQty,
            unit: item.unit,
            rate: item.rate,
            discountType: item.discountType,
            discountValue: item.discountValue,
            discountAmount: item.discountAmount,
            vatRate: item.vatRate,
            vatAmount: item.vatAmount,
            lineSubtotal: item.lineSubtotal,
            lineTotal: item.lineTotal,
          }))
        }
      },
      include: { items: true }
    });

    await AuditService.log({
      userId,
      module: 'SALES_ORDER',
      entityType: 'SALES_ORDER',
      action: 'CREATE',
      entityId: salesOrder.id,
      description: `Created Sales Order ${soNumber}`,
    });

    return salesOrder;
  }

  static async update(id: string, data: SalesOrderFormValues, userId: string) {
    const existing = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existing) {
      throw new Error('Sales Order not found');
    }

    if (existing.status !== 'DRAFT' && existing.status !== 'CONFIRMED') {
      throw new Error(`Cannot edit a sales order in ${existing.status} status.`);
    }

    const rawCalcResults: LineItemResult[] = [];
    const calculatedItems = data.items.map(item => {
      const discountTypeMap: Record<string, 'PERCENTAGE' | 'FIXED_AMOUNT'> = {
        percentage: 'PERCENTAGE',
        fixed: 'FIXED_AMOUNT',
      };
      
      const calcInput: LineItemInput = {
        quantity: item.orderedQty,
        rate: item.rate,
        discountType: item.discountType ? discountTypeMap[item.discountType] : null,
        discountValue: item.discountValue,
        vatRate: item.vatRate,
      };

      const res = calculateLineItem(calcInput);
      rawCalcResults.push(res);

      return {
        ...item,
        discountType: item.discountType || null,
        discountValue: item.discountValue || 0,
        discountAmount: res.discountAmount.toNumber(),
        lineSubtotal: res.lineSubtotal.toNumber(),
        taxableAmount: res.taxableAmount.toNumber(),
        vatAmount: res.vatAmount.toNumber(),
        lineTotal: res.lineTotal.toNumber(),
      };
    });
    
    const totals = calculateDocumentTotals(rawCalcResults);

    const updated = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.salesOrderItem.deleteMany({
        where: { salesOrderId: id }
      });

      // Update SO and create new items
      const so = await tx.salesOrder.update({
        where: { id },
        data: {
          customerId: data.customerId,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          taxableAmount: totals.taxableAmount,
          vatAmount: totals.vatAmount,
          grandTotal: totals.grandTotal,
          notes: data.notes,
          terms: data.terms,
          items: {
            create: calculatedItems.map(item => ({
              productId: item.productId,
              description: item.description,
              orderedQty: item.orderedQty,
              remainingQty: item.orderedQty, // this might need to adjust based on fulfilled/invoiced later, but for edit (Draft/Confirmed) it's same
              unit: item.unit,
              rate: item.rate,
              discountType: item.discountType,
              discountValue: item.discountValue,
              discountAmount: item.discountAmount,
              vatRate: item.vatRate,
              vatAmount: item.vatAmount,
              lineSubtotal: item.lineSubtotal,
              lineTotal: item.lineTotal,
            }))
          }
        },
        include: { items: true }
      });

      return so;
    });

    await AuditService.log({
      userId,
      module: 'SALES_ORDER',
      entityType: 'SALES_ORDER',
      action: 'UPDATE',
      entityId: id,
      description: `Updated Sales Order`,
    });

    return updated;
  }

  static async getById(id: string) {
    return prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } },
        createdBy: true,
        quotation: true,
      }
    });
  }

  static async updateStatus(id: string, status: SalesOrderStatus, userId: string, reason?: string) {
    const so = await prisma.salesOrder.update({
      where: { id },
      data: { status }
    });

    await AuditService.log({
      userId,
      module: 'SALES_ORDER',
      entityType: 'SALES_ORDER',
      action: 'STATUS_CHANGE',
      entityId: id,
      description: `Status changed to ${status}`,
      afterData: { status, reason }
    });

    return so;
  }

  static async cancel(id: string, userId: string, reason: string) {
    const so = await prisma.salesOrder.findUnique({
      where: { id },
      include: { invoices: true }
    });

    if (!so) throw new Error("Sales Order not found");

    if (so.status === 'FULFILLED') {
      throw new Error("Cannot cancel a fulfilled sales order");
    }

    // A sales order shouldn't be cancelled if there are valid invoices attached to it, 
    // or maybe they need to be cancelled first. For now we just cancel it.
    
    const cancelled = await prisma.salesOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledBy: userId,
        cancelledAt: new Date(),
        cancellationReason: reason,
      }
    });

    await AuditService.log({
      userId,
      module: 'SALES_ORDER',
      entityType: 'SALES_ORDER',
      action: 'CANCEL',
      entityId: id,
      description: `Cancelled Sales Order: ${reason}`,
      afterData: { status: 'CANCELLED' }
    });

    return cancelled;
  }

  static async convertToInvoice(
    salesOrderId: string,
    itemsToInvoice: { salesOrderItemId: string; quantity: number }[],
    userId: string
  ) {
    if (itemsToInvoice.length === 0) {
      throw new Error("No items selected for invoicing");
    }

    return await prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.findUnique({
        where: { id: salesOrderId },
        include: { 
          items: {
            include: { product: true }
          }, 
          customer: true 
        }
      });

      if (!so) throw new Error("Sales Order not found");
      if (so.status !== 'CONFIRMED' && so.status !== 'FULFILLED') {
        throw new Error("Sales Order must be confirmed to create an invoice");
      }

      // Check quantities
      const itemsMap = new Map(so.items.map(i => [i.id, i]));
      for (const req of itemsToInvoice) {
        const soItem = itemsMap.get(req.salesOrderItemId);
        if (!soItem) throw new Error(`Item ${req.salesOrderItemId} not found in Sales Order`);
        if (req.quantity <= 0) throw new Error("Invoice quantity must be greater than 0");
        if (req.quantity > soItem.remainingQty.toNumber()) {
          throw new Error(`Cannot invoice ${req.quantity} for item ${soItem.product?.name || soItem.description}. Only ${soItem.remainingQty.toNumber()} remaining.`);
        }
      }

      // Generate invoice number
      const invoiceNumber = await DocumentNumberService.generateNextNumber('INVOICE', tx);

      // Prepare invoice items
      const newInvoiceItems = [];
      const rawCalcResults: LineItemResult[] = [];
      for (const req of itemsToInvoice) {
        const soItem = itemsMap.get(req.salesOrderItemId)!;
        
        // Update SO Item quantities
        await tx.salesOrderItem.update({
          where: { id: soItem.id },
          data: {
            invoicedQty: soItem.invoicedQty.toNumber() + req.quantity,
            remainingQty: soItem.remainingQty.toNumber() - req.quantity,
          }
        });

        // Calculate money
        const calcRes = calculateLineItem({
          quantity: req.quantity,
          rate: soItem.rate.toNumber(),
          discountType: soItem.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT' | null,
          discountValue: soItem.discountValue?.toNumber(),
          vatRate: soItem.vatRate.toNumber(),
        });

        rawCalcResults.push(calcRes);

        newInvoiceItems.push({
          salesOrderItemId: soItem.id,
          productId: soItem.productId,
          description: soItem.description,
          quantity: req.quantity,
          unit: soItem.unit,
          rate: soItem.rate,
          discountType: soItem.discountType,
          discountValue: soItem.discountValue,
          discountAmount: calcRes.discountAmount.toNumber(),
          vatRate: soItem.vatRate,
          vatAmount: calcRes.vatAmount.toNumber(),
          lineSubtotal: calcRes.lineSubtotal.toNumber(),
          lineTotal: calcRes.lineTotal.toNumber(),
        });
      }

      // Update SO status if all items are fully invoiced (for simplicity, we assume invoicing = fulfillment)
      const updatedSOItems = await tx.salesOrderItem.findMany({ where: { salesOrderId } });
      const allFullyInvoiced = updatedSOItems.every(i => i.remainingQty.toNumber() === 0);
      
      if (allFullyInvoiced) {
        await tx.salesOrder.update({
          where: { id: salesOrderId },
          data: { status: 'FULFILLED' }
        });
      }

      const docTotals = calculateDocumentTotals(rawCalcResults);

      const invoice = await tx.invoice.create({
        data: {
          number: invoiceNumber,
          customerId: so.customerId,
          salesOrderId: so.id,
          status: 'DRAFT',
          date: new Date(),
          subtotal: docTotals.subtotal,
          discountAmount: docTotals.discountAmount,
          taxableAmount: docTotals.taxableAmount,
          vatAmount: docTotals.vatAmount,
          grandTotal: docTotals.grandTotal,
          notes: so.notes,
          paymentTerms: so.terms,
          items: {
            create: newInvoiceItems
          }
        }
      });

      await AuditService.log({
        userId,
        module: 'INVOICE',
        entityType: 'INVOICE',
        entityId: invoice.id,
        action: 'CREATE',
        description: `Invoice ${invoiceNumber} created from Sales Order ${so.number}`,
        metadata: { salesOrderId }
      }, tx);

      return invoice;
    });
  }

  static async reopen(id: string, userId: string) {
    const so = await prisma.salesOrder.findUnique({
      where: { id },
    });

    if (!so) throw new Error("Sales Order not found");

    if (so.status !== 'CANCELLED') {
      throw new Error("Only cancelled sales orders can be reopened");
    }

    const reopened = await prisma.salesOrder.update({
      where: { id },
      data: {
        status: 'DRAFT',
        cancelledBy: null,
        cancelledAt: null,
        cancellationReason: null,
      }
    });

    await AuditService.log({
      userId,
      module: 'SALES_ORDER',
      entityType: 'SALES_ORDER',
      entityId: id,
      action: 'REOPEN',
      description: `Sales Order ${reopened.number} reopened to draft status`,
      beforeData: { previousStatus: so.status }
    });

    return reopened;
  }

  static async getSalesOrders(params: {
    search?: string;
    status?: string;
    customerId?: string;
    userId?: string;
  }) {
    const where: Prisma.SalesOrderWhereInput = {};

    if (params.search) {
      where.OR = [
        { number: { contains: params.search, mode: 'insensitive' } },
        { customer: { companyName: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    if (params.status && params.status !== 'ALL') {
      where.status = params.status as SalesOrderStatus;
    }

    if (params.customerId && params.customerId !== 'ALL') {
      where.customerId = params.customerId;
    }

    if (params.userId && params.userId !== 'ALL') {
      where.createdById = params.userId;
    }

    return prisma.salesOrder.findMany({
      where,
      include: {
        customer: true,
        createdBy: true,
        _count: {
          select: { items: true, invoices: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export type SalesOrderWithRelations = Prisma.SalesOrderGetPayload<{
  include: {
    customer: true,
    createdBy: true,
    _count: {
      select: { items: true, invoices: true }
    }
  }
}>;

export type SalesOrderDetails = Prisma.SalesOrderGetPayload<{
  include: {
    customer: true,
    createdBy: true,
    items: {
      include: {
        product: true
      }
    }
  }
}>;
