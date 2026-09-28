import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TaskForm } from '../task-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function NewTaskPage({ searchParams }: { searchParams: { customerId?: string } }) {
  await requirePermission('create_task'); // Update if specific permission name differs

  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, email: true }
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tasks" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Task</h1>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <TaskForm users={users} initialCustomerId={searchParams.customerId} />
      </div>
    </div>
  );
}
