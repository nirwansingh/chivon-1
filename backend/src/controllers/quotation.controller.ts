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


export const quotationRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function pdf(res: import('express').Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}

// --- Quotations ---
quotationRouter.post(
  '/quotations/query',
  asyncRoute(async (req, res) => {
    await requirePermission('QUOTATION.VIEW');
    res.json(await QuotationService.getQuotations(req.body || {}));
  })
);
quotationRouter.get(
  '/quotations/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('QUOTATION.VIEW');
    res.json(await QuotationService.getById(req.params.id));
  })
);
quotationRouter.post(
  '/quotations',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('QUOTATION.CREATE');
    res.json(await QuotationService.create(req.body, user.id));
  })
);
quotationRouter.post(
  '/quotations/:id/revisions',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('QUOTATION.CREATE');
    res.json(await QuotationService.createRevision(req.params.id, req.body, user.id));
  })
);
quotationRouter.post(
  '/quotations/:id/status',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('QUOTATION.UPDATE');
    res.json(await QuotationService.updateStatus(req.params.id, req.body.status, user.id, req.body.notes));
  })
);
quotationRouter.post(
  '/quotations/:id/submit',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('QUOTATION.UPDATE');
    res.json(await QuotationService.submitForApproval(req.params.id, user.id));
  })
);
quotationRouter.post(
  '/quotations/:id/approve',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('QUOTATION.APPROVE');
    res.json(await QuotationService.approve(req.params.id, user.id));
  })
);
quotationRouter.post(
  '/quotations/:id/reject',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('QUOTATION.APPROVE');
    res.json(await QuotationService.reject(req.params.id, user.id, req.body.reason));
  })
);
quotationRouter.post(
  '/quotations/:id/sent',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('QUOTATION.UPDATE');
    res.json(await QuotationService.markAsSent(req.params.id, user.id));
  })
);
quotationRouter.post(
  '/quotations/:id/sales-order',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('SALES_ORDER.CREATE');
    res.json(await QuotationService.convertToSalesOrder(req.params.id, user.id));
  })
);
quotationRouter.post(
  '/quotations/:id/invoice',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('manage_invoices');
    res.json(
      await QuotationService.convertToInvoice(req.params.id, req.body.revisionId, req.body.items, user.id)
    );
  })
);

