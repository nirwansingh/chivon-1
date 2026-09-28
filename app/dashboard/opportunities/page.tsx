import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { OpportunityService } from '@/lib/opportunity-service';
import { OpportunityClient } from './client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Opportunities | Chivon CRM',
};

export default async function OpportunitiesPage(props: {
  searchParams: Promise<{ q?: string; status?: string; view?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('OPPORTUNITY.VIEW');
  const canCreate = await requirePermission('OPPORTUNITY.CREATE').then(() => true).catch(() => false);
  const canEdit = await requirePermission('OPPORTUNITY.EDIT').then(() => true).catch(() => false);

  const searchParams = await props.searchParams;
  const q = searchParams.q || '';
  const status = searchParams.status || 'ALL';
  const view = searchParams.view || 'list'; // 'list' or 'kanban'

  const opportunities = await OpportunityService.getOpportunities({ search: q, status });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Opportunities" 
        description="Manage sales pipeline and deals."
        action={
          <div className="flex gap-2">
            <Button variant={view === 'list' ? 'default' : 'outline'} render={<Link href={`/dashboard/opportunities?view=list${q ? `&q=${q}` : ''}`} />}>
              List
            </Button>
            <Button variant={view === 'kanban' ? 'default' : 'outline'} render={<Link href={`/dashboard/opportunities?view=kanban${q ? `&q=${q}` : ''}`} />}>
              Kanban
            </Button>
            {canCreate && (
              <Button render={<Link href="/dashboard/opportunities/new" />}>
                <Plus className="mr-2 h-4 w-4" />
                New Deal
              </Button>
            )}
          </div>
        }
      />
      
      <OpportunityClient 
        opportunities={opportunities} 
        view={view as 'list' | 'kanban'} 
        canEdit={canEdit}
      />
    </div>
  );
}
