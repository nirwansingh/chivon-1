'use server';

import { getCurrentUser, requirePermission } from '@/lib/auth';
import { QuotationService } from '@/lib/quotation-service';
import { quotationSchema, QuotationFormValues } from './schema';
import { ActionResult } from '@/lib/action-result';
import { revalidatePath } from 'next/cache';

export async function createQuotationAction(data: QuotationFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    await requirePermission('QUOTATION.CREATE');

    const parsed = quotationSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: `Invalid data: ${parsed.error.message}` };
    }

    const quotation = await QuotationService.create(parsed.data, user.id);
    return { success: true, data: { id: quotation.id } };
  } catch (err: any) {
    console.error('Failed to create quotation:', err);
    return { success: false, error: err.message || 'Internal error' };
  }
}

export async function createRevisionAction(id: string, data: QuotationFormValues) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    await requirePermission('QUOTATION.CREATE');

    const parsed = quotationSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: `Invalid data: ${parsed.error.message}` };
    }

    const quotation = await QuotationService.createRevision(id, parsed.data, user.id);
    
    revalidatePath('/dashboard/quotations');
    revalidatePath(`/dashboard/quotations/${id}`);
    return { success: true, data: quotation };
  } catch (error: any) {
    console.error('Error creating quotation revision:', error);
    return { success: false, error: error.message || 'Failed to create quotation revision' };
  }
}

export async function submitQuotationAction(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    await requirePermission('QUOTATION.UPDATE');
    await QuotationService.submitForApproval(id, user.id);
    revalidatePath(`/dashboard/quotations/${id}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function approveQuotationAction(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    await requirePermission('QUOTATION.APPROVE');
    await QuotationService.approve(id, user.id);
    revalidatePath(`/dashboard/quotations/${id}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function rejectQuotationAction(id: string, reason: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    await requirePermission('QUOTATION.APPROVE');
    await QuotationService.reject(id, user.id, reason);
    revalidatePath(`/dashboard/quotations/${id}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function markQuotationSentAction(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    await requirePermission('QUOTATION.UPDATE');
    await QuotationService.markAsSent(id, user.id);
    revalidatePath(`/dashboard/quotations/${id}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function convertQuotationToSOAction(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    await requirePermission('SALES_ORDER.CREATE');
    const so = await QuotationService.convertToSalesOrder(id, user.id);
    revalidatePath(`/dashboard/quotations/${id}`);
    revalidatePath(`/dashboard/sales-orders`);
    return { success: true, data: so };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
