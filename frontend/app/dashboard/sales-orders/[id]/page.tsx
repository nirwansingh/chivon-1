import { notFound } from 'next/navigation';
import { SalesOrderService } from '@/lib/sales-order-service';
import { SalesOrderView } from '@/components/sales-order-view';
import { getCurrentUser, requirePermission } from '@/lib/auth';

export default async function SalesOrderPage(props: { params: Promise<{ id: string }> }) {
  await requirePermission('SALES_ORDER.VIEW');

  const { id } = await props.params;
  const salesOrder = await SalesOrderService.getById(id);

  if (!salesOrder) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <SalesOrderView initialSalesOrder={JSON.parse(JSON.stringify(salesOrder))} />
    </div>
  );
}
