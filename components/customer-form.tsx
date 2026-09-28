'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { customerSchema, CustomerFormValues } from '@/app/dashboard/customers/schema';
import { createCustomerAction, updateCustomerAction } from '@/app/dashboard/customers/actions';
import { toast } from 'react-toastify';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash, Loader2 } from 'lucide-react';
import { CustomerWithRelations } from '@/lib/customer-service';
import { Decimal } from 'decimal.js';

interface CustomerFormProps {
  initialData?: CustomerWithRelations | null;
  onInlineSuccess?: (id: string) => void;
}

export function CustomerForm({ initialData, onInlineSuccess }: CustomerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!initialData;

  const defaultValues: Partial<CustomerFormValues> = initialData
    ? {
        ...initialData,
        openingReceivable: initialData.openingReceivable ? new Decimal(initialData.openingReceivable.toString()).toNumber() : undefined,
        status: initialData.status as 'ACTIVE' | 'INACTIVE',
        customerType: initialData.customerType || '',
        vatNumber: initialData.vatNumber || '',
        trn: initialData.trn || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        website: initialData.website || '',
        industry: initialData.industry || '',
        notes: initialData.notes || '',
        contacts: initialData.contacts.map((c) => ({
          id: c.id,
          name: c.name,
          isPrimary: c.isPrimary,
          designation: c.designation || '',
          email: c.email || '',
          phone: c.phone || '',
          mobile: c.mobile || '',
          whatsapp: c.whatsapp || '',
          notes: c.notes || '',
        })),
        addresses: initialData.addresses.map((a) => ({
          id: a.id,
          type: a.type as 'REGISTERED' | 'BILLING' | 'SHIPPING',
          addressLine1: a.addressLine1 || '',
          addressLine2: a.addressLine2 || '',
          city: a.city || '',
          state: a.state || '',
          country: a.country || 'United Arab Emirates',
          postalCode: a.postalCode || '',
        })),
      }
    : {
        companyName: '',
        customerType: '',
        vatNumber: '',
        trn: '',
        email: '',
        phone: '',
        website: '',
        industry: '',
        status: 'ACTIVE',
        notes: '',
        contacts: [{ name: '', isPrimary: true, designation: '', email: '', phone: '', mobile: '', whatsapp: '', notes: '' }],
        addresses: [{ type: 'REGISTERED', addressLine1: '', addressLine2: '', city: '', state: '', country: 'United Arab Emirates', postalCode: '' }],
      };

  const form = useForm<CustomerFormValues>({
    // @ts-expect-error - mismatch with strict nested types
    resolver: zodResolver(customerSchema),
    defaultValues: defaultValues as any,
  });

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control: form.control,
    name: 'contacts',
  });

  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
    control: form.control,
    name: 'addresses',
  });

  async function onSubmit(data: CustomerFormValues) {
    setIsSubmitting(true);
    
    // Ensure only one primary contact is selected if somehow multiple are checked
    // The spec says "Contacts CRUD (multiple, primary flag)".
    // If the user selects multiple primaries, we can either auto-fix it or show an error. 
    // We'll auto-fix by setting the first found primary as true, others false, 
    // or just assume the UI handled it.
    
    try {
      if (isEditing && initialData) {
        const result = await updateCustomerAction(initialData.id, data);
        if (result.success) {
          toast.success('Customer updated successfully');
          if (onInlineSuccess) {
            onInlineSuccess(initialData.id);
          } else {
            router.push(`/dashboard/customers/${initialData.id}`);
          }
        } else {
          toast.error(result.error || 'Failed to update customer');
        }
      } else {
        const result = await createCustomerAction(data);
        if (result.success && result.data?.id) {
          toast.success('Customer created successfully');
          if (onInlineSuccess) {
            onInlineSuccess(result.data.id);
          } else {
            router.push(`/dashboard/customers/${result.data.id}`);
          }
        } else {
          toast.error(result.error || 'Failed to create customer');
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
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
          </TabsList>

          {/* BASIC INFO TAB */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>Main information about the customer entity.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control as any}
                  name="companyName"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Company Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  name="customerType"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Customer Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="B2B">B2B (Corporate)</SelectItem>
                          <SelectItem value="B2C">B2C (Individual)</SelectItem>
                          <SelectItem value="DISTRIBUTOR">Distributor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="industry"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Construction" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="email"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Main Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="info@acme.com" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="phone"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Main Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+971..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax & Financials</CardTitle>
                <CardDescription>Tax registration and opening balances.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control as any}
                  name="trn"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>TRN (Tax Registration Number)</FormLabel>
                      <FormControl>
                        <Input placeholder="100..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control as any}
                  name="vatNumber"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>VAT Number (if different)</FormLabel>
                      <FormControl>
                        <Input placeholder="..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isEditing && (
                  <FormField
                    control={form.control as any}
                    name="openingReceivable"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Opening Balance (Receivable)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>Set this only during initial creation.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTACTS TAB */}
          <TabsContent value="contacts" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Contacts</h3>
                <p className="text-sm text-muted-foreground">Add and manage customer contacts.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => appendContact({ name: '', isPrimary: contactFields.length === 0 })}>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </div>

            {contactFields.map((field, index) => (
              <Card key={field.id} className="relative overflow-hidden">
                {contactFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 text-destructive hover:text-destructive hover:bg-destructive/10 z-10"
                    onClick={() => removeContact(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control as any}
                    name={`contacts.${index}.name`}
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name={`contacts.${index}.designation`}
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Designation</FormLabel>
                        <FormControl>
                          <Input placeholder="Manager" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name={`contacts.${index}.email`}
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@acme.com" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name={`contacts.${index}.phone`}
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Office Phone" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name={`contacts.${index}.mobile`}
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Mobile</FormLabel>
                        <FormControl>
                          <Input placeholder="Mobile Phone" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center space-x-2 pt-8">
                    <FormField
                      control={form.control as any}
                      name={`contacts.${index}.isPrimary`}
                      render={({ field }: any) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm w-full h-full justify-center">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked: boolean) => {
                                // If this is checked, uncheck others
                                if (checked) {
                                  contactFields.forEach((_, i) => {
                                    if (i !== index) {
                                      form.setValue(`contacts.${i}.isPrimary`, false);
                                    }
                                  });
                                }
                                field.onChange(checked);
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Primary Contact
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ADDRESSES TAB */}
          <TabsContent value="addresses" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Addresses</h3>
                <p className="text-sm text-muted-foreground">Manage billing, shipping, and registered addresses.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => appendAddress({ type: 'SHIPPING', addressLine1: '', city: '', country: 'United Arab Emirates' })}>
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Button>
            </div>

            {addressFields.map((field, index) => (
              <Card key={field.id} className="relative overflow-hidden">
                {addressFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 text-destructive hover:text-destructive hover:bg-destructive/10 z-10"
                    onClick={() => removeAddress(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name={`addresses.${index}.type`}
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Type <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="REGISTERED">Registered</SelectItem>
                            <SelectItem value="BILLING">Billing</SelectItem>
                            <SelectItem value="SHIPPING">Shipping</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control as any}
                    name={`addresses.${index}.addressLine1`}
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Address Line 1 <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Street, Building..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control as any}
                    name={`addresses.${index}.city`}
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>City <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Dubai" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name={`addresses.${index}.country`}
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Country <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="United Arab Emirates" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-8 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Customer' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
