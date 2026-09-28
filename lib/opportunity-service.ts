import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { ActionResult } from './action-result';
import { getCurrentUser } from './auth';
import { AuditService } from './audit';

export class OpportunityService {
  static async getOpportunities(params?: {
    search?: string;
    status?: string;
    customerId?: string;
    assignedUserId?: string;
  }) {
    const where: Prisma.OpportunityWhereInput = {};

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params?.status && params.status !== 'ALL') {
      where.status = params.status as any;
    }
    if (params?.customerId) {
      where.customerId = params.customerId;
    }
    if (params?.assignedUserId) {
      where.assignedUserId = params.assignedUserId;
    }

    return prisma.opportunity.findMany({
      where,
      include: {
        customer: { select: { companyName: true } },
        contact: { select: { name: true } },
        assignedUser: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getOpportunityById(id: string) {
    return prisma.opportunity.findUnique({
      where: { id },
      include: {
        customer: true,
        contact: true,
        assignedUser: true,
        items: {
          include: { product: true },
        },
        tasks: true,
      },
    });
  }

  static async createOpportunity(data: Omit<Prisma.OpportunityUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
      const opportunity = await prisma.opportunity.create({
        data,
      });

      await AuditService.log({
        userId: user.id,
        action: 'CREATE',
        module: 'OPPORTUNITY',
        entityType: 'Opportunity',
        entityId: opportunity.id,
        afterData: opportunity,
      });

      return { success: true, data: opportunity };
    } catch (error: any) {
      console.error('Create opportunity error:', error);
      return { success: false, error: 'Failed to create opportunity' };
    }
  }

  static async updateOpportunity(id: string, data: Prisma.OpportunityUncheckedUpdateInput) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
      const before = await prisma.opportunity.findUnique({ where: { id } });
      if (!before) return { success: false, error: 'Opportunity not found' };

      const opportunity = await prisma.opportunity.update({
        where: { id },
        data,
      });

      await AuditService.log({
        userId: user.id,
        action: 'UPDATE',
        module: 'OPPORTUNITY',
        entityType: 'Opportunity',
        entityId: opportunity.id,
        beforeData: before,
        afterData: opportunity,
      });

      return { success: true, data: opportunity };
    } catch (error: any) {
      console.error('Update opportunity error:', error);
      return { success: false, error: 'Failed to update opportunity' };
    }
  }

  static async updateOpportunityStatus(id: string, status: string) {
    return this.updateOpportunity(id, { status: status as any });
  }

  static async convertInquiryToOpportunity(inquiryId: string): Promise<ActionResult<any>> {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
      const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
      if (!inquiry) return { success: false, error: 'Inquiry not found' };
      if (!inquiry.customerId) return { success: false, error: 'Inquiry must be linked to a customer before converting' };

      const result = await prisma.$transaction(async (tx) => {
        // Create the opportunity
        const opp = await tx.opportunity.create({
          data: {
            name: inquiry.title,
            customerId: inquiry.customerId!,
            contactId: inquiry.contactId,
            description: inquiry.description,
            expectedValue: inquiry.expectedValue,
            expectedClosingDate: inquiry.expectedClosingDate,
            assignedUserId: inquiry.assignedToId,
            source: inquiry.source,
            project: inquiry.project,
            site: inquiry.site,
            notes: inquiry.notes,
            status: 'NEW',
          },
        });

        // Update inquiry
        await tx.inquiry.update({
          where: { id: inquiryId },
          data: {
            status: 'CONVERTED',
            opportunityId: opp.id,
          },
        });

        return opp;
      });

      await AuditService.log({
        userId: user.id,
        action: 'CONVERT_INQUIRY',
        module: 'OPPORTUNITY',
        entityType: 'Opportunity',
        entityId: result.id,
        afterData: { fromInquiryId: inquiryId },
      });

      return { success: true, data: result };
    } catch (error: any) {
      console.error('Convert inquiry error:', error);
      return { success: false, error: 'Failed to convert inquiry to opportunity' };
    }
  }
}
