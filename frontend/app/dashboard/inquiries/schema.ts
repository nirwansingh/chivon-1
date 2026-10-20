import { z } from 'zod';

export const inquirySchema = z.object({
  title: z.string().min(2, 'Title is required'),
  source: z.string().optional(),
  customerId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  productOrService: z.string().optional(),
  quantity: z.number().optional().nullable(),
  description: z.string().optional(),
  project: z.string().optional(),
  site: z.string().optional(),
  expectedValue: z.number().optional().nullable(),
  expectedClosingDate: z.date().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'FOLLOW_UP_REQUIRED', 'CONVERTED', 'LOST']).default('NEW'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  notes: z.string().optional(),
});

export type InquiryFormValues = z.infer<typeof inquirySchema>;
