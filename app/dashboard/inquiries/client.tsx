'use client';

import * as React from 'react';
import { Inquiry } from '@prisma/client';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { StatusBadge } from '@/components/status-badge';
import { DateDisplay } from '@/components/date-display';
import { MoneyDisplay } from '@/components/money-display';

type InquiryWithRelations = Inquiry & {
  customer: { companyName: string } | null;
  assignedTo: { name: string } | null;
};

interface InquiryListClientProps {
  inquiries: InquiryWithRelations[];
}

export function InquiryListClient({ inquiries }: InquiryListClientProps) {
  const columns: ColumnDef<InquiryWithRelations>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-medium px-4">{row.getValue('title')}</div>,
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => {
        const customer = row.original.customer;
        return customer ? customer.companyName : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const priority = row.getValue('priority') as string;
        let color = 'text-muted-foreground';
        if (priority === 'HIGH') color = 'text-warning';
        if (priority === 'URGENT') color = 'text-destructive font-bold';
        return <span className={color}>{priority}</span>;
      },
    },
    {
      accessorKey: 'expectedValue',
      header: 'Expected Value',
      cell: ({ row }) => {
        const val = row.getValue('expectedValue') as any;
        return val ? <MoneyDisplay amount={Number(val)} /> : '-';
      },
    },
    {
      accessorKey: 'assignedTo',
      header: 'Assigned To',
      cell: ({ row }) => {
        const assigned = row.original.assignedTo;
        return assigned ? assigned.name : '-';
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => <DateDisplay date={row.getValue('createdAt')} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const inquiry = row.original;
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
              <DropdownMenuItem onClick={() => window.location.href = `/dashboard/inquiries/${inquiry.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = `/dashboard/inquiries/${inquiry.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              {/* Deletion requires T-11 guard logic typically, keeping it simple or disabled based on permissions */}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns as any}
      data={inquiries}
    />
  );
}
