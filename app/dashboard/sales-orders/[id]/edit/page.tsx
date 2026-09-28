import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { SalesOrderForm } from '@/components/sales-order-form';
import { SalesOrderService } from '@/lib/sales-order-service';

export const metadata: Metadata = {
  title: 'Edit Sales Order | Chivon CRM',
};

export default async function EditSalesOrderPage(props: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('SALES_ORDER.EDIT');

  const { id } = await props.params;
  const salesOrder = await SalesOrderService.getById(id);

  if (!salesOrder) {
    notFound();
  }

  if (salesOrder.status !== 'DRAFT' && salesOrder.status !== 'CONFIRMED') {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
        <PageHeader 
          title={`Edit Sales Order ${salesOrder.number}`} 
          breadcrumbs={[
            { label: 'Sales Orders', href: '/dashboard/sales-orders' },
            { label: salesOrder.number, href: `/dashboard/sales-orders/${salesOrder.id}` },
            { label: 'Edit' }
          ]}
        />
        <div className="p-6 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
          Cannot edit a sales order in {salesOrder.status} status.
        </div>
      </div>
    );
  }

  const initialData = {
    customerId: salesOrder.customerId,
    notes: salesOrder.notes || undefined,
    terms: salesOrder.terms || undefined,
    items: salesOrder.items.map(i => ({
      productId: i.productId || undefined,
      description: i.description || undefined,
      orderedQty: i.orderedQty.toNumber(),
      unit: i.unit,
      rate: i.rate.toNumber(),
      discountType: (i.discountType === 'PERCENTAGE' ? 'percentage' : i.discountType === 'FIXED_AMOUNT' ? 'fixed' : undefined) as "percentage" | "fixed" | undefined,
      discountValue: i.discountValue?.toNumber() || undefined,
      vatRate: i.vatRate.toNumber(),
    }))
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <PageHeader 
        title={`Edit Sales Order ${salesOrder.number}`} 
        description="Modify an existing sales order."
        breadcrumbs={[
          { label: 'Sales Orders', href: '/dashboard/sales-orders' },
          { label: salesOrder.number, href: `/dashboard/sales-orders/${salesOrder.id}` },
          { label: 'Edit' }
        ]}
      />
      
      <div className="bg-background">
        <SalesOrderForm initialData={initialData} salesOrderId={salesOrder.id} />
      </div>
    </div>
  );
}
