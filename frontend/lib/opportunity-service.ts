import type { Prisma } from '@prisma/client';
import { api } from './api-client';
import type { ActionResult } from './action-result';

export class OpportunityService {
  static getOpportunities(params?: {
    search?: string;
    status?: string;
    customerId?: string;
    assignedUserId?: string;
  }) {
    return api('/api/opportunities/query', { method: 'POST', body: params || {} });
  }

  static getOpportunityById(id: string) {
    return api(`/api/opportunities/${id}`);
  }

  static createOpportunity(data: Omit<Prisma.OpportunityUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>) {
    return api<ActionResult>('/api/opportunities', { method: 'POST', body: data });
  }

  static updateOpportunity(id: string, data: Prisma.OpportunityUncheckedUpdateInput) {
    return api<ActionResult>(`/api/opportunities/${id}`, { method: 'PUT', body: data });
  }

  static updateOpportunityStatus(id: string, status: string) {
    return api<ActionResult>(`/api/opportunities/${id}/status`, { method: 'POST', body: { status } });
  }

  static convertInquiryToOpportunity(inquiryId: string) {
    return api<ActionResult>(`/api/inquiries/${inquiryId}/convert`, { method: 'POST' });
  }
}
