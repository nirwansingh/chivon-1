import { z } from 'zod';

export const opportunitySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  customerId: z.string().min(1, 'Customer is required'),
  contactId: z.string().optional().nullable(),
  description: z.string().optional(),
  expectedValue: z.number().optional().nullable(),
  probability: z.number().min(0).max(100).optional().nullable(),
  expectedClosingDate: z.date().optional().nullable(),
  assignedUserId: z.string().optional().nullable(),
  source: z.string().optional(),
  competitor: z.string().optional(),
  project: z.string().optional(),
  site: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).default('NEW'),
});

export type OpportunityFormValues = z.infer<typeof opportunitySchema>;
