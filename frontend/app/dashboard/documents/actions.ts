'use server';

import { api } from '@/lib/api-client';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function uploadDocument(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const file = formData.get('file');
  if (!file) throw new Error('No file provided');

  const result = await api<{ success: boolean; documentId: string }>('/api/documents', {
    method: 'POST',
    formData,
  });

  const relatedEntityType = formData.get('relatedEntityType');
  const relatedEntityId = formData.get('relatedEntityId');
  revalidatePath('/dashboard/documents');
  if (relatedEntityType === 'Customer' && typeof relatedEntityId === 'string') {
    revalidatePath(`/dashboard/customers/${relatedEntityId}`);
  }
  return result;
}

export async function deleteDocumentAction(documentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  await api(`/api/documents/${documentId}`, { method: 'DELETE' });
  revalidatePath('/dashboard/documents');
}
