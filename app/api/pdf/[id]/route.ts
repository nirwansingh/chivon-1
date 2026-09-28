import { NextResponse } from 'next/server';
import { PdfService } from '@/lib/pdf-service';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // We expect ?revisionId=...
    const { searchParams } = new URL(request.url);
    const revisionId = searchParams.get('revisionId');

    if (!revisionId) {
      return new NextResponse('Missing revisionId', { status: 400 });
    }

    const pdfBuffer = await PdfService.generateQuotationPdf(id, revisionId);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="quotation-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}
