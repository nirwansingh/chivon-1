import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { QuotationForm } from '@/components/quotation-form';

export const metadata: Metadata = {
  title: 'New Quotation | Chivon CRM',
};

export default async function NewQuotationPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('QUOTATION.CREATE');

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <PageHeader 
        title="Create Quotation" 
        description="Draft a new sales quotation with line items."
        breadcrumbs={[
          { label: 'Quotations', href: '/dashboard/quotations' },
          { label: 'New' }
        ]}
      />
      
      <div className="bg-background">
        <QuotationForm />
      </div>
    </div>
  );
}
