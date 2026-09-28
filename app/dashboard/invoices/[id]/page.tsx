import { requirePermission } from '@/lib/auth';
import { InvoiceService } from '@/lib/invoice-service';
import { notFound } from 'next/navigation';
import { InvoiceView } from '@/components/invoice-view';

export const dynamic = 'force-dynamic';

export default async function InvoicePage({ params }: { params: { id: string } }) {
  await requirePermission('view_invoices');
  
  const invoice = await InvoiceService.getById(params.id);
  if (!invoice) return notFound();
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <InvoiceView invoice={JSON.parse(JSON.stringify(invoice))} />
    </div>
  );
}
