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


export const invoiceRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function pdf(res: import('express').Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}

// --- Invoices ---
invoiceRouter.post(
  '/invoices/query',
  asyncRoute(async (req, res) => {
    await requirePermission('view_invoices');
    res.json(await InvoiceService.getInvoices(req.body || {}));
  })
);
invoiceRouter.get(
  '/invoices/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('view_invoices');
    res.json(await InvoiceService.getById(req.params.id));
  })
);
invoiceRouter.post(
  '/invoices/:id/cancel',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('manage_invoices');
    res.json(await InvoiceService.cancel(req.params.id, user.id, req.body.reason));
  })
);
invoiceRouter.post(
  '/invoices/:id/status',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('manage_invoices');
    const status = req.body.status as 'ISSUED' | 'PAID';
    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({ where: { id: req.params.id }, data: { status } });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          module: 'INVOICE',
          entityType: 'INVOICE',
          entityId: req.params.id,
          action: 'UPDATE_STATUS',
          description: `Invoice status updated to ${status}`,
          afterData: { status },
        },
      });
    });
    res.json({ success: true });
  })
);
invoiceRouter.post(
  '/invoices/:id/credit-notes',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('manage_invoices');
    const cn = await CreditNoteService.create(req.params.id, req.body.items, req.body.notes, user.id);
    res.json({ success: true, creditNoteId: cn.id });
  })
);
invoiceRouter.get(
  '/invoices/:id/outstanding',
  asyncRoute(async (req, res) => {
    await requirePermission('view_invoices');
    res.json({ outstanding: await InvoiceService.calculateOutstanding(req.params.id) });
  })
);
invoiceRouter.get(
  '/quotations/:id/invoice-source',
  asyncRoute(async (req, res) => {
    await requirePermission('manage_invoices');
    const revisionId = String(req.query.revisionId || '');
    const quote = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: {
        revisions: {
          where: { id: revisionId },
          include: { items: { include: { product: true } } },
        },
        customer: true,
      },
    });
    res.json(quote);
  })
);

