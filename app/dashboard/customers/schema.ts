import { z } from 'zod';

export const contactSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  designation: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().or(z.literal('')).nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export const addressSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['REGISTERED', 'BILLING', 'SHIPPING']),
  addressLine1: z.string().min(1, 'Address Line 1 is required'),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional().nullable(),
  country: z.string().min(1, 'Country is required').default('United Arab Emirates'),
  postalCode: z.string().optional().nullable(),
});

export const customerSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().min(2, 'Company name is required'),
  customerType: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  trn: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().or(z.literal('')).nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')).nullable(),
  industry: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  notes: z.string().optional().nullable(),
  openingReceivable: z.number().or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)).optional().nullable(),
  openingAsOfDate: z.date().optional().nullable(),
  
  contacts: z.array(contactSchema).min(1, 'At least one contact is required'),
  addresses: z.array(addressSchema).min(1, 'At least one address is required'),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
