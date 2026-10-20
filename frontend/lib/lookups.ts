import { api } from './api-client';

export async function listUsers(status: 'active' | 'all' = 'active') {
  const result = await api<{ users: { id: string; name: string; email: string; roleId: string; status: string }[] }>(
    `/api/auth/lookups/users${status === 'all' ? '?status=all' : ''}`
  );
  return result.users;
}

export async function listCustomerOptions() {
  const result = await api<{ customers: { id: string; companyName: string; status: string }[] }>(
    '/api/auth/lookups/customers'
  );
  return result.customers;
}

export async function listRoles() {
  const result = await api<{ roles: { id: string; name: string }[] }>('/api/auth/lookups/roles');
  return result.roles;
}

export async function listDevUsers() {
  const result = await api<{
    users: { id: string; name: string; email: string; role: { name: string } }[];
  }>('/api/auth/dev-users');
  return result.users;
}
