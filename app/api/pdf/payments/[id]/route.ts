import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { PdfService } from '@/lib/pdf-service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission('view_invoices');
    
    const buffer = await PdfService.generatePaymentReceiptPdf(params.id);
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receipt-${params.id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
  }
}
