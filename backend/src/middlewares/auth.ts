import { AsyncLocalStorage } from 'node:async_hooks';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '../models/prisma';

type AuthStore = { token: string | null };

const authStorage = new AsyncLocalStorage<AuthStore>();

export function runWithAuth<T>(token: string | null, fn: () => T): T {
  return authStorage.run({ token }, fn);
}

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error(
      'AUTH_SECRET environment variable is missing. Please set AUTH_SECRET in your .env file.'
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: string): Promise<string> {
  const secret = getAuthSecret();
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

async function userFromToken(token: string | null) {
  if (!token) return null;
  try {
    const secret = getAuthSecret();
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId, status: 'ACTIVE' },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
    return user;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const token = authStorage.getStore()?.token ?? null;
  return userFromToken(token);
}

/**
 * Ensures the user has the given permission.
 * Throws if unauthenticated or unauthorized.
 */
export async function requirePermission(permissionKey: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }

  if (user.role.isSystem && user.role.name === 'Super Admin') {
    return user;
  }

  const hasPerm = user.role.permissions.some(
    (rp: { permission: { key: string } }) => rp.permission.key === permissionKey
  );
  if (!hasPerm) {
    throw new Error(`FORBIDDEN: Missing permission ${permissionKey}`);
  }

  return user;
}
