import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { OpportunityForm } from '@/components/opportunity-form';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Add New Opportunity | Chivon CRM',
};

export default async function NewOpportunityPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('OPPORTUNITY.CREATE');

  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Add New Opportunity" 
        description="Create a new sales opportunity."
        breadcrumbs={[
          { label: 'Opportunities', href: '/dashboard/opportunities' },
          { label: 'New' }
        ]}
      />
      
      <div className="max-w-4xl">
        <OpportunityForm users={users} />
      </div>
    </div>
  );
}
