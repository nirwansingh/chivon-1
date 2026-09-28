import { notFound, redirect } from 'next/navigation';
import { QuotationService } from '@/lib/quotation-service';
import { QuotationForm } from '@/components/quotation-form';

export default async function ReviseQuotationPage({ params }: { params: { id: string } }) {
  const quotation = await QuotationService.getById(params.id);

  if (!quotation) {
    notFound();
  }

  // Get current revision
  const currentRevision = quotation.revisions.find(r => r.isCurrent) || quotation.revisions[0];

  if (!currentRevision) {
    notFound();
  }

  const initialData = {
    customerId: quotation.customerId,
    contactId: quotation.contactId || undefined,
    opportunityId: quotation.opportunityId || undefined,
    validUntil: quotation.validUntil || undefined,
    notes: quotation.notes || undefined,
    terms: quotation.terms || undefined,
    discountType: currentRevision.discountType as any || null,
    discountValue: currentRevision.discountValue ? Number(currentRevision.discountValue) : null,
    items: currentRevision.items.map(item => ({
      productId: item.productId || undefined,
      description: item.description || undefined,
      quantity: Number(item.quantity),
      unit: item.unit,
      rate: Number(item.rate),
      discountType: item.discountType as any || null,
      discountValue: item.discountValue ? Number(item.discountValue) : null,
      vatRate: Number(item.vatRate),
    })),
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Revise Quotation {quotation.number}
        </h1>
        <p className="text-muted-foreground mt-2">
          Creating Revision {currentRevision.revisionNumber + 1}
        </p>
      </div>
      
      <QuotationForm initialData={initialData} quotationId={quotation.id} />
    </div>
  );
}
