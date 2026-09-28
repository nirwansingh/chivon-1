import { UserService } from '@/server/services/UserService';
import Link from 'next/link';

export default async function UsersPage() {
  const users = await UserService.listUsers();

  return (
    <div className="p-8">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <Link href="/dashboard/users/new" className="px-4 py-2 bg-blue-600 text-white rounded">Add User</Link>
      </div>
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="text-left">
            <th className="px-4 py-2 border-b">Name</th>
            <th className="px-4 py-2 border-b">Email</th>
            <th className="px-4 py-2 border-b">Role</th>
            <th className="px-4 py-2 border-b">Status</th>
            <th className="px-4 py-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td className="px-4 py-2 border-b">{u.name}</td>
              <td className="px-4 py-2 border-b">{u.email}</td>
              <td className="px-4 py-2 border-b">{u.role.name}</td>
              <td className="px-4 py-2 border-b">
                <span className={`px-2 py-1 rounded text-xs text-white ${u.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}>
                  {u.status}
                </span>
              </td>
              <td className="px-4 py-2 border-b space-x-4">
                <Link href={`/dashboard/users/${u.id}`} className="text-blue-600 hover:underline">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
