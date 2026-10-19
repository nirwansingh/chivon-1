'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { convertInquiryAction } from '@/app/dashboard/inquiries/actions';
import { toast } from 'react-toastify';

interface ConvertOpportunityDialogProps {
  inquiryId: string;
}

export function ConvertOpportunityDialog({ inquiryId }: ConvertOpportunityDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  async function handleConvert() {
    setIsSubmitting(true);
    try {
      const result = await convertInquiryAction(inquiryId);
      if (result.success) {
        toast.success('Inquiry converted to opportunity');
        setOpen(false);
        router.push(`/dashboard/opportunities/${result.data.id}`);
      } else {
        toast.error(!result.success ? result.error : 'Failed to convert inquiry');
      }
    } catch (e) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button>
          <RefreshCw className="mr-2 h-4 w-4" />
          Convert to Opportunity
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert to Opportunity</DialogTitle>
          <DialogDescription>
            Are you sure you want to convert this inquiry into a new sales opportunity? The inquiry status will be marked as CONVERTED.
            <br/><br/>
            Make sure the inquiry is linked to a customer first.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Conversion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
