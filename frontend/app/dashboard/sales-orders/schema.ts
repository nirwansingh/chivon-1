import { z } from 'zod';
import { ProductUnit } from '@prisma/client';

export const salesOrderItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  orderedQty: z.number().min(0.0001, 'Quantity must be > 0'),
  unit: z.nativeEnum(ProductUnit).default(ProductUnit.NOS),
  rate: z.number().min(0, 'Rate cannot be negative'),
  discountType: z.enum(['percentage', 'fixed']).optional().nullable(),
  discountValue: z.number().min(0).optional().nullable(),
  vatRate: z.number().min(0).default(5.00),
}).refine((data) => data.productId || data.description, {
  message: 'Either a product or description is required',
  path: ['description'],
});

export const salesOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  items: z.array(salesOrderItemSchema).min(1, 'At least one line item is required'),
});

export type SalesOrderFormValues = z.infer<typeof salesOrderSchema>;
export type SalesOrderItemFormValues = z.infer<typeof salesOrderItemSchema>;
