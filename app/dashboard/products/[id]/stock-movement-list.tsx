'use client';

import * as React from 'react';
import { StockMovement } from '@prisma/client';
import { DateDisplay } from '@/components/date-display';
import { Badge } from '@/components/ui/badge';

interface StockMovementWithUser extends StockMovement {
  createdBy: { name: string } | null;
}

interface StockMovementListProps {
  movements: StockMovementWithUser[];
  unit: string;
}

export function StockMovementList({ movements, unit }: StockMovementListProps) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
        No stock movements recorded yet.
      </div>
    );
  }

  return (
    <div className="relative border-l border-muted ml-3 space-y-6 py-2">
      {movements.map((m) => {
        const qty = Number(m.quantity);
        const isPositive = qty > 0;
        const isNegative = qty < 0;

        let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
        if (m.type === 'IN' || m.type === 'OPENING') badgeVariant = 'default'; // primary color
        if (m.type === 'OUT') badgeVariant = 'secondary';
        if (m.type === 'ADJUSTMENT' && isNegative) badgeVariant = 'destructive';
        if (m.type === 'ADJUSTMENT' && isPositive) badgeVariant = 'default';

        return (
          <div key={m.id} className="relative pl-6">
            <div className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-background ${
              isPositive || m.type === 'OPENING' ? 'bg-success' : 
              isNegative || m.type === 'OUT' ? 'bg-destructive' : 'bg-muted-foreground'
            }`} />
            
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 bg-muted/30 p-4 rounded-lg border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={badgeVariant} className="text-[10px] h-5">{m.type}</Badge>
                  <span className="text-sm text-muted-foreground">
                    by {m.createdBy?.name || 'System'}
                  </span>
                </div>
                {m.notes && (
                  <p className="text-sm text-foreground mt-1">{m.notes}</p>
                )}
                {m.reference && (
                  <p className="text-xs text-muted-foreground">Ref: {m.reference}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-lg font-bold ${
                  isPositive ? 'text-success' : 
                  isNegative ? 'text-destructive' : 'text-foreground'
                }`}>
                  {isPositive ? '+' : ''}{qty} {unit}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  <DateDisplay date={m.createdAt} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
