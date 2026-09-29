import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { logger } from './logger';

export interface AuditLogInput {
  userId?: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  description?: string;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async log(input: AuditLogInput, tx?: any) {
    try {
      const db = tx || prisma;
      const finalAfterData = input.afterData || input.metadata;
      await db.auditLog.create({
        data: {
          userId: input.userId,
          action: input.action,
          module: input.module,
          entityType: input.entityType,
          entityId: input.entityId,
          description: input.description,
          beforeData: input.beforeData ? (input.beforeData as Prisma.InputJsonValue) : undefined,
          afterData: finalAfterData ? (finalAfterData as Prisma.InputJsonValue) : undefined,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        }
      });
    } catch (error) {
      // We don't want audit logging failures to break the main application flow
      logger.error('Failed to create audit log', error);
    }
  }

  static async getAuditLogs(params: {
    search?: string;
    userId?: string;
    module?: string;
    action?: string;
    entityId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    const { search, userId, module, action, entityId, dateFrom, dateTo, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (userId) where.userId = userId;
    if (module) where.module = module;
    if (action) where.action = action;
    if (entityId) where.entityId = entityId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [total, data] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { total, data };
  }
}
