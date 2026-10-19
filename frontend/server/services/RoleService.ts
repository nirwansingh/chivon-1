import { api } from '@/lib/api-client';

export class RoleService {
  static listRoles() {
    return api<
      {
        id: string;
        name: string;
        description: string | null;
        isSystem: boolean;
        permissions: { permission: { key: string } }[];
      }[]
    >('/api/roles');
  }

  static listAllPermissions() {
    return api<{ id: string; key: string; module: string; action: string; description: string | null }[]>(
      '/api/roles/permissions'
    );
  }

  static createRole(data: { name: string; description?: string; permissionKeys: string[] }) {
    return api('/api/roles', { method: 'POST', body: data });
  }

  static updateRole(id: string, data: { name: string; description?: string; permissionKeys: string[] }) {
    return api(`/api/roles/${id}`, { method: 'PUT', body: data });
  }
}
