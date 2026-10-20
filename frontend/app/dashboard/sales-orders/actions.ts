'use server';

import { revalidatePath } from 'next/cache';
import { SalesOrderFormValues, salesOrderSchema } from './schema';
import { SalesOrderService } from '@/lib/sales-order-service';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { QuotationService } from '@/lib/quotation-service';
import { SalesOrderStatus } from '@prisma/client';

import { ActionResult } from '@/lib/action-result';

export async function createSalesOrderAction(data: SalesOrderFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    
    await requirePermission('SALES_ORDER.CREATE');

    const parsed = salesOrderSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: `Validation failed: ${parsed.error.message}` };
    }

    const so = await SalesOrderService.create(parsed.data, user.id);
    
    revalidatePath('/dashboard/sales-orders');
    return { success: true, data: { id: so.id } };
  } catch (error: any) {
    return { success: false, error: error.message || 'Internal Error' };
  }
}

export async function updateSalesOrderAction(id: string, data: SalesOrderFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    await requirePermission('SALES_ORDER.EDIT');

    const parsed = salesOrderSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: `Validation failed: ${parsed.error.message}` };
    }

    const so = await SalesOrderService.update(id, parsed.data, user.id);
    
    revalidatePath('/dashboard/sales-orders');
    revalidatePath(`/dashboard/sales-orders/${id}`);
    return { success: true, data: { id: so.id } };
  } catch (error: any) {
    return { success: false, error: error.message || 'Internal Error' };
  }
}

export async function convertQuotationToSalesOrderAction(quotationId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    await requirePermission('SALES_ORDER.CREATE');

    const so = await QuotationService.convertToSalesOrder(quotationId, user.id);
    
    revalidatePath('/dashboard/quotations');
    revalidatePath('/dashboard/sales-orders');
    return { success: true, data: { id: so.id } };
  } catch (error: any) {
    return { success: false, error: error.message || 'Internal Error' };
  }
}

export async function updateSalesOrderStatusAction(id: string, status: SalesOrderStatus, reason?: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    await requirePermission('SALES_ORDER.EDIT');

    await SalesOrderService.updateStatus(id, status, user.id, reason);
    
    revalidatePath('/dashboard/sales-orders');
    revalidatePath(`/dashboard/sales-orders/${id}`);
    return { success: true, data: undefined };
  } catch (error: any) {
    return { success: false, error: error.message || 'Internal Error' };
  }
}

export async function cancelSalesOrderAction(id: string, reason: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    await requirePermission('SALES_ORDER.CANCEL');

    await SalesOrderService.cancel(id, user.id, reason);
    
    revalidatePath('/dashboard/sales-orders');
    revalidatePath(`/dashboard/sales-orders/${id}`);
    return { success: true, data: undefined };
  } catch (error: any) {
    return { success: false, error: error.message || 'Internal Error' };
  }
}

export async function reopenSalesOrderAction(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    await requirePermission('SALES_ORDER.EDIT');

    await SalesOrderService.reopen(id, user.id);
    
    revalidatePath('/dashboard/sales-orders');
    revalidatePath(`/dashboard/sales-orders/${id}`);
    return { success: true, data: undefined };
  } catch (error: any) {
    return { success: false, error: error.message || 'Internal Error' };
  }
}
