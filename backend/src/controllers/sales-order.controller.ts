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


export const salesOrderRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function pdf(res: import('express').Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}

// --- Sales orders ---
salesOrderRouter.post(
  '/sales-orders/query',
  asyncRoute(async (req, res) => {
    await requirePermission('SALES_ORDER.VIEW');
    res.json(await SalesOrderService.getSalesOrders(req.body || {}));
  })
);
salesOrderRouter.get(
  '/sales-orders/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('SALES_ORDER.VIEW');
    res.json(await SalesOrderService.getById(req.params.id));
  })
);
salesOrderRouter.post(
  '/sales-orders',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('SALES_ORDER.CREATE');
    res.json(await SalesOrderService.create(req.body, user.id));
  })
);
salesOrderRouter.put(
  '/sales-orders/:id',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('SALES_ORDER.EDIT');
    res.json(await SalesOrderService.update(req.params.id, req.body, user.id));
  })
);
salesOrderRouter.post(
  '/sales-orders/:id/status',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('SALES_ORDER.EDIT');
    res.json(await SalesOrderService.updateStatus(req.params.id, req.body.status, user.id, req.body.reason));
  })
);
salesOrderRouter.post(
  '/sales-orders/:id/cancel',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('SALES_ORDER.CANCEL');
    res.json(await SalesOrderService.cancel(req.params.id, user.id, req.body.reason));
  })
);
salesOrderRouter.post(
  '/sales-orders/:id/reopen',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('SALES_ORDER.EDIT');
    res.json(await SalesOrderService.reopen(req.params.id, user.id));
  })
);
salesOrderRouter.post(
  '/sales-orders/:id/invoice',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('manage_invoices');
    res.json(await SalesOrderService.convertToInvoice(req.params.id, req.body.items, user.id));
  })
);
salesOrderRouter.get(
  '/sales-orders/:id/invoice-source',
  asyncRoute(async (req, res) => {
    await requirePermission('manage_invoices');
    const so = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { product: true } }, customer: true },
    });
    res.json(so);
  })
);

