import { prisma } from './prisma';
import { SOAService } from './soa-service';

export interface ReportFilter {
  dateFrom?: Date;
  dateTo?: Date;
  customerId?: string;
  userId?: string; // Created by or assigned to
  status?: string;
}

export class ReportService {
  static buildDateFilter(dateField: string, filters: ReportFilter) {
    if (!filters.dateFrom && !filters.dateTo) return {};
    return {
      [dateField]: {
        ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
        ...(filters.dateTo ? { lte: filters.dateTo } : {})
      }
    };
  }

  static async getQuotationsReport(filters: ReportFilter) {
    const where: any = {
      ...this.buildDateFilter('date', filters),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.userId ? { createdById: filters.userId } : {}),
      ...(filters.status && filters.status !== 'ALL' ? { status: filters.status } : {})
    };

    const items = await prisma.quotation.findMany({
      where,
      include: {
        customer: { select: { companyName: true } },
        createdBy: { select: { name: true } },
        revisions: { where: { isCurrent: true } }
      },
      orderBy: { date: 'desc' }
    });

    const totals = items.reduce((acc, q) => {
      const rev = q.revisions[0];
      if (rev) {
        acc.grandTotal += rev.grandTotal.toNumber();
      }
      return acc;
    }, { grandTotal: 0 });

    return { items, totals };
  }

  static async getSalesOrdersReport(filters: ReportFilter) {
    const where: any = {
      ...this.buildDateFilter('date', filters),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.userId ? { createdById: filters.userId } : {}),
      ...(filters.status && filters.status !== 'ALL' ? { status: filters.status } : {})
    };

    const items = await prisma.salesOrder.findMany({
      where,
      include: {
        customer: { select: { companyName: true } },
        createdBy: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    const totals = items.reduce((acc, so) => {
      acc.grandTotal += so.grandTotal.toNumber();
      return acc;
    }, { grandTotal: 0 });

    return { items, totals };
  }

  static async getInvoicesReport(filters: ReportFilter) {
    const where: any = {
      ...this.buildDateFilter('date', filters),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.userId ? { createdById: filters.userId } : {}),
      ...(filters.status && filters.status !== 'ALL' ? { status: filters.status } : {})
    };

    const items = await prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { companyName: true } },
        createdBy: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    const totals = items.reduce((acc, inv) => {
      acc.grandTotal += inv.grandTotal.toNumber();
      return acc;
    }, { grandTotal: 0 });

    return { items, totals };
  }

  static async getPaymentsReport(filters: ReportFilter) {
    const where: any = {
      ...this.buildDateFilter('paymentDate', filters),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.userId ? { createdById: filters.userId } : {}),
      ...(filters.status && filters.status !== 'ALL' ? { status: filters.status } : {})
    };

    const items = await prisma.payment.findMany({
      where,
      include: {
        customer: { select: { companyName: true } },
        createdBy: { select: { name: true } }
      },
      orderBy: { paymentDate: 'desc' }
    });

    const totals = items.reduce((acc, pay) => {
      acc.amount += pay.amount.toNumber();
      return acc;
    }, { amount: 0 });

    return { items, totals };
  }

  static async getOpportunityPipelineReport(filters: ReportFilter) {
    const where: any = {
      ...this.buildDateFilter('createdAt', filters),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.userId ? { assignedUserId: filters.userId } : {}),
      ...(filters.status && filters.status !== 'ALL' ? { status: filters.status } : {})
    };

    const items = await prisma.opportunity.findMany({
      where,
      include: {
        customer: { select: { companyName: true } },
        assignedUser: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totals = items.reduce((acc, opp) => {
      acc.expectedValue += (opp.expectedValue?.toNumber() || 0);
      return acc;
    }, { expectedValue: 0 });

    return { items, totals };
  }

  static async getProductsReport(filters: ReportFilter) {
    // Product reports might filter by status (ACTIVE/INACTIVE) or just show all
    const where: any = {
      ...(filters.status && filters.status !== 'ALL' ? { status: filters.status } : {})
    };

    const items = await prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });

    const totals = items.reduce((acc, prod) => {
      acc.stockQuantity += prod.stockQuantity.toNumber();
      acc.inventoryValue += (prod.stockQuantity.toNumber() * prod.rate.toNumber());
      return acc;
    }, { stockQuantity: 0, inventoryValue: 0 });

    return { items, totals };
  }

  static async getReceivablesReport(filters: ReportFilter) {
    let receivables = await SOAService.getReceivablesAging();
    
    if (filters.customerId) {
      receivables = receivables.filter(r => r.customerId === filters.customerId);
    }
    
    // We can filter the receivables by date if we wanted, but typically receivables are "as of now"
    return { items: receivables };
  }
}
