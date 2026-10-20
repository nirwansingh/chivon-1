'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';
import { allocatePaymentAction, reversePaymentAction } from '@/app/dashboard/payments/actions';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface PaymentDetailViewProps {
  payment: any; // Include customer and allocations
  outstandingInvoices: any[]; // Invoices for this customer that have outstanding balance
}

export function PaymentDetailView({ payment, outstandingInvoices }: PaymentDetailViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allocations, setAllocations] = useState<{ [invoiceId: string]: number }>({});
  
  const allocatedAmount = payment.allocations.reduce((sum: number, a: any) => sum + (a.isReversed ? 0 : Number(a.amount)), 0);
  const unallocatedAmount = Number(payment.amount) - allocatedAmount;
  
  const currentDraftTotal = Object.values(allocations).reduce((sum, val) => sum + (val || 0), 0);

  const handleAllocate = async () => {
    const toAllocate = Object.entries(allocations)
      .map(([invoiceId, amount]) => ({ invoiceId, amount: Number(amount) }))
      .filter(a => a.amount > 0);
      
    if (toAllocate.length === 0) {
      toast.error('Enter allocation amounts first');
      return;
    }
    
    if (currentDraftTotal > unallocatedAmount) {
      toast.error('Total allocations exceed unallocated amount');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await allocatePaymentAction(payment.id, toAllocate);
      toast.success('Payment allocated successfully');
      setAllocations({});
    } catch (err: any) {
      toast.error(err.message || 'Failed to allocate payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReverse = async () => {
    if (!confirm('Are you sure you want to reverse this payment? This will also reverse all its allocations.')) {
      return;
    }
    const reason = prompt('Please provide a reason for reversal:');
    if (!reason) return;
    
    setIsSubmitting(true);
    try {
      await reversePaymentAction(payment.id, reason);
      toast.success('Payment reversed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reverse payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{payment.number}</h1>
          <p className="text-muted-foreground">{payment.customer.companyName}</p>
        </div>
        <div className="flex gap-2 items-center">
          <StatusBadge status={payment.isReversed ? 'CANCELLED' : payment.status} />
          {!payment.isReversed && (
            <Button variant="destructive" onClick={handleReverse} disabled={isSubmitting}>
              Reverse Payment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">{formatCurrency(Number(payment.amount))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{formatDate(payment.paymentDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method:</span>
              <span>{payment.paymentMethod}</span>
            </div>
            {payment.referenceNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference:</span>
                <span>{payment.referenceNumber}</span>
              </div>
            )}
            {payment.bank && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank:</span>
                <span>{payment.bank}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Allocation Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-medium">{formatCurrency(Number(payment.amount))}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Allocated:</span>
              <span>{formatCurrency(allocatedAmount)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Unallocated:</span>
              <span>{formatCurrency(unallocatedAmount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {!payment.isReversed && unallocatedAmount > 0 && outstandingInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Allocate to Outstanding Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right w-48">Amount to Allocate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.number}</TableCell>
                    <TableCell>{formatDate(inv.createdAt)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(inv.grandTotal))}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(inv.outstanding)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max={Math.min(unallocatedAmount, inv.outstanding)}
                        step="0.01"
                        value={allocations[inv.id] || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setAllocations(prev => ({ ...prev, [inv.id]: isNaN(val) ? 0 : val }));
                        }}
                        className="text-right"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm">
                Total to Allocate: <span className="font-bold">{formatCurrency(currentDraftTotal)}</span>
                {currentDraftTotal > unallocatedAmount && (
                  <span className="text-red-500 ml-2">Exceeds unallocated amount!</span>
                )}
              </div>
              <Button onClick={handleAllocate} disabled={isSubmitting || currentDraftTotal <= 0 || currentDraftTotal > unallocatedAmount}>
                {isSubmitting ? 'Allocating...' : 'Allocate Funds'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {payment.allocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Allocation History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Date Allocated</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payment.allocations.map((a: any) => (
                  <TableRow key={a.id} className={a.isReversed ? "opacity-50 line-through" : ""}>
                    <TableCell>{a.invoice.number}</TableCell>
                    <TableCell>{formatDate(a.createdAt)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(a.amount))}</TableCell>
                    <TableCell>
                      {a.isReversed ? <Badge variant="destructive">Reversed</Badge> : <Badge variant="default">Active</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
