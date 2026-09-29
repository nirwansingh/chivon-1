import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DataTable } from '@/components/data-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  await requirePermission('view_invoices');

  const page = parseInt(searchParams.page || '1');
  const query = searchParams.q || '';
  const pageSize = 20;

  const where = query
    ? {
      OR: [
        { number: { contains: query, mode: 'insensitive' as const } },
        { customer: { companyName: { contains: query, mode: 'insensitive' as const } } },
      ],
    }
    : {};

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { customer: true },
      orderBy: { paymentDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.payment.count({ where }),
  ]);

  const serializedPayments = payments.map(p => ({
    ...p,
    amount: Number(p.amount),
  }));

  const columns = [
    {
      header: 'Payment No',
      accessorKey: 'number',
      cell: (item: any) => (
        <Link href={`/dashboard/payments/${item.id}`} className="font-medium hover:underline text-primary">
          {item.number}
        </Link>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'paymentDate',
      cell: (item: any) => formatDate(item.paymentDate),
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
      cell: (item: any) => <div className="font-medium text-right">{formatCurrency(item.amount)}</div>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (item: any) => (
        <StatusBadge
          status={item.isReversed ? 'CANCELLED' : item.status}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <Button render={<Link href="/dashboard/payments/new" />}>
          <Plus className="mr-2 h-4 w-4" /> Record Payment
        </Button>
      </div>

      <DataTable
        data={serializedPayments}
        columns={columns}
        searchPlaceholder="Search payments..."
        pagination={{
          pageIndex: page - 1,
          pageSize,
        }}
        pageCount={Math.ceil(total / pageSize)}
      />
    </div>
  );
}
