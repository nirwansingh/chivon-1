import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function proxyBackend(request: NextRequest, path: string) {
  const token = (await cookies()).get('chivon_session')?.value;
  const url = new URL(path, API_URL);
  url.search = request.nextUrl.search;

  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { headers, cache: 'no-store' });
  const body = await response.arrayBuffer();
  const out = new Headers();
  for (const name of ['content-type', 'content-disposition', 'cache-control']) {
    const value = response.headers.get(name);
    if (value) out.set(name, value);
  }
  return new NextResponse(body, { status: response.status, headers: out });
}
