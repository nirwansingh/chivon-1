import { api } from './api-client';

export interface PaymentCreateInput {
  customerId: string;
  amount: number;
  paymentMethod: string;
  paymentDate?: Date;
  referenceNumber?: string;
  bank?: string;
  chequeNumber?: string;
  notes?: string;
  allocations?: { invoiceId: string; amount: number }[];
}

export class PaymentService {
  static create(input: PaymentCreateInput, _userId: string) {
    return api('/api/payments', { method: 'POST', body: input });
  }

  static allocate(paymentId: string, allocations: { invoiceId: string; amount: number }[], _userId: string) {
    return api(`/api/payments/${paymentId}/allocate`, { method: 'POST', body: { allocations } });
  }

  static reversePayment(paymentId: string, reason: string, _userId: string) {
    return api(`/api/payments/${paymentId}/reverse`, { method: 'POST', body: { reason } });
  }
}
