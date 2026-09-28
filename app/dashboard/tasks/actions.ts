'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

export async function createTask(data: any) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const task = await prisma.task.create({
    data: {
      ...data,
      createdById: user.id,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  // Create an activity log if customer is linked
  if (data.customerId) {
    await prisma.activity.create({
      data: {
        customerId: data.customerId,
        type: 'TASK_CREATED',
        description: `Task created: ${task.title}`,
        relatedEntityType: 'Task',
        relatedEntityId: task.id,
        createdById: user.id
      }
    });
  }

  revalidatePath('/dashboard/tasks');
  if (data.customerId) revalidatePath(`/dashboard/customers/${data.customerId}`);
  
  return task;
}

export async function updateTask(id: string, data: any) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  revalidatePath('/dashboard/tasks');
  if (task.customerId) revalidatePath(`/dashboard/customers/${task.customerId}`);
  
  return task;
}

export async function updateTaskStatus(id: string, status: any) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const oldTask = await prisma.task.findUnique({ where: { id } });
  
  const task = await prisma.task.update({
    where: { id },
    data: { status },
  });

  if (oldTask?.customerId && oldTask.status !== status) {
    await prisma.activity.create({
      data: {
        customerId: oldTask.customerId,
        type: 'TASK_UPDATED',
        description: `Task "${task.title}" marked as ${status}`,
        relatedEntityType: 'Task',
        relatedEntityId: task.id,
        createdById: user.id
      }
    });
  }

  revalidatePath('/dashboard/tasks');
  if (task.customerId) revalidatePath(`/dashboard/customers/${task.customerId}`);
  
  return task;
}

export async function deleteTask(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const task = await prisma.task.delete({
    where: { id },
  });

  revalidatePath('/dashboard/tasks');
  if (task.customerId) revalidatePath(`/dashboard/customers/${task.customerId}`);
  
  return task;
}
