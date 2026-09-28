import { NextRequest, NextResponse } from 'next/server';
import { SearchService } from '@/lib/search-service';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ results: {} });
    }

    const results = await SearchService.search(q, user.id, user.role.name);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[SEARCH_API]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
