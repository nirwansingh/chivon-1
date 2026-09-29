'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { FileEdit, Download, ArrowLeft, Send, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatAED, amountInWordsAED } from '@/lib/money';
import { useRouter } from 'next/navigation';
import { SalesOrderDetails } from '@/lib/sales-order-service';
import { updateSalesOrderStatusAction, cancelSalesOrderAction, reopenSalesOrderAction } from '@/app/dashboard/sales-orders/actions';

export function SalesOrderView({ initialSalesOrder }: { initialSalesOrder: SalesOrderDetails }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handleAction = (action: () => Promise<{ success: boolean; error?: string, data?: any }>, successMessage: string) => {
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        toast.success(successMessage);
      } else {
        toast.error(res.error || 'Action failed');
      }
    });
  };

  const isEditable = initialSalesOrder.status === 'DRAFT' || initialSalesOrder.status === 'CONFIRMED';
  const canCancel = initialSalesOrder.status !== 'CANCELLED' && initialSalesOrder.status !== 'FULFILLED';

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/dashboard/sales-orders" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Sales Orders
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {initialSalesOrder.number}
            <Badge variant="outline" className="text-sm">
              {initialSalesOrder.status}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Customer: <span className="font-medium text-foreground">{initialSalesOrder.customer?.companyName}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" render={<a href={`/api/pdf/sales-orders/${initialSalesOrder.id}`} target="_blank" rel="noopener noreferrer" />}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>

          {initialSalesOrder.status === 'CONFIRMED' && (
            <Link href={`/dashboard/invoices/new?salesOrderId=${initialSalesOrder.id}`}>
              <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <FileEdit className="w-4 h-4 mr-2" />
                Generate Invoice
              </Button>
            </Link>
          )}

          {isEditable && (
            <Link href={`/dashboard/sales-orders/${initialSalesOrder.id}/edit`}>
              <Button variant="default" size="sm" disabled={isPending}>
                <FileEdit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}

          {initialSalesOrder.status === 'DRAFT' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleAction(() => updateSalesOrderStatusAction(initialSalesOrder.id, 'CONFIRMED'), 'Order Confirmed')}
              disabled={isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Confirm Order
            </Button>
          )}

          {canCancel && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => {
                if(confirm('Are you sure you want to cancel this order?')) {
                  handleAction(() => cancelSalesOrderAction(initialSalesOrder.id, 'User cancelled'), 'Order Cancelled');
                }
              }}
              disabled={isPending}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Order
            </Button>
          )}

          {initialSalesOrder.status === 'CANCELLED' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if(confirm('Are you sure you want to reopen this cancelled order?')) {
                  handleAction(() => reopenSalesOrderAction(initialSalesOrder.id), 'Order Reopened');
                }
              }}
              disabled={isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Reopen Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium p-4">Item</th>
                      <th className="text-right font-medium p-4">Unit</th>
                      <th className="text-right font-medium p-4" title="Ordered Quantity">Ord Qty</th>
                      <th className="text-right font-medium p-4" title="Fulfilled Quantity">Flf Qty</th>
                      <th className="text-right font-medium p-4" title="Invoiced Quantity">Inv Qty</th>
                      <th className="text-right font-medium p-4" title="Remaining Quantity">Rem Qty</th>
                      <th className="text-right font-medium p-4">Rate (AED)</th>
                      <th className="text-right font-medium p-4">Discount (AED)</th>
                      <th className="text-right font-medium p-4">VAT (AED)</th>
                      <th className="text-right font-medium p-4">Total (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {initialSalesOrder.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-foreground">{item.product?.name || 'Custom Item'}</div>
                          <div className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{item.description}</div>
                        </td>
                        <td className="p-4 text-right text-muted-foreground">{item.unit}</td>
                        <td className="p-4 text-right">{Number(item.orderedQty)}</td>
                        <td className="p-4 text-right text-muted-foreground">{item.fulfilledQty ? Number(item.fulfilledQty) : 0}</td>
                        <td className="p-4 text-right text-muted-foreground">{item.invoicedQty ? Number(item.invoicedQty) : 0}</td>
                        <td className="p-4 text-right font-medium">{item.remainingQty ? Number(item.remainingQty) : Number(item.orderedQty)}</td>
                        <td className="p-4 text-right">{formatAED(Number(item.rate))}</td>
                        <td className="p-4 text-right text-muted-foreground">
                          {Number(item.discountAmount) > 0 ? formatAED(Number(item.discountAmount)) : '-'}
                        </td>
                        <td className="p-4 text-right text-muted-foreground">
                          {Number(item.vatAmount) > 0 ? `${formatAED(Number(item.vatAmount))} (${item.vatRate}%)` : '-'}
                        </td>
                        <td className="p-4 text-right font-medium">{formatAED(Number(item.lineTotal))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {(initialSalesOrder.notes || initialSalesOrder.terms) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {initialSalesOrder.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{initialSalesOrder.notes}</p>
                  </CardContent>
                </Card>
              )}
              {initialSalesOrder.terms && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Terms & Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{initialSalesOrder.terms}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatAED(Number(initialSalesOrder.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-red-500">-{formatAED(Number(initialSalesOrder.discountAmount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxable Amount</span>
                <span>{formatAED(Number(initialSalesOrder.taxableAmount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT</span>
                <span>{formatAED(Number(initialSalesOrder.vatAmount))}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-4">
                <span>Total</span>
                <span>{formatAED(Number(initialSalesOrder.grandTotal))}</span>
              </div>
              
              <div className="text-xs text-muted-foreground text-right mt-2 italic">
                {amountInWordsAED(Number(initialSalesOrder.grandTotal))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs uppercase font-medium">Created On</span>
                <span>{format(new Date(initialSalesOrder.createdAt), 'PPP')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs uppercase font-medium">Created By</span>
                <span>{initialSalesOrder.createdBy?.name || 'Unknown'}</span>
              </div>
              {initialSalesOrder.quotationId && (
                <div className="flex flex-col mt-4 pt-4 border-t border-dashed">
                  <span className="text-muted-foreground text-xs uppercase font-medium mb-1">Source Quotation</span>
                  <Link href={`/dashboard/quotations/${initialSalesOrder.quotationId}`} className="text-primary hover:underline font-medium">
                    View Original Quotation
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
