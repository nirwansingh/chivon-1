import { requirePermission } from '@/lib/auth';
import { api } from '@/lib/api-client';
import { DataTable } from '@/components/data-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PaymentsClient } from './client';
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

  const result = await api<{ payments: { amount: { toString(): string } | number }[]; total: number }>(
    `/api/payments?page=${page}&q=${encodeURIComponent(query)}`
  );
  const payments = result.payments;
  const total = result.total;

  const serializedPayments = payments.map(p => ({
    ...p,
    amount: Number(p.amount),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <Button render={<Link href="/dashboard/payments/new" />}>
          <Plus className="mr-2 h-4 w-4" /> Record Payment
        </Button>
      </div>

      <PaymentsClient 
        payments={serializedPayments as any} 
        page={page} 
        pageSize={pageSize} 
        total={total} 
      />
    </div>
  );
}
