import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const SECRET_KEY = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-replace-in-production');

export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
    
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

export async function getCurrentUser() {
  const sessionCookie = (await cookies()).get('chivon_session')?.value;
  if (!sessionCookie) return null;

  try {
    const { payload } = await jwtVerify(sessionCookie, SECRET_KEY);
    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId, status: 'ACTIVE' },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    if (!user) {
      await destroySession();
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Ensures the user has the given permission.
 * Throws an error (which results in 403 server-side behavior) if unauthenticated or unauthorized.
 * Returns the verified user object if successful.
 */
export async function requirePermission(permissionKey: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }

  // Super Admin bypasses all checks
  if (user.role.isSystem && user.role.name === 'Super Admin') {
    return user;
  }

  const hasPerm = user.role.permissions.some((rp: any) => rp.permission.key === permissionKey);
  if (!hasPerm) {
    throw new Error(`FORBIDDEN: Missing permission ${permissionKey}`);
  }

  return user;
}
