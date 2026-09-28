'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCreditNoteAction } from '@/app/dashboard/invoices/actions';
import { toast } from 'sonner';
import { PlusCircle, Trash2 } from 'lucide-react';

export function CreditNoteDialog({ invoiceId, maxAmount }: { invoiceId: string; maxAmount: number }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  
  const [items, setItems] = useState([
    { description: 'Refund', quantity: 1, rate: 0, vatRate: 5.0 }
  ]);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0, vatRate: 5.0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => {
    const sub = item.quantity * item.rate;
    const vat = sub * (item.vatRate / 100);
    return sum + sub + vat;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount <= 0) {
      toast.error('Credit note amount must be greater than zero');
      return;
    }
    if (totalAmount > maxAmount) {
      toast.error(`Credit note amount cannot exceed outstanding balance (${maxAmount})`);
      return;
    }

    setIsSubmitting(true);
    try {
      await createCreditNoteAction(invoiceId, items, notes);
      toast.success('Credit Note created successfully');
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create Credit Note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Issue Credit Note</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Issue Credit Note</DialogTitle>
            <DialogDescription>
              Create a credit note for this invoice. Maximum allowed: AED {maxAmount.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex items-end gap-2 p-4 border rounded-md relative">
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                  <div className="flex-1 space-y-2">
                    <Label>Description</Label>
                    <Input
                      required
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Rate (AED)</Label>
                    <Input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label>VAT (%)</Label>
                    <Input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={item.vatRate}
                      onChange={(e) => updateItem(index, 'vatRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              ))}
              
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Line Item
              </Button>
            </div>

            <div className="space-y-2 pt-4">
              <Label>Notes (Optional)</Label>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for credit note..."
              />
            </div>

            <div className="flex justify-end text-lg font-bold border-t pt-4 mt-4">
              Total Credit: AED {totalAmount.toFixed(2)}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || totalAmount <= 0 || totalAmount > maxAmount}>
              {isSubmitting ? 'Creating...' : 'Create Credit Note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
