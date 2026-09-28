'use client';

import * as React from 'react';
import { Opportunity } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateOpportunityStatusAction } from '@/app/dashboard/opportunities/actions';
import { toast } from 'react-toastify';
import { MoneyDisplay } from '@/components/money-display';
import Link from 'next/link';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

type OpportunityWithRelations = Opportunity & {
  customer: { companyName: string } | null;
  assignedUser: { name: string } | null;
};

interface KanbanBoardProps {
  opportunities: OpportunityWithRelations[];
  canEdit: boolean;
}

const COLUMNS = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] as const;
type ColumnType = typeof COLUMNS[number];

export function KanbanBoard({ opportunities, canEdit }: KanbanBoardProps) {
  const [items, setItems] = React.useState(opportunities);

  // Keep synced if props change
  React.useEffect(() => {
    setItems(opportunities);
  }, [opportunities]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, status: ColumnType) => {
    e.preventDefault();
    if (!canEdit) return;

    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    const opp = items.find(o => o.id === id);
    if (!opp || opp.status === status) return;

    // Optimistic UI update
    setItems(prev => prev.map(o => o.id === id ? { ...o, status } : o));

    try {
      const result = await updateOpportunityStatusAction(id, status);
      if (!result.success) {
        toast.error(result.error || 'Failed to update status');
        // Revert
        setItems(opportunities);
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      setItems(opportunities);
    }
  };

  const formatColumnName = (col: string) => {
    return col.charAt(0) + col.slice(1).toLowerCase();
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] items-start">
      {COLUMNS.map((col) => {
        const colItems = items.filter(i => i.status === col);
        const totalValue = colItems.reduce((acc, curr) => acc + Number(curr.expectedValue || 0), 0);

        return (
          <div 
            key={col}
            className="flex-shrink-0 w-80 bg-surface-blue/30 rounded-xl flex flex-col max-h-full border border-border/50 shadow-sm"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col)}
          >
            <div className="p-3 border-b border-border/50 flex justify-between items-center bg-surface-blue/80 rounded-t-xl font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-foreground tracking-wide text-sm">{formatColumnName(col)}</span>
                <span className="bg-background text-primary text-[10px] px-2 py-0.5 rounded-md shadow-sm font-bold border border-border/50">{colItems.length}</span>
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                <MoneyDisplay amount={totalValue} />
              </div>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {colItems.map(opp => (
                <div
                  key={opp.id}
                  draggable={canEdit}
                  onDragStart={(e) => handleDragStart(e, opp.id)}
                  className={cn(
                    "bg-card border border-border rounded-xl p-3 shadow-sm card-hover hover:border-primary/30 transition-all",
                    canEdit && "cursor-grab active:cursor-grabbing"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/dashboard/opportunities/${opp.id}`} className="font-semibold text-sm text-primary hover:underline line-clamp-2 pr-2">
                      {opp.name}
                    </Link>
                    {canEdit && <GripVertical className="h-4 w-4 text-muted-foreground/30 hover:text-muted-foreground shrink-0 cursor-grab transition-colors" />}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-3 truncate">
                    {opp.customer?.companyName || 'No customer'}
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="text-sm font-medium text-primary">
                      {opp.expectedValue ? <MoneyDisplay amount={Number(opp.expectedValue)} /> : '-'}
                    </div>
                    {opp.probability !== null && (
                      <div className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded">
                        {opp.probability}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {colItems.length === 0 && (
                <div className="text-center p-4 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
