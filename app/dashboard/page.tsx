import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardService } from '@/lib/dashboard-service';
import { DashboardClient } from './client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

function getDateRange(rangeString: string): { dateFrom?: Date; dateTo?: Date } {
  const now = new Date();
  
  switch (rangeString) {
    case 'TODAY':
      return { dateFrom: startOfDay(now), dateTo: endOfDay(now) };
    case 'THIS_WEEK':
      return { dateFrom: startOfWeek(now, { weekStartsOn: 1 }), dateTo: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'THIS_MONTH':
      return { dateFrom: startOfMonth(now), dateTo: endOfMonth(now) };
    case 'THIS_QUARTER':
      return { dateFrom: startOfQuarter(now), dateTo: endOfQuarter(now) };
    case 'THIS_YEAR':
      // Real app might fetch financial year start from DB, but using simple year for V1
      return { dateFrom: startOfYear(now), dateTo: endOfYear(now) };
    case 'ALL_TIME':
    default:
      return {};
  }
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  if (!user || !user.role) {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const range = typeof searchParams.range === 'string' ? searchParams.range : 'THIS_MONTH';

  const { dateFrom, dateTo } = getDateRange(range);
  
  const dashboardData = await DashboardService.getDashboardData({
    dateFrom,
    dateTo,
    userId: user.id,
    role: user.role.name === 'Super Admin' ? 'SUPER_ADMIN' : user.role.name.toUpperCase()
  });

  const greeting = getGreeting();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
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

      {/* Hydrate the React client component with data */}
      <DashboardClient data={JSON.parse(JSON.stringify(dashboardData))} role={user.role.name === 'Super Admin' ? 'SUPER_ADMIN' : user.role.name.toUpperCase()} />
    </div>
  );
}
