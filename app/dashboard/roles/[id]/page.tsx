import { RoleService } from '@/server/services/RoleService';
import { updateRoleAction } from '../actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const roleWithPerms = await prisma.role.findUnique({
    where: { id },
    include: { permissions: { include: { permission: true } } }
  });
  if (!roleWithPerms) notFound();

  const isSuperAdmin = roleWithPerms.isSystem && roleWithPerms.name === 'Super Admin';
  const currentKeys = new Set(roleWithPerms.permissions.map(rp => rp.permission.key));

  const allPermissions = await RoleService.listAllPermissions();
  const groupedPermissions = allPermissions.reduce((acc, curr) => {
    if (!acc[curr.module]) acc[curr.module] = [];
    acc[curr.module].push(curr);
    return acc;
  }, {} as Record<string, typeof allPermissions>);

  const updateAction = updateRoleAction.bind(null, id);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Edit Role {isSuperAdmin && <span className="text-sm font-normal text-red-600 ml-2">(Super Admin cannot be modified)</span>}</h1>
      <form action={updateAction} className="space-y-8">
        <div className="max-w-xl space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Role Name</label>
            <input name="name" defaultValue={roleWithPerms.name} disabled={roleWithPerms.isSystem} required className="w-full border border-gray-300 rounded p-2 disabled:bg-gray-100" />
            {roleWithPerms.isSystem && <input type="hidden" name="name" value={roleWithPerms.name} />}
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Description</label>
            <textarea name="description" defaultValue={roleWithPerms.description || ''} disabled={isSuperAdmin} className="w-full border border-gray-300 rounded p-2 disabled:bg-gray-100"></textarea>
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
                      <input 
                        type="checkbox" 
                        name="permissionKeys" 
                        value={p.key} 
                        defaultChecked={currentKeys.has(p.key)}
                        disabled={isSuperAdmin}
                        className="rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50" 
                      />
                      <span className="text-sm font-medium">{p.action}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isSuperAdmin && (
          <div className="flex gap-4 pt-4 border-t">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Update Role</button>
            <Link href="/dashboard/roles" className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</Link>
          </div>
        )}
      </form>
    </div>
  );
}
