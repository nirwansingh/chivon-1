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


export const pdfRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function pdf(res: import('express').Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}

// --- PDFs ---
pdfRouter.get(
  '/pdf/quotations/:id',
  asyncRoute(async (req, res) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHENTICATED');
    const revisionId = String(req.query.revisionId || '');
    if (!revisionId) throw new Error('Missing revisionId');
    const buffer = await PdfService.generateQuotationPdf(req.params.id, revisionId);
    pdf(res, buffer, `quotation-${req.params.id}.pdf`);
  })
);
pdfRouter.get(
  '/pdf/sales-orders/:id',
  asyncRoute(async (req, res) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHENTICATED');
    pdf(res, await PdfService.generateSalesOrderPdf(req.params.id), `sales-order-${req.params.id}.pdf`);
  })
);
pdfRouter.get(
  '/pdf/invoices/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('view_invoices');
    pdf(res, await PdfService.generateInvoicePdf(req.params.id), `invoice-${req.params.id}.pdf`);
  })
);
pdfRouter.get(
  '/pdf/credit-notes/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('view_invoices');
    pdf(res, await PdfService.generateCreditNotePdf(req.params.id), `credit-note-${req.params.id}.pdf`);
  })
);
pdfRouter.get(
  '/pdf/payments/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('view_invoices');
    pdf(res, await PdfService.generatePaymentReceiptPdf(req.params.id), `payment-${req.params.id}.pdf`);
  })
);
pdfRouter.get(
  '/pdf/soa',
  asyncRoute(async (req, res) => {
    await requirePermission('view_reports');
    const customerId = String(req.query.customerId || '');
    const fromDate = String(req.query.fromDate || '');
    const toDate = String(req.query.toDate || '');
    const buffer = await PdfService.generateSOAPdf(
      customerId,
      new Date(fromDate),
      new Date(toDate + 'T23:59:59')
    );
    pdf(res, buffer, `soa-${customerId}.pdf`);
  })
);
