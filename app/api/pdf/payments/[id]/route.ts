import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { PdfService } from '@/lib/pdf-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('view_invoices');
    
    const { id } = await params;
    const buffer = await PdfService.generatePaymentReceiptPdf(id);
    
    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receipt-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
  }
}
