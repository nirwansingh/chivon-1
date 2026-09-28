import { prisma } from './prisma';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'documents');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
];

export class StorageService {
  /**
   * Initialize the storage directory
   */
  static async init() {
    try {
      await fs.access(STORAGE_DIR);
    } catch (e) {
      await fs.mkdir(STORAGE_DIR, { recursive: true });
    }
  }

  /**
   * Upload a file and create a document record
   */
  static async uploadDocument(
    fileBuffer: Buffer,
    fileName: string,
    fileType: string,
    uploaderId: string,
    options: {
      category?: string;
      relatedEntityType?: string;
      relatedEntityId?: string;
    } = {}
  ) {
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds 10MB limit. Uploaded size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    }

    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      throw new Error(`File type ${fileType} is not allowed.`);
    }

    await this.init();

    const fileExt = path.extname(fileName) || '';
    const safeFileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(STORAGE_DIR, safeFileName);

    // Write file to local secure storage
    await fs.writeFile(filePath, fileBuffer);

    // Create Document record
    const document = await prisma.document.create({
      data: {
        fileName,
        fileType,
        fileSize: fileBuffer.length,
        storagePath: safeFileName,
        category: options.category || 'General',
        relatedEntityType: options.relatedEntityType,
        relatedEntityId: options.relatedEntityId,
        uploadedById: uploaderId,
      }
    });

    return document;
  }

  /**
   * Retrieve a file path by document ID
   */
  static async getDocumentFile(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) throw new Error('Document not found');

    const filePath = path.join(STORAGE_DIR, document.storagePath);
    return {
      document,
      filePath
    };
  }

  /**
   * Delete a document from storage and DB
   */
  static async deleteDocument(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) return;

    const filePath = path.join(STORAGE_DIR, document.storagePath);
    
    try {
      await fs.unlink(filePath);
    } catch (e: any) {
      if (e.code !== 'ENOENT') {
        throw new Error(`Failed to delete file from storage: ${e.message}`);
      }
    }

    await prisma.document.delete({
      where: { id: documentId }
    });

    return true;
  }
}
