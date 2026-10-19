import { api } from '@/lib/api-client';

export class UserService {
  static listUsers() {
    return api<
      {
        id: string;
        name: string;
        email: string;
        status: string;
        roleId: string;
        role: { id: string; name: string };
      }[]
    >('/api/users');
  }

  static createUser(data: { name: string; email: string; password: string; roleId: string }) {
    return api('/api/users', { method: 'POST', body: data });
  }

  static updateUser(id: string, data: { name: string; email: string; roleId: string }) {
    return api(`/api/users/${id}`, { method: 'PUT', body: data });
  }

  static deactivateUser(id: string) {
    return api(`/api/users/${id}/deactivate`, { method: 'POST' });
  }

  static activateUser(id: string) {
    return api(`/api/users/${id}/activate`, { method: 'POST' });
  }

  static resetPassword(id: string, password: string) {
    return api(`/api/users/${id}/password`, { method: 'POST', body: { password } });
  }
}
