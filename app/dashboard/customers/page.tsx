import { Metadata } from 'next';
import { CustomerService } from '@/lib/customer-service';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CustomerListClient } from './client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Customers | Chivon CRM',
};

export default async function CustomersPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('CUSTOMER.VIEW');
  const canCreate = await requirePermission('CUSTOMER.CREATE').then(() => true).catch(() => false);

  const searchParams = await props.searchParams;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit) : 10;
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
  const status = typeof searchParams.status === 'string' && (searchParams.status === 'ACTIVE' || searchParams.status === 'INACTIVE') 
    ? searchParams.status 
    : undefined;
  const sortBy = typeof searchParams.sortBy === 'string' ? searchParams.sortBy : 'createdAt';
  const sortOrder = searchParams.sortOrder === 'asc' ? 'asc' : 'desc';

  const { data, total, pageCount } = await CustomerService.getCustomers({
    page,
    limit,
    search,
    status,
    sortBy,
    sortOrder,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Customers" 
        description="Manage your customer accounts, contacts, and addresses."
        action={
          canCreate ? (
            <Button render={
              <Link href="/dashboard/customers/new" />
            }>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          ) : undefined
        }
      />
      
      <CustomerListClient 
        initialData={data} 
        initialTotal={total}
        initialPageCount={pageCount}
      />
    </div>
  );
}
