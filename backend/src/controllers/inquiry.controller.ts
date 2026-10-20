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


export const inquiryRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function pdf(res: import('express').Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}

// --- Inquiries ---
inquiryRouter.post(
  '/inquiries/query',
  asyncRoute(async (req, res) => {
    await requirePermission('INQUIRY.VIEW');
    res.json(await InquiryService.getInquiries(req.body || {}));
  })
);
inquiryRouter.get(
  '/inquiries/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('INQUIRY.VIEW');
    res.json(await InquiryService.getInquiryById(req.params.id));
  })
);
inquiryRouter.post(
  '/inquiries',
  asyncRoute(async (req, res) => {
    await requirePermission('INQUIRY.CREATE');
    res.json(await InquiryService.createInquiry(req.body));
  })
);
inquiryRouter.put(
  '/inquiries/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('INQUIRY.EDIT');
    res.json(await InquiryService.updateInquiry(req.params.id, req.body));
  })
);
inquiryRouter.delete(
  '/inquiries/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('INQUIRY.DELETE');
    res.json(await InquiryService.deleteInquiry(req.params.id));
  })
);
inquiryRouter.post(
  '/inquiries/:id/convert',
  asyncRoute(async (req, res) => {
    await requirePermission('INQUIRY.EDIT');
    res.json(await OpportunityService.convertInquiryToOpportunity(req.params.id));
  })
);

