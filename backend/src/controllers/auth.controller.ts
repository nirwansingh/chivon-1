import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../models/prisma';
import { AuditService } from '../services/audit';
import { getCurrentUser, requirePermission, signSession } from '../middlewares/auth';
import { asyncRoute } from '../middlewares/error';

export const authRouter = Router();

function devSwitchEnabled() {
  return process.env.NODE_ENV !== 'production' && process.env.DEV_USER_SWITCH === 'true';
}

authRouter.post(
  '/login',
  asyncRoute(async (req, res) => {
    const email = String(req.body?.email || '');
    const password = String(req.body?.password || '');
    if (!email || !password) {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({ error: 'Invalid credentials or inactive user' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await AuditService.log({
      userId: user.id,
      action: 'LOGIN',
      module: 'AUTH',
      entityType: 'User',
      entityId: user.id,
      description: 'User logged in with credentials',
    });

    const token = await signSession(user.id);
    res.json({ token });
  })
);

authRouter.post(
  '/quick-login',
  asyncRoute(async (req, res) => {
    if (!devSwitchEnabled()) {
      res.status(403).json({ error: 'Quick login disabled' });
      return;
    }
    const userId = String(req.body?.userId || '');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE') {
      res.status(404).json({ error: 'User not found or inactive' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await AuditService.log({
      userId: user.id,
      action: 'LOGIN',
      module: 'AUTH',
      entityType: 'User',
      entityId: user.id,
      description: 'User quick-logged in (dev mode)',
    });

    res.json({ token: await signSession(user.id) });
  })
);

authRouter.get(
  '/dev-users',
  asyncRoute(async (_req, res) => {
    if (!devSwitchEnabled()) {
      res.json({ users: [] });
      return;
    }
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      include: { role: true },
      orderBy: { role: { name: 'asc' } },
    });
    res.json({ users });
  })
);

authRouter.get(
  '/me',
  asyncRoute(async (_req, res) => {
    const user = await getCurrentUser();
    if (!user) {
      res.status(401).json({ error: 'UNAUTHENTICATED' });
      return;
    }
    res.json({ user });
  })
);

authRouter.post(
  '/logout',
  asyncRoute(async (_req, res) => {
    const user = await getCurrentUser();
    if (user) {
      await AuditService.log({
        userId: user.id,
        action: 'LOGOUT',
        module: 'AUTH',
        entityType: 'User',
        entityId: user.id,
        description: 'User logged out',
      });
    }
    res.json({ ok: true });
  })
);

authRouter.post(
  '/switch',
  asyncRoute(async (req, res) => {
    if (!devSwitchEnabled()) {
      res.status(403).json({ error: 'User switch is disabled in this environment' });
      return;
    }
    const actor = await getCurrentUser();
    if (!actor) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const targetUserId = String(req.body?.targetUserId || '');
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { role: true },
    });
    if (!targetUser || targetUser.status !== 'ACTIVE') {
      res.status(404).json({ error: 'Target user not found or inactive' });
      return;
    }
    if (actor.id === targetUserId) {
      res.json({ token: null, unchanged: true });
      return;
    }
    await AuditService.log({
      userId: actor.id,
      action: 'USER_SWITCH',
      module: 'AUTH',
      entityType: 'User',
      entityId: targetUserId,
      description: `Dev switch: ${actor.name} → ${targetUser.name} (${targetUser.role.name})`,
      afterData: {
        switchedToId: targetUserId,
        switchedToName: targetUser.name,
        role: targetUser.role.name,
      },
    });
    res.json({ token: await signSession(targetUserId) });
  })
);

authRouter.get(
  '/lookups/users',
  asyncRoute(async (req, res) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHENTICATED');
    const activeOnly = req.query.status !== 'all';
    const users = await prisma.user.findMany({
      where: activeOnly ? { status: 'ACTIVE' } : undefined,
      select: { id: true, name: true, email: true, roleId: true, status: true },
      orderBy: { name: 'asc' },
    });
    res.json({ users });
  })
);

authRouter.get(
  '/lookups/customers',
  asyncRoute(async (_req, res) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('UNAUTHENTICATED');
    const customers = await prisma.customer.findMany({
      select: { id: true, companyName: true, status: true },
      orderBy: { companyName: 'asc' },
    });
    res.json({ customers });
  })
);

authRouter.get(
  '/lookups/roles',
  asyncRoute(async (_req, res) => {
    await requirePermission('system:manage');
    const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
    res.json({ roles });
  })
);
