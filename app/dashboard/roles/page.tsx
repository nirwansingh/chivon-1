import { RoleService } from '@/server/services/RoleService';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default async function RolesPage() {
  const roles = await RoleService.listRoles();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Roles & Permissions"
        description="Manage role-based access control for the application."
        action={
          <Button render={<Link href="/dashboard/roles/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        }
      />
      <Card className="shadow-sm border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-blue/50 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Role Name</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">System Role</th>
                  <th className="px-6 py-4 font-medium">Permissions</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roles.map(r => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-primary">{r.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{r.description}</td>
                    <td className="px-6 py-4">
                      {r.isSystem ? <span className="bg-primary/10 text-primary px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase rounded-md border border-primary/20">System</span> : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{r.permissions.length} permissions</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" render={<Link href={`/dashboard/roles/${r.id}`} />}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
