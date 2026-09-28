import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PaymentDetailView } from '@/components/payment-detail-view';
import { InvoiceService } from '@/lib/invoice-service';

export const dynamic = 'force-dynamic';

export default async function PaymentPage({ params }: { params: { id: string } }) {
  await requirePermission('view_invoices');
  
  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      allocations: {
        include: { invoice: true }
      }
    }
  });

  if (!payment) notFound();

  // Find outstanding invoices for this customer
  const unallocatedAmount = Number(payment.amount) - payment.allocations.reduce((sum, a) => sum + (a.isReversed ? 0 : Number(a.amount)), 0);
  
  let outstandingInvoices = [];
  
  if (!payment.isReversed && unallocatedAmount > 0) {
    const customerInvoices = await prisma.invoice.findMany({
      where: { 
        customerId: payment.customerId,
        status: { in: ['ISSUED', 'PARTIALLY_PAID'] }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    // We must compute the outstanding balance for each
    const withOutstanding = await Promise.all(
      customerInvoices.map(async (inv) => {
        const outst = await InvoiceService.calculateOutstanding(inv.id);
        return { ...inv, outstanding: outst };
      })
    );
    
    outstandingInvoices = withOutstanding.filter(inv => inv.outstanding > 0.01);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PaymentDetailView payment={payment} outstandingInvoices={outstandingInvoices} />
    </div>
  );
}
