'use server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

export async function loginWithCredentials(prevState: any, formData: FormData) {
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

  await createSession(user.id);
  redirect('/dashboard');
}

export async function logout() {
  const { destroySession } = await import('@/lib/auth');
  await destroySession();
  redirect('/login');
}
