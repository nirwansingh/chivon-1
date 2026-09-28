import { RoleService } from '@/server/services/RoleService';
import Link from 'next/link';

export default async function RolesPage() {
  const roles = await RoleService.listRoles();

  return (
    <div className="p-8">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <Link href="/dashboard/roles/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Role</Link>
      </div>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="text-left bg-gray-50 text-gray-700 text-sm">
            <th className="px-4 py-2 border-b font-medium">Role Name</th>
            <th className="px-4 py-2 border-b font-medium">Description</th>
            <th className="px-4 py-2 border-b font-medium">System Role</th>
            <th className="px-4 py-2 border-b font-medium">Permissions</th>
            <th className="px-4 py-2 border-b font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map(r => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 border-b font-medium">{r.name}</td>
              <td className="px-4 py-3 border-b text-gray-600">{r.description}</td>
              <td className="px-4 py-3 border-b">
                {r.isSystem ? <span className="bg-gray-200 text-gray-700 px-2 py-1 text-xs rounded">System</span> : 'No'}
              </td>
              <td className="px-4 py-3 border-b text-sm text-gray-500">{r.permissions.length} permissions</td>
              <td className="px-4 py-3 border-b">
                <Link href={`/dashboard/roles/${r.id}`} className="text-blue-600 hover:underline">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
