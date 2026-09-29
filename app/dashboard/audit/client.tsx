'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { DateDisplay } from '@/components/date-display';
import { Button } from '@/components/ui/button';
import { Eye, FileCode } from 'lucide-react';
import { DiffViewer } from './diff-viewer';
import { FilterBar } from '@/components/filter-bar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface AuditListClientProps {
  initialData: any[];
  initialTotal: number;
  initialPageCount: number;
  users: { id: string; name: string }[];
}

export function AuditListClient({ initialData, initialPageCount, users }: AuditListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 50;
  const search = searchParams.get('search') || '';

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: page - 1,
    pageSize: limit,
  });

  const [globalFilter, setGlobalFilter] = React.useState(search);

  // Filter states
  const [selectedUser, setSelectedUser] = React.useState(searchParams.get('userId') || 'ALL');
  const [selectedModule, setSelectedModule] = React.useState(searchParams.get('module') || 'ALL');
  const [selectedAction, setSelectedAction] = React.useState(searchParams.get('action') || 'ALL');

  const [selectedAuditLog, setSelectedAuditLog] = React.useState<any | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (pagination.pageIndex > 0) {
      params.set('page', (pagination.pageIndex + 1).toString());
    } else {
      params.delete('page');
    }
    
    if (pagination.pageSize !== 50) {
      params.set('limit', pagination.pageSize.toString());
    } else {
      params.delete('limit');
    }

    if (globalFilter) {
      params.set('search', globalFilter);
    } else {
      params.delete('search');
    }

    if (selectedUser !== 'ALL') params.set('userId', selectedUser);
    else params.delete('userId');

    if (selectedModule !== 'ALL') params.set('module', selectedModule);
    else params.delete('module');

    if (selectedAction !== 'ALL') params.set('action', selectedAction);
    else params.delete('action');

    router.replace(`${pathname}?${params.toString()}`);
  }, [pagination, globalFilter, selectedUser, selectedModule, selectedAction, pathname, router, searchParams]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date & Time',
      cell: ({ row }) => <DateDisplay date={row.getValue('createdAt')} formatString="PP pp" />,
    },
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original.user;
        return user ? <span className="font-medium">{user.name}</span> : <span className="text-muted-foreground">System</span>;
      },
    },
    {
      accessorKey: 'module',
      header: 'Module',
      cell: ({ row }) => <span className="font-semibold text-xs tracking-wider uppercase">{row.getValue('module')}</span>,
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const action = row.getValue('action') as string;
        let color = 'text-foreground';
        if (action === 'CREATE') color = 'text-green-600 dark:text-green-400';
        if (action === 'UPDATE' || action === 'EDIT') color = 'text-blue-600 dark:text-blue-400';
        if (action === 'DELETE' || action === 'CANCEL') color = 'text-red-600 dark:text-red-400';
        return <span className={`font-semibold text-xs tracking-wider ${color}`}>{action}</span>;
      },
    },
    {
      accessorKey: 'entityType',
      header: 'Entity Type',
    },
    {
      accessorKey: 'entityId',
      header: 'Entity ID',
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('entityId')}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const log = row.original;
        const hasData = !!log.beforeData || !!log.afterData;
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            disabled={!hasData}
            onClick={() => setSelectedAuditLog(log)}
            title={hasData ? "View Diff" : "No payload"}
          >
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        onClearFilters={() => {
          setSelectedUser('ALL');
          setSelectedModule('ALL');
          setSelectedAction('ALL');
          setGlobalFilter('');
        }}
      >
        <Select value={selectedUser} onValueChange={(val) => setSelectedUser(val || 'ALL')}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Users</SelectItem>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedModule} onValueChange={(val) => setSelectedModule(val || 'ALL')}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Modules</SelectItem>
            <SelectItem value="CUSTOMER">CUSTOMER</SelectItem>
            <SelectItem value="QUOTATION">QUOTATION</SelectItem>
            <SelectItem value="SALES_ORDER">SALES_ORDER</SelectItem>
            <SelectItem value="INVOICE">INVOICE</SelectItem>
            <SelectItem value="PAYMENT">PAYMENT</SelectItem>
            <SelectItem value="USER">USER</SelectItem>
            <SelectItem value="ROLE">ROLE</SelectItem>
            <SelectItem value="SETTING">SETTING</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedAction} onValueChange={(val) => setSelectedAction(val || 'ALL')}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Actions</SelectItem>
            <SelectItem value="CREATE">CREATE</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="APPROVE">APPROVE</SelectItem>
            <SelectItem value="CANCEL">CANCEL</SelectItem>
            <SelectItem value="LOGIN">LOGIN</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={initialData}
        pageCount={initialPageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        searchPlaceholder="Search audit description or entity ID..."
      />

      {selectedAuditLog && (
        <DiffViewer 
          log={selectedAuditLog} 
          onClose={() => setSelectedAuditLog(null)} 
        />
      )}
    </div>
  );
}
