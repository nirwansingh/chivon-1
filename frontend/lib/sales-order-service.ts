import type { Prisma, SalesOrderStatus } from '@prisma/client';
import type { SalesOrderFormValues } from '@/app/dashboard/sales-orders/schema';
import { api } from './api-client';

export type SalesOrderWithRelations = Prisma.SalesOrderGetPayload<{
  include: {
    customer: true;
    createdBy: true;
    _count: { select: { items: true; invoices: true } };
  };
}>;

export type SalesOrderDetails = Prisma.SalesOrderGetPayload<{
  include: {
    customer: true;
    createdBy: true;
    items: { include: { product: true } };
  };
}>;

export class SalesOrderService {
  static create(data: SalesOrderFormValues, _userId: string) {
    return api<{ id: string }>('/api/sales-orders', { method: 'POST', body: data });
  }

  static update(id: string, data: SalesOrderFormValues, _userId: string) {
    return api<{ id: string }>(`/api/sales-orders/${id}`, { method: 'PUT', body: data });
  }

  static getById(id: string) {
    return api<SalesOrderDetails | null>(`/api/sales-orders/${id}`);
  }

  static updateStatus(id: string, status: SalesOrderStatus, _userId: string, reason?: string) {
    return api(`/api/sales-orders/${id}/status`, { method: 'POST', body: { status, reason } });
  }

  static cancel(id: string, _userId: string, reason: string) {
    return api(`/api/sales-orders/${id}/cancel`, { method: 'POST', body: { reason } });
  }

  static convertToInvoice(
    salesOrderId: string,
    itemsToInvoice: { salesOrderItemId: string; quantity: number }[],
    _userId: string
  ) {
    return api<{ id: string }>(`/api/sales-orders/${salesOrderId}/invoice`, {
      method: 'POST',
      body: { items: itemsToInvoice },
    });
  }

  static reopen(id: string, _userId: string) {
    return api(`/api/sales-orders/${id}/reopen`, { method: 'POST' });
  }

  static getSalesOrders(params: {
    search?: string;
    status?: string;
    customerId?: string;
    userId?: string;
  }) {
    return api<SalesOrderWithRelations[]>('/api/sales-orders/query', { method: 'POST', body: params });
  }
}
