import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface StorageService {
  /**
   * Uploads a file and returns its storage path.
   */
  uploadFile(file: File | Blob | Buffer, fileName: string, category: string): Promise<string>;
  
  /**
   * Deletes a file by its storage path.
   */
  deleteFile(path: string): Promise<void>;
  
  /**
   * Retrieves a public URL or signed URL for a file.
   */
  getFileUrl(path: string): Promise<string>;
}

export class SupabaseStorageService implements StorageService {
  private client: SupabaseClient;
  private bucketName: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    this.bucketName = process.env.SUPABASE_BUCKET || 'chivon-documents';
    
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async uploadFile(file: File | Blob | Buffer, fileName: string, category: string): Promise<string> {
    const path = `${category}/${Date.now()}-${fileName}`;
    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .upload(path, file);

    if (error) {
      throw new Error(`Failed to upload file to Supabase: ${error.message}`);
    }

    return data.path;
  }

  async deleteFile(path: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete file from Supabase: ${error.message}`);
    }
  }

  async getFileUrl(path: string): Promise<string> {
    const { data } = this.client.storage
      .from(this.bucketName)
      .getPublicUrl(path);

    return data.publicUrl;
  }
}

export class MockStorageService implements StorageService {
  async uploadFile(file: File | Blob | Buffer, fileName: string, category: string): Promise<string> {
    return `mock-storage/${category}/${Date.now()}-${fileName}`;
  }

  async deleteFile(path: string): Promise<void> {
    // Do nothing
  }

  async getFileUrl(path: string): Promise<string> {
    return `https://mock.storage.local/${path}`;
  }
}

// Export a singleton instance based on environment
export const storage: StorageService = 
  process.env.NODE_ENV === 'test' || !process.env.SUPABASE_URL
    ? new MockStorageService()
    : new SupabaseStorageService();
