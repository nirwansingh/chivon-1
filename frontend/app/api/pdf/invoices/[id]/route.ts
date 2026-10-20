import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/backend-proxy';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyBackend(request, `/api/pdf/invoices/${id}`);
}
