import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center py-16 px-6 text-center space-y-5 rounded-xl border border-dashed overflow-hidden',
        className
      )}
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      {/* Subtle blueprint grid backdrop */}
      <div
        className="absolute inset-0 blueprint-grid opacity-[0.04] pointer-events-none"
        aria-hidden="true"
      />

      {/* Icon chip */}
      {Icon && (
        <div
          className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
          style={{ background: 'var(--surface-blue)' }}
          aria-hidden="true"
        >
          <Icon
            className="h-6 w-6"
            style={{ color: 'var(--primary)' }}
            strokeWidth={1.75}
          />
        </div>
      )}

      {/* Text */}
      <div className="relative z-10 space-y-2">
        <h3
          className="text-h3 text-foreground"
        >
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* CTA */}
      {action && (
        <Button
          onClick={action.onClick}
          variant="outline"
          className="relative z-10 mt-1"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
