import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { logout } from '@/app/login/actions';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-4">Welcome, {user.name} ({user.role?.name})!</p>
      
      <form action={logout} className="mt-8">
        <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">Logout</button>
      </form>
    </div>
  );
}
