import type { Prisma } from '@prisma/client';
import { api } from './api-client';

export type CustomerWithRelations = Prisma.CustomerGetPayload<{
  include: {
    contacts: true;
    addresses: true;
    tasks: true;
  };
}> & { documents?: unknown[] };

export class CustomerService {
  static getCustomers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return api<{ data: CustomerWithRelations[]; total: number; pageCount: number }>('/api/customers/query', {
      method: 'POST',
      body: params,
    });
  }

  static getCustomerById(id: string) {
    return api<CustomerWithRelations | null>(`/api/customers/${id}`);
  }

  static createCustomer(
    _userId: string,
    data: Prisma.CustomerCreateInput,
    contacts?: Prisma.CustomerContactCreateWithoutCustomerInput[],
    addresses?: Prisma.CustomerAddressCreateWithoutCustomerInput[]
  ) {
    return api('/api/customers', { method: 'POST', body: { data, contacts, addresses } });
  }

  static fullUpdateCustomer(
    _userId: string,
    id: string,
    data: Prisma.CustomerUpdateInput,
    contacts: unknown[],
    addresses: unknown[]
  ) {
    return api(`/api/customers/${id}`, { method: 'PUT', body: { data, contacts, addresses } });
  }

  static async deleteCustomer(_userId: string, id: string) {
    await api(`/api/customers/${id}`, { method: 'DELETE' });
  }
}
