import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSession } from '../lib/auth';
import { UserService } from '../server/services/UserService';

vi.mock('../lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/auth')>();
  return {
    ...actual,
    requirePermission: vi.fn().mockResolvedValue({ id: 'test-admin-id', role: { name: 'Super Admin', isSystem: true } }),
  };
});

describe('Authentication security cleanups', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('AUTH_SECRET validation', () => {
    it('throws error when AUTH_SECRET is not configured', async () => {
      delete process.env.AUTH_SECRET;
      await expect(createSession('user-123')).rejects.toThrow(
        /AUTH_SECRET environment variable is missing/i
      );
    });
  });

  describe('UserService password requirements', () => {
    it('rejects user creation with missing password', async () => {
      await expect(
        UserService.createUser({
          name: 'Jane Doe',
          email: 'jane@chivon.local',
          password: '',
          roleId: 'role-123',
        })
      ).rejects.toThrow(/Password is required and must be at least 6 characters long/i);
    });

    it('rejects user creation with short password', async () => {
      await expect(
        UserService.createUser({
          name: 'Jane Doe',
          email: 'jane@chivon.local',
          password: '123',
          roleId: 'role-123',
        })
      ).rejects.toThrow(/Password is required and must be at least 6 characters long/i);
    });

    it('rejects password reset with short password', async () => {
      await expect(
        UserService.resetPassword('user-123', 'short')
      ).rejects.toThrow(/New password is required and must be at least 6 characters long/i);
    });
  });
});
