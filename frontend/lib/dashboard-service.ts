import { api } from './api-client';

export class DashboardService {
  static getDashboardData(params: { dateFrom?: Date; dateTo?: Date; userId?: string; role?: string }) {
    return api('/api/dashboard', { method: 'POST', body: params });
  }
}
