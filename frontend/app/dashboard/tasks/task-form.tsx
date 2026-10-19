'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createTask } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomerSelector } from '@/components/customer-selector';
import { toast } from 'sonner';

export function TaskForm({ users, initialCustomerId }: { users: any[], initialCustomerId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [priority, setPriority] = React.useState('MEDIUM');
  const [assignedToId, setAssignedToId] = React.useState('');
  const [customerId, setCustomerId] = React.useState(initialCustomerId || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createTask({
        title,
        description,
        dueDate: dueDate || null,
        priority,
        assignedToId: assignedToId || null,
        customerId: customerId || null,
      });
      toast.success('Task created successfully');
      router.push('/dashboard/tasks');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title..." />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          placeholder="Detailed description..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        
        <div className="space-y-2">
          <Label>Priority</Label>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={priority}
            onChange={e => setPriority(e.target.value)}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Assignee</Label>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={assignedToId}
            onChange={e => setAssignedToId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <Label>Related Customer</Label>
          <CustomerSelector value={customerId} onChange={setCustomerId} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
