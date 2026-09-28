import { prisma } from '@/lib/prisma';
import { quickLogin } from './actions';
import {
  ShieldCheck,
  TrendingUp,
  FileText,
  CreditCard,
  Users,
  Package,
  Settings,
  LayoutDashboard,
} from 'lucide-react';

// Map role names to an icon and a short description
const ROLE_META: Record<string, { icon: React.ElementType; desc: string; color: string; bg: string }> = {
  'Super Admin': { icon: ShieldCheck, desc: 'Full system access', color: '#7C3AED', bg: '#F5F3FF' },
  'Sales Manager': { icon: TrendingUp, desc: 'CRM & sales pipeline', color: '#0B4F9E', bg: '#EAF3FF' },
  'Sales Executive': { icon: FileText, desc: 'Quotes & opportunities', color: '#0EA5E9', bg: '#F0F9FF' },
  'Accounts Manager': { icon: CreditCard, desc: 'Finance & payments', color: '#16A34A', bg: '#F0FDF4' },
  'Operations Manager': { icon: Package, desc: 'Stock & operations', color: '#F59E0B', bg: '#FFFBEB' },
  'HR Manager': { icon: Users, desc: 'User management', color: '#6366F1', bg: '#EEF2FF' },
  'Admin': { icon: Settings, desc: 'Administration', color: '#64748B', bg: '#F8FAFC' },
};

const DEFAULT_META = { icon: LayoutDashboard, desc: 'Access the system', color: '#0B4F9E', bg: '#EAF3FF' };

export async function QuickLogin() {
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    include: { role: true },
    orderBy: { role: { name: 'asc' } },
  });

  return (
    <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 mb-4">
        <div
          className="h-px flex-1"
          style={{ background: 'var(--border)' }}
          aria-hidden="true"
        />
        <span className="text-xs font-semibold uppercase tracking-widest px-2" style={{ color: 'var(--muted-foreground)' }}>
          DEV — Quick Login
        </span>
        <div
          className="h-px flex-1"
          style={{ background: 'var(--border)' }}
          aria-hidden="true"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {users.map(user => {
          const meta = ROLE_META[user.role.name] ?? DEFAULT_META;
          const Icon = meta.icon;
          return (
            <form key={user.id} action={quickLogin.bind(null, user.id)}>
              <button
                type="submit"
                className="w-full text-left rounded-lg border p-3 transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
                style={{ borderColor: 'var(--border)', background: 'white' }}
                id={`quick-login-${user.role.name.toLowerCase().replace(/[^a-z]/g, '-')}`}
                aria-label={`Quick login as ${user.name} (${user.role.name})`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ background: meta.bg }}
                    aria-hidden="true"
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{user.role.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{meta.desc}</p>
                  </div>
                </div>
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
