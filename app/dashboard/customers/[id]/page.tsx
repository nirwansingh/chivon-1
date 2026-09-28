import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { CustomerService } from '@/lib/customer-service';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { DateDisplay } from '@/components/date-display';
import { MoneyDisplay } from '@/components/money-display';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/empty-state';
import { FolderOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Customer Details | Chivon CRM',
};

export default async function CustomerDetailsPage(props: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('CUSTOMER.VIEW');
  const canEdit = await requirePermission('CUSTOMER.EDIT').then(() => true).catch(() => false);

  const { id } = await props.params;
  const customer = await CustomerService.getCustomerById(id);

  if (!customer) {
    notFound();
  }

  // Calculate some dummy financials for now until we have real invoices/payments
  const totalInvoiced = 0;
  const totalPaid = 0;
  const outstanding = (customer.openingReceivable?.toNumber() || 0) + totalInvoiced - totalPaid;
  const overdue = 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={customer.companyName}
        description={`Customer ID: ${customer.id}`}
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          { label: customer.companyName }
        ]}
        action={
          canEdit ? (
            <Button render={<Link href={`/dashboard/customers/${customer.id}/edit`} />}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Customer
            </Button>
          ) : undefined
        }
      />
      
      {/* P4.7 Financial Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-hover kpi-accent-blue">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold uppercase tracking-wider text-xs">Total Invoiced</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              <MoneyDisplay amount={totalInvoiced} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="card-hover kpi-accent-green">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold uppercase tracking-wider text-xs">Total Paid</CardDescription>
            <CardTitle className="text-2xl font-bold text-success">
              <MoneyDisplay amount={totalPaid} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="card-hover kpi-accent-amber">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold uppercase tracking-wider text-xs">Outstanding Balance</CardDescription>
            <CardTitle className="text-2xl font-bold text-warning">
              <MoneyDisplay amount={outstanding} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="card-hover kpi-accent-red">
          <CardHeader className="py-4">
            <CardDescription className="font-semibold uppercase tracking-wider text-xs">Overdue Amount</CardDescription>
            <CardTitle className="text-2xl font-bold text-danger">
              <MoneyDisplay amount={overdue} />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <ScrollArea className="w-full pb-2">
          <TabsList className="mb-4 inline-flex w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({customer.contacts.length})</TabsTrigger>
            <TabsTrigger value="addresses">Addresses ({customer.addresses.length})</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="quotations">Quotations</TabsTrigger>
            <TabsTrigger value="orders">Sales Orders</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="soa">Statement of Account</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b border-border/50 bg-surface-blue/30">
                <CardTitle className="text-base font-semibold">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                  <div className="text-muted-foreground font-medium">Status</div>
                  <div><StatusBadge status={customer.status} /></div>
                  
                  <div className="text-muted-foreground font-medium">Customer Type</div>
                  <div className="font-medium text-foreground">{customer.customerType || '-'}</div>
                  
                  <div className="text-muted-foreground font-medium">Industry</div>
                  <div className="text-foreground">{customer.industry || '-'}</div>
                  
                  <div className="text-muted-foreground font-medium">Email</div>
                  <div className="text-primary">{customer.email || '-'}</div>
                  
                  <div className="text-muted-foreground font-medium">Phone</div>
                  <div className="text-foreground">{customer.phone || '-'}</div>
                  
                  <div className="text-muted-foreground font-medium">Website</div>
                  <div className="text-primary">{customer.website || '-'}</div>
                  
                  <div className="text-muted-foreground font-medium">TRN</div>
                  <div className="font-mono text-xs">{customer.trn || '-'}</div>
                  
                  <div className="text-muted-foreground font-medium">Created</div>
                  <div><DateDisplay date={customer.createdAt} /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b border-border/50 bg-surface-blue/30">
                <CardTitle className="text-base font-semibold">Primary Contact</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                {customer.contacts.length > 0 ? (
                  (() => {
                    const primary = customer.contacts.find(c => c.isPrimary) || customer.contacts[0];
                    return (
                      <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                        <div className="text-muted-foreground font-medium">Name</div>
                        <div className="font-semibold text-foreground">{primary.name}</div>
                        
                        <div className="text-muted-foreground font-medium">Designation</div>
                        <div className="text-foreground">{primary.designation || '-'}</div>
                        
                        <div className="text-muted-foreground font-medium">Email</div>
                        <div className="text-primary">{primary.email || '-'}</div>
                        
                        <div className="text-muted-foreground font-medium">Phone</div>
                        <div className="text-foreground">{primary.phone || '-'}</div>
                        
                        <div className="text-muted-foreground font-medium">Mobile</div>
                        <div className="text-foreground">{primary.mobile || '-'}</div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-sm text-muted-foreground py-4 text-center">No contacts available.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3 border-b border-border/50 bg-surface-blue/30">
              <CardTitle className="text-base font-semibold">All Contacts</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {customer.contacts.map(contact => (
                  <div key={contact.id} className="p-4 border border-border rounded-xl shadow-sm bg-card card-hover hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-foreground">{contact.name}</h4>
                      {contact.isPrimary && <Badge className="text-[10px] px-1.5 h-5 bg-surface-blue text-primary border-0 font-semibold tracking-wide">Primary</Badge>}
                    </div>
                    <div className="text-sm space-y-1.5 text-muted-foreground">
                      {contact.designation && <p className="text-foreground font-medium">{contact.designation}</p>}
                      {contact.email && <p className="text-primary hover:underline cursor-pointer">✉️ {contact.email}</p>}
                      {contact.phone && <p>📞 {contact.phone}</p>}
                      {contact.mobile && <p>📱 {contact.mobile}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3 border-b border-border/50 bg-surface-blue/30">
              <CardTitle className="text-base font-semibold">All Addresses</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {customer.addresses.map(address => (
                  <div key={address.id} className="p-4 border border-border rounded-xl shadow-sm bg-card card-hover hover:border-primary/30 transition-colors">
                    <div className="mb-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-surface-blue px-2 py-1 rounded-md">
                        {address.type}
                      </span>
                    </div>
                    <div className="text-sm space-y-1 mt-3 text-muted-foreground leading-relaxed">
                      <p className="font-medium text-foreground">{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>{address.city}{address.state ? `, ${address.state}` : ''}</p>
                      <p>{address.country} <span className="font-mono ml-1">{address.postalCode}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placeholders for future modules */}
        {['inquiries', 'opportunities', 'quotations', 'orders', 'invoices', 'payments', 'soa', 'tasks', 'documents', 'activity'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="pt-6">
                <EmptyState 
                  icon={FolderOpen} 
                  title={`${tab.charAt(0).toUpperCase() + tab.slice(1)} Coming Soon`} 
                  description={`This module will be built in a future phase.`} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}

      </Tabs>
    </div>
  );
}
