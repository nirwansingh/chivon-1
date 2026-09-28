import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { AuditService } from '@/lib/audit';

export class RoleService {
  static async listRoles() {
    await requirePermission('system:manage');
    return prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' }
    });
  }

  static async listAllPermissions() {
    await requirePermission('system:manage');
    return prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }]
    });
  }

  static async createRole(data: { name: string; description?: string; permissionKeys: string[] }) {
    const actor = await requirePermission('system:manage');

    const role = await prisma.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: {
          name: data.name,
          description: data.description || '',
          isSystem: false,
        }
      });

      if (data.permissionKeys && data.permissionKeys.length > 0) {
        const perms = await tx.permission.findMany({
          where: { key: { in: data.permissionKeys } }
        });

        if (perms.length > 0) {
          await tx.rolePermission.createMany({
            data: perms.map(p => ({
              roleId: newRole.id,
              permissionId: p.id
            }))
          });
        }
      }

      return newRole;
    });

    await AuditService.log({
      userId: actor.id,
      action: 'ROLE_CHANGE',
      module: 'ROLE',
      entityType: 'Role',
      entityId: role.id,
      afterData: { ...role, permissionKeys: data.permissionKeys }
    });

    return role;
  }

  static async updateRole(id: string, data: { name: string; description?: string; permissionKeys: string[] }) {
    const actor = await requirePermission('system:manage');

    const before = await prisma.role.findUnique({ 
      where: { id },
      include: { permissions: { include: { permission: true } } }
    });
    if (!before) throw new Error('Role not found');

    if (before.isSystem && before.name === 'Super Admin') {
      throw new Error('Cannot modify Super Admin role');
    }

    const updatedRole = await prisma.$transaction(async (tx) => {
      const r = await tx.role.update({
        where: { id },
        data: {
          name: before.isSystem ? before.name : data.name, // don't rename system roles
          description: data.description || before.description,
        }
      });

      await tx.rolePermission.deleteMany({ where: { roleId: id } });

      if (data.permissionKeys && data.permissionKeys.length > 0) {
        const perms = await tx.permission.findMany({
          where: { key: { in: data.permissionKeys } }
        });

        if (perms.length > 0) {
          await tx.rolePermission.createMany({
            data: perms.map(p => ({
              roleId: r.id,
              permissionId: p.id
            }))
          });
        }
      }

      return r;
    });

    await AuditService.log({
      userId: actor.id,
      action: 'ROLE_CHANGE',
      module: 'ROLE',
      entityType: 'Role',
      entityId: updatedRole.id,
      beforeData: before,
      afterData: { ...updatedRole, permissionKeys: data.permissionKeys }
    });

    return updatedRole;
  }
}
