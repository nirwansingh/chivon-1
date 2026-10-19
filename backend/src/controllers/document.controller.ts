import { Router } from 'express';
import fs from 'node:fs';
import multer from 'multer';
import { Prisma } from '@prisma/client';
import { prisma } from '../models/prisma';
import { requirePermission, getCurrentUser } from '../middlewares/auth';
import { asyncRoute } from '../middlewares/error';
import { CustomerService } from '../services/customer-service';
import { InquiryService } from '../services/inquiry-service';
import { OpportunityService } from '../services/opportunity-service';
import { ProductService } from '../services/product-service';
import { QuotationService } from '../services/quotation-service';
import { SalesOrderService } from '../services/sales-order-service';
import { InvoiceService } from '../services/invoice-service';
import { PaymentService } from '../services/payment-service';
import { CreditNoteService } from '../services/credit-note-service';
import { SOAService } from '../services/soa-service';
import { DashboardService } from '../services/dashboard-service';
import { ReportService, type ReportFilter } from '../services/report-service';
import { AuditService } from '../services/audit';
import { SearchService } from '../services/search-service';
import { PdfService } from '../services/pdf-service';
import { StorageService } from '../services/storage-service';
import { UserService } from '../services/UserService';
import { RoleService } from '../services/RoleService';


export const documentRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function pdf(res: import('express').Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}

// --- Documents ---
documentRouter.get(
  '/documents',
  asyncRoute(async (_req, res) => {
    await requirePermission('view_documents');
    const documents = await prisma.document.findMany({
      include: { uploadedBy: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(documents);
  })
);
documentRouter.post(
  '/documents',
  upload.single('file'),
  asyncRoute(async (req, res) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHENTICATED');
    const file = req.file;
    if (!file) throw new Error('No file provided');
    const category = String(req.body.category || 'General');
    const relatedEntityType = req.body.relatedEntityType ? String(req.body.relatedEntityType) : undefined;
    const relatedEntityId = req.body.relatedEntityId ? String(req.body.relatedEntityId) : undefined;
    const document = await StorageService.uploadDocument(file.buffer, file.originalname, file.mimetype, user.id, {
      category,
      relatedEntityType,
      relatedEntityId,
    });
    if (document.relatedEntityType === 'Customer' && document.relatedEntityId) {
      await prisma.activity.create({
        data: {
          customerId: document.relatedEntityId,
          type: 'DOCUMENT_UPLOADED',
          description: `Uploaded document: ${document.fileName}`,
          relatedEntityType: 'Document',
          relatedEntityId: document.id,
          createdById: user.id,
        },
      });
    }
    res.json({ success: true, documentId: document.id });
  })
);
documentRouter.delete(
  '/documents/:id',
  asyncRoute(async (req, res) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHENTICATED');
    await StorageService.deleteDocument(req.params.id);
    res.json({ ok: true });
  })
);
documentRouter.get(
  '/documents/:id/file',
  asyncRoute(async (req, res) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHENTICATED');
    const { document, filePath } = await StorageService.getDocumentFile(req.params.id);
    if (!fs.existsSync(filePath)) {
      res.status(404).send('File not found');
      return;
    }
    const fileBuffer = fs.readFileSync(filePath);
    res.setHeader('Content-Type', document.fileType);
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(fileBuffer);
  })
);

