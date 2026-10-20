import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/backend-proxy';

export async function GET(request: NextRequest) {
  return proxyBackend(request, '/api/pdf/soa');
}
