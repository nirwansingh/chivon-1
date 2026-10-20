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


export const taskRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function pdf(res: import('express').Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}

// --- Tasks ---
taskRouter.get(
  '/tasks',
  asyncRoute(async (_req, res) => {
    await requirePermission('view_tasks');
    const [tasks, users, customers] = await Promise.all([
      prisma.task.findMany({
        include: { assignedTo: true, customer: true },
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
      }),
      prisma.user.findMany({ where: { status: 'ACTIVE' } }),
      prisma.customer.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, companyName: true },
      }),
    ]);
    res.json({ tasks, users, customers });
  })
);
taskRouter.post(
  '/tasks',
  asyncRoute(async (req, res) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHENTICATED');
    const data = req.body;
    const task = await prisma.task.create({
      data: {
        ...data,
        createdById: user.id,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });
    if (data.customerId) {
      await prisma.activity.create({
        data: {
          customerId: data.customerId,
          type: 'TASK_CREATED',
          description: `Task created: ${task.title}`,
          relatedEntityType: 'Task',
          relatedEntityId: task.id,
          createdById: user.id,
        },
      });
    }
    res.json(task);
  })
);
taskRouter.put(
  '/tasks/:id',
  asyncRoute(async (req, res) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHENTICATED');
    const data = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });
    res.json(task);
  })
);
taskRouter.post(
  '/tasks/:id/status',
  asyncRoute(async (req, res) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHENTICATED');
    const oldTask = await prisma.task.findUnique({ where: { id: req.params.id } });
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    if (oldTask?.customerId && oldTask.status !== req.body.status) {
      await prisma.activity.create({
        data: {
          customerId: oldTask.customerId,
          type: 'TASK_UPDATED',
          description: `Task "${task.title}" marked as ${req.body.status}`,
          relatedEntityType: 'Task',
          relatedEntityId: task.id,
          createdById: user.id,
        },
      });
    }
    res.json(task);
  })
);
taskRouter.delete(
  '/tasks/:id',
  asyncRoute(async (req, res) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHENTICATED');
    const task = await prisma.task.delete({ where: { id: req.params.id } });
    res.json(task);
  })
);

