'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth';
import { OpportunityService } from '@/lib/opportunity-service';
import { opportunitySchema } from './schema';
import { ActionResult } from '@/lib/action-result';
import { Opportunity } from '@prisma/client';

export async function createOpportunityAction(data: unknown): Promise<ActionResult<Opportunity>> {
  await requirePermission('OPPORTUNITY.CREATE');

  const parsed = opportunitySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid opportunity data' } as any;
  }

  const result = await OpportunityService.createOpportunity(parsed.data as any);
  if (result.success) {
    revalidatePath('/dashboard/opportunities');
  }

  return result as any;
}

export async function updateOpportunityAction(id: string, data: unknown): Promise<ActionResult<Opportunity>> {
  await requirePermission('OPPORTUNITY.EDIT');

  const parsed = opportunitySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid opportunity data' } as any;
  }

  const result = await OpportunityService.updateOpportunity(id, parsed.data as any);
  if (result.success) {
    revalidatePath('/dashboard/opportunities');
    revalidatePath(`/dashboard/opportunities/${id}`);
  }

  return result as any;
}

export async function updateOpportunityStatusAction(id: string, status: string): Promise<ActionResult<Opportunity>> {
  await requirePermission('OPPORTUNITY.EDIT');

  const result = await OpportunityService.updateOpportunityStatus(id, status);
  if (result.success) {
    revalidatePath('/dashboard/opportunities');
    revalidatePath(`/dashboard/opportunities/${id}`);
  }

  return result as any;
}
