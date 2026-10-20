'use server';

import { requirePermission } from '@/lib/auth';
import { InvoiceService } from '@/lib/invoice-service';
import { SalesOrderService } from '@/lib/sales-order-service';
import { QuotationService } from '@/lib/quotation-service';
import { api } from '@/lib/api-client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function convertSalesOrderToInvoiceAction(
  salesOrderId: string,
  items: { salesOrderItemId: string; quantity: number }[]
) {
  const user = await requirePermission('manage_invoices');
  const invoice = await SalesOrderService.convertToInvoice(salesOrderId, items, user.id);

  revalidatePath('/dashboard/sales-orders');
  revalidatePath('/dashboard/invoices');

  redirect(`/dashboard/invoices/${invoice.id}`);
}

export async function convertQuotationToInvoiceAction(
  quotationId: string,
  revisionId: string,
  items: { quotationItemId: string; quantity: number }[]
) {
  const user = await requirePermission('manage_invoices');
  const invoice = await QuotationService.convertToInvoice(quotationId, revisionId, items, user.id);

  revalidatePath('/dashboard/quotations');
  revalidatePath('/dashboard/invoices');

  redirect(`/dashboard/invoices/${invoice.id}`);
}

export async function cancelInvoiceAction(id: string, reason: string) {
  const user = await requirePermission('manage_invoices');
  await InvoiceService.cancel(id, user.id, reason);

  revalidatePath('/dashboard/invoices');
  revalidatePath(`/dashboard/invoices/${id}`);
}

export async function updateInvoiceStatusAction(id: string, status: 'ISSUED' | 'PAID') {
  await requirePermission('manage_invoices');
  await api(`/api/invoices/${id}/status`, { method: 'POST', body: { status } });

  revalidatePath('/dashboard/invoices');
  revalidatePath(`/dashboard/invoices/${id}`);
  return { success: true };
}

export async function createCreditNoteAction(
  invoiceId: string,
  items: { description: string; quantity: number; rate: number; vatRate: number }[],
  notes: string
) {
  await requirePermission('manage_invoices');
  const result = await api<{ success: boolean; creditNoteId: string }>(`/api/invoices/${invoiceId}/credit-notes`, {
    method: 'POST',
    body: { items, notes },
  });

  revalidatePath('/dashboard/invoices');
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  return result;
}
