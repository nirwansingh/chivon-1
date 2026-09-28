import { requirePermission } from '@/lib/auth';
import { SOAService } from '@/lib/soa-service';
import { DataTable } from '@/components/data-table';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ReceivablesPage() {
  await requirePermission('view_reports'); // or appropriate permission

  const agingData = await SOAService.getReceivablesAging();

  const totalCurrent = agingData.reduce((sum, item) => sum + item.current, 0);
  const total30 = agingData.reduce((sum, item) => sum + item.days30, 0);
  const total60 = agingData.reduce((sum, item) => sum + item.days60, 0);
  const total90 = agingData.reduce((sum, item) => sum + item.days90, 0);
  const total120 = agingData.reduce((sum, item) => sum + item.days120Plus, 0);
  const totalUnallocated = agingData.reduce((sum, item) => sum + item.unallocatedCredits, 0);
  const grandTotal = agingData.reduce((sum, item) => sum + item.totalOutstanding, 0);

  const columns = [
    {
      header: 'Customer',
      accessorKey: 'customerName',
      cell: (item: any) => (
        <Link href={`/dashboard/customers/${item.customerId}`} className="font-medium hover:underline text-primary">
          {item.customerName}
        </Link>
      ),
    },
    {
      header: 'Current',
      accessorKey: 'current',
      cell: (item: any) => <div className="text-right">{formatCurrency(item.current)}</div>,
    },
    {
      header: '1-30 Days',
      accessorKey: 'days30',
      cell: (item: any) => <div className="text-right">{formatCurrency(item.days30)}</div>,
    },
    {
      header: '31-60 Days',
      accessorKey: 'days60',
      cell: (item: any) => <div className="text-right">{formatCurrency(item.days60)}</div>,
    },
    {
      header: '61-90 Days',
      accessorKey: 'days90',
      cell: (item: any) => <div className="text-right">{formatCurrency(item.days90)}</div>,
    },
    {
      header: '> 90 Days',
      accessorKey: 'days120Plus',
      cell: (item: any) => <div className="text-right text-red-600">{formatCurrency(item.days120Plus)}</div>,
    },
    {
      header: 'Unallocated Credits',
      accessorKey: 'unallocatedCredits',
      cell: (item: any) => <div className="text-right text-green-600">{item.unallocatedCredits > 0 ? `-${formatCurrency(item.unallocatedCredits)}` : '-'}</div>,
    },
    {
      header: 'Total Outstanding',
      accessorKey: 'totalOutstanding',
      cell: (item: any) => <div className="text-right font-bold">{formatCurrency(item.totalOutstanding)}</div>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Receivables & Aging Summary</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Current</div>
          <div className="text-xl font-bold">{formatCurrency(totalCurrent)}</div>
        </div>
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">1-30 Days</div>
          <div className="text-xl font-bold">{formatCurrency(total30)}</div>
        </div>
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">31-60 Days</div>
          <div className="text-xl font-bold">{formatCurrency(total60)}</div>
        </div>
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">61-90 Days</div>
          <div className="text-xl font-bold">{formatCurrency(total90)}</div>
        </div>
        <div className="bg-card border border-red-200 rounded-lg p-4 shadow-sm bg-red-50/50">
          <div className="text-sm text-red-600">> 90 Days</div>
          <div className="text-xl font-bold text-red-700">{formatCurrency(total120)}</div>
        </div>
        <div className="bg-card border border-green-200 rounded-lg p-4 shadow-sm bg-green-50/50">
          <div className="text-sm text-green-600">Unallocated Credits</div>
          <div className="text-xl font-bold text-green-700">-{formatCurrency(totalUnallocated)}</div>
        </div>
        <div className="bg-primary text-primary-foreground border rounded-lg p-4 shadow-sm">
          <div className="text-sm opacity-90">Grand Total</div>
          <div className="text-xl font-bold">{formatCurrency(grandTotal)}</div>
        </div>
      </div>

      <DataTable
        data={agingData}
        columns={columns}
        searchPlaceholder="Search customer..."
        pagination={{ page: 1, pageSize: 100, total: agingData.length, totalPages: 1 }}
      />
    </div>
  );
}
