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


export const productRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function pdf(res: import('express').Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}

// --- Products ---
productRouter.get(
  '/products',
  asyncRoute(async (req, res) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHENTICATED');
    const search = String(req.query.search || '');
    const id = req.query.id ? String(req.query.id) : undefined;
    const where: Prisma.ProductWhereInput = {};
    if (id) where.id = id;
    else if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    const products = await prisma.product.findMany({
      where,
      take: 20,
      orderBy: { name: 'asc' },
    });
    res.json({ products });
  })
);
productRouter.post(
  '/products/query',
  asyncRoute(async (req, res) => {
    await requirePermission('PRODUCT.VIEW');
    res.json(await ProductService.getProducts(req.body || {}));
  })
);
productRouter.get(
  '/products/categories',
  asyncRoute(async (_req, res) => {
    await requirePermission('PRODUCT.VIEW');
    res.json(await ProductService.getCategories());
  })
);
productRouter.get(
  '/products/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('PRODUCT.VIEW');
    res.json(await ProductService.getProductById(req.params.id));
  })
);
productRouter.get(
  '/products/:id/movements',
  asyncRoute(async (req, res) => {
    await requirePermission('PRODUCT.VIEW');
    res.json(await ProductService.getStockMovements(req.params.id));
  })
);
productRouter.post(
  '/products',
  asyncRoute(async (req, res) => {
    await requirePermission('PRODUCT.CREATE');
    res.json(await ProductService.createProduct(req.body));
  })
);
productRouter.put(
  '/products/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('PRODUCT.EDIT');
    res.json(await ProductService.updateProduct(req.params.id, req.body));
  })
);
productRouter.post(
  '/products/:id/stock',
  asyncRoute(async (req, res) => {
    await requirePermission('PRODUCT.EDIT');
    res.json(await ProductService.adjustStock(req.params.id, req.body.quantity, req.body.notes));
  })
);

