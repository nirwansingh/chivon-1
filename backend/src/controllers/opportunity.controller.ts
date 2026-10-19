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


export const opportunityRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function pdf(res: import('express').Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}

// --- Opportunities ---
opportunityRouter.post(
  '/opportunities/query',
  asyncRoute(async (req, res) => {
    await requirePermission('OPPORTUNITY.VIEW');
    res.json(await OpportunityService.getOpportunities(req.body || {}));
  })
);
opportunityRouter.get(
  '/opportunities/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('OPPORTUNITY.VIEW');
    res.json(await OpportunityService.getOpportunityById(req.params.id));
  })
);
opportunityRouter.post(
  '/opportunities',
  asyncRoute(async (req, res) => {
    await requirePermission('OPPORTUNITY.CREATE');
    res.json(await OpportunityService.createOpportunity(req.body));
  })
);
opportunityRouter.put(
  '/opportunities/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('OPPORTUNITY.EDIT');
    res.json(await OpportunityService.updateOpportunity(req.params.id, req.body));
  })
);
opportunityRouter.post(
  '/opportunities/:id/status',
  asyncRoute(async (req, res) => {
    await requirePermission('OPPORTUNITY.EDIT');
    res.json(await OpportunityService.updateOpportunityStatus(req.params.id, req.body.status));
  })
);

