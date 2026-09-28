import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { InquiryForm } from '@/components/inquiry-form';
import { InquiryService } from '@/lib/inquiry-service';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Edit Inquiry | Chivon CRM',
};

export default async function EditInquiryPage(props: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('INQUIRY.EDIT');

  const { id } = await props.params;
  const [inquiry, users] = await Promise.all([
    InquiryService.getInquiryById(id),
    prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!inquiry) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={`Edit Inquiry: ${inquiry.title}`} 
        description="Update inquiry details."
        breadcrumbs={[
          { label: 'Inquiries', href: '/dashboard/inquiries' },
          { label: inquiry.title, href: `/dashboard/inquiries/${inquiry.id}` },
          { label: 'Edit' }
        ]}
      />
      
      <div className="max-w-4xl">
        <InquiryForm initialData={inquiry} users={users} />
      </div>
    </div>
  );
}
