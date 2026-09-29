'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { productSchema, ProductFormValues } from '@/app/dashboard/products/schema';
import { createProductAction, updateProductAction } from '@/app/dashboard/products/actions';
import { toast } from 'react-toastify';
import { Product, ProductCategory } from '@prisma/client';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Decimal } from 'decimal.js';

interface ProductFormProps {
  initialData?: Product | null;
  categories: ProductCategory[];
  onInlineSuccess?: (id: string) => void;
}

export function ProductForm({ initialData, categories, onInlineSuccess }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!initialData;

  const defaultValues: Partial<ProductFormValues> = initialData
    ? {
        sku: initialData.sku || '',
        name: initialData.name,
        type: initialData.type as any,
        categoryId: initialData.categoryId || undefined,
        description: initialData.description || '',
        unit: initialData.unit as any,
        rate: new Decimal(initialData.rate.toString()).toNumber(),
        vatRate: new Decimal(initialData.vatRate.toString()).toNumber(),
        minStock: initialData.minStock ? new Decimal(initialData.minStock.toString()).toNumber() : undefined,
        status: initialData.status as any,
      }
    : {
        sku: '',
        name: '',
        type: 'PRODUCT',
        categoryId: undefined,
        description: '',
        unit: 'NOS',
        rate: 0,
        vatRate: 5,
        minStock: undefined,
        status: 'ACTIVE',
        initialStock: 0,
      };

  const form = useForm<ProductFormValues>({
    // @ts-expect-error - mismatch with strict nested types
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues as any,
  });

  async function onSubmit(data: ProductFormValues) {
    setIsSubmitting(true);
    
    try {
      if (isEditing && initialData) {
        const result = await updateProductAction(initialData.id, data);
        if (result.success) {
          toast.success('Product updated successfully');
          if (onInlineSuccess) {
            onInlineSuccess(initialData.id);
          } else {
            router.push(`/dashboard/products/${initialData.id}`);
          }
        } else {
          toast.error(!result.success ? result.error : 'Failed to update product');
        }
      } else {
        const result = await createProductAction(data);
        if (result.success && result.data?.id) {
          toast.success('Product created successfully');
          if (onInlineSuccess) {
            onInlineSuccess(result.data.id);
          } else {
            router.push(`/dashboard/products/${result.data.id}`);
          }
        } else {
          toast.error(!result.success ? result.error : 'Failed to create product');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...(form as any)}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>Basic information about the item.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Steel Pipe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="sku"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. SP-123" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="type"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Type <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PRODUCT">Product</SelectItem>
                      <SelectItem value="SERVICE">Service</SelectItem>
                      <SelectItem value="MANPOWER">Manpower</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="categoryId"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No categories found
                        </div>
                      ) : (
                        categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="unit"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Unit of Measure <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NOS">NOS (Numbers)</SelectItem>
                      <SelectItem value="KG">KG (Kilograms)</SelectItem>
                      <SelectItem value="HOURS">Hours</SelectItem>
                      <SelectItem value="DAYS">Days</SelectItem>
                      <SelectItem value="METER">Meter</SelectItem>
                      <SelectItem value="SET">Set</SelectItem>
                      <SelectItem value="LOT">Lot</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="status"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="description"
              render={({ field }: any) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter product details..." {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control as any}
              name="rate"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Default Rate <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="vatRate"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>VAT Rate (%) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="5.00" 
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="minStock"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Minimum Stock Level</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="e.g. 10" 
                      {...field} 
                      value={field.value || ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        field.onChange(isNaN(val) ? undefined : val);
                      }} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control as any}
                name="initialStock"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Opening Stock Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                        value={field.value || ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          field.onChange(isNaN(val) ? 0 : val);
                        }} 
                      />
                    </FormControl>
                    <FormDescription>Set this only during initial creation.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onInlineSuccess ? onInlineSuccess('cancel') : router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Item' : 'Create Item'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
