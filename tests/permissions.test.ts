import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { PermissionService } from '../lib/permissions';
import { PERMISSIONS } from '../lib/permissions';

/**
 * T-10 Permission Scaffold — verifies that the seeded default roles
 * can/cannot perform their expected actions, checked against the real DB.
 *
 * The permission keys match what the seed inserts via ALL_PERMISSIONS.
 */
describe('Permissions — T-10 role scaffold', () => {
  /** Map of role name → userId (resolved from the seeded DB) */
  const roleUserMap: Record<string, string | undefined> = {};

  beforeAll(async () => {
    const users = await prisma.user.findMany({
      include: { role: true },
      where: { status: 'ACTIVE' },
    });
    for (const u of users) {
      roleUserMap[u.role.name] = u.id;
    }
  });

  const userId = (role: string): string => {
    const id = roleUserMap[role];
    if (!id) throw new Error(`No active user found for role "${role}" — run the seed first`);
    return id;
  };

  // ── Super Admin ──────────────────────────────────────────────────────────
  describe('Super Admin', () => {
    it('has all permissions via bypass', async () => {
      const id = userId('Super Admin');
      // Super Admin bypasses the permission table entirely
      expect(await PermissionService.hasPermission(id, PERMISSIONS.SYSTEM.MANAGE)).toBe(true);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.CRM.READ)).toBe(true);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.FINANCE.REVERSE)).toBe(true);
    });
  });

  // ── Sales Manager ─────────────────────────────────────────────────────────
  describe('Sales Manager', () => {
    it('can read CRM and approve sales', async () => {
      const id = userId('Sales Manager');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.CRM.READ)).toBe(true);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.CRM.CREATE)).toBe(true);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.SALES.APPROVE)).toBe(true);
    });

    it('cannot manage the system', async () => {
      const id = userId('Sales Manager');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.SYSTEM.MANAGE)).toBe(false);
    });

    it('cannot reverse finance', async () => {
      const id = userId('Sales Manager');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.FINANCE.REVERSE)).toBe(false);
    });
  });

  // ── Sales Exec ────────────────────────────────────────────────────────────
  describe('Sales Exec', () => {
    it('can read and create CRM and sales records', async () => {
      const id = userId('Sales Exec');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.CRM.READ)).toBe(true);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.SALES.CREATE)).toBe(true);
    });

    it('cannot approve sales', async () => {
      const id = userId('Sales Exec');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.SALES.APPROVE)).toBe(false);
    });

    it('cannot access finance', async () => {
      const id = userId('Sales Exec');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.FINANCE.READ)).toBe(false);
    });
  });

  // ── Finance Manager ───────────────────────────────────────────────────────
  describe('Finance Manager', () => {
    it('can read, create, approve, and reverse finance', async () => {
      const id = userId('Finance Manager');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.FINANCE.READ)).toBe(true);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.FINANCE.APPROVE)).toBe(true);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.FINANCE.REVERSE)).toBe(true);
    });

    it('cannot manage the system', async () => {
      const id = userId('Finance Manager');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.SYSTEM.MANAGE)).toBe(false);
    });

    it('cannot create CRM records', async () => {
      const id = userId('Finance Manager');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.CRM.CREATE)).toBe(false);
    });
  });

  // ── Accountant ────────────────────────────────────────────────────────────
  describe('Accountant', () => {
    it('can read and create finance records', async () => {
      const id = userId('Accountant');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.FINANCE.READ)).toBe(true);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.FINANCE.CREATE)).toBe(true);
    });

    it('cannot approve or reverse finance', async () => {
      const id = userId('Accountant');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.FINANCE.APPROVE)).toBe(false);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.FINANCE.REVERSE)).toBe(false);
    });

    it('cannot manage the system', async () => {
      const id = userId('Accountant');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.SYSTEM.MANAGE)).toBe(false);
    });
  });

  // ── Procurement ───────────────────────────────────────────────────────────
  describe('Procurement', () => {
    it('can read settings', async () => {
      const id = userId('Procurement');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.SETTINGS.READ)).toBe(true);
    });

    it('cannot create or manage anything else', async () => {
      const id = userId('Procurement');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.CRM.CREATE)).toBe(false);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.FINANCE.CREATE)).toBe(false);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.SYSTEM.MANAGE)).toBe(false);
    });
  });

  // ── Viewer ────────────────────────────────────────────────────────────────
  describe('Viewer', () => {
    it('can read CRM, sales, and finance', async () => {
      const id = userId('Viewer');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.CRM.READ)).toBe(true);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.SALES.READ)).toBe(true);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.FINANCE.READ)).toBe(true);
    });

    it('cannot create anything', async () => {
      const id = userId('Viewer');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.CRM.CREATE)).toBe(false);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.SALES.CREATE)).toBe(false);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.FINANCE.CREATE)).toBe(false);
    });

    it('cannot approve, reverse, or manage the system', async () => {
      const id = userId('Viewer');
      expect(await PermissionService.hasPermission(id, PERMISSIONS.SALES.APPROVE)).toBe(false);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.FINANCE.REVERSE)).toBe(false);
      expect(await PermissionService.hasPermission(id, PERMISSIONS.SYSTEM.MANAGE)).toBe(false);
    });
  });

  // ── Inactive user guard ───────────────────────────────────────────────────
  describe('Inactive user', () => {
    it('returns false for any permission even if the role has it', async () => {
      // Create a transient inactive user for this test
      const superAdminRole = await prisma.role.findFirst({ where: { name: 'Super Admin' } });
      if (!superAdminRole) return;

      const tempUser = await prisma.user.create({
        data: {
          name: 'Temp Inactive',
          email: `inactive-test-${Date.now()}@chivon.test`,
          passwordHash: 'irrelevant',
          roleId: superAdminRole.id,
          status: 'INACTIVE',
        },
      });
      try {
        expect(await PermissionService.hasPermission(tempUser.id, PERMISSIONS.CRM.READ)).toBe(false);
      } finally {
        await prisma.user.delete({ where: { id: tempUser.id } });
      }
    });
  });
});
