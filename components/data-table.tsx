'use client';

import * as React from 'react';
import { m } from 'framer-motion';
import { staggerItem, MAX_STAGGER_ROWS } from '@/lib/motion';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Settings2, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  globalFilter?: string;
  onGlobalFilterChange?: (filter: string) => void;
  isLoading?: boolean;
  onExport?: () => void;
  searchPlaceholder?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount = 1,
  pagination = { pageIndex: 0, pageSize: 100 },
  onPaginationChange = () => {},
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  globalFilter,
  onGlobalFilterChange,
  isLoading = false,
  onExport,
  searchPlaceholder = 'Search...',
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        onPaginationChange(updater(pagination));
      } else {
        onPaginationChange(updater);
      }
    },
    onSortingChange: (updater) => {
      if (onSortingChange && sorting) {
        if (typeof updater === 'function') {
          onSortingChange(updater(sorting));
        } else {
          onSortingChange(updater);
        }
      }
    },
    onColumnFiltersChange: (updater) => {
      if (onColumnFiltersChange && columnFilters) {
        if (typeof updater === 'function') {
          onColumnFiltersChange(updater(columnFilters));
        } else {
          onColumnFiltersChange(updater);
        }
      }
    },
    onGlobalFilterChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {onGlobalFilterChange && (
            <div className="relative">
              <input
                type="search"
                placeholder={searchPlaceholder}
                value={globalFilter ?? ''}
                onChange={(event) => onGlobalFilterChange(event.target.value)}
                className="h-9 w-64 pl-3 pr-3 text-sm rounded-lg border transition-all duration-150 focus:outline-none focus:ring-2 bg-surface-blue focus:bg-white"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                aria-label="Search table"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="ml-auto" />}>
              <Settings2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Export
            </Button>
          )}
        </div>
      </div>
      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'var(--border)' }}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b"
                style={{ background: 'var(--surface-blue)', borderColor: 'var(--border)' }}
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.min(pagination.pageSize, 8) }).map((_, index) => (
                <TableRow key={index} style={{ background: index % 2 === 0 ? 'white' : 'var(--surface-blue)/30' }}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <div className="skeleton h-4 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, rowIndex) => {
                const shouldAnimate = rowIndex < MAX_STAGGER_ROWS;
                const RowWrapper = shouldAnimate ? m.tr : 'tr';
                const animProps = shouldAnimate ? {
                  variants: staggerItem,
                  initial: 'hidden',
                  animate: 'visible',
                  custom: rowIndex,
                } : {};
                return (
                  <RowWrapper
                    key={row.id}
                    {...animProps}
                    data-state={row.getIsSelected() && 'selected'}
                    className="border-b transition-colors duration-100 hover:bg-surface-blue/60 cursor-default"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </RowWrapper>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="text-xs text-muted-foreground">
          {isLoading ? (
            <div className="skeleton h-4 w-32 rounded" />
          ) : (
            <>
              Showing{' '}
              <span className="font-medium text-foreground">
                {pageCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1}
              </span>{' '}
              –{' '}
              <span className="font-medium text-foreground">
                {pageCount === 0
                  ? 0
                  : Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.length > 0 ? (pagination.pageIndex * pagination.pageSize) + data.length : 0)}
              </span>{' '}
              of <span className="font-medium text-foreground">{pageCount * pagination.pageSize}</span> results
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage() || isLoading}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isLoading}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <span className="text-xs font-medium px-2 text-foreground">
            Page {pagination.pageIndex + 1} of {Math.max(1, pageCount)}
          </span>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
            aria-label="Go to next page"
          >
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage() || isLoading}
            aria-label="Go to last page"
          >
            <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
