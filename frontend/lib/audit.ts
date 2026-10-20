import { api } from './api-client';

export class AuditService {
  static getAuditLogs(params: {
    search?: string;
    userId?: string;
    module?: string;
    action?: string;
    entityId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    return api<{ data: unknown[]; total: number }>('/api/audit/query', { method: 'POST', body: params });
  }
}
