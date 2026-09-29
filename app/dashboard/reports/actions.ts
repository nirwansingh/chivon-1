'use server';

import { requirePermission } from '@/lib/auth';
import { ReportService, ReportFilter } from '@/lib/report-service';
import { AuditService } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { PERMISSIONS } from '@/lib/permissions';

export async function getReportData(type: string, filters: ReportFilter) {
  const user = await requirePermission('REPORT.VIEW');

  let data: any = { items: [], totals: {} };

  switch (type) {
    case 'QUOTATION':
      data = await ReportService.getQuotationsReport(filters);
      break;
    case 'SALES_ORDER':
      data = await ReportService.getSalesOrdersReport(filters);
      break;
    case 'INVOICE':
      data = await ReportService.getInvoicesReport(filters);
      break;
    case 'PAYMENT':
      data = await ReportService.getPaymentsReport(filters);
      break;
    case 'PIPELINE':
      data = await ReportService.getOpportunityPipelineReport(filters);
      break;
    case 'PRODUCT':
      data = await ReportService.getProductsReport(filters);
      break;
    case 'RECEIVABLES':
      data = await ReportService.getReceivablesReport(filters);
      break;
    default:
      throw new Error(`Unknown report type: ${type}`);
  }

  // Audit the view
  await AuditService.log({
    userId: user.id,
    action: 'VIEW',
    module: 'REPORT',
    entityType: 'Report',
    entityId: type,
    description: `Viewed ${type} report with filters: ${JSON.stringify(filters)}`,
  });

  return { success: true, data };
}

export async function exportReport(type: string, filters: ReportFilter, format: 'CSV' | 'PDF') {
  const user = await requirePermission('REPORT.EXPORT');
  
  // Implementation will vary based on the report.
  // In a real application, you might generate the CSV string or PDF buffer here 
  // and return it, or return a URL to a stored file.
  // We'll scaffold this out as returning the raw data so the client can construct the CSV for V1.
  
  const { data } = await getReportData(type, filters);

  await AuditService.log({
    userId: user.id,
    action: 'EXPORT',
    module: 'REPORT',
    entityType: 'Report',
    entityId: type,
    description: `Exported ${type} report to ${format} with filters: ${JSON.stringify(filters)}`,
  });

  return { success: true, data, format };
}
