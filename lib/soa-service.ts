import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

export interface SOAEntry {
  date: Date;
  type: 'INVOICE' | 'CREDIT_NOTE' | 'PAYMENT' | 'OPENING_BALANCE' | 'CLOSING_BALANCE';
  reference: string;
  description: string;
  debit: number; // Increases balance (Invoices)
  credit: number; // Decreases balance (Payments, Credit Notes)
  balance: number;
}

export interface SOAReport {
  customerId: string;
  customerName: string;
  fromDate: Date;
  toDate: Date;
  openingBalance: number;
  closingBalance: number;
  entries: SOAEntry[];
  aging: {
    current: number; // < 0 days (not yet due) or 0-30 days
    days30: number;  // 1-30 days overdue
    days60: number;  // 31-60 days overdue
    days90: number;  // 61-90 days overdue
    days120Plus: number; // >90 days overdue
    totalOutstanding: number;
  };
}

export class SOAService {
  static async generateSOA(customerId: string, fromDate: Date, toDate: Date): Promise<SOAReport> {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error("Customer not found");

    // 1. Calculate Opening Balance
    const baseOpening = customer.openingReceivable ? customer.openingReceivable.toNumber() : 0;
    const baseDate = customer.openingAsOfDate || new Date(0);

    // Sum all transactions before fromDate (and after baseDate)
    const [pastInvoices, pastCreditNotes, pastPayments] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: {
          customerId,
          status: { not: 'CANCELLED' },
          createdAt: { gte: baseDate, lt: fromDate }
        }
      }),
      prisma.creditNote.aggregate({
        _sum: { grandTotal: true },
        where: {
          invoice: { customerId },
          createdAt: { gte: baseDate, lt: fromDate }
        }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          customerId,
          isReversed: false,
          paymentDate: { gte: baseDate, lt: fromDate }
        }
      })
    ]);

    const openingBalance = baseOpening 
      + (pastInvoices._sum.grandTotal?.toNumber() || 0)
      - (pastCreditNotes._sum.grandTotal?.toNumber() || 0)
      - (pastPayments._sum.amount?.toNumber() || 0);

    // 2. Fetch ledger transactions in range
    const [invoices, creditNotes, payments] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          customerId,
          status: { not: 'CANCELLED' },
          createdAt: { gte: fromDate, lte: toDate }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.creditNote.findMany({
        where: {
          invoice: { customerId },
          createdAt: { gte: fromDate, lte: toDate }
        },
        include: { invoice: true },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.payment.findMany({
        where: {
          customerId,
          isReversed: false,
          paymentDate: { gte: fromDate, lte: toDate }
        },
        orderBy: { paymentDate: 'asc' }
      })
    ]);

    // Map to generic entries and sort by date
    let rawEntries: (Omit<SOAEntry, 'balance'> & { date: Date })[] = [];

    invoices.forEach(inv => {
      rawEntries.push({
        date: inv.createdAt,
        type: 'INVOICE',
        reference: inv.number,
        description: 'Invoice Issued',
        debit: inv.grandTotal.toNumber(),
        credit: 0
      });
    });

    creditNotes.forEach(cn => {
      rawEntries.push({
        date: cn.createdAt,
        type: 'CREDIT_NOTE',
        reference: cn.number,
        description: `Credit Note against ${cn.invoice.number}`,
        debit: 0,
        credit: cn.grandTotal.toNumber()
      });
    });

    payments.forEach(pay => {
      rawEntries.push({
        date: pay.paymentDate,
        type: 'PAYMENT',
        reference: pay.number,
        description: pay.paymentMethod + (pay.referenceNumber ? ` - ${pay.referenceNumber}` : ''),
        debit: 0,
        credit: pay.amount.toNumber()
      });
    });

    rawEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

    // 3. Compute running balance
    const entries: SOAEntry[] = [];
    
    // Add opening balance entry if applicable
    entries.push({
      date: fromDate,
      type: 'OPENING_BALANCE',
      reference: '',
      description: 'Opening Balance',
      debit: openingBalance >= 0 ? openingBalance : 0,
      credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
      balance: openingBalance
    });

    let currentBalance = openingBalance;
    for (const entry of rawEntries) {
      currentBalance = currentBalance + entry.debit - entry.credit;
      entries.push({
        ...entry,
        balance: currentBalance
      });
    }

    entries.push({
      date: toDate,
      type: 'CLOSING_BALANCE',
      reference: '',
      description: 'Closing Balance',
      debit: currentBalance >= 0 ? currentBalance : 0,
      credit: currentBalance < 0 ? Math.abs(currentBalance) : 0,
      balance: currentBalance
    });

    // 4. Calculate Aging Buckets (using current date, as aging is a live snapshot)
    const allOutstandingInvoices = await prisma.invoice.findMany({
      where: {
        customerId,
        status: { in: ['ISSUED', 'PARTIALLY_PAID'] }
      },
      include: {
        creditNotes: true,
        allocations: { where: { isReversed: false } }
      }
    });

    const aging = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      days120Plus: 0,
      totalOutstanding: 0
    };

    const now = new Date();

    for (const inv of allOutstandingInvoices) {
      const cnTotal = inv.creditNotes.reduce((sum, cn) => sum + cn.grandTotal.toNumber(), 0);
      const payTotal = inv.allocations.reduce((sum, a) => sum + a.amount.toNumber(), 0);
      const outstanding = inv.grandTotal.toNumber() - cnTotal - payTotal;

      if (outstanding <= 0.01) continue;

      aging.totalOutstanding += outstanding;

      const dueDate = inv.dueDate || inv.createdAt;
      if (now <= dueDate) {
        aging.current += outstanding;
      } else {
        const diffTime = Math.abs(now.getTime() - dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays <= 30) {
          aging.days30 += outstanding;
        } else if (diffDays <= 60) {
          aging.days60 += outstanding;
        } else if (diffDays <= 90) {
          aging.days90 += outstanding;
        } else {
          aging.days120Plus += outstanding;
        }
      }
    }
    
    // Add opening balance to total outstanding if it's positive (and we don't have invoices backing it up directly)
    // Actually, openingReceivable is just a starting ledger value. 
    // Usually aging is purely invoice-based. If opening balance represents un-migrated invoices, 
    // it typically goes into 120+ days unless specified.
    if (baseOpening > 0 && customer.openingAsOfDate) {
       // Estimate how much of opening balance is unpaid. This is complex because payments could have paid it.
       // The true outstanding is `currentBalance`. Let's just adjust aging if they don't match.
       // For a strict ERP, unallocated payments reduce the oldest bucket, and opening balances are in 120+.
       // For this CRM, we will just allocate any difference between `aging.totalOutstanding` and `currentBalance` to 120+.
       const diff = currentBalance - aging.totalOutstanding;
       if (diff > 0.01) {
         aging.days120Plus += diff;
         aging.totalOutstanding += diff;
       } else if (diff < -0.01) {
         // Customer has unallocated payments (credit). Apply it to buckets starting from current?
         // We won't do full waterfall payment allocation for aging here, just reduce total.
         aging.totalOutstanding += diff; // diff is negative
       }
    } else {
      // Apply unallocated payments logic if no opening balance but we have unallocated payments
      const unallocatedPayments = await prisma.payment.findMany({
        where: { customerId, status: { in: ['UNALLOCATED', 'PARTIALLY_ALLOCATED'] }, isReversed: false },
        include: { allocations: { where: { isReversed: false } } }
      });
      
      let totalUnallocated = 0;
      unallocatedPayments.forEach(p => {
        const allocated = p.allocations.reduce((sum, a) => sum + a.amount.toNumber(), 0);
        totalUnallocated += (p.amount.toNumber() - allocated);
      });
      
      aging.totalOutstanding -= totalUnallocated;
    }

    return {
      customerId,
      customerName: customer.companyName,
      fromDate,
      toDate,
      openingBalance,
      closingBalance: currentBalance,
      entries,
      aging
    };
  }

  static async getReceivablesAging() {
    const customers = await prisma.customer.findMany({
      where: {
        status: 'ACTIVE'
      }
    });

    const results = [];
    for (const customer of customers) {
      // Just generate SOA for a massive date range to get accurate aging without recreating logic
      // But generateSOA generates all entries which is slow.
      // We can just calculate the aging part.
      
      const allOutstandingInvoices = await prisma.invoice.findMany({
        where: {
          customerId: customer.id,
          status: { in: ['ISSUED', 'PARTIALLY_PAID'] }
        },
        include: {
          creditNotes: true,
          allocations: { where: { isReversed: false } }
        }
      });

      let current = 0, days30 = 0, days60 = 0, days90 = 0, days120Plus = 0, totalOutstanding = 0;
      const now = new Date();

      for (const inv of allOutstandingInvoices) {
        const cnTotal = inv.creditNotes.reduce((sum, cn) => sum + cn.grandTotal.toNumber(), 0);
        const payTotal = inv.allocations.reduce((sum, a) => sum + a.amount.toNumber(), 0);
        const outstanding = inv.grandTotal.toNumber() - cnTotal - payTotal;

        if (outstanding <= 0.01) continue;

        totalOutstanding += outstanding;

        const dueDate = inv.dueDate || inv.createdAt;
        if (now <= dueDate) {
          current += outstanding;
        } else {
          const diffTime = Math.abs(now.getTime() - dueDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          
          if (diffDays <= 30) {
            days30 += outstanding;
          } else if (diffDays <= 60) {
            days60 += outstanding;
          } else if (diffDays <= 90) {
            days90 += outstanding;
          } else {
            days120Plus += outstanding;
          }
        }
      }

      // Add unallocated payments
      const unallocatedPayments = await prisma.payment.findMany({
        where: { customerId: customer.id, status: { in: ['UNALLOCATED', 'PARTIALLY_ALLOCATED'] }, isReversed: false },
        include: { allocations: { where: { isReversed: false } } }
      });
      
      let totalUnallocated = 0;
      unallocatedPayments.forEach(p => {
        const allocated = p.allocations.reduce((sum, a) => sum + a.amount.toNumber(), 0);
        totalUnallocated += (p.amount.toNumber() - allocated);
      });
      
      totalOutstanding -= totalUnallocated;
      
      if (customer.openingReceivable && customer.openingReceivable.toNumber() > 0) {
         const baseOpening = customer.openingReceivable.toNumber();
         // Basic estimation for aging, put opening balance in 120+ if not offset
         days120Plus += baseOpening;
         totalOutstanding += baseOpening;
      }

      if (totalOutstanding > 0.01 || totalOutstanding < -0.01) {
        results.push({
          customerId: customer.id,
          customerName: customer.companyName,
          current,
          days30,
          days60,
          days90,
          days120Plus,
          totalOutstanding,
          unallocatedCredits: totalUnallocated
        });
      }
    }

    return results;
  }
}
