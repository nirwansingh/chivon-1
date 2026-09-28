import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TaskBoard } from './task-board';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const user = await requirePermission('view_tasks');

  // Fetch all tasks for the current user or all if admin
  // For now, let's fetch all tasks since this is an ERP, maybe filter by assignee on client
  const tasks = await prisma.task.findMany({
    include: {
      assignedTo: true,
      customer: true,
    },
    orderBy: [
      { dueDate: 'asc' },
      { priority: 'desc' }
    ]
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const formattedTasks = tasks.map(task => {
    let visualState = 'upcoming';
    if (task.status === 'DONE') {
      visualState = 'completed';
    } else if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate < now) {
        visualState = 'overdue';
      } else if (dueDate.getTime() === now.getTime()) {
        visualState = 'due_today';
      }
    }

    return {
      ...task,
      visualState
    };
  });

  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' }
  });

  const customers = await prisma.customer.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, companyName: true }
  });

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Tasks & Follow-ups</h1>
        <Button asChild>
          <Link href="/dashboard/tasks/new">
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Link>
        </Button>
      </div>

      <TaskBoard initialTasks={formattedTasks} users={users} customers={customers} currentUser={user} />
    </div>
  );
}
