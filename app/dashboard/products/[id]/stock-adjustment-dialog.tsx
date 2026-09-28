'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PackagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { adjustStockAction } from '@/app/dashboard/products/actions';
import { toast } from 'react-toastify';

const stockSchema = z.object({
  quantity: z.number().refine(val => val !== 0, 'Quantity must not be zero'),
  notes: z.string().optional(),
});

type StockFormValues = z.infer<typeof stockSchema>;

interface StockAdjustmentDialogProps {
  productId: string;
  currentStock: number;
  unit: string;
}

export function StockAdjustmentDialog({ productId, currentStock, unit }: StockAdjustmentDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      quantity: 0,
      notes: '',
    },
  });

  const quantity = form.watch('quantity');
  const newStock = currentStock + (quantity || 0);

  async function onSubmit(data: StockFormValues) {
    setIsSubmitting(true);
    try {
      const result = await adjustStockAction(productId, data.quantity, data.notes);
      if (result.success) {
        toast.success('Stock adjusted successfully');
        setOpen(false);
        form.reset();
      } else {
        toast.error(result.error || 'Failed to adjust stock');
      }
    } catch (e) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>
        <PackagePlus className="mr-2 h-4 w-4" />
        Adjust Stock
      </Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            Add or remove stock manually. Use negative values to deduct stock.
          </DialogDescription>
        </DialogHeader>

        <Form {...(form as any)}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg text-sm mb-4">
              <div>
                <div className="text-muted-foreground">Current Stock</div>
                <div className="font-semibold">{currentStock} {unit}</div>
              </div>
              <div className="text-right">
                <div className="text-muted-foreground">New Stock</div>
                <div className={`font-semibold ${newStock < 0 ? 'text-destructive' : 'text-primary'}`}>
                  {newStock} {unit}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Quantity <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.0001"
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Reason for adjustment..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || quantity === 0 || newStock < 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Adjustment
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
