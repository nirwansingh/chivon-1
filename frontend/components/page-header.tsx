import * as React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  breadcrumbs?: Breadcrumb[];
}

export function PageHeader({
  title,
  description,
  action,
  className,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 mb-6 border-b',
        className
      )}
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="space-y-1 min-w-0">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-2" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" aria-hidden="true" />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground transition-colors duration-150 font-medium"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium" aria-current="page">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title */}
        <h1 className="text-h1 text-foreground truncate">{title}</h1>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>

      {/* Actions */}
      {action && (
        <>
          {/* Spacer block for mobile so content doesn't get hidden behind the fixed bottom bar */}
          <div className="h-20 sm:hidden block w-full" aria-hidden="true" />
          <div 
            className="flex items-center gap-2 shrink-0 
              fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-40 justify-end
              sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:p-0 sm:bg-transparent sm:border-0 sm:z-auto sm:justify-start
              shadow-[0_-4px_15px_rgba(0,0,0,0.05)] sm:shadow-none
            "
            style={{ borderColor: 'var(--border)' }}
          >
            {action}
          </div>
        </>
      )}
    </div>
  );
}
