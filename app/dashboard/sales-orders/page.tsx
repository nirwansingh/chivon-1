import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { SalesOrderService } from '@/lib/sales-order-service';
import { SalesOrderClient } from './client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Sales Orders | Chivon CRM',
};

export default async function SalesOrdersPage(props: {
  searchParams: Promise<{ q?: string; status?: string; customerId?: string; userId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('SALES_ORDER.VIEW');
  const canCreate = await requirePermission('SALES_ORDER.CREATE').then(() => true).catch(() => false);
  const canEdit = await requirePermission('SALES_ORDER.EDIT').then(() => true).catch(() => false);

  const searchParams = await props.searchParams;
  const q = searchParams.q || '';
  const status = searchParams.status || 'ALL';
  const customerId = searchParams.customerId || '';
  const userId = searchParams.userId || '';

  const salesOrders = await SalesOrderService.getSalesOrders({ 
    search: q, 
    status, 
    customerId: customerId || undefined, 
    userId: userId || undefined 
  });

  const users = await prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
  const customers = await prisma.customer.findMany({ select: { id: true, companyName: true }, orderBy: { companyName: 'asc' } });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Sales Orders" 
        description="Manage sales orders, fulfillment, and conversions from quotations."
        action={
          <div className="flex gap-2">
            {canCreate && (
              <Button render={<Link href="/dashboard/sales-orders/new" />}>
                <Plus className="mr-2 h-4 w-4" />
                New Sales Order
              </Button>
            )}
          </div>
        }
      />
      
      <SalesOrderClient 
        salesOrders={JSON.parse(JSON.stringify(salesOrders)) as any} 
        canEdit={canEdit}
        users={users}
        customers={customers}
      />
    </div>
  );
}
