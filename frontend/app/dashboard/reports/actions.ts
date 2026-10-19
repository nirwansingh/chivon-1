'use server';

import { requirePermission } from '@/lib/auth';
import { api } from '@/lib/api-client';
import type { ReportFilter } from '@/lib/report-service';

export async function getReportData(type: string, filters: ReportFilter) {
  await requirePermission('REPORT.VIEW');
  return api<{ success: boolean; data: { items: any[]; totals: any } }>('/api/reports', {
    method: 'POST',
    body: { type, filters },
  });
}

export async function exportReport(type: string, filters: ReportFilter, format: 'CSV' | 'PDF') {
  await requirePermission('REPORT.EXPORT');
  return api<{ success: boolean; data: { items: any[] }; format: string }>('/api/reports', {
    method: 'POST',
    body: { type, filters, format, export: true },
  });
}
