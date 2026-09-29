import { Suspense } from 'react';
import { InvoiceService } from '@/lib/invoice-service';
import { requirePermission } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
}) {
  await requirePermission('view_invoices');
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Manage your customer invoices"
      />
      
      <Card>
        <CardContent className="p-0">
          <Suspense fallback={<div className="p-6 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /></div>}>
            <InvoiceList search={searchParams.search} status={searchParams.status} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function InvoiceList({ search, status }: { search?: string; status?: string }) {
  const invoices = await InvoiceService.getInvoices({ search, status });
  
  if (invoices.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No invoices found. Convert a Sales Order to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted text-muted-foreground border-b">
          <tr>
            <th className="px-6 py-3 font-medium">Number</th>
            <th className="px-6 py-3 font-medium">Date</th>
            <th className="px-6 py-3 font-medium">Customer</th>
            <th className="px-6 py-3 font-medium">Source</th>
            <th className="px-6 py-3 font-medium">Total</th>
            <th className="px-6 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4">
                <Link href={`/dashboard/invoices/${inv.id}`} className="font-medium hover:underline text-primary">
                  {inv.number}
                </Link>
              </td>
              <td className="px-6 py-4">{formatDate(inv.date)}</td>
              <td className="px-6 py-4">{inv.customer.companyName}</td>
              <td className="px-6 py-4">
                {inv.salesOrder ? (
                  <Link href={`/dashboard/sales-orders/${inv.salesOrder.id}`} className="text-xs hover:underline text-muted-foreground">
                    {inv.salesOrder.number}
                  </Link>
                ) : inv.quotation ? (
                  <Link href={`/dashboard/quotations/${inv.quotation.id}`} className="text-xs hover:underline text-muted-foreground">
                    {inv.quotation.number}
                  </Link>
                ) : '-'}
              </td>
              <td className="px-6 py-4 font-medium">{formatCurrency(inv.grandTotal.toNumber())}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                  inv.status === 'PAID' ? 'bg-green-100 text-green-800 border-green-200' :
                  inv.status === 'DRAFT' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                  inv.status === 'ISSUED' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {inv.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
