'use server';

import { api } from '@/lib/api-client';
import { createSession, getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function switchUserAction(targetUserId: string): Promise<void> {
  if (process.env.NODE_ENV === 'production' || process.env.DEV_USER_SWITCH !== 'true') {
    throw new Error('User switch is disabled in this environment');
  }

  const actor = await getCurrentUser();
  if (!actor) {
    throw new Error('Not authenticated');
  }

  const result = await api<{ token: string | null; unchanged?: boolean }>('/api/auth/switch', {
    method: 'POST',
    body: { targetUserId },
  });

  if (result.token) {
    await createSession(result.token);
  }
  redirect('/dashboard');
}
