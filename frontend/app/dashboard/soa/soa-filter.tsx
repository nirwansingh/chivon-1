'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerSelector } from '@/components/customer-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SOAFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customerId, setCustomerId] = React.useState(searchParams.get('customerId') || '');
  const [fromDate, setFromDate] = React.useState(searchParams.get('fromDate') || getDefaultFromDate());
  const [toDate, setToDate] = React.useState(searchParams.get('toDate') || getDefaultToDate());

  function getDefaultFromDate() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  }

  function getDefaultToDate() {
    return new Date().toISOString().split('T')[0];
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return;

    const params = new URLSearchParams();
    params.set('customerId', customerId);
    params.set('fromDate', fromDate);
    params.set('toDate', toDate);

    router.push(`/dashboard/soa?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end bg-card border p-4 rounded-lg shadow-sm">
      <div className="flex-1 w-full space-y-2">
        <Label>Customer</Label>
        <CustomerSelector value={customerId} onChange={setCustomerId} />
      </div>
      <div className="w-full md:w-48 space-y-2">
        <Label>From Date</Label>
        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
      </div>
      <div className="w-full md:w-48 space-y-2">
        <Label>To Date</Label>
        <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
      </div>
      <Button type="submit" disabled={!customerId}>Generate SOA</Button>
    </form>
  );
}
