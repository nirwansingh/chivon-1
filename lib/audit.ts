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
}
