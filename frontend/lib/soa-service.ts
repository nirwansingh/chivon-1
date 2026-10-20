import { api } from './api-client';

export interface SOAEntry {
  date: Date;
  type: 'INVOICE' | 'CREDIT_NOTE' | 'PAYMENT' | 'OPENING_BALANCE' | 'CLOSING_BALANCE';
  reference: string;
  description: string;
  debit: number;
  credit: number;
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
    current: number;
    days30: number;
    days60: number;
    days90: number;
    days120Plus: number;
    totalOutstanding: number;
  };
}

export class SOAService {
  static generateSOA(customerId: string, fromDate: Date, toDate: Date) {
    return api<SOAReport>('/api/soa', {
      method: 'POST',
      body: { customerId, fromDate, toDate },
    });
  }

  static getReceivablesAging() {
    return api<
      {
        customerId: string;
        customerName: string;
        current: number;
        days30: number;
        days60: number;
        days90: number;
        days120Plus: number;
        unallocatedCredits: number;
        totalOutstanding: number;
      }[]
    >('/api/receivables');
  }
}
