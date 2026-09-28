'use client';

import * as React from 'react';
import { uploadDocument } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function UploadForm({
  relatedEntityType,
  relatedEntityId,
  onSuccess
}: {
  relatedEntityType?: string;
  relatedEntityId?: string;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = React.useState(false);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (relatedEntityType && relatedEntityId) {
        formData.append('relatedEntityType', relatedEntityType);
        formData.append('relatedEntityId', relatedEntityId);
      }
      
      const file = formData.get('file') as File;
      if (file && file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      await uploadDocument(formData);
      toast.success('Document uploaded successfully');
      
      // Reset form
      (e.target as HTMLFormElement).reset();
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <select name="category" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="General">General</option>
          <option value="Contract">Contract</option>
          <option value="Specification">Specification</option>
          <option value="Drawing">Drawing</option>
          <option value="Invoice">Invoice</option>
          <option value="Receipt">Receipt</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>File</Label>
        <Input type="file" name="file" required accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" />
        <p className="text-xs text-muted-foreground">Max 10MB. Allowed: PDF, PNG, JPG, DOCX, XLSX</p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Uploading...' : 'Upload Document'}
      </Button>
    </form>
  );
}
