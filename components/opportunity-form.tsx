'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { opportunitySchema, OpportunityFormValues } from '@/app/dashboard/opportunities/schema';
import { createOpportunityAction, updateOpportunityAction } from '@/app/dashboard/opportunities/actions';
import { toast } from 'react-toastify';
import { Opportunity } from '@prisma/client';
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

interface OpportunityFormProps {
  initialData?: Opportunity | null;
  users: { id: string; name: string }[];
}

export function OpportunityForm({ initialData, users }: OpportunityFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!initialData;

  const defaultValues: Partial<OpportunityFormValues> = initialData
    ? {
        name: initialData.name,
        customerId: initialData.customerId,
        contactId: initialData.contactId || null,
        description: initialData.description || '',
        expectedValue: initialData.expectedValue ? new Decimal(initialData.expectedValue.toString()).toNumber() : null,
        probability: initialData.probability || null,
        expectedClosingDate: initialData.expectedClosingDate || null,
        assignedUserId: initialData.assignedUserId || null,
        source: initialData.source || '',
        competitor: initialData.competitor || '',
        project: initialData.project || '',
        site: initialData.site || '',
        status: initialData.status as any,
        notes: initialData.notes || '',
      }
    : {
        name: '',
        customerId: '',
        contactId: null,
        description: '',
        expectedValue: null,
        probability: 50,
        expectedClosingDate: null,
        assignedUserId: null,
        source: '',
        competitor: '',
        project: '',
        site: '',
        status: 'NEW',
        notes: '',
      };

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema) as any,
    defaultValues: defaultValues as any,
  });

  async function onSubmit(data: OpportunityFormValues) {
    setIsSubmitting(true);
    
    try {
      if (isEditing && initialData) {
        const result = await updateOpportunityAction(initialData.id, data);
        if (result.success) {
          toast.success('Opportunity updated successfully');
          router.push(`/dashboard/opportunities/${initialData.id}`);
        } else {
          toast.error(!result.success ? result.error : 'Failed to update opportunity');
        }
      } else {
        const result = await createOpportunityAction(data);
        if (result.success && result.data?.id) {
          toast.success('Opportunity created successfully');
          router.push(`/dashboard/opportunities/${result.data.id}`);
        } else {
          toast.error(!result.success ? result.error : 'Failed to create opportunity');
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
            <CardTitle>Opportunity Details</CardTitle>
            <CardDescription>Basic information about the sales opportunity.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }: any) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Name / Title <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Pipeline Expansion Q3" {...field} />
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
                  <FormLabel>Customer <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <CustomerSelector 
                      value={field.value || undefined} 
                      onChange={(val) => field.onChange(val || '')} 
                      error={!!form.formState.errors.customerId}
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
              name="probability"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Probability (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0"
                      max="100"
                      placeholder="e.g. 50" 
                      {...field} 
                      value={field.value || ''}
                      onChange={e => {
                        const val = parseInt(e.target.value);
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
              name="assignedUserId"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <Select onValueChange={(val) => field.onChange(val === 'unassigned' ? null : val)} defaultValue={field.value || 'unassigned'}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="QUALIFIED">Qualified</SelectItem>
                      <SelectItem value="PROPOSAL">Proposal</SelectItem>
                      <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                      <SelectItem value="WON">Won</SelectItem>
                      <SelectItem value="LOST">Lost</SelectItem>
                    </SelectContent>
                  </Select>
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
              name="competitor"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Competitor</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ABC Trading" {...field} value={field.value || ''} />
                  </FormControl>
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
                    <Textarea placeholder="Enter details..." {...field} value={field.value || ''} />
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
            {isEditing ? 'Update Opportunity' : 'Create Opportunity'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
