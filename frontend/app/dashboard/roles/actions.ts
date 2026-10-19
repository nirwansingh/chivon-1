'use server';
import { RoleService } from '@/server/services/RoleService';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createRoleAction(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const permissionKeys = formData.getAll('permissionKeys') as string[];

  await RoleService.createRole({ name, description, permissionKeys });
  revalidatePath('/dashboard/roles');
  redirect('/dashboard/roles');
}

export async function updateRoleAction(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const permissionKeys = formData.getAll('permissionKeys') as string[];

  await RoleService.updateRole(id, { name, description, permissionKeys });
  revalidatePath('/dashboard/roles');
  redirect('/dashboard/roles');
}
