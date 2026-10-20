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


export const reportRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function pdf(res: import('express').Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}

// --- SOA / dashboard / reports / audit / search ---
reportRouter.post(
  '/soa',
  asyncRoute(async (req, res) => {
    await requirePermission('view_reports');
    res.json(
      await SOAService.generateSOA(
        req.body.customerId,
        new Date(req.body.fromDate),
        new Date(req.body.toDate)
      )
    );
  })
);
reportRouter.get(
  '/receivables',
  asyncRoute(async (_req, res) => {
    await requirePermission('view_reports');
    res.json(await SOAService.getReceivablesAging());
  })
);
reportRouter.post(
  '/dashboard',
  asyncRoute(async (req, res) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHENTICATED');
    res.json(
      await DashboardService.getDashboardData({
        dateFrom: req.body.dateFrom ? new Date(req.body.dateFrom) : undefined,
        dateTo: req.body.dateTo ? new Date(req.body.dateTo) : undefined,
        userId: user.id,
        role: req.body.role,
      })
    );
  })
);
reportRouter.post(
  '/reports',
  asyncRoute(async (req, res) => {
    const user = await requirePermission(req.body.export ? 'REPORT.EXPORT' : 'REPORT.VIEW');
    const filters = (req.body.filters || {}) as ReportFilter;
    const type = String(req.body.type);
    let data: unknown;
    switch (type) {
      case 'QUOTATION':
        data = await ReportService.getQuotationsReport(filters);
        break;
      case 'SALES_ORDER':
        data = await ReportService.getSalesOrdersReport(filters);
        break;
      case 'INVOICE':
        data = await ReportService.getInvoicesReport(filters);
        break;
      case 'PAYMENT':
        data = await ReportService.getPaymentsReport(filters);
        break;
      case 'PIPELINE':
        data = await ReportService.getOpportunityPipelineReport(filters);
        break;
      case 'PRODUCT':
        data = await ReportService.getProductsReport(filters);
        break;
      case 'RECEIVABLES':
        data = await ReportService.getReceivablesReport(filters);
        break;
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
    await AuditService.log({
      userId: user.id,
      action: req.body.export ? 'EXPORT' : 'VIEW',
      module: 'REPORT',
      entityType: 'Report',
      entityId: type,
      description: `${req.body.export ? 'Exported' : 'Viewed'} ${type} report with filters: ${JSON.stringify(filters)}`,
    });
    res.json({ success: true, data, format: req.body.format });
  })
);
reportRouter.post(
  '/audit/query',
  asyncRoute(async (req, res) => {
    await requirePermission('AUDIT.VIEW');
    const body = req.body || {};
    res.json(
      await AuditService.getAuditLogs({
        ...body,
        dateFrom: body.dateFrom ? new Date(body.dateFrom) : undefined,
        dateTo: body.dateTo ? new Date(body.dateTo) : undefined,
      })
    );
  })
);
reportRouter.get(
  '/search',
  asyncRoute(async (req, res) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHENTICATED');
    const q = String(req.query.q || '');
    if (!q) {
      res.json({ results: {} });
      return;
    }
    const results = await SearchService.search(q, user.id, user.role.name);
    res.json({ results });
  })
);

