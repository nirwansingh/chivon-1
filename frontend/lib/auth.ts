import { cache } from 'react';
import { cookies } from 'next/headers';
import { api } from './api-client';

type SessionUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    isSystem: boolean;
    permissions: { permission: { key: string } }[];
  };
};

function getAuthSecretPresent() {
  return Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.trim() !== '');
}

export async function createSession(token: string) {
  if (!getAuthSecretPresent()) {
    throw new Error(
      'AUTH_SECRET environment variable is missing. Please set AUTH_SECRET in your .env file.'
    );
  }
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  (await cookies()).set('chivon_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    sameSite: 'lax',
    path: '/',
  });
}

export async function destroySession() {
  (await cookies()).delete('chivon_session');
}

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get('chivon_session')?.value;
  if (!token) return null;
  try {
    const result = await api<{ user: SessionUser }>('/api/auth/me');
    return result.user;
  } catch {
    return null;
  }
});

export async function requirePermission(permissionKey: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }

  if (user.role.isSystem && user.role.name === 'Super Admin') {
    return user;
  }

  const hasPerm = user.role.permissions.some((rp) => rp.permission.key === permissionKey);
  if (!hasPerm) {
    throw new Error(`FORBIDDEN: Missing permission ${permissionKey}`);
  }

  return user;
}
