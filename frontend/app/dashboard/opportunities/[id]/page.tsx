import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { OpportunityService } from '@/lib/opportunity-service';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { DateDisplay } from '@/components/date-display';
import { MoneyDisplay } from '@/components/money-display';
import { EmptyState } from '@/components/empty-state';
import { FolderOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Opportunity Details | Chivon CRM',
};

export default async function OpportunityDetailsPage(props: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('OPPORTUNITY.VIEW');
  const canEdit = await requirePermission('OPPORTUNITY.EDIT').then(() => true).catch(() => false);

  const { id } = await props.params;
  const opportunity = await OpportunityService.getOpportunityById(id);

  if (!opportunity) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={opportunity.name}
        description={`Opportunity ID: ${opportunity.id}`}
        breadcrumbs={[
          { label: 'Opportunities', href: '/dashboard/opportunities' },
          { label: opportunity.name }
        ]}
        action={
          canEdit ? (
            <div className="flex gap-2">
              <Button render={<Link href={`/dashboard/opportunities/${opportunity.id}/edit`} />} variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Deal
              </Button>
            </div>
          ) : undefined
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-hover kpi-accent-blue">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold uppercase tracking-wider text-xs">Status</CardDescription>
            <CardTitle className="text-xl font-bold">
              <StatusBadge status={opportunity.status} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="card-hover kpi-accent-amber">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold uppercase tracking-wider text-xs">Probability</CardDescription>
            <CardTitle className="text-2xl font-bold text-primary">
              {opportunity.probability !== null ? `${opportunity.probability}%` : '-'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="card-hover kpi-accent-green">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold uppercase tracking-wider text-xs">Expected Value</CardDescription>
            <CardTitle className="text-2xl font-bold text-success">
              {opportunity.expectedValue ? <MoneyDisplay amount={Number(opportunity.expectedValue)} /> : '-'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="card-hover border-border">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold uppercase tracking-wider text-xs">Assigned To</CardDescription>
            <CardTitle className="text-xl font-bold">
              {opportunity.assignedUser?.name || 'Unassigned'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products/Services</TabsTrigger>
          <TabsTrigger value="activity">Activity & Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3 border-b border-border/50 bg-surface-blue/30">
              <CardTitle className="text-base font-semibold">Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 text-sm">
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Customer</div>
                  <div className="font-semibold text-foreground">
                    {opportunity.customer ? (
                      <Link href={`/dashboard/customers/${opportunity.customerId}`} className="text-primary hover:underline transition-colors">
                        {opportunity.customer.companyName}
                      </Link>
                    ) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Contact Person</div>
                  <div className="font-semibold text-foreground">{opportunity.contact?.name || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Source</div>
                  <div className="font-semibold text-foreground">{opportunity.source || '-'}</div>
                </div>
                
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Competitor</div>
                  <div className="font-semibold text-foreground">{opportunity.competitor || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Expected Closing</div>
                  <div className="font-semibold text-foreground">{opportunity.expectedClosingDate ? <DateDisplay date={opportunity.expectedClosingDate} /> : '-'}</div>
                </div>

                <div>
                  <div className="text-muted-foreground font-medium mb-1">Project</div>
                  <div className="font-semibold text-foreground">{opportunity.project || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Site Location</div>
                  <div className="font-semibold text-foreground">{opportunity.site || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Created</div>
                  <div className="font-medium text-foreground"><DateDisplay date={opportunity.createdAt} /></div>
                </div>

                <div className="md:col-span-3">
                  <div className="text-muted-foreground font-medium mb-1.5">Description</div>
                  <div className="font-medium bg-surface-blue/30 text-foreground p-3.5 rounded-lg border border-border/50 min-h-[60px] whitespace-pre-wrap">
                    {opportunity.description || '-'}
                  </div>
                </div>
                
                {opportunity.notes && (
                  <div className="md:col-span-3">
                    <div className="text-muted-foreground font-medium mb-1.5">Internal Notes</div>
                    <div className="font-medium bg-surface-blue/30 text-foreground p-3.5 rounded-lg border border-border/50 min-h-[60px] whitespace-pre-wrap">
                      {opportunity.notes}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardContent className="pt-6">
              <EmptyState 
                icon={FolderOpen} 
                title="Products & Services" 
                description="Managing detailed line items on opportunities is typically done via Quotations (Phase 8)." 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="pt-6">
              <EmptyState 
                icon={FolderOpen} 
                title="Activity Timeline & Tasks" 
                description="Activity tracking will be built in Phase 13." 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
