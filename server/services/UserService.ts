import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requirePermission } from '@/lib/auth';
import { AuditService } from '@/lib/audit';

export class UserService {
  static async listUsers() {
    await requirePermission('system:manage');
    return prisma.user.findMany({
      include: { role: true },
      orderBy: { name: 'asc' }
    });
  }

  static async createUser(data: { name: string; email: string; password: string; roleId: string }) {
    const actor = await requirePermission('system:manage');
    const { name, email, password, roleId } = data;

    if (!name || name.trim() === '') {
      throw new Error('Name is required.');
    }
    if (!email || !email.includes('@')) {
      throw new Error('Valid email address is required.');
    }
    if (!password || password.trim().length < 6) {
      throw new Error('Password is required and must be at least 6 characters long.');
    }
    if (!roleId) {
      throw new Error('Role is required.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        roleId,
        status: 'ACTIVE'
      }
    });

    await AuditService.log({
      userId: actor.id,
      action: 'USER_CHANGE',
      module: 'USER',
      entityType: 'User',
      entityId: newUser.id,
      afterData: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        roleId: newUser.roleId,
        status: newUser.status,
      }
    });

    return newUser;
  }

  static async updateUser(id: string, data: { name: string; email: string; roleId: string }) {
    const actor = await requirePermission('system:manage');
    
    const before = await prisma.user.findUnique({ where: { id } });
    if (!before) throw new Error('User not found');

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        roleId: data.roleId,
      }
    });

    await AuditService.log({
      userId: actor.id,
      action: 'USER_CHANGE',
      module: 'USER',
      entityType: 'User',
      entityId: updatedUser.id,
      beforeData: before,
      afterData: updatedUser
    });

    return updatedUser;
  }

  static async deactivateUser(id: string) {
    const actor = await requirePermission('system:manage');
    
    if (actor.id === id) throw new Error('Cannot deactivate yourself');

    const before = await prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!before) throw new Error('User not found');
    if (before.role.isSystem && before.role.name === 'Super Admin') {
      throw new Error('Cannot deactivate Super Admin');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' }
    });

    await AuditService.log({
      userId: actor.id,
      action: 'USER_CHANGE',
      module: 'USER',
      entityType: 'User',
      entityId: updated.id,
      beforeData: before,
      afterData: updated,
      description: 'Deactivated user'
    });

    return updated;
  }

  static async activateUser(id: string) {
    const actor = await requirePermission('system:manage');
    
    const before = await prisma.user.findUnique({ where: { id } });
    if (!before) throw new Error('User not found');

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });

    await AuditService.log({
      userId: actor.id,
      action: 'USER_CHANGE',
      module: 'USER',
      entityType: 'User',
      entityId: updated.id,
      beforeData: before,
      afterData: updated,
      description: 'Activated user'
    });

    return updated;
  }

  static async resetPassword(id: string, newPassword: string) {
    const actor = await requirePermission('system:manage');
    
    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error('New password is required and must be at least 6 characters long.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    await AuditService.log({
      userId: actor.id,
      action: 'USER_CHANGE',
      module: 'USER',
      entityType: 'User',
      entityId: updated.id,
      description: 'Reset password'
    });

    return true;
  }
}
