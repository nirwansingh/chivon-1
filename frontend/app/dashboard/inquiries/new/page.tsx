import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { InquiryForm } from '@/components/inquiry-form';
import { listUsers } from '@/lib/lookups';

export const metadata: Metadata = {
  title: 'Add New Inquiry | Chivon CRM',
};

export default async function NewInquiryPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('INQUIRY.CREATE');

  const users = await listUsers();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Add New Inquiry" 
        description="Record a new inquiry or lead."
        breadcrumbs={[
          { label: 'Inquiries', href: '/dashboard/inquiries' },
          { label: 'New' }
        ]}
      />
      
      <div className="max-w-4xl">
        <InquiryForm users={users} />
      </div>
    </div>
  );
}
