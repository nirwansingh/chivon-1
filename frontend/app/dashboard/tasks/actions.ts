'use server';

import { api } from '@/lib/api-client';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

export async function createTask(data: any) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const task = await api<{ id: string; customerId?: string | null }>('/api/tasks', {
    method: 'POST',
    body: data,
  });

  revalidatePath('/dashboard/tasks');
  if (data.customerId) revalidatePath(`/dashboard/customers/${data.customerId}`);
  return task;
}

export async function updateTask(id: string, data: any) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const task = await api<{ customerId?: string | null }>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: data,
  });

  revalidatePath('/dashboard/tasks');
  if (task.customerId) revalidatePath(`/dashboard/customers/${task.customerId}`);
  return task;
}

export async function updateTaskStatus(id: string, status: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const task = await api<{ customerId?: string | null }>(`/api/tasks/${id}/status`, {
    method: 'POST',
    body: { status },
  });

  revalidatePath('/dashboard/tasks');
  if (task.customerId) revalidatePath(`/dashboard/customers/${task.customerId}`);
  return task;
}

export async function deleteTask(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const task = await api<{ customerId?: string | null }>(`/api/tasks/${id}`, { method: 'DELETE' });

  revalidatePath('/dashboard/tasks');
  if (task.customerId) revalidatePath(`/dashboard/customers/${task.customerId}`);
  return task;
}
