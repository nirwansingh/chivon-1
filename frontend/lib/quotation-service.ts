import type { Prisma, Quotation, QuotationStatus } from '@prisma/client';
import type { QuotationFormValues } from '@/app/dashboard/quotations/schema';
import { api } from './api-client';

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
  static getQuotations(params?: {
    search?: string;
    status?: string;
    customerId?: string;
    userId?: string;
  }) {
    return api<QuotationWithRelations[]>('/api/quotations/query', { method: 'POST', body: params || {} });
  }

  static getById(id: string) {
    return api(`/api/quotations/${id}`);
  }

  static create(data: QuotationFormValues, _userId: string) {
    return api<Quotation>('/api/quotations', { method: 'POST', body: data });
  }

  static createRevision(quotationId: string, data: QuotationFormValues, _userId: string) {
    return api<Quotation>(`/api/quotations/${quotationId}/revisions`, { method: 'POST', body: data });
  }

  static updateStatus(id: string, status: QuotationStatus, _userId: string, notes?: string) {
    return api(`/api/quotations/${id}/status`, { method: 'POST', body: { status, notes } });
  }

  static submitForApproval(id: string, _userId: string) {
    return api(`/api/quotations/${id}/submit`, { method: 'POST' });
  }

  static approve(id: string, _userId: string) {
    return api(`/api/quotations/${id}/approve`, { method: 'POST' });
  }

  static reject(id: string, _userId: string, reason: string) {
    return api(`/api/quotations/${id}/reject`, { method: 'POST', body: { reason } });
  }

  static markAsSent(id: string, _userId: string) {
    return api(`/api/quotations/${id}/sent`, { method: 'POST' });
  }

  static convertToSalesOrder(id: string, _userId: string) {
    return api(`/api/quotations/${id}/sales-order`, { method: 'POST' });
  }

  static convertToInvoice(
    quotationId: string,
    revisionId: string,
    itemsToInvoice: { quotationItemId: string; quantity: number }[],
    _userId: string
  ) {
    return api(`/api/quotations/${quotationId}/invoice`, {
      method: 'POST',
      body: { revisionId, items: itemsToInvoice },
    });
  }
}
