'use server';

import { prisma } from '@/lib/prisma';
import { createSession, getCurrentUser } from '@/lib/auth';
import { AuditService } from '@/lib/audit';
import { redirect } from 'next/navigation';

/**
 * DEV-MODE ONLY: Switch the active session to another user without a password.
 * Writes an audit entry. Disabled in production and when DEV_USER_SWITCH != 'true'.
 */
export async function switchUserAction(targetUserId: string): Promise<void> {
  if (process.env.NODE_ENV === 'production' || process.env.DEV_USER_SWITCH !== 'true') {
    throw new Error('User switch is disabled in this environment');
  }

  const actor = await getCurrentUser();
  if (!actor) {
    throw new Error('Not authenticated');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { role: true },
  });

  if (!targetUser || targetUser.status !== 'ACTIVE') {
    throw new Error('Target user not found or inactive');
  }

  // Don't switch to yourself — no-op
  if (actor.id === targetUserId) {
    redirect('/dashboard');
  }

  await AuditService.log({
    userId: actor.id,
    action: 'USER_SWITCH',
    module: 'AUTH',
    entityType: 'User',
    entityId: targetUserId,
    description: `Dev switch: ${actor.name} → ${targetUser.name} (${targetUser.role.name})`,
    afterData: { switchedToId: targetUserId, switchedToName: targetUser.name, role: targetUser.role.name },
  });

  await createSession(targetUserId);
  redirect('/dashboard');
}
