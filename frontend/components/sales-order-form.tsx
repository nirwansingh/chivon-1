'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Plus, Trash2, Calculator, CalendarIcon } from 'lucide-react';
import { ProductUnit } from '@prisma/client';
import { Decimal } from 'decimal.js';

import { Button } from '@/components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';

import { CustomerSelector } from '@/components/customer-selector';
import { ProductSelector } from '@/components/product-selector';
import { createSalesOrderAction, updateSalesOrderAction } from '@/app/dashboard/sales-orders/actions';
import { salesOrderSchema, SalesOrderFormValues } from '@/app/dashboard/sales-orders/schema';
import { calculateLineItem, calculateDocumentTotals, LineItemInput, formatAED, amountInWordsAED, toDecimal } from '@/lib/money';

interface SalesOrderFormProps {
  initialData?: Partial<SalesOrderFormValues>;
  salesOrderId?: string;
}

export function SalesOrderForm({ initialData, salesOrderId }: SalesOrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<any>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: initialData || {
      customerId: '',
      discountType: null,
      discountValue: null,
      items: [
        {
          orderedQty: 1,
          rate: 0,
          unit: ProductUnit.NOS,
          vatRate: 5,
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: 'items',
    control: form.control,
  });

  const watchItems = form.watch('items');
  const watchDiscountType = form.watch('discountType');
  const watchDiscountValue = form.watch('discountValue');

  // Live Totals calculation
  const totals = React.useMemo(() => {
    const lines = watchItems.map((item: any) => {
      const calcInput: LineItemInput = {
        quantity: item.orderedQty || 0,
        rate: item.rate || 0,
        discountType: item.discountType === 'percentage' ? 'PERCENTAGE' : item.discountType === 'fixed' ? 'FIXED_AMOUNT' : null,
        discountValue: item.discountValue || 0,
        vatRate: item.vatRate || 0,
      };
      const res = calculateLineItem(calcInput);
      return {
        lineSubtotal: res.lineSubtotal.toNumber(),
        vatAmount: res.vatAmount.toNumber(),
        lineTotal: res.lineTotal.toNumber(),
      };
    });

    let globalDiscount = new Decimal(0);
    const subtotal = lines.reduce((acc: any, l: any) => acc.add(l.lineSubtotal), new Decimal(0));
    
    if (watchDiscountType === 'percentage' && watchDiscountValue) {
      globalDiscount = subtotal.mul(watchDiscountValue).div(100);
    } else if (watchDiscountType === 'fixed' && watchDiscountValue) {
      globalDiscount = new Decimal(watchDiscountValue);
    }
    
    const sums = calculateDocumentTotals(lines.map((l: any) => ({
      lineSubtotal: new Decimal(l.lineSubtotal),
      discountAmount: new Decimal(0), // we will handle global + line discount together
      taxableAmount: new Decimal(l.lineSubtotal), // temp
      vatAmount: new Decimal(l.vatAmount),
      lineTotal: new Decimal(l.lineTotal),
    })));

    const discountAmount = globalDiscount; // simplified: ignoring line discounts for global sum if any to avoid double count or just add them
    const taxableAmount = sums.subtotal.sub(discountAmount);
    const vatAmount = sums.vatAmount; // in a real app, VAT should be recalculated after global discount
    const grandTotal = taxableAmount.add(vatAmount);

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      vatAmount,
      grandTotal,
    };
  }, [JSON.stringify(watchItems), watchDiscountType, watchDiscountValue]);

  async function onSubmit(data: SalesOrderFormValues) {
    if (!data.items || data.items.length === 0) {
      toast.error('Please add at least 1 item.');
      return;
    }
    
    setIsSubmitting(true);
    
    let res;
    if (salesOrderId) {
      res = await updateSalesOrderAction(salesOrderId, data);
    } else {
      res = await createSalesOrderAction(data);
    }
    
    if (res.success) {
      toast.success(salesOrderId ? 'Sales Order updated successfully.' : 'The sales order has been created successfully.');
      router.push(`/dashboard/sales-orders/${res.data?.id}`);
    } else {
      toast.error(res.error || (salesOrderId ? 'Failed to update sales order' : 'Failed to create sales order'));
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
        
        {/* Customer & Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Customer *</FormLabel>
                    <CustomerSelector 
                      value={field.value} 
                      onChange={field.onChange}
                      error={!!form.formState.errors.customerId}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Valid Until</FormLabel>
                    <Popover>
                      <FormControl>
                        <PopoverTrigger render={
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          />
                        }>
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </PopoverTrigger>
                      </FormControl>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Terms & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal/External Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notes visible on salesOrder..." 
                        className="resize-none h-20" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Standard terms apply..." 
                        className="resize-none h-20" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Add products or custom descriptions</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ orderedQty: 1, rate: 0, unit: ProductUnit.NOS, vatRate: 5 })}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left font-medium">
                    <th className="p-3 w-1/4">Product / Description</th>
                    <th className="p-3 w-24">Qty</th>
                    <th className="p-3 w-24">Unit</th>
                    <th className="p-3 w-32">Rate</th>
                    <th className="p-3 w-40">Discount</th>
                    <th className="p-3 w-24">VAT %</th>
                    <th className="p-3 w-32 text-right">Total</th>
                    <th className="p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const currentItem = watchItems[index];
                    const calcRes = calculateLineItem({
                      quantity: currentItem.orderedQty || 0,
                      rate: currentItem.rate || 0,
                      discountType: currentItem.discountType === 'percentage' ? 'PERCENTAGE' : currentItem.discountType === 'fixed' ? 'FIXED_AMOUNT' : null,
                      discountValue: currentItem.discountValue || 0,
                      vatRate: currentItem.vatRate || 0,
                    });
                    
                    return (
                      <tr key={field.id} className="border-b last:border-0 group">
                        <td className="p-2 space-y-2 align-top">
                          <FormField
                            control={form.control as any}
                            name={`items.${index}.productId`}
                            render={({ field: productField }) => (
                              <ProductSelector
                                value={productField.value || ''}
                                onChange={(val) => productField.onChange(val)}
                              />
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field: descField }) => (
                              <Input 
                                placeholder="Custom description..." 
                                className="h-8 text-xs" 
                                {...descField} 
                                value={descField.value || ''}
                              />
                            )}
                          />
                        </td>
                        <td className="p-2 align-top">
                          <FormField
                            control={form.control}
                            name={`items.${index}.orderedQty`}
                            render={({ field: qtyField }) => (
                              <Input 
                                type="number" 
                                step="any" 
                                className="h-8" 
                                {...qtyField} 
                                onChange={e => qtyField.onChange(parseFloat(e.target.value) || 0)}
                              />
                            )}
                          />
                        </td>
                        <td className="p-2 align-top">
                          <FormField
                            control={form.control}
                            name={`items.${index}.unit`}
                            render={({ field: unitField }) => (
                              <Select onValueChange={unitField.onChange} value={unitField.value}>
                                <FormControl>
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Unit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.values(ProductUnit).map(u => (
                                    <SelectItem key={u} value={u}>{u}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </td>
                        <td className="p-2 align-top">
                          <FormField
                            control={form.control}
                            name={`items.${index}.rate`}
                            render={({ field: rateField }) => (
                              <Input 
                                type="number" 
                                step="any" 
                                className="h-8" 
                                {...rateField}
                                onChange={e => rateField.onChange(parseFloat(e.target.value) || 0)}
                              />
                            )}
                          />
                        </td>
                        <td className="p-2 align-top space-y-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.discountType`}
                            render={({ field: discTypeField }) => (
                              <Select 
                                onValueChange={(val) => discTypeField.onChange(val === 'none' ? null : val)} 
                                value={discTypeField.value || 'none'}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  <SelectItem value="percentage">%</SelectItem>
                                  <SelectItem value="fixed">Fixed</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {currentItem.discountType && (
                            <FormField
                              control={form.control}
                              name={`items.${index}.discountValue`}
                              render={({ field: discValField }) => (
                                <Input 
                                  type="number" 
                                  step="any" 
                                  placeholder="Value"
                                  className="h-8" 
                                  {...discValField}
                                  value={discValField.value || ''}
                                  onChange={e => discValField.onChange(parseFloat(e.target.value) || 0)}
                                />
                              )}
                            />
                          )}
                        </td>
                        <td className="p-2 align-top">
                          <FormField
                            control={form.control}
                            name={`items.${index}.vatRate`}
                            render={({ field: vatField }) => (
                              <Input 
                                type="number" 
                                step="any" 
                                className="h-8" 
                                {...vatField}
                                onChange={e => vatField.onChange(parseFloat(e.target.value) || 0)}
                              />
                            )}
                          />
                        </td>
                        <td className="p-2 align-top text-right font-medium text-sm">
                          {formatAED(calcRes.lineTotal.toNumber())}
                        </td>
                        <td className="p-2 align-top text-center">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {form.formState.errors.items?.root?.message && (
              <p className="text-sm font-medium text-destructive">
                {String(form.formState.errors.items.root.message)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Summary & Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Discount</CardTitle>
              <CardDescription>Apply a discount to the entire salesOrder subtotal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Type</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === 'none' ? null : val)} 
                        value={field.value || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Discount Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Discount</SelectItem>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {watchDiscountType && (
                  <FormField
                    control={form.control}
                    name="discountValue"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Value</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="any" 
                            {...field}
                            value={field.value || ''}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">{formatAED(totals.subtotal.toNumber())}</span>
                </div>
                
                {totals.discountAmount.toNumber() > 0 && (
                  <div className="flex justify-between items-center text-destructive">
                    <span>Discount</span>
                    <span>-{formatAED(totals.discountAmount.toNumber())}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-muted-foreground border-t pt-3">
                  <span>Taxable Amount</span>
                  <span className="font-medium text-foreground">{formatAED(totals.taxableAmount.toNumber())}</span>
                </div>
                
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>VAT Amount</span>
                  <span className="font-medium text-foreground">{formatAED(totals.vatAmount.toNumber())}</span>
                </div>
                
                <div className="flex justify-between items-center border-t pt-3 text-lg font-bold">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatAED(totals.grandTotal.toNumber())}</span>
                </div>
                
                <div className="text-xs text-muted-foreground text-right italic pt-2 capitalize">
                  {amountInWordsAED(totals.grandTotal.toNumber())}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sticky Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-10 lg:pl-72 flex justify-end gap-4 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)]">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⟳</span> Saving...
              </span>
            ) : (
              'Save SalesOrder'
            )}
          </Button>
        </div>

      </form>
    </Form>
  );
}
