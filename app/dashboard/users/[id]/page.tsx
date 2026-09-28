import { prisma } from '@/lib/prisma';
import { updateUserAction, toggleUserStatusAction } from '../actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  const roles = await prisma.role.findMany();
  const updateAction = updateUserAction.bind(null, id);
  const toggleAction = toggleUserStatusAction.bind(null, id, user.status);

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Edit User</h1>
      <form action={updateAction} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Name</label>
          <input name="name" defaultValue={user.name} required className="w-full border border-gray-300 rounded p-2" />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Email</label>
          <input type="email" name="email" defaultValue={user.email} required className="w-full border border-gray-300 rounded p-2" />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Role</label>
          <select name="roleId" defaultValue={user.roleId} required className="w-full border border-gray-300 rounded p-2">
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="flex gap-4 pt-4">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Update</button>
          <Link href="/dashboard/users" className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</Link>
        </div>
      </form>

      <hr className="my-8" />
      
      <h2 className="text-xl font-bold mb-4 text-gray-800">Reset Password</h2>
      <form action={async (formData) => {
        'use server';
        const { resetPasswordAction } = await import('../actions');
        await resetPasswordAction(id, formData);
      }} className="space-y-4 mb-8">
        <div>
          <label className="block mb-1 text-sm font-medium">New Password</label>
          <input type="password" name="password" required className="w-full border border-gray-300 rounded p-2" />
        </div>
        <button type="submit" className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">Reset Password</button>
      </form>

      <hr className="my-8" />
      
      <h2 className="text-xl font-bold mb-4 text-gray-800">Danger Zone</h2>
      <form action={toggleAction}>
        <button 
          type="submit" 
          className={`px-4 py-2 text-white rounded font-medium ${user.status === 'ACTIVE' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {user.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
        </button>
      </form>
    </div>
  );
}
