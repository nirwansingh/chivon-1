import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { PdfService } from '@/lib/pdf-service';

export async function GET(
  request: Request
) {
  try {
    await requirePermission('view_reports');

    const url = new URL(request.url);
    const customerId = url.searchParams.get('customerId');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    if (!customerId || !fromDate || !toDate) {
      return new NextResponse('Missing parameters', { status: 400 });
    }

    const pdfBuffer = await PdfService.generateSOAPdf(customerId, new Date(fromDate), new Date(toDate + 'T23:59:59'));

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="SOA-${customerId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate SOA PDF:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
