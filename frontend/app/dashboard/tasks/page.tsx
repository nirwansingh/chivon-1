import { requirePermission } from '@/lib/auth';
import { api } from '@/lib/api-client';
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
  const { tasks, users, customers } = await api<{
    tasks: { status: string; dueDate: string | Date | null; [key: string]: unknown }[];
    users: { id: string; name: string; status: string }[];
    customers: { id: string; companyName: string }[];
  }>('/api/tasks');

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const formattedTasks = tasks.map(task => {
    let visualState = 'upcoming';
    if (task.status === 'COMPLETED') {
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

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Tasks & Follow-ups</h1>
        <Button render={<Link href="/dashboard/tasks/new" />}>
          <Plus className="mr-2 h-4 w-4" /> New Task
        </Button>
      </div>

      <TaskBoard initialTasks={formattedTasks} users={users} customers={customers} currentUser={user} />
    </div>
  );
}
