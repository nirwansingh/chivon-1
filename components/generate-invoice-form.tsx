'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { convertSalesOrderToInvoiceAction, convertQuotationToInvoiceAction } from '@/app/dashboard/invoices/actions';
import { toast } from 'sonner';

interface GenerateInvoiceFormProps {
  type: 'sales_order' | 'quotation';
  sourceDoc: any; // Using any for simplicity here since it's JSON cloned
}

export function GenerateInvoiceForm({ type, sourceDoc }: GenerateInvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // State for selected items and quantities
  // For SO: { [itemId]: quantity }
  const initialQuantities = type === 'sales_order' 
    ? sourceDoc.items.reduce((acc: any, item: any) => {
        if (Number(item.remainingQty) > 0) {
          acc[item.id] = Number(item.remainingQty);
        }
        return acc;
      }, {})
    : sourceDoc.revisions[0].items.reduce((acc: any, item: any) => {
        acc[item.id] = Number(item.quantity);
        return acc;
      }, {});

  const [quantities, setQuantities] = useState<Record<string, number>>(initialQuantities);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(Object.keys(initialQuantities)));

  const itemsList = type === 'sales_order' ? sourceDoc.items : sourceDoc.revisions[0].items;

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const updateQuantity = (id: string, val: string) => {
    const num = parseFloat(val);
    setQuantities(prev => ({
      ...prev,
      [id]: isNaN(num) ? 0 : num
    }));
  };

  const onSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one item to invoice');
      return;
    }

    const payload = Array.from(selectedIds).map(id => ({
      [type === 'sales_order' ? 'salesOrderItemId' : 'quotationItemId']: id,
      quantity: quantities[id] || 0
    }));

    if (payload.some(p => p.quantity <= 0)) {
      toast.error('Quantities must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      if (type === 'sales_order') {
        await convertSalesOrderToInvoiceAction(sourceDoc.id, payload as any);
      } else {
        await convertQuotationToInvoiceAction(sourceDoc.id, sourceDoc.revisions[0].id, payload as any);
      }
      toast.success('Invoice generated successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate invoice');
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === itemsList.filter((i: any) => type === 'sales_order' ? Number(i.remainingQty) > 0 : true).length && selectedIds.size > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const validIds = itemsList
                          .filter((i: any) => type === 'sales_order' ? Number(i.remainingQty) > 0 : true)
                          .map((i: any) => i.id);
                        setSelectedIds(new Set(validIds));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2 text-right">Rate</th>
                {type === 'sales_order' && <th className="px-4 py-2 text-right">Remaining</th>}
                <th className="px-4 py-2 w-32 text-right">Qty to Invoice</th>
                <th className="px-4 py-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {itemsList.map((item: any) => {
                const isSalesOrder = type === 'sales_order';
                const remaining = isSalesOrder ? Number(item.remainingQty) : Number(item.quantity);
                if (isSalesOrder && remaining <= 0) return null; // Skip fully invoiced items

                const selected = selectedIds.has(item.id);
                const qtyToInvoice = quantities[item.id] || 0;
                
                // Approximate line total (before discount/tax) for preview
                const lineTotal = qtyToInvoice * Number(item.rate);

                return (
                  <tr key={item.id} className={selected ? 'bg-primary/5' : ''}>
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={selected}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {item.product?.name || item.description}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(Number(item.rate))}
                    </td>
                    {isSalesOrder && (
                      <td className="px-4 py-3 text-right">
                        {remaining}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Input 
                        type="number"
                        min="0"
                        max={isSalesOrder ? remaining : undefined}
                        step="0.01"
                        className="w-full text-right"
                        value={qtyToInvoice || ''}
                        onChange={(e) => updateQuantity(item.id, e.target.value)}
                        disabled={!selected}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {selected ? formatCurrency(lineTotal) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-muted/50 p-6">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={onSubmit} disabled={loading || selectedIds.size === 0}>
          {loading ? 'Generating...' : 'Generate Invoice'}
        </Button>
      </CardFooter>
    </Card>
  );
}
