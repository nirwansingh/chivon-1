import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { QuotationService } from '@/lib/quotation-service';
import { QuotationClient } from './client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Quotations | Chivon CRM',
};

export default async function QuotationsPage(props: {
  searchParams: Promise<{ q?: string; status?: string; customerId?: string; userId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('QUOTATION.VIEW');
  const canCreate = await requirePermission('QUOTATION.CREATE').then(() => true).catch(() => false);
  const canEdit = await requirePermission('QUOTATION.EDIT').then(() => true).catch(() => false);

  const searchParams = await props.searchParams;
  const q = searchParams.q || '';
  const status = searchParams.status || 'ALL';
  const customerId = searchParams.customerId || '';
  const userId = searchParams.userId || '';

  const quotations = await QuotationService.getQuotations({ 
    search: q, 
    status, 
    customerId: customerId || undefined, 
    userId: userId || undefined 
  });

  // Fetch users and customers for the filter dropdowns
  const users = await prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
  const customers = await prisma.customer.findMany({ select: { id: true, companyName: true }, orderBy: { companyName: 'asc' } });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Quotations" 
        description="Manage sales quotations and revisions."
        action={
          <div className="flex gap-2">
            {canCreate && (
              <Button render={<Link href="/dashboard/quotations/new" />}>
                <Plus className="mr-2 h-4 w-4" />
                New Quotation
              </Button>
            )}
          </div>
        }
      />
      
      <QuotationClient 
        quotations={quotations} 
        canEdit={canEdit}
        users={users}
        customers={customers}
      />
    </div>
  );
}
