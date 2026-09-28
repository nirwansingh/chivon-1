'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';
import { Product, ProductCategory } from '@prisma/client';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { MoneyDisplay } from '@/components/money-display';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

type ProductWithCategory = Product & { category: ProductCategory | null };

interface ProductListClientProps {
  initialData: ProductWithCategory[];
  initialTotal: number;
  initialPageCount: number;
  categories: ProductCategory[];
}

export function ProductListClient({ initialData, initialPageCount, categories }: ProductListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse URL state
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') || '';

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: page - 1,
    pageSize: limit,
  });

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: searchParams.get('sortBy') || 'createdAt', desc: searchParams.get('sortOrder') !== 'asc' },
  ]);

  const [globalFilter, setGlobalFilter] = React.useState(search);

  // Sync state to URL
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (pagination.pageIndex > 0) {
      params.set('page', (pagination.pageIndex + 1).toString());
    } else {
      params.delete('page');
    }
    
    if (pagination.pageSize !== 10) {
      params.set('limit', pagination.pageSize.toString());
    } else {
      params.delete('limit');
    }

    if (globalFilter) {
      params.set('search', globalFilter);
    } else {
      params.delete('search');
    }

    if (sorting.length > 0) {
      params.set('sortBy', sorting[0].id);
      params.set('sortOrder', sorting[0].desc ? 'desc' : 'asc');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [pagination, globalFilter, sorting, pathname, router, searchParams]);

  const columns: ColumnDef<ProductWithCategory>[] = [
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => row.getValue('sku') || '-',
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link href={`/dashboard/products/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.getValue('name')}
        </Link>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
    },
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => row.original.category?.name || '-',
    },
    {
      accessorKey: 'rate',
      header: 'Rate',
      cell: ({ row }) => <MoneyDisplay amount={Number(row.original.rate)} />,
    },
    {
      accessorKey: 'stockQuantity',
      header: 'Stock',
      cell: ({ row }) => {
        const qty = Number(row.original.stockQuantity);
        const minStock = row.original.minStock ? Number(row.original.minStock) : null;
        const isLow = minStock !== null && qty <= minStock;
        
        return (
          <div className="flex items-center gap-2">
            <span>{qty} {row.original.unit}</span>
            {isLow && <span className="text-xs text-destructive font-medium bg-destructive/10 px-1.5 py-0.5 rounded">Low</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger nativeButton={false} render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href={`/dashboard/products/${product.id}`} />}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href={`/dashboard/products/${product.id}/edit`} />}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Item
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={initialData}
      pageCount={initialPageCount}
      pagination={pagination}
      onPaginationChange={setPagination}
      sorting={sorting}
      onSortingChange={setSorting}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      searchPlaceholder="Search products and services..."
    />
  );
}
