'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth';
import { InquiryService } from '@/lib/inquiry-service';
import { inquirySchema } from './schema';
import { ActionResult } from '@/lib/action-result';
import { Inquiry } from '@prisma/client';

export async function createInquiryAction(data: unknown): Promise<ActionResult<Inquiry>> {
  await requirePermission('INQUIRY.CREATE');

  const parsed = inquirySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid inquiry data' } as any;
  }

  const result = await InquiryService.createInquiry(parsed.data as any);
  if (result.success) {
    revalidatePath('/dashboard/inquiries');
  }

  return result as any;
}

export async function updateInquiryAction(id: string, data: unknown): Promise<ActionResult<Inquiry>> {
  await requirePermission('INQUIRY.EDIT');

  const parsed = inquirySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid inquiry data' } as any;
  }

  const result = await InquiryService.updateInquiry(id, parsed.data as any);
  if (result.success) {
    revalidatePath('/dashboard/inquiries');
    revalidatePath(`/dashboard/inquiries/${id}`);
  }

  return result as any;
}

export async function deleteInquiryAction(id: string): Promise<ActionResult<boolean>> {
  await requirePermission('INQUIRY.DELETE');

  const result = await InquiryService.deleteInquiry(id);
  if (result.success) {
    revalidatePath('/dashboard/inquiries');
  }

  return result as any;
}

export async function convertInquiryAction(id: string): Promise<ActionResult<any>> {
  await requirePermission('INQUIRY.EDIT');

  const { OpportunityService } = await import('@/lib/opportunity-service');
  const result = await OpportunityService.convertInquiryToOpportunity(id);
  
  if (result.success) {
    revalidatePath('/dashboard/inquiries');
    revalidatePath(`/dashboard/inquiries/${id}`);
    revalidatePath('/dashboard/opportunities');
  }

  return result as any;
}
