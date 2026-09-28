'use server';
import { UserService } from '@/server/services/UserService';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createUserAction(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const roleId = formData.get('roleId') as string;

  await UserService.createUser({ name, email, password, roleId });
  revalidatePath('/dashboard/users');
  redirect('/dashboard/users');
}

export async function updateUserAction(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const roleId = formData.get('roleId') as string;

  await UserService.updateUser(id, { name, email, roleId });
  revalidatePath('/dashboard/users');
  redirect('/dashboard/users');
}

export async function toggleUserStatusAction(id: string, currentStatus: string) {
  if (currentStatus === 'ACTIVE') {
    await UserService.deactivateUser(id);
  } else {
    await UserService.activateUser(id);
  }
  revalidatePath('/dashboard/users');
}

export async function resetPasswordAction(id: string, formData: FormData) {
  const password = formData.get('password') as string;
  await UserService.resetPassword(id, password);
  revalidatePath(`/dashboard/users/${id}`);
}
