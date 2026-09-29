import { Metadata } from 'next';
import { requirePermission } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { ReportsClient } from './client';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Reports | Chivon Mechanical',
};

export default async function ReportsPage() {
  await requirePermission('REPORT.VIEW');

  // Fetch necessary lookup data for filters
  const [customers, users] = await Promise.all([
    prisma.customer.findMany({ select: { id: true, companyName: true }, orderBy: { companyName: 'asc' } }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Reports" 
        description="Generate and export operational and financial reports." 
      />
      
      <ReportsClient 
        customers={customers.map(c => ({ label: c.companyName, value: c.id }))}
        users={users.map(u => ({ label: u.name, value: u.id }))}
      />
    </div>
  );
}
