import { z } from 'zod';
import { ProductUnit } from '@prisma/client';

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().nullable().optional(),
  description: z.string().optional(),
  quantity: z.number().min(0.0001, 'Quantity must be greater than 0'),
  unit: z.nativeEnum(ProductUnit),
  rate: z.number().min(0, 'Rate cannot be negative'),
  discountType: z.enum(['percentage', 'fixed']).nullable().optional(),
  discountValue: z.number().min(0).optional(),
  vatRate: z.number().min(0),
});

export const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  salesOrderId: z.string().nullable().optional(),
  quotationId: z.string().nullable().optional(),
  date: z.date(),
  dueDate: z.date().nullable().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
export type InvoiceItemValues = z.infer<typeof invoiceItemSchema>;
