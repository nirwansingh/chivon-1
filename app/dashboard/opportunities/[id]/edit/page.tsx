import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { OpportunityForm } from '@/components/opportunity-form';
import { OpportunityService } from '@/lib/opportunity-service';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Edit Opportunity | Chivon CRM',
};

export default async function EditOpportunityPage(props: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('OPPORTUNITY.EDIT');

  const { id } = await props.params;
  const [opportunity, users] = await Promise.all([
    OpportunityService.getOpportunityById(id),
    prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!opportunity) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={`Edit Opportunity: ${opportunity.name}`} 
        description="Update opportunity details."
        breadcrumbs={[
          { label: 'Opportunities', href: '/dashboard/opportunities' },
          { label: opportunity.name, href: `/dashboard/opportunities/${opportunity.id}` },
          { label: 'Edit' }
        ]}
      />
      
      <div className="max-w-4xl">
        <OpportunityForm initialData={opportunity} users={users} />
      </div>
    </div>
  );
}
