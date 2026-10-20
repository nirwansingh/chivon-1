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


export const paymentRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function pdf(res: import('express').Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}

// --- Payments ---
paymentRouter.get(
  '/payments',
  asyncRoute(async (req, res) => {
    await requirePermission('view_invoices');
    const page = parseInt(String(req.query.page || '1'), 10);
    const query = String(req.query.q || '');
    const pageSize = 20;
    const where = query
      ? {
          OR: [
            { number: { contains: query, mode: 'insensitive' as const } },
            { customer: { companyName: { contains: query, mode: 'insensitive' as const } } },
          ],
        }
      : {};
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { customer: true },
        orderBy: { paymentDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.payment.count({ where }),
    ]);
    res.json({ payments, total, page, pageSize });
  })
);
paymentRouter.get(
  '/payments/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('view_invoices');
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { customer: true, allocations: { include: { invoice: true } } },
    });
    if (!payment) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const unallocatedAmount =
      Number(payment.amount) -
      payment.allocations.reduce((sum, a) => sum + (a.isReversed ? 0 : Number(a.amount)), 0);
    let outstandingInvoices: unknown[] = [];
    if (!payment.isReversed && unallocatedAmount > 0) {
      const customerInvoices = await prisma.invoice.findMany({
        where: {
          customerId: payment.customerId,
          status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
        },
        orderBy: { createdAt: 'asc' },
      });
      const withOutstanding = await Promise.all(
        customerInvoices.map(async (inv) => ({
          ...inv,
          outstanding: await InvoiceService.calculateOutstanding(inv.id),
        }))
      );
      outstandingInvoices = withOutstanding.filter((inv) => inv.outstanding > 0.01);
    }
    res.json({ payment, outstandingInvoices });
  })
);
paymentRouter.post(
  '/payments',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('manage_invoices');
    res.json(await PaymentService.create(req.body, user.id));
  })
);
paymentRouter.post(
  '/payments/:id/allocate',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('manage_invoices');
    res.json(await PaymentService.allocate(req.params.id, req.body.allocations, user.id));
  })
);
paymentRouter.post(
  '/payments/:id/reverse',
  asyncRoute(async (req, res) => {
    const user = await requirePermission('manage_invoices');
    res.json(await PaymentService.reversePayment(req.params.id, req.body.reason, user.id));
  })
);

