import type { Prisma } from '@prisma/client';
import { api } from './api-client';
import type { ActionResult } from './action-result';

export class InquiryService {
  static getInquiries(params?: {
    search?: string;
    status?: string;
    customerId?: string;
    assignedToId?: string;
  }) {
    return api('/api/inquiries/query', { method: 'POST', body: params || {} });
  }

  static getInquiryById(id: string) {
    return api(`/api/inquiries/${id}`);
  }

  static createInquiry(data: Omit<Prisma.InquiryUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>) {
    return api<ActionResult>('/api/inquiries', { method: 'POST', body: data });
  }

  static updateInquiry(id: string, data: Prisma.InquiryUncheckedUpdateInput) {
    return api<ActionResult>(`/api/inquiries/${id}`, { method: 'PUT', body: data });
  }

  static deleteInquiry(id: string) {
    return api<ActionResult>(`/api/inquiries/${id}`, { method: 'DELETE' });
  }
}
