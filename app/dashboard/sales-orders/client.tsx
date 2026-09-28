'use client';

import * as React from 'react';
import { SalesOrderWithRelations } from '@/lib/sales-order-service';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal, Eye, Edit } from 'lucide-react';
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
import { FilterBar } from '@/components/filter-bar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SalesOrderStatus } from '@prisma/client';

interface SalesOrderClientProps {
  salesOrders: SalesOrderWithRelations[];
  canEdit: boolean;
  users: { id: string; name: string }[];
  customers: { id: string; companyName: string }[];
}

export function SalesOrderClient({ salesOrders, canEdit, users, customers }: SalesOrderClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('q') || '';
  const currentStatus = searchParams.get('status') || 'ALL';
  const currentCustomer = searchParams.get('customerId') || 'ALL';
  const currentUser = searchParams.get('userId') || 'ALL';

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'ALL') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const columns: ColumnDef<SalesOrderWithRelations>[] = [
    {
      accessorKey: 'number',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link href={`/dashboard/sales-orders/${row.original.id}`} className="font-medium hover:underline text-primary">
          {row.original.number}
        </Link>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => <div>{row.original.customer.companyName}</div>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Date Created',
      cell: ({ row }) => <DateDisplay date={row.original.createdAt} />,
    },
    {
      accessorKey: 'grandTotal',
      header: () => <div className="text-right">Grand Total</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">
          <MoneyDisplay amount={row.original.grandTotal.toNumber()} />
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const so = row.original;
        const isEditable = canEdit && (so.status === 'DRAFT' || so.status === 'CONFIRMED');

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem render={<Link href={`/dashboard/sales-orders/${so.id}`} />}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {isEditable && (
                  <DropdownMenuItem render={<Link href={`/dashboard/sales-orders/${so.id}/edit`} />}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchPlaceholder="Search sales orders..."
        searchQuery={currentSearch}
        onSearchChange={(val) => updateFilters('q', val)}
        onClearFilters={() => router.push(pathname)}
      >
        <Select value={currentStatus} onValueChange={(val) => updateFilters('status', val)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.values(SalesOrderStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentCustomer} onValueChange={(val) => updateFilters('customerId', val)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Customers</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={currentUser} onValueChange={(val) => updateFilters('userId', val)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Created By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Users</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      <div className="rounded-md border">
        <DataTable columns={columns} data={salesOrders} />
      </div>
    </div>
  );
}
