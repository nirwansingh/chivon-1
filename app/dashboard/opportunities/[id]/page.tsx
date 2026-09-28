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
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Status</CardDescription>
            <CardTitle className="text-xl font-bold">
              <StatusBadge status={opportunity.status} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Probability</CardDescription>
            <CardTitle className="text-2xl font-bold text-primary">
              {opportunity.probability !== null ? `${opportunity.probability}%` : '-'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Expected Value</CardDescription>
            <CardTitle className="text-2xl font-bold text-success">
              {opportunity.expectedValue ? <MoneyDisplay amount={Number(opportunity.expectedValue)} /> : '-'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Assigned To</CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle>Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Customer</div>
                  <div className="font-medium">
                    {opportunity.customer ? (
                      <Link href={`/dashboard/customers/${opportunity.customerId}`} className="text-primary hover:underline">
                        {opportunity.customer.companyName}
                      </Link>
                    ) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Contact Person</div>
                  <div className="font-medium">{opportunity.contact?.name || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Source</div>
                  <div className="font-medium">{opportunity.source || '-'}</div>
                </div>
                
                <div>
                  <div className="text-muted-foreground">Competitor</div>
                  <div className="font-medium">{opportunity.competitor || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Expected Closing</div>
                  <div className="font-medium">{opportunity.expectedClosingDate ? <DateDisplay date={opportunity.expectedClosingDate} /> : '-'}</div>
                </div>

                <div>
                  <div className="text-muted-foreground">Project</div>
                  <div className="font-medium">{opportunity.project || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Site Location</div>
                  <div className="font-medium">{opportunity.site || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div className="font-medium"><DateDisplay date={opportunity.createdAt} /></div>
                </div>

                <div className="md:col-span-3">
                  <div className="text-muted-foreground mb-1">Description</div>
                  <div className="font-medium bg-muted/50 p-3 rounded-md min-h-[60px] whitespace-pre-wrap">
                    {opportunity.description || '-'}
                  </div>
                </div>
                
                {opportunity.notes && (
                  <div className="md:col-span-3">
                    <div className="text-muted-foreground mb-1">Internal Notes</div>
                    <div className="font-medium bg-muted/50 p-3 rounded-md min-h-[60px] whitespace-pre-wrap">
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
