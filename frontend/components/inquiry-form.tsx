'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { inquirySchema, InquiryFormValues } from '@/app/dashboard/inquiries/schema';
import { createInquiryAction, updateInquiryAction } from '@/app/dashboard/inquiries/actions';
import { toast } from 'react-toastify';
import { Inquiry } from '@prisma/client';
import { CustomerSelector } from '@/components/customer-selector';

import {
  Form,
  FormControl,
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

interface InquiryFormProps {
  initialData?: Inquiry | null;
  users: { id: string; name: string }[];
}

export function InquiryForm({ initialData, users }: InquiryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!initialData;

  const defaultValues: Partial<InquiryFormValues> = initialData
    ? {
        title: initialData.title,
        source: initialData.source || '',
        customerId: initialData.customerId || null,
        contactId: initialData.contactId || null,
        productOrService: initialData.productOrService || '',
        quantity: initialData.quantity ? new Decimal(initialData.quantity.toString()).toNumber() : null,
        description: initialData.description || '',
        project: initialData.project || '',
        site: initialData.site || '',
        expectedValue: initialData.expectedValue ? new Decimal(initialData.expectedValue.toString()).toNumber() : null,
        expectedClosingDate: initialData.expectedClosingDate || null,
        assignedToId: initialData.assignedToId || null,
        status: initialData.status as any,
        priority: initialData.priority as any,
        notes: initialData.notes || '',
      }
    : {
        title: '',
        source: '',
        customerId: null,
        contactId: null,
        productOrService: '',
        quantity: null,
        description: '',
        project: '',
        site: '',
        expectedValue: null,
        expectedClosingDate: null,
        assignedToId: null,
        status: 'NEW',
        priority: 'MEDIUM',
        notes: '',
      };

  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema) as any,
    defaultValues: defaultValues as any,
  });

  async function onSubmit(data: InquiryFormValues) {
    setIsSubmitting(true);
    
    try {
      if (isEditing && initialData) {
        const result = await updateInquiryAction(initialData.id, data);
        if (result.success) {
          toast.success('Inquiry updated successfully');
          router.push(`/dashboard/inquiries/${initialData.id}`);
        } else {
          toast.error(!result.success ? result.error : 'Failed to update inquiry');
        }
      } else {
        const result = await createInquiryAction(data);
        if (result.success && result.data?.id) {
          toast.success('Inquiry created successfully');
          router.push(`/dashboard/inquiries/${result.data.id}`);
        } else {
          toast.error(!result.success ? result.error : 'Failed to create inquiry');
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
            <CardTitle>Inquiry Details</CardTitle>
            <CardDescription>Basic information about the inquiry.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control as any}
              name="title"
              render={({ field }: any) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Title <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 50x Steel Pipes for Dubai Project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="customerId"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <FormControl>
                    <CustomerSelector 
                      value={field.value || undefined} 
                      onChange={(val) => field.onChange(val || null)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="source"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Website, Walk-in, Email" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="productOrService"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Product/Service Needed</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Steel Pipe" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="quantity"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g. 100" 
                      {...field} 
                      value={field.value || ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        field.onChange(isNaN(val) ? null : val);
                      }} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="expectedValue"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Expected Value</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      {...field} 
                      value={field.value || ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        field.onChange(isNaN(val) ? null : val);
                      }} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="expectedClosingDate"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Expected Closing Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={e => {
                        field.onChange(e.target.value ? new Date(e.target.value) : null);
                      }} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="project"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Downtown Metro" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="site"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Site Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Dubai Marina" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Management</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control as any}
              name="assignedToId"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <Select onValueChange={(val) => field.onChange(val === 'unassigned' ? null : val)} value={field.value || 'unassigned'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
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
                  <FormLabel>Status <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="CONTACTED">Contacted</SelectItem>
                      <SelectItem value="QUALIFIED">Qualified</SelectItem>
                      <SelectItem value="UNQUALIFIED">Unqualified</SelectItem>
                      <SelectItem value="FOLLOW_UP_REQUIRED">Follow Up Required</SelectItem>
                      <SelectItem value="CONVERTED">Converted</SelectItem>
                      <SelectItem value="LOST">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="priority"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Priority <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
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
                  <FormLabel>Description / Requirements</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter detailed requirements..." {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Inquiry' : 'Create Inquiry'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
