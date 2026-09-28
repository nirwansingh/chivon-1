import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const id = searchParams.get('id');

    let where: any = {};
    if (id) {
      where.id = id;
    } else if (search.trim()) {
      where = {
        OR: [
          { companyName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ]
      };
    }

    const customers = await prisma.customer.findMany({
      where,
      take: 20,
      orderBy: { companyName: 'asc' },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('[CUSTOMERS_API]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
