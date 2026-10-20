import type { Prisma } from '@prisma/client';
import { api } from './api-client';

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: { customer: true; salesOrder: true; quotation: true };
}>;

export type InvoiceDetails = Prisma.InvoiceGetPayload<{
  include: {
    customer: true;
    items: { include: { product: true } };
    salesOrder: true;
    quotation: true;
    creditNotes: true;
    allocations: { include: { payment: true } };
  };
}>;

export class InvoiceService {
  static getInvoices(params: { search?: string; status?: string; customerId?: string }) {
    return api<InvoiceWithRelations[]>('/api/invoices/query', { method: 'POST', body: params });
  }

  static getById(id: string) {
    return api<InvoiceDetails | null>(`/api/invoices/${id}`);
  }

  static cancel(id: string, _userId: string, reason: string) {
    return api(`/api/invoices/${id}/cancel`, { method: 'POST', body: { reason } });
  }

  static async calculateOutstanding(id: string) {
    const result = await api<{ outstanding: number }>(`/api/invoices/${id}/outstanding`);
    return result.outstanding;
  }
}
