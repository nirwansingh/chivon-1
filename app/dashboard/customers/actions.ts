'use server';

import { requirePermission } from '@/lib/auth';
import { CustomerService } from '@/lib/customer-service';
import { customerSchema, CustomerFormValues } from './schema';
import { revalidatePath } from 'next/cache';

export async function createCustomerAction(data: CustomerFormValues) {
  try {
    const user = await requirePermission('CUSTOMER.CREATE');
    
    // Validate
    const parsed = customerSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: 'Validation failed', details: parsed.error.flatten() };
    }

    const { contacts, addresses, ...customerData } = parsed.data;

    // Convert openingReceivable to Prisma Decimal or undefined
    const preparedData = {
      ...customerData,
      openingReceivable: customerData.openingReceivable ?? undefined,
      openingAsOfDate: customerData.openingAsOfDate ?? undefined,
    };

    const customer = await CustomerService.createCustomer(
      user.id,
      preparedData,
      contacts.map(c => ({
        name: c.name,
        designation: c.designation ?? undefined,
        email: c.email ?? undefined,
        phone: c.phone ?? undefined,
        mobile: c.mobile ?? undefined,
        whatsapp: c.whatsapp ?? undefined,
        isPrimary: c.isPrimary,
        notes: c.notes ?? undefined,
      })),
      addresses.map(a => ({
        type: a.type,
        addressLine1: a.addressLine1,
        addressLine2: a.addressLine2 ?? undefined,
        city: a.city,
        state: a.state ?? undefined,
        country: a.country,
        postalCode: a.postalCode ?? undefined,
      }))
    );

    revalidatePath('/dashboard/customers');
    return { success: true, data: { id: customer.id } };
  } catch (error: any) {
    console.error('[CREATE_CUSTOMER]', error);
    return { success: false, error: error.message || 'Failed to create customer' };
  }
}

export async function updateCustomerAction(id: string, data: CustomerFormValues) {
  try {
    const user = await requirePermission('CUSTOMER.EDIT');
    
    // Validate
    const parsed = customerSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: 'Validation failed', details: parsed.error.flatten() };
    }

    const { contacts, addresses, ...customerData } = parsed.data;

    const preparedData = {
      ...customerData,
      openingReceivable: customerData.openingReceivable ?? undefined,
      openingAsOfDate: customerData.openingAsOfDate ?? undefined,
    };

    const customer = await CustomerService.fullUpdateCustomer(
      user.id,
      id,
      preparedData,
      contacts.map(c => ({
        id: c.id,
        name: c.name,
        designation: c.designation ?? undefined,
        email: c.email ?? undefined,
        phone: c.phone ?? undefined,
        mobile: c.mobile ?? undefined,
        whatsapp: c.whatsapp ?? undefined,
        isPrimary: c.isPrimary,
        notes: c.notes ?? undefined,
      })),
      addresses.map(a => ({
        id: a.id,
        type: a.type,
        addressLine1: a.addressLine1,
        addressLine2: a.addressLine2 ?? undefined,
        city: a.city,
        state: a.state ?? undefined,
        country: a.country,
        postalCode: a.postalCode ?? undefined,
      }))
    );

    revalidatePath('/dashboard/customers');
    revalidatePath(`/dashboard/customers/${id}`);
    
    return { success: true, data: { id: customer.id } };
  } catch (error: any) {
    console.error('[UPDATE_CUSTOMER]', error);
    return { success: false, error: error.message || 'Failed to update customer' };
  }
}

export async function deleteCustomerAction(id: string) {
  try {
    const user = await requirePermission('CUSTOMER.DELETE');
    await CustomerService.deleteCustomer(user.id, id);
    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error: any) {
    console.error('[DELETE_CUSTOMER]', error);
    return { success: false, error: error.message || 'Failed to delete customer' };
  }
}
