import { Metadata } from 'next';
import { AuditService } from '@/lib/audit';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AuditListClient } from './client';
import { PageHeader } from '@/components/page-header';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Audit Logs | Chivon CRM',
};

export default async function AuditPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('AUDIT.VIEW');

  const searchParams = await props.searchParams;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit) : 50;
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
  
  const userId = typeof searchParams.userId === 'string' ? searchParams.userId : undefined;
  const moduleName = typeof searchParams.module === 'string' ? searchParams.module : undefined;
  const action = typeof searchParams.action === 'string' ? searchParams.action : undefined;
  const dateFrom = typeof searchParams.dateFrom === 'string' ? new Date(searchParams.dateFrom) : undefined;
  const dateTo = typeof searchParams.dateTo === 'string' ? new Date(searchParams.dateTo) : undefined;

  const { data, total } = await AuditService.getAuditLogs({
    page,
    limit,
    search,
    userId,
    module: moduleName,
    action,
    dateFrom: dateFrom && !isNaN(dateFrom.getTime()) ? dateFrom : undefined,
    dateTo: dateTo && !isNaN(dateTo.getTime()) ? dateTo : undefined,
  });

  const pageCount = Math.ceil(total / limit);
  const users = await prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Audit Logs" 
        description="View system activity, user actions, and data changes."
      />
      
      <AuditListClient 
        initialData={JSON.parse(JSON.stringify(data))} 
        initialTotal={total}
        initialPageCount={pageCount}
        users={users}
      />
    </div>
  );
}
