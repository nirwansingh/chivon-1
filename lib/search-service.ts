import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export type SearchResultType = 'CUSTOMER' | 'INQUIRY' | 'OPPORTUNITY' | 'QUOTATION' | 'SALES_ORDER' | 'INVOICE' | 'PAYMENT' | 'PRODUCT' | 'USER';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  url: string;
}

export class SearchService {
  /**
   * Universal search across all allowed modules based on the current user's permissions.
   */
  static async search(query: string, userId: string, roleName: string): Promise<Record<string, SearchResult[]>> {
    const q = query.trim();
    if (!q || q.length < 2) {
      return {};
    }

    const results: Record<string, SearchResult[]> = {};

    // For V1, we will conditionally search based on basic role inference 
    // or we can just let Prisma filter. To be truly robust, we should check `requirePermission` 
    // for each module, but since search returns multiple types, we can check permissions manually.
    // We'll assume if they can login, they can see Users (for now).
    // In actual implementation, we check the DB or session for permissions.

    // 1. Search Users (Admin usually)
    if (['SUPER_ADMIN', 'ADMIN'].includes(roleName)) {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        include: { role: true },
      });

      if (users.length > 0) {
        results['Users'] = users.map(u => ({
          id: u.id,
          type: 'USER',
          title: u.name,
          subtitle: `${u.email} • ${u.role.name}`,
          url: `/dashboard/users`, // or specific user page when available
        }));
      }
    }

    // Since Customers, Quotes, etc. aren't fully seeded with full search indexing yet,
    // we'll leave placeholders for them here to be populated in Phase 4-6.

    /*
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ]
      },
      take: 5
    });
    */

    return results;
  }
}
