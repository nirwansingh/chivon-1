import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { PdfService } from '@/lib/pdf-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('view_invoices');
    
    const { id } = await params;
    if (!id) {
      return new NextResponse('Credit Note ID is required', { status: 400 });
    }

    const pdfBuffer = await PdfService.generateCreditNotePdf(id);
    
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="credit-note-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return new NextResponse(error.message || 'Error generating PDF', { status: 500 });
  }
}
