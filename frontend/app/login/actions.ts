'use server';

import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { createSession, destroySession } from '@/lib/auth';

function rethrowRedirect(error: unknown): never {
  if (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    String((error as { digest?: string }).digest).startsWith('NEXT_REDIRECT')
  ) {
    throw error;
  }
  throw error;
}

export async function loginWithCredentials(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Missing email or password' };
  }

  try {
    const result = await api<{ token: string }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    await createSession(result.token);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    rethrowRedirect(error);
  }

  redirect('/dashboard');
}

export async function quickLogin(userId: string) {
  const result = await api<{ token: string }>('/api/auth/quick-login', {
    method: 'POST',
    body: { userId },
  });
  await createSession(result.token);
  redirect('/dashboard');
}

export async function logout() {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => null);
  await destroySession();
  redirect('/login');
}
