'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
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
      { title: 'Customers', url: '/dashboard/customers', icon: Users },
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
      { title: 'Statement of Account', url: '/dashboard/soa', icon: FileBarChart },
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
    label: 'Documents & Reports',
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
      { title: 'Roles & Permissions', url: '/dashboard/roles', icon: Shield },
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

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold">
            C
          </div>
          <span className="font-bold text-lg hidden md:block">Chivon CRM</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} className={item.disabled ? 'opacity-50 cursor-not-allowed' : ''} />}
                      isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
                      disabled={item.disabled}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <p className="text-xs text-muted-foreground text-center">Chivon Mechanical v1.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}
