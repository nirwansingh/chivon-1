import { requirePermission } from '@/lib/auth';
import { SOAService } from '@/lib/soa-service';
import { SOAFilter } from './soa-filter';
import { formatAED as formatCurrency } from '@/lib/money';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SOAPage({ searchParams }: { searchParams: { customerId?: string, fromDate?: string, toDate?: string } }) {
  await requirePermission('view_reports');

  const { customerId, fromDate, toDate } = searchParams;
  
  let soaReport = null;

  if (customerId && fromDate && toDate) {
    soaReport = await SOAService.generateSOA(customerId, new Date(fromDate), new Date(toDate + 'T23:59:59'));
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Statement of Account</h1>
        {soaReport && (
          <Button render={<Link href={`/api/pdf/soa?customerId=${customerId}&fromDate=${fromDate}&toDate=${toDate}`} target="_blank" />}>
            <FileText className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        )}
      </div>

      <SOAFilter />

      {soaReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Customer Details</h3>
              <p className="text-2xl font-bold">{soaReport.customerName}</p>
            </div>
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Statement Period</h3>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-medium">{format(new Date(fromDate!), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="font-medium">{format(new Date(toDate!), 'dd MMM yyyy')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground text-xs uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium text-right">Debit</th>
                    <th className="px-4 py-3 font-medium text-right">Credit</th>
                    <th className="px-4 py-3 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {soaReport.entries.map((entry, index) => (
                    <tr key={index} className={`border-b hover:bg-muted/50 ${entry.type.includes('BALANCE') ? 'bg-primary/5 font-semibold' : ''}`}>
                      <td className="px-4 py-3">{format(new Date(entry.date), 'dd MMM yyyy')}</td>
                      <td className="px-4 py-3">{entry.type}</td>
                      <td className="px-4 py-3">{entry.reference}</td>
                      <td className="px-4 py-3">{entry.description}</td>
                      <td className="px-4 py-3 text-right">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                      <td className="px-4 py-3 text-right">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(entry.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6 shadow-sm">
             <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Aging Summary (As of Today)</h3>
             <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Current</div>
                  <div className="font-semibold">{formatCurrency(soaReport.aging.current)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">1-30 Days</div>
                  <div className="font-semibold">{formatCurrency(soaReport.aging.days30)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">31-60 Days</div>
                  <div className="font-semibold">{formatCurrency(soaReport.aging.days60)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">61-90 Days</div>
                  <div className="font-semibold">{formatCurrency(soaReport.aging.days90)}</div>
                </div>
                <div>
                  <div className="text-xs text-red-600">&gt; 90 Days</div>
                  <div className="font-semibold text-red-600">{formatCurrency(soaReport.aging.days120Plus)}</div>
                </div>
                <div>
                  <div className="text-xs text-primary font-bold">Total Due</div>
                  <div className="font-bold text-lg">{formatCurrency(soaReport.aging.totalOutstanding)}</div>
                </div>
             </div>
          </div>

        </div>
      )}
    </div>
  );
}
