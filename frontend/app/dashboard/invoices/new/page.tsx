import { requirePermission } from '@/lib/auth';
import { api } from '@/lib/api-client';
import { redirect } from 'next/navigation';
import { GenerateInvoiceForm } from '@/components/generate-invoice-form';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: { salesOrderId?: string; quotationId?: string; revisionId?: string };
}) {
  await requirePermission('manage_invoices');

  if (searchParams.salesOrderId) {
    const so = await api<any>(`/api/sales-orders/${searchParams.salesOrderId}/invoice-source`);

    if (!so) return redirect('/dashboard/sales-orders');
    if (so.status !== 'CONFIRMED' && so.status !== 'FULFILLED') {
      return (
        <div className="p-8 text-center text-red-500">
          Sales order must be confirmed before invoicing.
        </div>
      );
    }

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight">Generate Invoice</h1>
        <p className="text-muted-foreground">
          Select items and quantities to invoice from Sales Order {so.number}
        </p>
        <GenerateInvoiceForm 
          type="sales_order" 
          sourceDoc={JSON.parse(JSON.stringify(so))} 
        />
      </div>
    );
  }

  if (searchParams.quotationId && searchParams.revisionId) {
    const quote = await api<any>(
      `/api/quotations/${searchParams.quotationId}/invoice-source?revisionId=${searchParams.revisionId}`
    );

    if (!quote || quote.revisions.length === 0) return redirect('/dashboard/quotations');
    
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight">Generate Invoice</h1>
        <p className="text-muted-foreground">
          Select items to invoice from Quotation {quote.number}
        </p>
        <GenerateInvoiceForm 
          type="quotation" 
          sourceDoc={JSON.parse(JSON.stringify(quote))} 
        />
      </div>
    );
  }

  return (
    <div className="p-8 text-center text-muted-foreground">
      Please select a Sales Order or Quotation to generate an invoice.
    </div>
  );
}
