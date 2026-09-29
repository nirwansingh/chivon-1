'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { m, AnimatePresence } from 'framer-motion';
import { spring } from '@/lib/motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSidebar } from '@/components/ui/sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Users,
  Target,
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  Banknote,
  FileBarChart,
  Package,
  Layers,
  Box,
  CheckSquare,
  CalendarClock,
  FolderOpen,
  BarChart,
  ShieldAlert,
  Settings,
  Shield,
  Clock,
  Building2,
} from 'lucide-react';

const navGroups: {
  label: string;
  items: { title: string; url: string; icon: React.ElementType; disabled?: boolean }[];
}[] = [
  {
    label: 'Overview',
    items: [{ title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'CRM',
    items: [
      { title: 'Inquiries', url: '/dashboard/inquiries', icon: Target },
      { title: 'Opportunities', url: '/dashboard/opportunities', icon: FileBarChart },
      { title: 'Customers', url: '/dashboard/customers', icon: Building2 },
    ],
  },
  {
    label: 'Sales',
    items: [
      { title: 'Quotations', url: '/dashboard/quotations', icon: FileText },
      { title: 'Sales Orders', url: '/dashboard/sales-orders', icon: ShoppingCart },
      { title: 'Invoices', url: '/dashboard/invoices', icon: Receipt },
    ],
  },
  {
    label: 'Finance',
    items: [
      { title: 'Payments', url: '/dashboard/payments', icon: CreditCard },
      { title: 'Receivables', url: '/dashboard/receivables', icon: Banknote },
      { title: 'SOA', url: '/dashboard/soa', icon: FileBarChart },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { title: 'Products', url: '/dashboard/products', icon: Package },
      { title: 'Services', url: '/dashboard/services', icon: Layers },
      { title: 'Stock', url: '/dashboard/stock', icon: Box },
    ],
  },
  {
    label: 'Activities',
    items: [
      { title: 'Tasks', url: '/dashboard/tasks', icon: CheckSquare },
      { title: 'Follow-ups', url: '/dashboard/follow-ups', icon: CalendarClock },
    ],
  },
  {
    label: 'Reports',
    items: [
      { title: 'Documents', url: '/dashboard/documents', icon: FolderOpen },
      { title: 'Reports', url: '/dashboard/reports', icon: BarChart },
      { title: 'Audit Logs', url: '/dashboard/audit', icon: ShieldAlert },
    ],
  },
  {
    label: 'Administration',
    items: [
      { title: 'Users', url: '/dashboard/users', icon: Users },
      { title: 'Roles', url: '/dashboard/roles', icon: Shield },
      { title: 'Settings', url: '/dashboard/settings', icon: Settings },
    ],
  },
  {
    label: 'Coming Soon',
    items: [
      { title: 'Procurement', url: '#', icon: Clock, disabled: true },
      { title: 'Email & WhatsApp', url: '#', icon: Clock, disabled: true },
      { title: 'AI Automation', url: '#', icon: Clock, disabled: true },
    ],
  },
];

function NavItem({
  item,
  isActive,
  collapsed,
}: {
  item: (typeof navGroups)[number]['items'][number];
  isActive: boolean;
  collapsed: boolean;
}) {
  const content = (
    <Link
      href={item.disabled ? '#' : item.url}
      className={`
        relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium
        transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-sidebar-ring group
        ${item.disabled
          ? 'opacity-40 cursor-not-allowed pointer-events-none'
          : isActive
          ? 'text-white'
          : 'text-sidebar-foreground hover:text-white'
        }
      `}
      aria-current={isActive ? 'page' : undefined}
      tabIndex={item.disabled ? -1 : 0}
    >
      {/* Sliding active background pill */}
      {isActive && (
        <m.div
          layoutId="active-nav-pill"
          className="absolute inset-0 rounded-md"
          style={{ background: 'var(--sidebar-primary)' }}
          transition={spring.smooth}
        />
      )}

      {/* Hover background (non-active) */}
      {!isActive && !item.disabled && (
        <span
          className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ background: 'var(--sidebar-accent)' }}
          aria-hidden="true"
        />
      )}

      <item.icon
        className={`relative z-10 shrink-0 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'}`}
        aria-hidden="true"
        strokeWidth={1.75}
      />
      {!collapsed && (
        <span className="relative z-10 truncate">{item.title}</span>
      )}
      {item.disabled && !collapsed && (
        <span className="relative z-10 ml-auto text-[10px] font-medium tracking-wider uppercase text-sidebar-muted">
          Soon
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={<li className="list-none" />}>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return <li className="list-none">{content}</li>;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';

  const sidebarContent = (
    <m.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={spring.smooth}
      className="relative flex-shrink-0 flex flex-col h-full overflow-hidden border-r"
      style={{ background: 'var(--sidebar)', borderColor: 'var(--sidebar-border)' }}
      aria-label="Main navigation"
    >
      {/* ── Brand block ── */}
      <div
        className="flex items-center gap-3 px-4 border-b shrink-0"
        style={{ height: 64, borderColor: 'var(--sidebar-border)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md"
          style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0B4F9E 100%)' }}
          aria-hidden="true"
        >
          C
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <m.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="whitespace-nowrap">
                <p className="text-sm font-bold leading-tight" style={{ color: 'var(--sidebar-foreground)', fontFamily: 'var(--font-heading)' }}>
                  Chivon CRM
                </p>
                <p className="text-xs leading-tight" style={{ color: 'var(--sidebar-muted)' }}>
                  Mechanical ERP
                </p>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav content ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-1">
            {/* Group label */}
            <AnimatePresence initial={false}>
              {!collapsed && (
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-2.5 pt-3 pb-1"
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--sidebar-muted)' }}
                  >
                    {group.label}
                  </p>
                </m.div>
              )}
            </AnimatePresence>

            {/* Nav items */}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.url !== '#' &&
                  (pathname === item.url || pathname.startsWith(item.url + '/'));
                return (
                  <NavItem
                    key={item.title}
                    item={item}
                    isActive={isActive}
                    collapsed={collapsed}
                  />
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div
        className="border-t px-4 py-3 shrink-0"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <AnimatePresence initial={false}>
          {!collapsed ? (
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[11px] text-center"
              style={{ color: 'var(--sidebar-muted)' }}
            >
              Chivon Mechanical v1.0
            </m.p>
          ) : (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <span className="text-[10px]" style={{ color: 'var(--sidebar-muted)' }}>v1</span>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </m.aside>
  );

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="p-0 w-auto bg-transparent border-none [&>button]:hidden">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden md:flex h-screen">
      {sidebarContent}
    </div>
  );
}
