import { Decimal } from 'decimal.js';
import { cn } from '@/lib/utils';

interface MoneyDisplayProps {
  amount: number | string | Decimal | null | undefined;
  currency?: string;
  showCurrency?: boolean;
  className?: string;
  fractionDigits?: number;
}

export function MoneyDisplay({
  amount,
  currency = 'AED',
  showCurrency = true,
  className,
  fractionDigits = 2,
}: MoneyDisplayProps) {
  if (amount === null || amount === undefined) {
    return <span className={cn('text-muted-foreground', className)}>-</span>;
  }

  // Convert to number safely
  let numVal = 0;
  if (typeof amount === 'number') {
    numVal = amount;
  } else if (typeof amount === 'string') {
    numVal = parseFloat(amount);
  } else if (amount && typeof amount.toNumber === 'function') {
    numVal = amount.toNumber();
  }

  if (isNaN(numVal)) {
    return <span className={cn('text-muted-foreground', className)}>-</span>;
  }

  const isNegative = numVal < 0;
  const absVal = Math.abs(numVal);

  const formattedAmount = new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(absVal);

  return (
    <span className={cn('font-medium whitespace-nowrap', isNegative ? 'text-destructive' : '', className)}>
      {isNegative ? '-' : ''}
      {showCurrency && <span className="mr-1 text-xs opacity-70">{currency}</span>}
      {formattedAmount}
    </span>
  );
}
