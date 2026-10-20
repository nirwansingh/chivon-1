import { requirePermission } from '@/lib/auth';
import { api } from '@/lib/api-client';
import { notFound } from 'next/navigation';
import { PaymentDetailView } from '@/components/payment-detail-view';

export const dynamic = 'force-dynamic';

export default async function PaymentPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  await requirePermission('view_invoices');
  
  const result = await api<{ payment: any; outstandingInvoices: any[] } | { error: string }>(
    `/api/payments/${params.id}`
  );
  if (!result || !('payment' in result) || !result.payment) notFound();
  const { payment, outstandingInvoices } = result;

  return (
    <div className="max-w-6xl mx-auto">
      <PaymentDetailView payment={payment} outstandingInvoices={outstandingInvoices} />
    </div>
  );
}
