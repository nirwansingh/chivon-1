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
      <div className="min-h-screen bg-background w-full flex">
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
        
        <AppSidebar />
        
        <div className={`flex-1 flex flex-col min-w-0 ${isDevMode ? 'mt-8' : ''}`}>
          <AppTopbar user={{ name: user.name, roleName: user.role.name }} />
          <main className="flex-1 p-4 md:p-6 overflow-auto flex flex-col">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
