import { Prisma } from '@prisma/client';

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export function mapPrismaError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return 'A unique constraint would be violated on this record. This value already exists.';
      case 'P2025':
        return 'Record to update not found.';
      case 'P2003':
        return 'Foreign key constraint failed. Related record might not exist.';
      default:
        return `Database error (${error.code}).`;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}
