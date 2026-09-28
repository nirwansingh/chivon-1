'use client';

import * as React from 'react';
import { QuotationWithRelations } from '@/lib/quotation-service';
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
import { QuotationStatus } from '@prisma/client';

interface QuotationClientProps {
  quotations: QuotationWithRelations[];
  canEdit: boolean;
  users: { id: string; name: string }[];
  customers: { id: string; companyName: string }[];
}

export function QuotationClient({ quotations, canEdit, users, customers }: QuotationClientProps) {
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

  const columns: ColumnDef<QuotationWithRelations>[] = [
    {
      accessorKey: 'number',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="px-4">
          <Link href={`/dashboard/quotations/${row.original.id}`} className="font-semibold text-primary hover:underline transition-colors duration-150">
            {row.getValue('number')}
          </Link>
        </div>
      ),
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
      id: 'total',
      header: 'Total',
      cell: ({ row }) => {
        const currentRev = row.original.revisions[0];
        if (!currentRev) return '-';
        return <MoneyDisplay amount={Number(currentRev.grandTotal)} />;
      },
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => <DateDisplay date={row.getValue('date')} />,
    },
    {
      accessorKey: 'validUntil',
      header: 'Valid Until',
      cell: ({ row }) => {
        const val = row.getValue('validUntil') as Date | null;
        return val ? <DateDisplay date={val} /> : '-';
      },
    },
    {
      accessorKey: 'createdBy',
      header: 'Salesperson',
      cell: ({ row }) => row.original.createdBy?.name || '-',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const q = row.original;
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
              <DropdownMenuItem render={<Link href={`/dashboard/quotations/${q.id}`} />}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem render={<Link href={`/dashboard/quotations/${q.id}/edit`} />}>
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
    <div className="flex flex-col gap-4">
      <FilterBar
        searchQuery={currentSearch}
        onSearchChange={(q) => updateFilters('q', q)}
        searchPlaceholder="Search quotations..."
        onClearFilters={() => router.push(pathname)}
      >
        <Select value={currentStatus} onValueChange={(v) => updateFilters('status', v)}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.keys(QuotationStatus).map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentCustomer} onValueChange={(v) => updateFilters('customerId', v)}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Customers</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentUser} onValueChange={(v) => updateFilters('userId', v)}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Salesperson" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Salespeople</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable columns={columns} data={quotations} />
    </div>
  );
}
