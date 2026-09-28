import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string | React.ReactNode;
  icon?: React.ReactNode;
  user?: string;
  isLast?: boolean;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  if (!items || items.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground py-4 text-center border rounded-md bg-muted/10 border-dashed', className)}>
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent', className)}>
      {items.map((item, index) => {
        const isLast = item.isLast ?? index === items.length - 1;
        
        return (
          <div key={item.id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group">
            
            {/* Timeline Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted text-muted-foreground shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              {item.icon ? item.icon : <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            
            {/* Timeline Content */}
            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border bg-card shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                <h4 className="font-semibold text-sm">{item.title}</h4>
                <time className="text-xs text-muted-foreground mt-1 sm:mt-0 font-medium">
                  {item.timestamp}
                </time>
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              )}
              {item.user && (
                <p className="text-xs text-muted-foreground mt-2 font-medium">By {item.user}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
