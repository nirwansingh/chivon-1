'use server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { AuditService } from '@/lib/audit';
export async function loginWithCredentials(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Missing email or password' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== 'ACTIVE') {
    return { error: 'Invalid credentials or inactive user' };
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return { error: 'Invalid credentials' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  await AuditService.log({
    userId: user.id,
    action: 'LOGIN',
    module: 'AUTH',
    entityType: 'User',
    entityId: user.id,
    description: 'User logged in with credentials'
  });

  await createSession(user.id);
  redirect('/dashboard');
}

export async function quickLogin(userId: string) {
  if (process.env.NODE_ENV === 'production' || process.env.DEV_USER_SWITCH !== 'true') {
    throw new Error('Quick login disabled');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== 'ACTIVE') {
    throw new Error('User not found or inactive');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  await AuditService.log({
    userId: user.id,
    action: 'LOGIN',
    module: 'AUTH',
    entityType: 'User',
    entityId: user.id,
    description: 'User quick-logged in (dev mode)'
  });

  await createSession(user.id);
  redirect('/dashboard');
}

export async function logout() {
  const { destroySession, getCurrentUser } = await import('@/lib/auth');
  const user = await getCurrentUser().catch(() => null);
  
  if (user) {
    await AuditService.log({
      userId: user.id,
      action: 'LOGOUT',
      module: 'AUTH',
      entityType: 'User',
      entityId: user.id,
      description: 'User logged out'
    });
  }

  await destroySession();
  redirect('/login');
}
