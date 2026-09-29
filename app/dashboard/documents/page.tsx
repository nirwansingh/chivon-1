import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DataTable } from '@/components/data-table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download, FileText, ImageIcon, FileSpreadsheet, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { UploadForm } from './upload-form';
import { deleteDocumentAction } from './actions';

export const dynamic = 'force-dynamic';

function getFileIcon(mimeType: string) {
  if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
  if (mimeType.includes('image')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
  return <FileText className="w-4 h-4" />;
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default async function DocumentsPage() {
  await requirePermission('view_documents'); // Replace with proper permission

  const documents = await prisma.document.findMany({
    include: {
      uploadedBy: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const columns = [
    {
      header: 'File Name',
      accessorKey: 'fileName',
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          {getFileIcon(item.fileType)}
          <span className="font-medium">{item.fileName}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
    },
    {
      header: 'Size',
      accessorKey: 'fileSize',
      cell: (item: any) => formatBytes(item.fileSize),
    },
    {
      header: 'Uploaded By',
      accessorKey: 'uploadedBy.name',
      cell: (item: any) => item.uploadedBy?.name || 'System',
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: (item: any) => format(new Date(item.createdAt), 'dd MMM yyyy HH:mm'),
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <Link href={`/api/documents/${item.id}`} target="_blank">
            <Button variant="ghost" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </Link>
          <form action={async () => {
            'use server';
            await deleteDocumentAction(item.id);
          }}>
            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </form>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="bg-card border rounded-lg p-6 shadow-sm sticky top-6">
            <h3 className="font-semibold mb-4">Upload Document</h3>
            <UploadForm />
          </div>
        </div>
        
        <div className="md:col-span-3">
          <div className="bg-card border rounded-lg shadow-sm">
            <DataTable
              data={documents}
              columns={columns}
              searchPlaceholder="Search files..."
              pagination={{ pageIndex: 0, pageSize: 100 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
