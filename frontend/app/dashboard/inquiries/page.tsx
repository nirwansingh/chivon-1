import { Metadata } from 'next';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { InquiryService } from '@/lib/inquiry-service';
import { InquiryListClient } from './client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Inquiries | Chivon CRM',
};

export default async function InquiriesPage(props: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  await requirePermission('INQUIRY.VIEW');
  const canCreate = await requirePermission('INQUIRY.CREATE').then(() => true).catch(() => false);

  const searchParams = await props.searchParams;
  const q = searchParams.q || '';
  const status = searchParams.status || 'ALL';

  const inquiries = await InquiryService.getInquiries({ search: q, status });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Inquiries" 
        description="Manage leads, inquiries, and incoming requests."
        action={
          canCreate ? (
            <Button render={<Link href="/dashboard/inquiries/new" />}>
              <Plus className="mr-2 h-4 w-4" />
              New Inquiry
            </Button>
          ) : undefined
        }
      />
      
      <InquiryListClient inquiries={inquiries} />
    </div>
  );
}
