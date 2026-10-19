'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { MoneyDisplay } from '@/components/money-display';
import { StatusBadge } from '@/components/status-badge';
import { DateDisplay } from '@/components/date-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, FileText, ShoppingCart, Receipt, CreditCard, Banknote, Clock, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface DashboardClientProps {
  data: {
    kpis: {
      totalCustomers: number;
      activeOpportunities: number;
      quotationValue: number;
      salesOrderValue: number;
      invoiceValue: number;
      collectedValue: number;
      outstandingValue: number;
      overdueValue: number;
    };
    tables: {
      recentQuotations: any[];
      recentInvoices: any[];
      recentPayments: any[];
      upcomingTasks: any[];
    };
    charts: {
      revenueChart: any[];
      pipelineChart: any[];
    };
  };
  role: string;
}

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function DashboardClient({ data, role }: DashboardClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentRange = searchParams.get('range') || 'THIS_MONTH';

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', e.target.value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const { kpis, tables, charts } = data;

  const showFinancials = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTS'].includes(role);
  const showSales = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES'].includes(role);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Overview</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Period:</label>
          <select 
            value={currentRange}
            onChange={handleRangeChange}
            className="text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="THIS_QUARTER">This Quarter</option>
            <option value="THIS_YEAR">This Financial Year</option>
            <option value="ALL_TIME">All Time</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Customers" value={kpis.totalCustomers.toString()} icon={Users} color="text-blue-500" />
        {showSales && (
          <>
            <KPICard title="Active Opportunities" value={kpis.activeOpportunities.toString()} icon={Target} color="text-indigo-500" />
            <KPICard title="Quoted Value" amount={kpis.quotationValue} icon={FileText} color="text-sky-500" />
            <KPICard title="Sales Orders" amount={kpis.salesOrderValue} icon={ShoppingCart} color="text-emerald-500" />
          </>
        )}
        {showFinancials && (
          <>
            <KPICard title="Invoiced" amount={kpis.invoiceValue} icon={Receipt} color="text-amber-500" />
            <KPICard title="Collected" amount={kpis.collectedValue} icon={CreditCard} color="text-green-600" />
            <KPICard title="Outstanding" amount={kpis.outstandingValue} icon={Banknote} color="text-orange-500" />
            <KPICard title="Overdue" amount={kpis.overdueValue} icon={Clock} color="text-red-500" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {showFinancials && charts.revenueChart.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Revenue Over Time (Invoiced)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => [`AED ${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="amount" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        
        {showSales && charts.pipelineChart.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Opportunity Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.pipelineChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="status"
                    label={(props: any) => `${props.name || props.status} (${props.value || props.count})`}
                  >
                    {charts.pipelineChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any, name: any, props: any) => [`${value} Opps (AED ${Number(props.payload.value).toLocaleString()})`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {showSales && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recent Quotations</CardTitle>
              <Link href="/dashboard/quotations" className="text-xs text-primary hover:underline flex items-center">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {tables.recentQuotations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No recent quotations.</p>
              ) : (
                <div className="space-y-4">
                  {tables.recentQuotations.map(q => (
                    <div key={q.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div>
                        <Link href={`/dashboard/quotations/${q.id}`} className="text-sm font-medium hover:underline">{q.number}</Link>
                        <p className="text-xs text-muted-foreground">{q.customer.companyName}</p>
                      </div>
                      <div className="text-right">
                        <MoneyDisplay amount={q.grandTotal} className="text-sm font-semibold" />
                        <div className="mt-1"><StatusBadge status={q.status} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {showFinancials && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
              <Link href="/dashboard/invoices" className="text-xs text-primary hover:underline flex items-center">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {tables.recentInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No recent invoices.</p>
              ) : (
                <div className="space-y-4">
                  {tables.recentInvoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div>
                        <Link href={`/dashboard/invoices/${inv.id}`} className="text-sm font-medium hover:underline">{inv.number}</Link>
                        <p className="text-xs text-muted-foreground">{inv.customer.companyName}</p>
                      </div>
                      <div className="text-right">
                        <MoneyDisplay amount={inv.grandTotal} className="text-sm font-semibold" />
                        <div className="mt-1"><StatusBadge status={inv.status} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Tasks & Follow-ups</CardTitle>
            <Link href="/dashboard/tasks" className="text-xs text-primary hover:underline flex items-center">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {tables.upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming tasks.</p>
            ) : (
              <div className="space-y-4">
                {tables.upcomingTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">Due: <DateDisplay date={task.dueDate} /></p>
                    </div>
                    <div>
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ title, value, amount, icon: Icon, color }: { title: string; value?: string; amount?: number; icon: any; color: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {amount !== undefined ? (
          <MoneyDisplay amount={amount} className="text-2xl font-bold" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
