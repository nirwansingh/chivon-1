import { prisma } from '@/lib/prisma';
import { quickLogin } from './actions';

export async function QuickLogin() {
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    include: { role: true }
  });

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <h3 className="text-sm font-medium text-gray-700 text-center mb-4">DEV MODE: Quick Login</h3>
      <div className="grid grid-cols-2 gap-2">
        {users.map(user => (
          <form key={user.id} action={quickLogin.bind(null, user.id)}>
            <button 
              type="submit" 
              className="w-full text-xs py-2 px-3 border border-blue-300 rounded text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              {user.role.name}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
