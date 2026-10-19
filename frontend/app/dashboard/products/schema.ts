import { z } from 'zod';

export const productSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['PRODUCT', 'SERVICE', 'MANPOWER']),
  categoryId: z.string().optional().nullable(),
  description: z.string().optional(),
  unit: z.enum(['NOS', 'KG', 'HOURS', 'DAYS', 'METER', 'SET', 'LOT', 'OTHER']),
  rate: z.number().min(0, 'Rate must be positive'),
  vatRate: z.number().min(0, 'VAT rate must be positive').default(5),
  minStock: z.number().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  initialStock: z.number().optional().nullable(), // Used only on creation for OPENING stock
});

export type ProductFormValues = z.infer<typeof productSchema>;
