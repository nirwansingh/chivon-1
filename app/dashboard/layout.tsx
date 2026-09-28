import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DevModeBanner } from '@/components/DevModeBanner';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppTopbar } from '@/components/app-topbar';
import { PageTransition } from '@/components/page-transition';

const isDevMode =
  process.env.NODE_ENV !== 'production' && process.env.DEV_USER_SWITCH === 'true';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const allUsers = isDevMode
    ? await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        include: { role: true },
        orderBy: { name: 'asc' },
      })
    : [];

  return (
    <SidebarProvider>
      {/*
        DEV MODE bar: fixed at top, 32px (--dev-bar-height).
        The wrapper below has padding-top equal to dev-bar-height when active,
        so the sidebar and topbar are never behind the DEV bar.
      */}
      {isDevMode && (
        <DevModeBanner
          currentUser={{ id: user.id, name: user.name, roleName: user.role.name }}
          allUsers={allUsers.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            roleName: u.role.name,
          }))}
        />
      )}

      {/* Full-screen shell — offset from top by DEV bar when active */}
      <div
        className="flex h-screen w-full overflow-hidden"
        style={{ paddingTop: isDevMode ? 'var(--dev-bar-height)' : '0' }}
      >
        {/* Sidebar */}
        <AppSidebar />

        {/* Main column */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AppTopbar user={{ name: user.name, roleName: user.role.name }} />

          <main className="flex-1 overflow-y-auto">
            <div className="px-5 py-5 md:px-6 md:py-6 h-full">
              <PageTransition>
                {children}
              </PageTransition>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
