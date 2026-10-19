import { RoleService } from '@/server/services/RoleService';
import { createRoleAction } from '../actions';
import Link from 'next/link';

export default async function NewRolePage() {
  const allPermissions = await RoleService.listAllPermissions();
  const groupedPermissions = allPermissions.reduce((acc, curr) => {
    if (!acc[curr.module]) acc[curr.module] = [];
    acc[curr.module].push(curr);
    return acc;
  }, {} as Record<string, typeof allPermissions>);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Create Role</h1>
      <form action={createRoleAction} className="space-y-8">
        <div className="max-w-xl space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Role Name</label>
            <input name="name" required className="w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Description</label>
            <textarea name="description" className="w-full border border-gray-300 rounded p-2"></textarea>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Permissions Matrix</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(groupedPermissions).map(([module, perms]) => (
              <div key={module} className="border rounded p-4 bg-white shadow-sm">
                <h3 className="font-bold text-lg mb-2 uppercase border-b pb-2">{module}</h3>
                <div className="space-y-2">
                  {perms.map(p => (
                    <label key={p.id} className="flex items-center space-x-2">
                      <input type="checkbox" name="permissionKeys" value={p.key} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-medium">{p.action}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Role</button>
          <Link href="/dashboard/roles" className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
