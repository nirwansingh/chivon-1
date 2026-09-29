'use server';

import { requirePermission } from '@/lib/auth';
import { PaymentService, PaymentCreateInput } from '@/lib/payment-service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPaymentAction(input: PaymentCreateInput) {
  const user = await requirePermission('manage_invoices');
  
  const payment = await PaymentService.create(input, user.id);
  
  revalidatePath('/dashboard/payments');
  if (input.allocations?.length) {
    input.allocations.forEach(a => revalidatePath(`/dashboard/invoices/${a.invoiceId}`));
  }
  
  redirect(`/dashboard/payments/${payment.id}`);
}

export async function allocatePaymentAction(
  paymentId: string, 
  allocations: { invoiceId: string; amount: number }[]
) {
  const user = await requirePermission('manage_invoices');
  
  const payment = await PaymentService.allocate(paymentId, allocations, user.id);
  
  revalidatePath('/dashboard/payments');
  revalidatePath(`/dashboard/payments/${paymentId}`);
  allocations.forEach(a => revalidatePath(`/dashboard/invoices/${a.invoiceId}`));
  
  return { success: true };
}

export async function reversePaymentAction(paymentId: string, reason: string) {
  const user = await requirePermission('manage_invoices');
  
  const payment = await PaymentService.reversePayment(paymentId, reason, user.id);
  
  revalidatePath('/dashboard/payments');
  revalidatePath(`/dashboard/payments/${paymentId}`);
  // We don't easily know all invoice IDs reversed here without querying, but we can revalidate invoices page
  revalidatePath('/dashboard/invoices');
  
  return { success: true };
}
