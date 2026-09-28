import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { CustomerForm } from '@/components/customer-form';

export const metadata: Metadata = {
  title: 'New Customer | Chivon CRM',
};

export default async function NewCustomerPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('CUSTOMER.CREATE');

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <PageHeader 
        title="Add Customer" 
        description="Create a new customer account, contacts, and addresses."
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          { label: 'New' }
        ]}
      />
      
      <div className="bg-background">
        <CustomerForm />
      </div>
    </div>
  );
}
