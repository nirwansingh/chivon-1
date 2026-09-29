import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export class DashboardService {
  static async getDashboardData(params: { dateFrom?: Date; dateTo?: Date; userId?: string; role?: string }) {
    const { dateFrom, dateTo, userId, role } = params;

    const dateFilter = dateFrom || dateTo ? {
      gte: dateFrom,
      lte: dateTo,
    } : undefined;

    // 1. KPI: Customers created in period (and total active)
    const totalCustomers = await prisma.customer.count({
      where: {
        status: 'ACTIVE',
        ...(dateFilter ? { createdAt: dateFilter } : {})
      }
    });

    // 2. Active Opportunities
    const activeOpportunities = await prisma.opportunity.count({
      where: {
        status: { notIn: ['WON', 'LOST'] },
        ...(userId && role === 'SALES' ? { assignedUserId: userId } : {}),
        ...(dateFilter ? { createdAt: dateFilter } : {})
      }
    });

    // 3. Quotation Value
    const quotations = await prisma.quotationRevision.aggregate({
      _sum: { grandTotal: true },
      where: {
        isCurrent: true,
        quotation: {
          status: { in: ['APPROVED', 'SENT', 'ACCEPTED'] },
          ...(userId && role === 'SALES' ? { createdById: userId } : {}),
          ...(dateFilter ? { date: dateFilter } : {})
        }
      }
    });
    const quotationValue = quotations._sum.grandTotal?.toNumber() || 0;

    // 4. Sales Order Value
    const salesOrders = await prisma.salesOrder.aggregate({
      _sum: { grandTotal: true },
      where: {
        status: { notIn: ['DRAFT', 'CANCELLED'] },
        ...(userId && role === 'SALES' ? { createdById: userId } : {}),
        ...(dateFilter ? { date: dateFilter } : {})
      }
    });
    const salesOrderValue = salesOrders._sum.grandTotal?.toNumber() || 0;

    // 5. Invoice Value & Outstanding
    // For outstanding/overdue, we need to calculate it properly.
    const allInvoices = await prisma.invoice.findMany({
      where: {
        status: { notIn: ['DRAFT', 'CANCELLED'] },
        ...(dateFilter ? { date: dateFilter } : {})
      },
      include: {
        allocations: { where: { isReversed: false } },
        creditNotes: true,
      }
    });

    let invoiceValue = 0;
    let outstandingValue = 0;
    let overdueValue = 0;
    const now = new Date();

    allInvoices.forEach(inv => {
      const total = inv.grandTotal.toNumber();
      invoiceValue += total;

      const allocated = inv.allocations.reduce((sum, a) => sum + a.amount.toNumber(), 0);
      const credited = inv.creditNotes.reduce((sum, c) => sum + c.grandTotal.toNumber(), 0);
      
      const outstanding = total - allocated - credited;
      if (outstanding > 0) {
        outstandingValue += outstanding;
        if (inv.dueDate && inv.dueDate < now) {
          overdueValue += outstanding;
        }
      }
    });

    // 6. Collected Payments
    const payments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: { notIn: ['UNALLOCATED'] }, // Only count allocated? Or all received? Let's count all not reversed.
        isReversed: false,
        ...(dateFilter ? { paymentDate: dateFilter } : {})
      }
    });
    const collectedValue = payments._sum.amount?.toNumber() || 0;

    // 7. Recent Data for Tables
    const recentQuotations = await prisma.quotation.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: { customer: { select: { companyName: true } } },
      where: userId && role === 'SALES' ? { createdById: userId } : {}
    });

    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: { customer: { select: { companyName: true } } }
    });

    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { paymentDate: 'desc' },
      include: { customer: { select: { companyName: true } } }
    });

    const upcomingTasks = await prisma.task.findMany({
      take: 5,
      where: {
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { gte: new Date() },
        ...(userId ? { assignedToId: userId } : {})
      },
      orderBy: { dueDate: 'asc' }
    });

    // 8. Charts Data
    // Revenue over time (Group by month for the filtered period, simplified)
    // We will build a simple array from the fetched invoices for the chart
    const revenueByMonth = allInvoices.reduce((acc, inv) => {
      const month = inv.date.toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + inv.grandTotal.toNumber();
      return acc;
    }, {} as Record<string, number>);

    const revenueChart = Object.entries(revenueByMonth)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Pipeline funnel
    const pipelineDataRaw = await prisma.opportunity.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { expectedValue: true },
      where: {
        ...(userId && role === 'SALES' ? { assignedUserId: userId } : {}),
        ...(dateFilter ? { createdAt: dateFilter } : {})
      }
    });

    const pipelineChart = pipelineDataRaw.map(p => ({
      status: p.status,
      count: p._count.id,
      value: p._sum.expectedValue?.toNumber() || 0
    }));

    return {
      kpis: {
        totalCustomers,
        activeOpportunities,
        quotationValue,
        salesOrderValue,
        invoiceValue,
        collectedValue,
        outstandingValue,
        overdueValue
      },
      tables: {
        recentQuotations,
        recentInvoices,
        recentPayments,
        upcomingTasks
      },
      charts: {
        revenueChart,
        pipelineChart
      }
    };
  }
}
