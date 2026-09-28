import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { ActionResult } from './action-result';
import { getCurrentUser } from './auth';
import { AuditService } from './audit';

export class InquiryService {
  static async getInquiries(params?: {
    search?: string;
    status?: string;
    customerId?: string;
    assignedToId?: string;
  }) {
    const where: Prisma.InquiryWhereInput = {};

    if (params?.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params?.status && params.status !== 'ALL') {
      where.status = params.status as any;
    }
    if (params?.customerId) {
      where.customerId = params.customerId;
    }
    if (params?.assignedToId) {
      where.assignedToId = params.assignedToId;
    }

    return prisma.inquiry.findMany({
      where,
      include: {
        customer: { select: { companyName: true } },
        contact: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getInquiryById(id: string) {
    return prisma.inquiry.findUnique({
      where: { id },
      include: {
        customer: true,
        contact: true,
        assignedTo: true,
        tasks: true,
      },
    });
  }

  static async createInquiry(data: Omit<Prisma.InquiryUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
      const inquiry = await prisma.inquiry.create({
        data: {
          ...data,
          createdById: user.id,
        },
      });

      await AuditService.log({
        userId: user.id,
        action: 'CREATE',
        module: 'INQUIRY',
        entityType: 'Inquiry',
        entityId: inquiry.id,
        afterData: inquiry,
      });

      return { success: true, data: inquiry };
    } catch (error: any) {
      console.error('Create inquiry error:', error);
      return { success: false, error: 'Failed to create inquiry' };
    }
  }

  static async updateInquiry(id: string, data: Prisma.InquiryUncheckedUpdateInput) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
      const before = await prisma.inquiry.findUnique({ where: { id } });
      if (!before) return { success: false, error: 'Inquiry not found' };

      const inquiry = await prisma.inquiry.update({
        where: { id },
        data,
      });

      await AuditService.log({
        userId: user.id,
        action: 'UPDATE',
        module: 'INQUIRY',
        entityType: 'Inquiry',
        entityId: inquiry.id,
        beforeData: before,
        afterData: inquiry,
      });

      return { success: true, data: inquiry };
    } catch (error: any) {
      console.error('Update inquiry error:', error);
      return { success: false, error: 'Failed to update inquiry' };
    }
  }

  static async deleteInquiry(id: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
      const before = await prisma.inquiry.findUnique({ where: { id } });
      if (!before) return { success: false, error: 'Inquiry not found' };

      await prisma.inquiry.delete({ where: { id } });

      await AuditService.log({
        userId: user.id,
        action: 'DELETE',
        module: 'INQUIRY',
        entityType: 'Inquiry',
        entityId: id,
        beforeData: before,
      });

      return { success: true, data: true };
    } catch (error: any) {
      console.error('Delete inquiry error:', error);
      return { success: false, error: 'Failed to delete inquiry' };
    }
  }
}
