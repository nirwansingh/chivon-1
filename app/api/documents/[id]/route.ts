import { NextResponse } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { StorageService } from '@/lib/storage-service';
import fs from 'fs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // In a real app, check if user has permission to view this specific document
    const { document, filePath } = await StorageService.getDocumentFile(params.id);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.fileType,
        'Content-Disposition': `inline; filename="${document.fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Failed to serve document:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
