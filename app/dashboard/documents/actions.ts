'use server';

import { getCurrentUser } from '@/lib/auth';
import { StorageService } from '@/lib/storage-service';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function uploadDocument(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  const category = (formData.get('category') as string) || 'General';
  const relatedEntityType = formData.get('relatedEntityType') as string | undefined;
  const relatedEntityId = formData.get('relatedEntityId') as string | undefined;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const document = await StorageService.uploadDocument(
    buffer,
    file.name,
    file.type,
    user.id,
    {
      category,
      relatedEntityType: relatedEntityType || undefined,
      relatedEntityId: relatedEntityId || undefined,
    }
  );

  // Log activity
  if (document.relatedEntityType === 'Customer' && document.relatedEntityId) {
    await prisma.activity.create({
      data: {
        customerId: document.relatedEntityId,
        type: 'DOCUMENT_UPLOADED',
        description: `Uploaded document: ${document.fileName}`,
        relatedEntityType: 'Document',
        relatedEntityId: document.id,
        createdById: user.id
      }
    });
  }

  revalidatePath('/dashboard/documents');
  if (relatedEntityType && relatedEntityId) {
    if (relatedEntityType === 'Customer') {
      revalidatePath(`/dashboard/customers/${relatedEntityId}`);
    }
    // Handle other revalidation paths if needed
  }

  return { success: true, documentId: document.id };
}

export async function deleteDocumentAction(documentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await StorageService.deleteDocument(documentId);
  revalidatePath('/dashboard/documents');
}
