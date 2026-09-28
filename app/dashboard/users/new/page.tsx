import { prisma } from '@/lib/prisma';
import { createUserAction } from '../actions';
import Link from 'next/link';

export default async function NewUserPage() {
  const roles = await prisma.role.findMany();

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Create User</h1>
      <form action={createUserAction} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Name</label>
          <input name="name" required className="w-full border border-gray-300 rounded p-2" />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Email</label>
          <input type="email" name="email" required className="w-full border border-gray-300 rounded p-2" />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Password</label>
          <input type="password" name="password" required className="w-full border border-gray-300 rounded p-2" />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Role</label>
          <select name="roleId" required className="w-full border border-gray-300 rounded p-2">
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="flex gap-4 pt-4">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
          <Link href="/dashboard/users" className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
