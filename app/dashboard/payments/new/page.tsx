import { requirePermission } from '@/lib/auth';
import { RecordPaymentForm } from '@/components/record-payment-form';

export const dynamic = 'force-dynamic';

export default async function NewPaymentPage() {
  await requirePermission('manage_invoices');
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Record New Payment</h1>
      <RecordPaymentForm />
    </div>
  );
}
