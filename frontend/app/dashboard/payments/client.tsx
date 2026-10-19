"use client";

import { DataTable } from '@/components/data-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';

interface Payment {
  id: string;
  number: string;
  paymentDate: Date | string;
  customer: {
    companyName: string;
  };
  paymentMethod: string;
  amount: number;
  status: string;
  isReversed: boolean;
}

export function PaymentsClient({
  payments,
  page,
  pageSize,
  total,
}: {
  payments: Payment[];
  page: number;
  pageSize: number;
  total: number;
}) {
  const columns: ColumnDef<Payment>[] = [
    {
      header: 'Payment No',
      accessorKey: 'number',
      cell: ({ row }) => (
        <Link href={`/dashboard/payments/${row.original.id}`} className="font-medium hover:underline text-primary">
          {row.original.number}
        </Link>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'paymentDate',
      cell: ({ row }) => formatDate(row.original.paymentDate),
    },
    {
      header: 'Customer',
      accessorKey: 'customer.companyName',
    },
    {
      header: 'Method',
      accessorKey: 'paymentMethod',
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: ({ row }) => <div className="font-medium text-right">{formatCurrency(row.original.amount)}</div>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.isReversed ? 'CANCELLED' : row.original.status}
        />
      ),
    },
  ];

  return (
    <DataTable
      data={payments}
      columns={columns}
      searchPlaceholder="Search payments..."
      pagination={{
        pageIndex: page - 1,
        pageSize,
      }}
      pageCount={Math.ceil(total / pageSize)}
    />
  );
}
