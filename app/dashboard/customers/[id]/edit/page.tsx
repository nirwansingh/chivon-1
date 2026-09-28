import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { CustomerForm } from '@/components/customer-form';
import { CustomerService } from '@/lib/customer-service';

export const metadata: Metadata = {
  title: 'Edit Customer | Chivon CRM',
};

export default async function EditCustomerPage(props: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('CUSTOMER.EDIT');

  const { id } = await props.params;
  const customer = await CustomerService.getCustomerById(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <PageHeader 
        title={`Edit ${customer.companyName}`}
        description="Update customer information, contacts, and addresses."
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          { label: customer.companyName, href: `/dashboard/customers/${id}` },
          { label: 'Edit' }
        ]}
      />
      
      <div className="bg-background">
        <CustomerForm initialData={customer} />
      </div>
    </div>
  );
}
