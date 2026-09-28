import { prisma } from './prisma';

export const PERMISSIONS = {
  CRM: {
    READ: 'crm:read',
    CREATE: 'crm:create',
    UPDATE: 'crm:update',
    DELETE: 'crm:delete',
  },
  SALES: {
    READ: 'sales:read',
    CREATE: 'sales:create',
    UPDATE: 'sales:update',
    DELETE: 'sales:delete',
    APPROVE: 'sales:approve',
  },
  FINANCE: {
    READ: 'finance:read',
    CREATE: 'finance:create',
    UPDATE: 'finance:update',
    DELETE: 'finance:delete',
    APPROVE: 'finance:approve',
    REVERSE: 'finance:reverse',
  },
  SETTINGS: {
    READ: 'settings:read',
    UPDATE: 'settings:update',
  },
  SYSTEM: {
    MANAGE: 'system:manage',
  }
} as const;

export const ALL_PERMISSIONS = Object.values(PERMISSIONS).flatMap(mod => Object.values(mod));

export class PermissionService {
  /**
   * Checks if a user has a specific permission.
   */
  static async hasPermission(userId: string, permissionKey: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.role || user.status !== 'ACTIVE') return false;
    
    if (user.role.isSystem && user.role.name === 'Super Admin') return true;

    return user.role.permissions.some(rp => rp.permission.key === permissionKey);
  }
}
