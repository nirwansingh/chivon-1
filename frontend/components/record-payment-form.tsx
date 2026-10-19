'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomerSelector } from '@/components/customer-selector';
import { createPaymentAction } from '@/app/dashboard/payments/actions';
import { toast } from 'sonner';

export function RecordPaymentForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerId, setCustomerId] = useState('');
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const amount = parseFloat(formData.get('amount') as string);
      
      if (amount <= 0) {
        toast.error('Amount must be greater than zero');
        setIsSubmitting(false);
        return;
      }
      
      await createPaymentAction({
        customerId,
        amount,
        paymentMethod: formData.get('paymentMethod') as string,
        referenceNumber: formData.get('referenceNumber') as string,
        bank: formData.get('bank') as string,
        chequeNumber: formData.get('chequeNumber') as string,
        notes: formData.get('notes') as string,
      });
      // createPaymentAction handles redirect
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Record Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Customer</Label>
            <CustomerSelector value={customerId} onChange={setCustomerId} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount (AED)</Label>
              <Input name="amount" type="number" step="0.01" min="0.01" required />
            </div>
            
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select name="paymentMethod" defaultValue="Bank Transfer">
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input name="referenceNumber" />
            </div>
            
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input name="bank" placeholder="e.g. Emirates NBD" />
            </div>
            
            <div className="space-y-2">
              <Label>Cheque Number</Label>
              <Input name="chequeNumber" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea name="notes" placeholder="Any additional details..." />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Record Payment'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
