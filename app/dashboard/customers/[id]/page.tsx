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
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Total Invoiced</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              <MoneyDisplay amount={totalInvoiced} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Total Paid</CardDescription>
            <CardTitle className="text-2xl font-bold text-success">
              <MoneyDisplay amount={totalPaid} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Outstanding Balance</CardDescription>
            <CardTitle className="text-2xl font-bold text-warning">
              <MoneyDisplay amount={outstanding} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Overdue Amount</CardDescription>
            <CardTitle className="text-2xl font-bold text-destructive">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Status</div>
                  <div><StatusBadge status={customer.status} /></div>
                  
                  <div className="text-muted-foreground">Customer Type</div>
                  <div>{customer.customerType || '-'}</div>
                  
                  <div className="text-muted-foreground">Industry</div>
                  <div>{customer.industry || '-'}</div>
                  
                  <div className="text-muted-foreground">Email</div>
                  <div>{customer.email || '-'}</div>
                  
                  <div className="text-muted-foreground">Phone</div>
                  <div>{customer.phone || '-'}</div>
                  
                  <div className="text-muted-foreground">Website</div>
                  <div>{customer.website || '-'}</div>
                  
                  <div className="text-muted-foreground">TRN</div>
                  <div>{customer.trn || '-'}</div>
                  
                  <div className="text-muted-foreground">Created</div>
                  <div><DateDisplay date={customer.createdAt} /></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Primary Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.contacts.length > 0 ? (
                  (() => {
                    const primary = customer.contacts.find(c => c.isPrimary) || customer.contacts[0];
                    return (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Name</div>
                        <div className="font-medium">{primary.name}</div>
                        
                        <div className="text-muted-foreground">Designation</div>
                        <div>{primary.designation || '-'}</div>
                        
                        <div className="text-muted-foreground">Email</div>
                        <div>{primary.email || '-'}</div>
                        
                        <div className="text-muted-foreground">Phone</div>
                        <div>{primary.phone || '-'}</div>
                        
                        <div className="text-muted-foreground">Mobile</div>
                        <div>{primary.mobile || '-'}</div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-sm text-muted-foreground">No contacts available.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>All Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {customer.contacts.map(contact => (
                  <div key={contact.id} className="p-4 border rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{contact.name}</h4>
                      {contact.isPrimary && <Badge className="text-[10px] px-1.5 h-5 bg-primary/10 text-primary hover:bg-primary/20 border-0">Primary</Badge>}
                    </div>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      {contact.designation && <p>{contact.designation}</p>}
                      {contact.email && <p>📧 {contact.email}</p>}
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
          <Card>
            <CardHeader>
              <CardTitle>All Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {customer.addresses.map(address => (
                  <div key={address.id} className="p-4 border rounded-lg shadow-sm">
                    <div className="mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded">
                        {address.type}
                      </span>
                    </div>
                    <div className="text-sm space-y-1 mt-3">
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>{address.city}{address.state ? `, ${address.state}` : ''}</p>
                      <p>{address.country} {address.postalCode}</p>
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
