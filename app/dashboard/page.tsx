import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Target,
  FileBarChart,
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  Banknote,
  Package,
  Layers,
  Box,
  BarChart,
  Shield,
  Settings,
} from 'lucide-react';

// Quick nav groups for the dashboard (matches sidebar, real links only)
const NAV_GROUPS = [
  {
    label: 'CRM',
    color: '#0B4F9E',
    bg: '#EAF3FF',
    links: [
      { href: '/dashboard/inquiries', label: 'Inquiries', icon: Target, desc: 'New leads and inquiries' },
      { href: '/dashboard/opportunities', label: 'Opportunities', icon: FileBarChart, desc: 'Pipeline opportunities' },
      { href: '/dashboard/customers', label: 'Customers', icon: Users, desc: 'Customer accounts' },
    ],
  },
  {
    label: 'Sales',
    color: '#0EA5E9',
    bg: '#F0F9FF',
    links: [
      { href: '/dashboard/quotations', label: 'Quotations', icon: FileText, desc: 'Quotes and revisions' },
      { href: '/dashboard/sales-orders', label: 'Sales Orders', icon: ShoppingCart, desc: 'Confirmed orders' },
      { href: '/dashboard/invoices', label: 'Invoices', icon: Receipt, desc: 'Customer invoices' },
    ],
  },
  {
    label: 'Finance',
    color: '#16A34A',
    bg: '#F0FDF4',
    links: [
      { href: '/dashboard/payments', label: 'Payments', icon: CreditCard, desc: 'Payment records' },
      { href: '/dashboard/receivables', label: 'Receivables', icon: Banknote, desc: 'Outstanding balances' },
    ],
  },
  {
    label: 'Catalog',
    color: '#F59E0B',
    bg: '#FFFBEB',
    links: [
      { href: '/dashboard/products', label: 'Products', icon: Package, desc: 'Product catalog' },
      { href: '/dashboard/services', label: 'Services', icon: Layers, desc: 'Service catalog' },
      { href: '/dashboard/stock', label: 'Stock', icon: Box, desc: 'Inventory management' },
    ],
  },
  {
    label: 'Administration',
    color: '#7C3AED',
    bg: '#F5F3FF',
    links: [
      { href: '/dashboard/users', label: 'Users', icon: Users, desc: 'User management' },
      { href: '/dashboard/roles', label: 'Roles & Permissions', icon: Shield, desc: 'Access control' },
      { href: '/dashboard/reports', label: 'Reports', icon: BarChart, desc: 'Business reports' },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings, desc: 'System settings' },
    ],
  },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const greeting = getGreeting();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── Greeting header ── */}
      <div className="space-y-1">
        <h1 className="text-h1 text-foreground">
          {greeting}, {user.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user.name}</span>
          {' '}·{' '}
          <span
            className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium"
            style={{ background: 'var(--surface-blue)', color: 'var(--primary)' }}
          >
            {user.role?.name}
          </span>
        </p>
      </div>

      {/* ── Module groups ── */}
      <div className="space-y-6">
        {NAV_GROUPS.map(group => (
          <section key={group.label} aria-labelledby={`group-${group.label}`}>
            <h2
              id={`group-${group.label}`}
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {group.label}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {group.links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  id={`nav-${link.label.toLowerCase().replace(/[^a-z]/g, '-')}`}
                  className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: group.bg }}
                    aria-hidden="true"
                  >
                    <link.icon className="h-4.5 w-4.5" style={{ color: group.color }} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors duration-150">
                      {link.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                      {link.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
