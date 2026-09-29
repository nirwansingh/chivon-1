'use server';

import { requirePermission } from '@/lib/auth';
import { InvoiceService } from '@/lib/invoice-service';
import { SalesOrderService } from '@/lib/sales-order-service';
import { QuotationService } from '@/lib/quotation-service';
import { prisma } from '@/lib/prisma';
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
  const user = await requirePermission('manage_invoices');
  
  await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.update({
      where: { id },
      data: { status }
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        module: 'INVOICE',
        entityType: 'INVOICE',
        entityId: id,
        action: 'UPDATE_STATUS',
        description: `Invoice status updated to ${status}`,
        afterData: { status }
      }
    });
  });
  
  revalidatePath('/dashboard/invoices');
  revalidatePath(`/dashboard/invoices/${id}`);
  return { success: true };
}

export async function createCreditNoteAction(
  invoiceId: string,
  items: { description: string; quantity: number; rate: number; vatRate: number }[],
  notes: string
) {
  const user = await requirePermission('manage_invoices');

  const { CreditNoteService } = await import('@/lib/credit-note-service');
  const cn = await CreditNoteService.create(invoiceId, items, notes, user.id);
  
  revalidatePath('/dashboard/invoices');
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  return { success: true, creditNoteId: cn.id };
}
