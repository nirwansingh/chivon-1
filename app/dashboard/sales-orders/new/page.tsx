import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { SalesOrderForm } from '@/components/sales-order-form';

export const metadata: Metadata = {
  title: 'New Sales Order | Chivon CRM',
};

export default async function NewSalesOrderPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('SALES_ORDER.CREATE');

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <PageHeader 
        title="Create Sales Order" 
        description="Draft a new sales order with line items."
        breadcrumbs={[
          { label: 'Sales Orders', href: '/dashboard/sales-orders' },
          { label: 'New' }
        ]}
      />
      
      <div className="bg-background">
        <SalesOrderForm />
      </div>
    </div>
  );
}
