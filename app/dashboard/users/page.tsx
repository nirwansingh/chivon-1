import { UserService } from '@/server/services/UserService';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';

export default async function UsersPage() {
  const users = await UserService.listUsers();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Users"
        description="Manage system users and access."
        action={
          <Button render={<Link href="/dashboard/users/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        }
      />
      <Card className="shadow-sm border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-blue/50 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-primary">{u.name}</td>
                    <td className="px-6 py-4 text-foreground">{u.email}</td>
                    <td className="px-6 py-4 text-foreground">{u.role.name}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" render={<Link href={`/dashboard/users/${u.id}`} />}>
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
