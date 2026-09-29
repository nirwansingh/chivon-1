import { prisma } from './prisma';
import { PrismaClient, Prisma } from '@prisma/client';

export class DocumentNumberService {
  /**
   * Generates the next document number atomically.
   * e.g., generateNextNumber('QT') -> 'QT-20241026-0001'
   */
  static async generateNextNumber(prefix: string, tx: Prisma.TransactionClient | PrismaClient = prisma): Promise<string> {
    const now = new Date();
    // YYYYMMDD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateKey = `${year}${month}${day}`;

    // Upsert atomic increment
    const sequence = await tx.documentSequence.upsert({
      where: {
        prefix_dateKey: {
          prefix,
          dateKey,
        },
      },
      update: {
        lastValue: {
          increment: 1,
        },
      },
      create: {
        prefix,
        dateKey,
        lastValue: 1,
      },
    });

    const sequenceNum = String(sequence.lastValue).padStart(4, '0');
    return `${prefix}-${dateKey}-${sequenceNum}`;
  }
}
