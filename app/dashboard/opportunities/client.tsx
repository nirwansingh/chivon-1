'use client';

import * as React from 'react';
import { Opportunity } from '@prisma/client';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { StatusBadge } from '@/components/status-badge';
import { DateDisplay } from '@/components/date-display';
import { MoneyDisplay } from '@/components/money-display';
import { KanbanBoard } from './kanban-board';

type OpportunityWithRelations = Opportunity & {
  customer: { companyName: string } | null;
  assignedUser: { name: string } | null;
};

interface OpportunityClientProps {
  opportunities: OpportunityWithRelations[];
  view: 'list' | 'kanban';
  canEdit: boolean;
}

export function OpportunityClient({ opportunities, view, canEdit }: OpportunityClientProps) {
  if (view === 'kanban') {
    return <KanbanBoard opportunities={opportunities} canEdit={canEdit} />;
  }

  const columns: ColumnDef<OpportunityWithRelations>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium px-4">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => row.original.customer?.companyName || '-',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      accessorKey: 'expectedValue',
      header: 'Value',
      cell: ({ row }) => {
        const val = row.getValue('expectedValue') as any;
        return val ? <MoneyDisplay amount={Number(val)} /> : '-';
      },
    },
    {
      accessorKey: 'probability',
      header: 'Prob.',
      cell: ({ row }) => {
        const p = row.getValue('probability') as number | null;
        return p !== null ? `${p}%` : '-';
      },
    },
    {
      accessorKey: 'expectedClosingDate',
      header: 'Closing Date',
      cell: ({ row }) => <DateDisplay date={row.getValue('expectedClosingDate')} />,
    },
    {
      accessorKey: 'assignedUser',
      header: 'Owner',
      cell: ({ row }) => row.original.assignedUser?.name || '-',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const opp = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            } />
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => window.location.href = `/dashboard/opportunities/${opp.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => window.location.href = `/dashboard/opportunities/${opp.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns as any}
      data={opportunities}
    />
  );
}
