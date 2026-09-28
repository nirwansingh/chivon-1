'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { FileEdit, History, Download, ArrowLeft, Plus, CheckCircle, XCircle, Send, FileText, Settings, FileOutput } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatAED, amountInWordsAED } from '@/lib/money';
import { submitQuotationAction, approveQuotationAction, rejectQuotationAction, markQuotationSentAction, convertQuotationToSOAction } from '@/app/dashboard/quotations/actions';
import { useRouter } from 'next/navigation';

export function QuotationView({ initialQuotation }: { initialQuotation: any }) {
  // Sort revisions descending
  const sortedRevisions = [...initialQuotation.revisions].sort((a, b) => b.revisionNumber - a.revisionNumber);
  
  const currentRevision = sortedRevisions.find(r => r.isCurrent) || sortedRevisions[0];
  
  const [selectedRevisionNumber, setSelectedRevisionNumber] = React.useState(currentRevision.revisionNumber.toString());
  const router = useRouter();

  const activeRevision = sortedRevisions.find(r => r.revisionNumber.toString() === selectedRevisionNumber) || currentRevision;

  const isCurrentViewed = activeRevision.isCurrent;

  const [isPending, startTransition] = React.useTransition();

  const handleAction = (action: () => Promise<{ success: boolean; error?: string, data?: any }>, successMessage: string) => {
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        toast.success(successMessage);
        if (res.data?.id) {
          // If a new entity (like SO) was created, navigate to it
          router.push(`/dashboard/sales-orders/${res.data.id}`);
        }
      } else {
        toast.error(res.error || 'Action failed');
      }
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/dashboard/quotations" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Quotations
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {initialQuotation.number}
            <Badge variant="outline" className="text-sm">
              {initialQuotation.status}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Customer: <span className="font-medium text-foreground">{initialQuotation.customer?.companyName}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-muted-foreground">Revision:</span>
            <Select value={selectedRevisionNumber} onValueChange={setSelectedRevisionNumber}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortedRevisions.map(rev => (
                  <SelectItem key={rev.id} value={rev.revisionNumber.toString()}>
                    {rev.revisionNumber} {rev.isCurrent ? '(Current)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>

          {isCurrentViewed && (
            <>
              {initialQuotation.status === 'DRAFT' && (
                <>
                  <Link href={`/dashboard/quotations/${initialQuotation.id}/revise`}>
                    <Button variant="default" size="sm" disabled={isPending}>
                      <FileEdit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleAction(() => submitQuotationAction(initialQuotation.id), 'Submitted for approval')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit for Approval
                  </Button>
                </>
              )}
              {initialQuotation.status === 'PENDING_APPROVAL' && (
                <>
                  <Button 
                    variant="default" 
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleAction(() => approveQuotationAction(initialQuotation.id), 'Quotation approved')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      const reason = window.prompt("Reason for rejection:");
                      if (reason) {
                        handleAction(() => rejectQuotationAction(initialQuotation.id, reason), 'Quotation rejected');
                      }
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
              {initialQuotation.status === 'APPROVED' && (
                <Button 
                  variant="default" 
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleAction(() => markQuotationSentAction(initialQuotation.id), 'Quotation marked as sent')}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Mark as Sent
                </Button>
              )}
              {(initialQuotation.status === 'APPROVED' || initialQuotation.status === 'SENT') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleAction(() => convertQuotationToSOAction(initialQuotation.id), 'Converted to Sales Order successfully')}
                >
                  <FileOutput className="w-4 h-4 mr-2" />
                  Convert to SO
                </Button>
              )}
              <a href={`/api/pdf/${initialQuotation.id}?revisionId=${activeRevision.id}`} target="_blank" rel="noopener noreferrer">
                <Button 
                  variant="outline" 
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </a>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const url = encodeURIComponent(`${window.location.origin}/api/pdf/${initialQuotation.id}?revisionId=${activeRevision.id}`);
                  const text = encodeURIComponent(`Here is the quotation ${initialQuotation.quotationNumber}: `);
                  window.open(`https://wa.me/?text=${text}${url}`, '_blank');
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                Share
              </Button>
              {initialQuotation.status !== 'DRAFT' && (
                <Link href={`/dashboard/quotations/${initialQuotation.id}/revise`}>
                  <Button variant="secondary" size="sm" disabled={isPending}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Revision
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {!isCurrentViewed && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 p-3 rounded-md text-sm flex items-center gap-2">
          <History className="w-4 h-4" />
          You are viewing an older revision (Rev {activeRevision.revisionNumber}). Only the current revision can be sent or converted.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left font-medium text-muted-foreground">
                    <th className="p-3">Item</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRevision.items.map((item: any) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <div className="font-medium text-foreground">{item.product?.name || item.description}</div>
                        {item.product?.sku && <div className="text-xs text-muted-foreground">{item.product.sku}</div>}
                      </td>
                      <td className="p-3 text-right">
                        {Number(item.quantity)} <span className="text-xs text-muted-foreground">{item.unit}</span>
                      </td>
                      <td className="p-3 text-right">{formatAED(Number(item.rate))}</td>
                      <td className="p-3 text-right font-medium">{formatAED(Number(item.lineTotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{format(new Date(initialQuotation.date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valid Until</span>
                <span className="font-medium">{initialQuotation.validUntil ? format(new Date(initialQuotation.validUntil), 'MMM d, yyyy') : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prepared By</span>
                <span className="font-medium">{initialQuotation.createdBy?.name || 'Unknown'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20">
            <CardContent className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">{formatAED(Number(activeRevision.subtotal))}</span>
                </div>
                
                {Number(activeRevision.discountAmount) > 0 && (
                  <div className="flex justify-between items-center text-destructive">
                    <span>Discount</span>
                    <span>-{formatAED(Number(activeRevision.discountAmount))}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-muted-foreground border-t pt-3">
                  <span>Taxable Amount</span>
                  <span className="font-medium text-foreground">{formatAED(Number(activeRevision.taxableAmount))}</span>
                </div>
                
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>VAT Amount</span>
                  <span className="font-medium text-foreground">{formatAED(Number(activeRevision.vatAmount))}</span>
                </div>
                
                <div className="flex justify-between items-center border-t pt-3 text-lg font-bold">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatAED(Number(activeRevision.grandTotal))}</span>
                </div>
                
                <div className="text-xs text-muted-foreground text-right italic pt-2 capitalize">
                  {amountInWordsAED(Number(activeRevision.grandTotal))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {(initialQuotation.notes || initialQuotation.terms) && (
        <Card>
          <CardHeader>
            <CardTitle>Terms & Notes</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {initialQuotation.notes && (
              <div>
                <h4 className="font-medium mb-2 text-muted-foreground">Notes</h4>
                <p className="whitespace-pre-wrap">{initialQuotation.notes}</p>
              </div>
            )}
            {initialQuotation.terms && (
              <div>
                <h4 className="font-medium mb-2 text-muted-foreground">Terms & Conditions</h4>
                <p className="whitespace-pre-wrap">{initialQuotation.terms}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
