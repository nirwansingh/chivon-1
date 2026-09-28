import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { logout } from '@/app/login/actions';
import Link from 'next/link';

const NAV_GROUPS = [
  {
    label: 'Administration',
    links: [
      { href: '/dashboard/users', label: 'Users' },
      { href: '/dashboard/roles', label: 'Roles & Permissions' },
    ],
  },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Welcome, <strong>{user.name}</strong> &mdash; {user.role?.name}
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            id="logout-btn"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
          >
            Logout
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {group.label}
            </h2>
            <ul className="space-y-2">
              {group.links.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block px-3 py-2 rounded text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                    id={`nav-${link.label.toLowerCase().replace(/[^a-z]/g, '-')}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
