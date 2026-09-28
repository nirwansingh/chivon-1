import { notFound } from 'next/navigation';
import { QuotationService } from '@/lib/quotation-service';
import { QuotationView } from '@/components/quotation-view';

export default async function QuotationPage({ params }: { params: { id: string } }) {
  const quotation = await QuotationService.getById(params.id);

  if (!quotation) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <QuotationView initialQuotation={quotation as any} />
    </div>
  );
}
