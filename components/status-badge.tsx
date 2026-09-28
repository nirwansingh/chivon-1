import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType =
  | 'NEW'
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'UNQUALIFIED'
  | 'FOLLOW_UP_REQUIRED'
  | 'CONVERTED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST'
  | 'APPROVED'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'TODO'
  | 'COMPLETED';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // We can't guarantee `status` is precisely `StatusType` at runtime in generic tables,
  // so we default to neutral if unknown.
  const s = status.toUpperCase();

  let variantClass = 'bg-muted text-muted-foreground border-border'; // Default Neutral

  // Success (Green)
  if (['WON', 'ACCEPTED', 'FULFILLED', 'PAID', 'ACTIVE', 'COMPLETED', 'CONVERTED', 'APPROVED'].includes(s)) {
    variantClass = 'bg-success/10 text-success border-success/20';
  }
  // Warning (Amber)
  else if (['PENDING_APPROVAL', 'PARTIALLY_FULFILLED', 'PARTIALLY_PAID', 'NEGOTIATION', 'PROPOSAL', 'FOLLOW_UP_REQUIRED', 'IN_PROGRESS'].includes(s)) {
    variantClass = 'bg-warning/10 text-warning border-warning/20';
  }
  // Danger (Red)
  else if (['LOST', 'UNQUALIFIED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'OVERDUE', 'INACTIVE'].includes(s)) {
    variantClass = 'bg-destructive/10 text-danger border-destructive/20';
  }
  // Info (Sky Blue)
  else if (['SENT', 'ISSUED', 'CONTACTED', 'QUALIFIED', 'CONFIRMED'].includes(s)) {
    variantClass = 'bg-sky/10 text-sky border-sky/20';
  }
  // Neutral (Blue/Gray) - NEW, DRAFT, TODO, etc.
  else if (['NEW', 'DRAFT', 'TODO'].includes(s)) {
    variantClass = 'bg-surface-blue text-primary border-primary/20';
  }

  // Format text: replace underscores and title case
  const label = s.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

  return (
    <Badge variant="outline" className={cn('font-medium', variantClass, className)}>
      {label}
    </Badge>
  );
}
