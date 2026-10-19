'use client';

import * as React from 'react';
import { updateTaskStatus } from './actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export function TaskBoard({ initialTasks, users, customers, currentUser }: any) {
  const [tasks, setTasks] = React.useState(initialTasks);
  const [filter, setFilter] = React.useState('all'); // all, my_tasks

  const filteredTasks = tasks.filter((t: any) => {
    if (filter === 'my_tasks' && t.assignedToId !== currentUser.id) return false;
    return true;
  });

  const columns = [
    { id: 'TODO', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'DONE', title: 'Done' }
  ];

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const originalTasks = [...tasks];
    setTasks(tasks.map((t: any) => t.id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (e) {
      setTasks(originalTasks);
    }
  };

  const getVisualStateColor = (state: string) => {
    switch (state) {
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      case 'due_today': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'upcoming': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };
  
  const getVisualStateIcon = (state: string) => {
    switch (state) {
      case 'overdue': return <AlertCircle className="w-3 h-3 mr-1" />;
      case 'due_today': return <Clock className="w-3 h-3 mr-1" />;
      case 'upcoming': return <Calendar className="w-3 h-3 mr-1" />;
      case 'completed': return <CheckCircle2 className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  const getVisualStateLabel = (state: string) => {
    switch (state) {
      case 'overdue': return 'Overdue';
      case 'due_today': return 'Due Today';
      case 'upcoming': return 'Upcoming';
      case 'completed': return 'Completed';
      default: return 'No Date';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex gap-2">
        <Badge 
          variant={filter === 'all' ? 'default' : 'outline'} 
          className="cursor-pointer"
          onClick={() => setFilter('all')}
        >
          All Tasks
        </Badge>
        <Badge 
          variant={filter === 'my_tasks' ? 'default' : 'outline'} 
          className="cursor-pointer"
          onClick={() => setFilter('my_tasks')}
        >
          My Tasks
        </Badge>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {columns.map(col => (
          <div key={col.id} className="bg-muted/50 rounded-lg p-4 flex flex-col max-h-full">
            <h3 className="font-semibold mb-4 text-muted-foreground flex justify-between items-center">
              {col.title}
              <span className="bg-muted px-2 py-0.5 rounded-full text-xs">
                {filteredTasks.filter((t: any) => t.status === col.id).length}
              </span>
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {filteredTasks.filter((t: any) => t.status === col.id).map((task: any) => (
                <Card key={task.id} className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                      <Badge variant="outline" className={`shrink-0 border ${task.priority === 'HIGH' ? 'text-red-600 border-red-200 bg-red-50' : task.priority === 'LOW' ? 'text-green-600 border-green-200 bg-green-50' : ''}`}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.customer && (
                      <div className="text-xs text-muted-foreground truncate">
                        {task.customer.companyName}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <div className={`flex items-center text-[10px] font-medium px-2 py-1 rounded-full border ${getVisualStateColor(task.visualState)}`}>
                        {getVisualStateIcon(task.visualState)}
                        {getVisualStateLabel(task.visualState)}
                        {task.dueDate && <span className="ml-1 opacity-75">({format(new Date(task.dueDate), 'MMM d')})</span>}
                      </div>

                      {col.id !== 'DONE' && (
                        <select 
                          className="text-xs border rounded px-1 py-0.5 bg-background"
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Prog</option>
                          <option value="DONE">Done</option>
                        </select>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
