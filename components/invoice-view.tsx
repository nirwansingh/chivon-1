'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, Download, Ban, ArrowLeft, Send } from 'lucide-react';
import { InvoiceDetails } from '@/lib/invoice-service';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cancelInvoiceAction, updateInvoiceStatusAction } from '@/app/dashboard/invoices/actions';
import { CreditNoteDialog } from './credit-note-dialog';

export function InvoiceView({ invoice }: { invoice: any }) {
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    const reason = prompt('Reason for cancellation:');
    if (!reason) return;

    setIsCancelling(true);
    try {
      await cancelInvoiceAction(invoice.id, reason);
      toast.success('Invoice cancelled successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to cancel invoice');
    } finally {
      setIsCancelling(false);
    }
  };

  const [isPending, startTransition] = useTransition();

  const handleStatusUpdate = (status: 'ISSUED' | 'PAID', message: string) => {
    startTransition(async () => {
      try {
        const res = await updateInvoiceStatusAction(invoice.id, status);
        if (res.success) toast.success(message);
      } catch (e: any) {
        toast.error(e.message || 'Action failed');
      }
    });
  };

  const isDraft = invoice.status === 'DRAFT';
  const isIssued = invoice.status === 'ISSUED';
  
  const cnTotal = invoice.creditNotes?.reduce((sum: number, cn: any) => sum + Number(cn.grandTotal), 0) || 0;
  const outstanding = Number(invoice.grandTotal) - cnTotal;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoice {invoice.number}</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <span>Customer: <Link href={`/dashboard/customers/${invoice.customerId}`} className="hover:underline text-primary">{invoice.customer.name}</Link></span>
            <span>•</span>
            <span>Date: {formatDate(invoice.date)}</span>
            {invoice.dueDate && (
              <>
                <span>•</span>
                <span>Due: {formatDate(invoice.dueDate)}</span>
              </>
            )}
            <span>•</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
              invoice.status === 'PAID' ? 'bg-green-100 text-green-800 border-green-200' :
              invoice.status === 'DRAFT' ? 'bg-gray-100 text-gray-800 border-gray-200' :
              invoice.status === 'ISSUED' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              'bg-red-100 text-red-800 border-red-200'
            }`}>
              {invoice.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {isDraft && (
            <Button 
              variant="default" 
              onClick={() => handleStatusUpdate('ISSUED', 'Invoice marked as issued')}
              disabled={isPending}
            >
              <Send className="mr-2 h-4 w-4" /> Issue Invoice
            </Button>
          )}
          {invoice.status !== 'CANCELLED' && (
            <Button variant="outline" asChild>
              <Link href={`/api/pdf/invoices/${invoice.id}`} target="_blank">
                <Download className="mr-2 h-4 w-4" /> PDF
              </Link>
            </Button>
          )}
          {isIssued && outstanding > 0 && (
            <CreditNoteDialog invoiceId={invoice.id} maxAmount={outstanding} />
          )}
          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <Button variant="destructive" onClick={handleCancel} disabled={isCancelling || isPending}>
              <Ban className="mr-2 h-4 w-4" /> Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Billing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground font-medium">Customer</div>
              <div>{invoice.customer.name}</div>
              <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{invoice.customer.address}</div>
            </div>
            
            {(invoice.salesOrder || invoice.quotation) && (
              <div>
                <div className="text-sm text-muted-foreground font-medium">Source Document</div>
                {invoice.salesOrder ? (
                  <Link href={`/dashboard/sales-orders/${invoice.salesOrderId}`} className="hover:underline text-primary">
                    {invoice.salesOrder.number}
                  </Link>
                ) : (
                  <Link href={`/dashboard/quotations/${invoice.quotationId}`} className="hover:underline text-primary">
                    {invoice.quotation.number}
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Terms & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground font-medium">Payment Terms</div>
              <div>{invoice.paymentTerms || 'N/A'}</div>
            </div>
            {invoice.notes && (
              <div>
                <div className="text-sm text-muted-foreground font-medium">Notes</div>
                <div className="whitespace-pre-wrap text-sm">{invoice.notes}</div>
              </div>
            )}
            {invoice.status === 'CANCELLED' && invoice.cancelledBy && (
              <div>
                <div className="text-sm text-red-500 font-medium">Cancellation</div>
                <div className="text-sm text-red-500">Cancelled by User ID: {invoice.cancelledBy}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-2 font-medium">Product / Description</th>
                  <th className="px-4 py-2 font-medium text-right">Quantity</th>
                  <th className="px-4 py-2 font-medium">Unit</th>
                  <th className="px-4 py-2 font-medium text-right">Rate</th>
                  <th className="px-4 py-2 font-medium text-right">Discount</th>
                  <th className="px-4 py-2 font-medium text-right">Subtotal</th>
                  <th className="px-4 py-2 font-medium text-right">VAT</th>
                  <th className="px-4 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {item.product?.name || item.description}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{Number(item.quantity).toFixed(2)}</td>
                    <td className="px-4 py-3">{item.unit}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(Number(item.rate))}</td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {Number(item.discountAmount) > 0 ? `-${formatCurrency(Number(item.discountAmount))}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(Number(item.lineSubtotal))}</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(Number(item.vatAmount))} <span className="text-xs text-muted-foreground">({Number(item.vatRate)}%)</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(item.lineTotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(Number(invoice.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount:</span>
                <span className="text-red-600">-{formatCurrency(Number(invoice.discountAmount))}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Taxable Amount:</span>
                <span>{formatCurrency(Number(invoice.taxableAmount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT:</span>
                <span>{formatCurrency(Number(invoice.vatAmount))}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Grand Total:</span>
                <span>{formatCurrency(Number(invoice.grandTotal))}</span>
              </div>
              {cnTotal > 0 && (
                <div className="flex justify-between text-sm font-bold text-red-600">
                  <span>Credit Notes:</span>
                  <span>-{formatCurrency(cnTotal)}</span>
                </div>
              )}
              {cnTotal > 0 && (
                <div className="flex justify-between text-lg font-bold border-t pt-3 text-blue-700">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(outstanding)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {invoice.creditNotes?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Credit Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-2 font-medium">Number</th>
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Notes</th>
                    <th className="px-4 py-2 font-medium text-right">Amount</th>
                    <th className="px-4 py-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.creditNotes.map((cn: any) => (
                    <tr key={cn.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{cn.number}</td>
                      <td className="px-4 py-3">{formatDate(cn.date)}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{cn.notes || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">
                        {formatCurrency(Number(cn.grandTotal))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/api/pdf/credit-notes/${cn.id}`} target="_blank">
                            <Download className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
