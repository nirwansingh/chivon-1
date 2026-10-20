'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  Search,
  LogOut,
  User as UserIcon,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { logout } from '@/app/login/actions';
import { m } from 'framer-motion';
import { fadeIn } from '@/lib/motion';

// ─── Breadcrumb helper ────────────────────────────────────────────────────────
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'Customers',
  inquiries: 'Inquiries',
  opportunities: 'Opportunities',
  quotations: 'Quotations',
  'sales-orders': 'Sales Orders',
  invoices: 'Invoices',
  payments: 'Payments',
  receivables: 'Receivables',
  soa: 'Statement of Account',
  products: 'Products',
  services: 'Services',
  stock: 'Stock',
  tasks: 'Tasks',
  'follow-ups': 'Follow-ups',
  documents: 'Documents',
  reports: 'Reports',
  audit: 'Audit Logs',
  users: 'Users',
  roles: 'Roles & Permissions',
  settings: 'Settings',
  new: 'New',
  edit: 'Edit',
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    // If it looks like an ID (not a known label), use a short truncation
    const label = SEGMENT_LABELS[seg] ?? (
      seg.length > 20 ? seg.slice(0, 8) + '…' : seg.replace(/-/g, ' ')
    );
    return { label, href, isLast: i === segments.length - 1 };
  });
}

// ─── Initials avatar ──────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AppTopbar({ user }: { user: { name: string; roleName: string } }) {
  const { toggleSidebar, state } = useSidebar();
  const collapsed = state === 'collapsed';
  const breadcrumbs = useBreadcrumbs();

  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Record<string, any[]>>({});
  const [isSearching, setIsSearching] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  // Keyboard shortcut: / or Ctrl+K opens search
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !e.defaultPrevented) {
        const active = document.activeElement as HTMLElement;
        if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') return;
        e.preventDefault();
        document.getElementById('topbar-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults({});
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.results) {
          setResults(data.results);
          setOpen(true);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <m.header
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 px-4 md:px-5 border-b glass"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-blue transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
        ) : (
          <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 flex-1 min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.href}>
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            )}
            {crumb.isLast ? (
              <span
                className="text-sm font-semibold text-foreground truncate max-w-[200px]"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 truncate max-w-[120px]"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Universal Search */}
      <div className="flex-1 w-full max-w-md mx-auto hidden md:flex items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            nativeButton={false}
            render={
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  id="topbar-search"
                  type="search"
                  placeholder="Search… (Press / or ⌘K)"
                  className="w-full pl-8 pr-8 h-9 text-sm bg-surface-blue border-border focus:bg-white"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search customers, quotes, invoices and more"
                  autoComplete="off"
                />
                {isSearching && (
                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            }
          />
          <PopoverContent className="w-[440px] p-0" align="start">
            {Object.keys(results).length === 0 ? (
              <div className="p-5 text-sm text-center text-muted-foreground">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              <div className="max-h-[320px] overflow-y-auto py-2">
                {Object.entries(results).map(([groupName, items]) => (
                  <div key={groupName} className="px-1">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      {groupName}
                    </div>
                    {items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.url}
                        onClick={() => { setOpen(false); setQuery(''); }}
                        className="flex flex-col gap-0.5 px-3 py-2 hover:bg-surface-blue rounded-md mx-1 outline-none focus:bg-surface-blue cursor-pointer transition-colors duration-100"
                      >
                        <span className="text-sm font-medium text-foreground">{item.title}</span>
                        {item.subtitle && (
                          <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-blue transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
                aria-label="Open user menu"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback
                    className="text-xs font-semibold"
                    style={{ background: 'var(--primary)', color: 'white' }}
                  >
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col text-left leading-none">
                  <span className="text-xs font-semibold text-foreground">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground">{user.roleName}</span>
                </div>
              </button>
            }
          />
          <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
            <DropdownMenuLabel className="font-normal py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className="text-xs font-semibold"
                    style={{ background: 'var(--primary)', color: 'white' }}
                  >
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-semibold leading-none text-foreground">{user.name}</p>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 font-medium w-fit"
                    style={{ background: 'var(--surface-blue)', color: 'var(--primary)' }}
                  >
                    {user.roleName}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logout}>
              <button type="submit" className="w-full text-left">
                <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5">
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </m.header>
  );
}
