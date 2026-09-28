import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateDisplayProps {
  date: Date | string | null | undefined;
  formatString?: string;
  includeTime?: boolean;
  className?: string;
}

export function DateDisplay({
  date,
  formatString = 'dd MMM yyyy',
  includeTime = false,
  className,
}: DateDisplayProps) {
  if (!date) {
    return <span className={cn('text-muted-foreground', className)}>-</span>;
  }

  try {
    let dateObj = date;
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    }

    const finalFormat = includeTime ? `${formatString} h:mm a` : formatString;
    
    return (
      <span className={cn('whitespace-nowrap', className)}>
        {format(dateObj as Date, finalFormat)}
      </span>
    );
  } catch (error) {
    return <span className={cn('text-destructive', className)}>Invalid Date</span>;
  }
}
