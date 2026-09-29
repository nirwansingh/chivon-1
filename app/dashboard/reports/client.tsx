'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FilterBar } from '@/components/filter-bar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, RefreshCw, Table as TableIcon } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { DateDisplay } from '@/components/date-display';
import { MoneyDisplay } from '@/components/money-display';
import { StatusBadge } from '@/components/status-badge';
import { getReportData, exportReport } from './actions';
import { toast } from 'react-toastify';
import { ColumnDef } from '@tanstack/react-table';

interface Option {
  label: string;
  value: string;
}

interface ReportsClientProps {
  customers: Option[];
  users: Option[];
}

const REPORT_TYPES = [
  { id: 'QUOTATION', label: 'Quotations' },
  { id: 'SALES_ORDER', label: 'Sales Orders' },
  { id: 'INVOICE', label: 'Invoices' },
  { id: 'PAYMENT', label: 'Payments' },
  { id: 'RECEIVABLES', label: 'Receivables & Aging' },
  { id: 'PIPELINE', label: 'Opportunity Pipeline' },
  { id: 'PRODUCT', label: 'Products & Inventory' },
];

export function ReportsClient({ customers, users }: ReportsClientProps) {
  const [activeReport, setActiveReport] = React.useState('INVOICE');
  const [isLoading, setIsLoading] = React.useState(false);
  const [data, setData] = React.useState<any[]>([]);
  const [totals, setTotals] = React.useState<any>({});

  // Filters
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [selectedCustomer, setSelectedCustomer] = React.useState('ALL');
  const [selectedUser, setSelectedUser] = React.useState('ALL');
  const [selectedStatus, setSelectedStatus] = React.useState('ALL');

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const filters = {
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        customerId: selectedCustomer !== 'ALL' ? selectedCustomer : undefined,
        userId: selectedUser !== 'ALL' ? selectedUser : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      };

      const res = await getReportData(activeReport, filters);
      if (res.success) {
        setData(res.data.items || []);
        setTotals(res.data.totals || {});
      } else {
        toast.error('Failed to load report data');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error loading report');
    } finally {
      setIsLoading(false);
    }
  }, [activeReport, dateFrom, dateTo, selectedCustomer, selectedUser, selectedStatus]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportCSV = async () => {
    try {
      const filters = {
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        customerId: selectedCustomer !== 'ALL' ? selectedCustomer : undefined,
        userId: selectedUser !== 'ALL' ? selectedUser : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      };

      const res = await exportReport(activeReport, filters, 'CSV');
      if (res.success && res.data?.items) {
        // Basic CSV generation for V1
        const items = res.data.items;
        if (items.length === 0) {
          toast.info('No data to export');
          return;
        }

        // Get headers from first item (excluding complex objects)
        const sample = items[0];
        const headers = Object.keys(sample).filter(k => typeof sample[k] !== 'object' || sample[k] instanceof Date);
        
        let csv = headers.join(',') + '\\n';
        items.forEach((item: any) => {
          csv += headers.map(h => {
            let val = item[h];
            if (val instanceof Date) val = val.toISOString().split('T')[0];
            return `"${String(val ?? '').replace(/"/g, '""')}"`;
          }).join(',') + '\\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeReport.toLowerCase()}-report.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast.success('Report exported successfully');
      }
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    }
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedCustomer('ALL');
    setSelectedUser('ALL');
    setSelectedStatus('ALL');
  };

  const getColumns = (): ColumnDef<any>[] => {
    switch (activeReport) {
      case 'QUOTATION':
      case 'SALES_ORDER':
      case 'INVOICE':
        return [
          { accessorKey: 'number', header: 'Number' },
          { 
            accessorKey: 'date', 
            header: 'Date',
            cell: ({ row }) => <DateDisplay date={row.original.date || row.original.createdAt} />
          },
          { 
            accessorKey: 'customer', 
            header: 'Customer',
            cell: ({ row }) => row.original.customer?.companyName 
          },
          { 
            accessorKey: 'status', 
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.getValue('status')} />
          },
          { 
            accessorKey: 'grandTotal', 
            header: 'Total Value',
            cell: ({ row }) => {
              // Handle quotation revisions
              const val = row.original.revisions ? row.original.revisions[0]?.grandTotal : row.getValue('grandTotal');
              return <MoneyDisplay amount={val || 0} />;
            }
          }
        ];
      case 'PAYMENT':
        return [
          { accessorKey: 'number', header: 'Number' },
          { 
            accessorKey: 'paymentDate', 
            header: 'Date',
            cell: ({ row }) => <DateDisplay date={row.getValue('paymentDate')} />
          },
          { 
            accessorKey: 'customer', 
            header: 'Customer',
            cell: ({ row }) => row.original.customer?.companyName 
          },
          { accessorKey: 'paymentMethod', header: 'Method' },
          { 
            accessorKey: 'status', 
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.getValue('status')} />
          },
          { 
            accessorKey: 'amount', 
            header: 'Amount',
            cell: ({ row }) => <MoneyDisplay amount={row.getValue('amount')} />
          }
        ];
      case 'RECEIVABLES':
        return [
          { accessorKey: 'customerName', header: 'Customer' },
          { 
            accessorKey: 'current', 
            header: 'Current',
            cell: ({ row }) => <MoneyDisplay amount={row.getValue('current')} />
          },
          { 
            accessorKey: 'days30', 
            header: '1-30 Days',
            cell: ({ row }) => <MoneyDisplay amount={row.getValue('days30')} />
          },
          { 
            accessorKey: 'days60', 
            header: '31-60 Days',
            cell: ({ row }) => <MoneyDisplay amount={row.getValue('days60')} />
          },
          { 
            accessorKey: 'days90', 
            header: '61-90 Days',
            cell: ({ row }) => <MoneyDisplay amount={row.getValue('days90')} />
          },
          { 
            accessorKey: 'days120Plus', 
            header: '90+ Days',
            cell: ({ row }) => <MoneyDisplay amount={row.getValue('days120Plus')} />
          },
          { 
            accessorKey: 'totalOutstanding', 
            header: 'Total Outstanding',
            cell: ({ row }) => <MoneyDisplay amount={row.getValue('totalOutstanding')} />
          },
        ];
      case 'PRODUCT':
        return [
          { accessorKey: 'sku', header: 'SKU' },
          { accessorKey: 'name', header: 'Name' },
          { 
            accessorKey: 'category', 
            header: 'Category',
            cell: ({ row }) => row.original.category?.name || '-' 
          },
          { accessorKey: 'stockQuantity', header: 'Stock Qty' },
          { 
            accessorKey: 'rate', 
            header: 'Rate',
            cell: ({ row }) => <MoneyDisplay amount={row.getValue('rate')} />
          }
        ];
      case 'PIPELINE':
        return [
          { accessorKey: 'name', header: 'Opportunity' },
          { 
            accessorKey: 'customer', 
            header: 'Customer',
            cell: ({ row }) => row.original.customer?.companyName 
          },
          { 
            accessorKey: 'status', 
            header: 'Stage',
            cell: ({ row }) => <StatusBadge status={row.getValue('status')} />
          },
          { 
            accessorKey: 'probability', 
            header: 'Prob. %',
            cell: ({ row }) => `${row.getValue('probability') || 0}%` 
          },
          { 
            accessorKey: 'expectedValue', 
            header: 'Value',
            cell: ({ row }) => <MoneyDisplay amount={row.getValue('expectedValue')} />
          }
        ];
      default:
        return [];
    }
  };

  const renderTotals = () => {
    if (Object.keys(totals).length === 0) return null;

    return (
      <div className="flex gap-4 items-center bg-muted p-4 rounded-lg mt-4">
        <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Report Totals:</span>
        {Object.entries(totals).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <span className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="font-bold font-mono"><MoneyDisplay amount={value as number} /></span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Report Generator</CardTitle>
            <CardDescription>Select a report type and apply filters to analyze data.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleExportCSV} disabled={data.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeReport} onValueChange={setActiveReport} className="mb-6">
          <TabsList className="flex flex-wrap h-auto overflow-x-auto justify-start">
            {REPORT_TYPES.map(rt => (
              <TabsTrigger key={rt.id} value={rt.id} className="min-w-fit">
                {rt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border mb-6 space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <TableIcon className="h-4 w-4 text-muted-foreground" />
            Report Filters
          </h3>
          <FilterBar onClearFilters={clearFilters}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">From</span>
              <Input 
                type="date" 
                value={dateFrom} 
                onChange={e => setDateFrom(e.target.value)}
                className="w-[140px] h-9"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">To</span>
              <Input 
                type="date" 
                value={dateTo} 
                onChange={e => setDateTo(e.target.value)}
                className="w-[140px] h-9"
              />
            </div>

            <Select value={selectedCustomer} onValueChange={(v) => setSelectedCustomer(v || 'ALL')}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Customers</SelectItem>
                {customers.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedUser} onValueChange={(v) => setSelectedUser(v || 'ALL')}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Users</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>
        </div>

        <div className="border rounded-lg bg-card">
          <DataTable 
            columns={getColumns()} 
            data={data}
            isLoading={isLoading}
          />
        </div>

        {renderTotals()}
      </CardContent>
    </Card>
  );
}
