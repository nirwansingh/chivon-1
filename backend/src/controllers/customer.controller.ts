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


export const customerRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function pdf(res: import('express').Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}

// --- Customers ---
customerRouter.get(
  '/customers',
  asyncRoute(async (req, res) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHENTICATED');
    const search = String(req.query.search || '');
    const id = req.query.id ? String(req.query.id) : undefined;
    const where: Prisma.CustomerWhereInput = {};
    if (id) where.id = id;
    else if (search.trim()) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    const customers = await prisma.customer.findMany({
      where,
      take: 20,
      orderBy: { companyName: 'asc' },
    });
    res.json({ customers });
  })
);

customerRouter.post(
  '/customers/query',
  asyncRoute(async (req, res) => {
    await requirePermission('CUSTOMER.VIEW');
    res.json(await CustomerService.getCustomers(req.body || {}));
  })
);

customerRouter.get(
  '/customers/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('CUSTOMER.VIEW');
    res.json(await CustomerService.getCustomerById(req.params.id));
  })
);

customerRouter.post(
  '/customers',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('CUSTOMER.CREATE');
    const { data, contacts, addresses } = req.body;
    res.json(await CustomerService.createCustomer(user.id, data, contacts, addresses));
  })
);

customerRouter.put(
  '/customers/:id',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('CUSTOMER.EDIT');
    const { data, contacts, addresses } = req.body;
    res.json(await CustomerService.fullUpdateCustomer(user.id, req.params.id, data, contacts, addresses));
  })
);

customerRouter.delete(
  '/customers/:id',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('CUSTOMER.DELETE');
    await CustomerService.deleteCustomer(user.id, req.params.id);
    res.json({ ok: true });
  })
);

