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


export const userRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function pdf(res: import('express').Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}

// --- Users & roles ---
userRouter.get(
  '/users',
  asyncRoute(async (_req, res) => {
    res.json(await UserService.listUsers());
  })
);
userRouter.get(
  '/users/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('system:manage');
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    res.json(user);
  })
);
userRouter.post(
  '/users',
  asyncRoute(async (req, res) => {
    res.json(await UserService.createUser(req.body));
  })
);
userRouter.put(
  '/users/:id',
  asyncRoute(async (req, res) => {
    res.json(await UserService.updateUser(req.params.id, req.body));
  })
);
userRouter.post(
  '/users/:id/deactivate',
  asyncRoute(async (req, res) => {
    res.json(await UserService.deactivateUser(req.params.id));
  })
);
userRouter.post(
  '/users/:id/activate',
  asyncRoute(async (req, res) => {
    res.json(await UserService.activateUser(req.params.id));
  })
);
userRouter.post(
  '/users/:id/password',
  asyncRoute(async (req, res) => {
    res.json(await UserService.resetPassword(req.params.id, req.body.password));
  })
);
userRouter.get(
  '/roles',
  asyncRoute(async (_req, res) => {
    res.json(await RoleService.listRoles());
  })
);
userRouter.get(
  '/roles/permissions',
  asyncRoute(async (_req, res) => {
    res.json(await RoleService.listAllPermissions());
  })
);
userRouter.get(
  '/roles/:id',
  asyncRoute(async (req, res) => {
    await requirePermission('system:manage');
    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: { permissions: { include: { permission: true } } },
    });
    res.json(role);
  })
);
userRouter.post(
  '/roles',
  asyncRoute(async (req, res) => {
    res.json(await RoleService.createRole(req.body));
  })
);
userRouter.put(
  '/roles/:id',
  asyncRoute(async (req, res) => {
    res.json(await RoleService.updateRole(req.params.id, req.body));
  })
);

