import { prisma } from '@/lib/prisma';
import { Quotation, QuotationStatus, Prisma } from '@prisma/client';
import { DocumentNumberService } from '@/lib/sequence';
import { calculateLineItem, calculateDocumentTotals, LineItemInput } from '@/lib/money';
import { QuotationFormValues } from '@/app/dashboard/quotations/schema';
import { AuditService } from '@/lib/audit';
import { Decimal } from 'decimal.js';

export type QuotationWithRelations = Prisma.QuotationGetPayload<{
  include: {
    customer: { select: { companyName: true } };
    createdBy: { select: { name: true } };
    revisions: {
      where: { isCurrent: true };
      select: { grandTotal: true; revisionNumber: true };
    };
  };
}>;

export class QuotationService {
  static async getQuotations(params?: {
    search?: string;
    status?: string;
    customerId?: string;
    userId?: string;
  }): Promise<QuotationWithRelations[]> {
    const where: Prisma.QuotationWhereInput = {};

    if (params?.search) {
      where.OR = [
        { number: { contains: params.search, mode: 'insensitive' } },
        { customer: { companyName: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    if (params?.status && params.status !== 'ALL') {
      where.status = params.status as QuotationStatus;
    }

    if (params?.customerId) {
      where.customerId = params.customerId;
    }

    if (params?.userId) {
      where.createdById = params.userId;
    }

    return prisma.quotation.findMany({
      where,
      include: {
        customer: { select: { companyName: true } },
        createdBy: { select: { name: true } },
        revisions: {
          where: { isCurrent: true },
          select: { grandTotal: true, revisionNumber: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  static async getById(id: string) {
    return prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        contact: true,
        opportunity: true,
        createdBy: { select: { name: true } },
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          include: {
            items: {
              include: {
                product: { select: { name: true, sku: true } },
              },
            },
          },
        },
      },
    });
  }

  static async create(data: QuotationFormValues, userId: string): Promise<Quotation> {
    const number = await DocumentNumberService.generateNextNumber('QT');

    // Calculate lines
    const processedItems = data.items.map(item => {
      const discountTypeMap: Record<string, 'PERCENTAGE' | 'FIXED_AMOUNT'> = {
        percentage: 'PERCENTAGE',
        fixed: 'FIXED_AMOUNT',
      };
      
      const calcInput: LineItemInput = {
        quantity: item.quantity,
        rate: item.rate,
        discountType: item.discountType ? discountTypeMap[item.discountType] : null,
        discountValue: item.discountValue,
        vatRate: item.vatRate,
      };

      const res = calculateLineItem(calcInput);

      return {
        ...item,
        discountType: item.discountType || null,
        discountValue: item.discountValue || 0,
        discountAmount: res.discountAmount.toNumber(),
        lineSubtotal: res.lineSubtotal.toNumber(),
        vatAmount: res.vatAmount.toNumber(),
        lineTotal: res.lineTotal.toNumber(),
      };
    });

    const docTotals = calculateDocumentTotals(
      processedItems.map(i => ({
        lineSubtotal: new Decimal(i.lineSubtotal),
        discountAmount: new Decimal(i.discountAmount),
        taxableAmount: new Decimal(i.lineSubtotal).sub(new Decimal(i.discountAmount)),
        vatAmount: new Decimal(i.vatAmount),
        lineTotal: new Decimal(i.lineTotal),
      }))
    );

    // Apply global discount on top if needed, simplifying for now since it's an initial pass
    // We already have docTotals which sums up line totals properly.
    if (data.discountType === 'percentage' && data.discountValue) {
      docTotals.discountAmount = docTotals.discountAmount.add(docTotals.subtotal.mul(data.discountValue).div(100));
    } else if (data.discountType === 'fixed' && data.discountValue) {
      docTotals.discountAmount = docTotals.discountAmount.add(new Decimal(data.discountValue));
    }
    
    // adjust final totals after global discount
    docTotals.taxableAmount = docTotals.subtotal.sub(docTotals.discountAmount);
    docTotals.grandTotal = docTotals.taxableAmount.add(docTotals.vatAmount);

    const quotation = await prisma.$transaction(async (tx) => {
      const q = await tx.quotation.create({
        data: {
          number,
          customerId: data.customerId,
          contactId: data.contactId,
          opportunityId: data.opportunityId,
          validUntil: data.validUntil,
          notes: data.notes,
          terms: data.terms,
          createdById: userId,
          status: 'DRAFT',
          revisions: {
            create: {
              revisionNumber: 0,
              isCurrent: true,
              subtotal: docTotals.subtotal.toNumber(),
              discountType: data.discountType || null,
              discountValue: data.discountValue || 0,
              discountAmount: docTotals.discountAmount.toNumber(),
              taxableAmount: docTotals.taxableAmount.toNumber(),
              vatAmount: docTotals.vatAmount.toNumber(),
              grandTotal: docTotals.grandTotal.toNumber(),
              items: {
                create: processedItems.map(item => ({
                  productId: item.productId,
                  description: item.description,
                  quantity: item.quantity,
                  unit: item.unit,
                  rate: item.rate,
                  discountType: item.discountType,
                  discountValue: item.discountValue,
                  discountAmount: item.discountAmount,
                  vatRate: item.vatRate,
                  vatAmount: item.vatAmount,
                  lineSubtotal: item.lineSubtotal,
                  lineTotal: item.lineTotal,
                })),
              },
            },
          },
        },
      });

      return q;
    });

    await AuditService.log({
      userId,
      module: 'QUOTATION',
      entityType: 'QUOTATION',
      action: 'CREATE',
      entityId: quotation.id,
      description: 'Created quotation Rev 0',
      afterData: { number, totals: docTotals }
    });

    return quotation;
  }

  static async createRevision(quotationId: string, data: QuotationFormValues, userId: string): Promise<Quotation> {
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { revisions: { select: { revisionNumber: true } } },
    });

    if (!existingQuotation) {
      throw new Error('Quotation not found');
    }

    const nextRevisionNumber = Math.max(...existingQuotation.revisions.map(r => r.revisionNumber), -1) + 1;

    // Calculate lines (same logic as create)
    const processedItems = data.items.map(item => {
      const discountTypeMap: Record<string, 'PERCENTAGE' | 'FIXED_AMOUNT'> = {
        percentage: 'PERCENTAGE',
        fixed: 'FIXED_AMOUNT',
      };
      
      const calcInput: LineItemInput = {
        quantity: item.quantity,
        rate: item.rate,
        discountType: item.discountType ? discountTypeMap[item.discountType] : null,
        discountValue: item.discountValue,
        vatRate: item.vatRate,
      };

      const res = calculateLineItem(calcInput);

      return {
        ...item,
        discountType: item.discountType || null,
        discountValue: item.discountValue || 0,
        discountAmount: res.discountAmount.toNumber(),
        lineSubtotal: res.lineSubtotal.toNumber(),
        vatAmount: res.vatAmount.toNumber(),
        lineTotal: res.lineTotal.toNumber(),
      };
    });

    const docTotals = calculateDocumentTotals(
      processedItems.map(i => ({
        lineSubtotal: new Decimal(i.lineSubtotal),
        discountAmount: new Decimal(i.discountAmount),
        taxableAmount: new Decimal(i.lineSubtotal).sub(new Decimal(i.discountAmount)),
        vatAmount: new Decimal(i.vatAmount),
        lineTotal: new Decimal(i.lineTotal),
      }))
    );

    if (data.discountType === 'percentage' && data.discountValue) {
      docTotals.discountAmount = docTotals.discountAmount.add(docTotals.subtotal.mul(data.discountValue).div(100));
    } else if (data.discountType === 'fixed' && data.discountValue) {
      docTotals.discountAmount = docTotals.discountAmount.add(new Decimal(data.discountValue));
    }
    
    docTotals.taxableAmount = docTotals.subtotal.sub(docTotals.discountAmount);
    docTotals.grandTotal = docTotals.taxableAmount.add(docTotals.vatAmount);

    const quotation = await prisma.$transaction(async (tx) => {
      // First set all existing revisions to isCurrent = false
      await tx.quotationRevision.updateMany({
        where: { quotationId },
        data: { isCurrent: false },
      });

      // Update the base quotation record with any high-level changes
      const q = await tx.quotation.update({
        where: { id: quotationId },
        data: {
          validUntil: data.validUntil,
          notes: data.notes,
          terms: data.terms,
          status: 'DRAFT', // Revert to draft on new revision
          revisions: {
            create: {
              revisionNumber: nextRevisionNumber,
              isCurrent: true,
              subtotal: docTotals.subtotal.toNumber(),
              discountType: data.discountType || null,
              discountValue: data.discountValue || 0,
              discountAmount: docTotals.discountAmount.toNumber(),
              taxableAmount: docTotals.taxableAmount.toNumber(),
              vatAmount: docTotals.vatAmount.toNumber(),
              grandTotal: docTotals.grandTotal.toNumber(),
              items: {
                create: processedItems.map(item => ({
                  productId: item.productId,
                  description: item.description,
                  quantity: item.quantity,
                  unit: item.unit,
                  rate: item.rate,
                  discountType: item.discountType,
                  discountValue: item.discountValue,
                  discountAmount: item.discountAmount,
                  vatRate: item.vatRate,
                  vatAmount: item.vatAmount,
                  lineSubtotal: item.lineSubtotal,
                  lineTotal: item.lineTotal,
                })),
              },
            },
          },
        },
      });

      return q;
    });

    await AuditService.log({
      userId,
      module: 'QUOTATION',
      entityType: 'QUOTATION',
      action: 'UPDATE',
      entityId: quotation.id,
      description: `Created revision ${nextRevisionNumber}`,
      afterData: { totals: docTotals }
    });

    return quotation;
  }

  static async updateStatus(id: string, status: QuotationStatus, userId: string, notes?: string) {
    const q = await prisma.quotation.update({
      where: { id },
      data: { status }
    });
    
    await AuditService.log({
      userId,
      module: 'QUOTATION',
      entityType: 'QUOTATION',
      entityId: id,
      action: 'UPDATE',
      description: `Status changed to ${status}${notes ? ` - ${notes}` : ''}`,
      afterData: { status }
    });
    return q;
  }

  static async submitForApproval(id: string, userId: string) {
    const settings = await prisma.documentSetting.findUnique({ where: { id: 'default' } });
    const requiresApproval = settings?.quotationApproval ?? true;

    return this.updateStatus(id, requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED', userId, 'Submitted');
  }

  static async approve(id: string, userId: string) {
    return this.updateStatus(id, 'APPROVED', userId, 'Approved');
  }

  static async reject(id: string, userId: string, reason: string) {
    const q = await prisma.quotation.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason, rejectionStage: 'APPROVAL' }
    });

    await AuditService.log({
      userId,
      module: 'QUOTATION',
      entityType: 'QUOTATION',
      entityId: id,
      action: 'UPDATE',
      description: `Rejected: ${reason}`,
      afterData: { status: 'REJECTED', rejectionReason: reason }
    });
    return q;
  }

  static async markAsSent(id: string, userId: string) {
    return this.updateStatus(id, 'SENT', userId);
  }

  static async convertToSalesOrder(id: string, userId: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        revisions: {
          where: { isCurrent: true },
          include: { items: true }
        }
      }
    });

    if (!quotation || quotation.revisions.length === 0) {
      throw new Error('Quotation or current revision not found');
    }

    const currentRev = quotation.revisions[0];

    if (quotation.status !== 'APPROVED' && quotation.status !== 'SENT' && quotation.status !== 'ACCEPTED') {
      throw new Error('Only approved, sent, or accepted quotations can be converted to sales orders.');
    }

    const soNumber = await DocumentNumberService.generateNextNumber('SO');

    const salesOrder = await prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.create({
        data: {
          number: soNumber,
          customerId: quotation.customerId,
          quotationId: quotation.id,
          quotationRevisionId: currentRev.id,
          status: 'DRAFT',
          subtotal: currentRev.subtotal,
          discountAmount: currentRev.discountAmount,
          taxableAmount: currentRev.taxableAmount,
          vatAmount: currentRev.vatAmount,
          grandTotal: currentRev.grandTotal,
          notes: quotation.notes,
          terms: quotation.terms,
          createdById: userId,
          items: {
            create: currentRev.items.map(item => ({
              productId: item.productId,
              description: item.description,
              orderedQty: item.quantity,
              remainingQty: item.quantity,
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
        }
      });

      await tx.quotation.update({
        where: { id },
        data: { status: 'ACCEPTED' }
      });

      // Need to log using tx if AuditService supports it, otherwise log outside
      // But since AuditService doesn't accept tx in our implementation, we can just log after transaction.
      return so;
    });

    await AuditService.log({
      userId,
      module: 'QUOTATION',
      entityType: 'QUOTATION',
      action: 'CONVERT_TO_SO',
      entityId: quotation.id,
      description: `Converted to Sales Order: ${soNumber}`,
      afterData: { status: 'ACCEPTED', salesOrderId: salesOrder.id }
    });

    return salesOrder;
  }
}
