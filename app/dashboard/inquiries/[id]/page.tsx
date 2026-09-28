import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { InquiryService } from '@/lib/inquiry-service';
import { Button } from '@/components/ui/button';
import { Edit, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { DateDisplay } from '@/components/date-display';
import { MoneyDisplay } from '@/components/money-display';
import { EmptyState } from '@/components/empty-state';
import { FolderOpen } from 'lucide-react';
import { Timeline } from '@/components/timeline'; // if not existing, we use a placeholder or check
import { ConvertOpportunityDialog } from './convert-dialog';

export const metadata: Metadata = {
  title: 'Inquiry Details | Chivon CRM',
};

export default async function InquiryDetailsPage(props: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('INQUIRY.VIEW');
  const canEdit = await requirePermission('INQUIRY.EDIT').then(() => true).catch(() => false);

  const { id } = await props.params;
  const inquiry = await InquiryService.getInquiryById(id);

  if (!inquiry) {
    notFound();
  }

  const isConverted = inquiry.status === 'CONVERTED';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={inquiry.title}
        description={`Inquiry ID: ${inquiry.id}`}
        breadcrumbs={[
          { label: 'Inquiries', href: '/dashboard/inquiries' },
          { label: inquiry.title }
        ]}
        action={
          canEdit ? (
            <div className="flex gap-2">
              {!isConverted && (
                <ConvertOpportunityDialog inquiryId={inquiry.id} />
              )}
              {isConverted && inquiry.opportunityId && (
                <Button variant="outline" render={<Link href={`/dashboard/opportunities/${inquiry.opportunityId}`} />}>
                  View Opportunity
                </Button>
              )}
              <Button render={<Link href={`/dashboard/inquiries/${inquiry.id}/edit`} />} variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Inquiry
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
              <StatusBadge status={inquiry.status} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="card-hover kpi-accent-amber">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold uppercase tracking-wider text-xs">Priority</CardDescription>
            <CardTitle className={`text-xl font-bold ${inquiry.priority === 'URGENT' ? 'text-danger' : inquiry.priority === 'HIGH' ? 'text-warning' : 'text-foreground'}`}>
              {inquiry.priority}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="card-hover kpi-accent-green">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold uppercase tracking-wider text-xs">Expected Value</CardDescription>
            <CardTitle className="text-xl font-bold text-success">
              {inquiry.expectedValue ? <MoneyDisplay amount={Number(inquiry.expectedValue)} /> : '-'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="card-hover border-border">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold uppercase tracking-wider text-xs">Assigned To</CardDescription>
            <CardTitle className="text-xl font-bold">
              {inquiry.assignedTo?.name || 'Unassigned'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity & Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes & Attachments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3 border-b border-border/50 bg-surface-blue/30">
              <CardTitle className="text-base font-semibold">Inquiry Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 text-sm">
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Customer</div>
                  <div className="font-semibold text-foreground">
                    {inquiry.customer ? (
                      <Link href={`/dashboard/customers/${inquiry.customerId}`} className="text-primary hover:underline transition-colors">
                        {inquiry.customer.companyName}
                      </Link>
                    ) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Contact Person</div>
                  <div className="font-semibold text-foreground">{inquiry.contact?.name || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Source</div>
                  <div className="font-semibold text-foreground">{inquiry.source || '-'}</div>
                </div>
                
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Product/Service</div>
                  <div className="font-semibold text-foreground">{inquiry.productOrService || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Quantity</div>
                  <div className="font-semibold text-foreground">{inquiry.quantity ? Number(inquiry.quantity) : '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Expected Closing</div>
                  <div className="font-semibold text-foreground">{inquiry.expectedClosingDate ? <DateDisplay date={inquiry.expectedClosingDate} /> : '-'}</div>
                </div>

                <div>
                  <div className="text-muted-foreground font-medium mb-1">Project</div>
                  <div className="font-semibold text-foreground">{inquiry.project || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Site Location</div>
                  <div className="font-semibold text-foreground">{inquiry.site || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Created</div>
                  <div className="font-medium text-foreground"><DateDisplay date={inquiry.createdAt} /></div>
                </div>

                <div className="md:col-span-3">
                  <div className="text-muted-foreground font-medium mb-1.5">Description / Requirements</div>
                  <div className="font-medium bg-surface-blue/30 text-foreground p-3.5 rounded-lg border border-border/50 min-h-[60px] whitespace-pre-wrap">
                    {inquiry.description || '-'}
                  </div>
                </div>
                
                {inquiry.notes && (
                  <div className="md:col-span-3">
                    <div className="text-muted-foreground font-medium mb-1.5">Internal Notes</div>
                    <div className="font-medium bg-surface-blue/30 text-foreground p-3.5 rounded-lg border border-border/50 min-h-[60px] whitespace-pre-wrap">
                      {inquiry.notes}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="pt-6">
              <EmptyState 
                icon={FolderOpen} 
                title="Activity Timeline" 
                description="Activity tracking will be built in Phase 13." 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardContent className="pt-6">
              <EmptyState 
                icon={FolderOpen} 
                title="Documents & Attachments" 
                description="Document management will be built in Phase 14." 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
