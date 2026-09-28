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
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Status</CardDescription>
            <CardTitle className="text-xl font-bold">
              <StatusBadge status={inquiry.status} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Priority</CardDescription>
            <CardTitle className="text-xl font-bold">
              {inquiry.priority}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Expected Value</CardDescription>
            <CardTitle className="text-xl font-bold text-primary">
              {inquiry.expectedValue ? <MoneyDisplay amount={Number(inquiry.expectedValue)} /> : '-'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Assigned To</CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle>Inquiry Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Customer</div>
                  <div className="font-medium">
                    {inquiry.customer ? (
                      <Link href={`/dashboard/customers/${inquiry.customerId}`} className="text-primary hover:underline">
                        {inquiry.customer.companyName}
                      </Link>
                    ) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Contact Person</div>
                  <div className="font-medium">{inquiry.contact?.name || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Source</div>
                  <div className="font-medium">{inquiry.source || '-'}</div>
                </div>
                
                <div>
                  <div className="text-muted-foreground">Product/Service</div>
                  <div className="font-medium">{inquiry.productOrService || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Quantity</div>
                  <div className="font-medium">{inquiry.quantity ? Number(inquiry.quantity) : '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Expected Closing</div>
                  <div className="font-medium">{inquiry.expectedClosingDate ? <DateDisplay date={inquiry.expectedClosingDate} /> : '-'}</div>
                </div>

                <div>
                  <div className="text-muted-foreground">Project</div>
                  <div className="font-medium">{inquiry.project || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Site Location</div>
                  <div className="font-medium">{inquiry.site || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div className="font-medium"><DateDisplay date={inquiry.createdAt} /></div>
                </div>

                <div className="md:col-span-3">
                  <div className="text-muted-foreground mb-1">Description / Requirements</div>
                  <div className="font-medium bg-muted/50 p-3 rounded-md min-h-[60px] whitespace-pre-wrap">
                    {inquiry.description || '-'}
                  </div>
                </div>
                
                {inquiry.notes && (
                  <div className="md:col-span-3">
                    <div className="text-muted-foreground mb-1">Internal Notes</div>
                    <div className="font-medium bg-muted/50 p-3 rounded-md min-h-[60px] whitespace-pre-wrap">
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
