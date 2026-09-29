import { notFound } from 'next/navigation';
import { QuotationService } from '@/lib/quotation-service';
import { QuotationView } from '@/components/quotation-view';

export default async function QuotationPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const quotation = await QuotationService.getById(params.id);

  if (!quotation) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <QuotationView initialQuotation={JSON.parse(JSON.stringify(quotation))} />
    </div>
  );
}
