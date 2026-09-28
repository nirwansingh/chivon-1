'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Edit2, FileDown, Forward, MoreHorizontal, Printer, Copy, CheckCircle2, XCircle, Share2 } from 'lucide-react';

interface DocumentActionsProps {
  status: string;
  onEdit?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onDownloadPdf?: () => void;
  onPreviewPdf?: () => void;
  onShare?: () => void;
  onConvert?: () => void;
  onDuplicate?: () => void;
  onCancel?: () => void;
  convertLabel?: string;
  canApprove?: boolean; // depends on permission
}

export function DocumentActions({
  status,
  onEdit,
  onApprove,
  onReject,
  onDownloadPdf,
  onPreviewPdf,
  onShare,
  onConvert,
  onDuplicate,
  onCancel,
  convertLabel = 'Convert',
  canApprove = false,
}: DocumentActionsProps) {
  const isPendingApproval = status === 'PENDING_APPROVAL';
  const isDraftOrRejected = ['DRAFT', 'REJECTED'].includes(status);
  const isApprovedOrIssued = ['APPROVED', 'ISSUED', 'SENT', 'ACCEPTED', 'CONFIRMED'].includes(status);

  return (
    <div className="flex items-center gap-2">
      {onEdit && (isDraftOrRejected || status === 'PENDING_APPROVAL') && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit2 className="mr-2 h-4 w-4" />
          Edit
        </Button>
      )}

      {canApprove && isPendingApproval && (
        <>
          {onApprove && (
            <Button variant="outline" size="sm" className="text-success border-success/30 hover:bg-success/10 hover:text-success" onClick={onApprove}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </Button>
          )}
          {onReject && (
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" onClick={onReject}>
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          )}
        </>
      )}

      {onPreviewPdf && (
        <Button variant="outline" size="sm" onClick={onPreviewPdf}>
          <FileDown className="mr-2 h-4 w-4" />
          Preview PDF
        </Button>
      )}

      {onConvert && isApprovedOrIssued && (
        <Button variant="default" size="sm" onClick={onConvert}>
          <Forward className="mr-2 h-4 w-4" />
          {convertLabel}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="px-2" />}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {onDownloadPdf && (
            <DropdownMenuItem onClick={onDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
          )}
          {onShare && (
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Link
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {onDuplicate && (
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
          )}
          {onCancel && (
            <DropdownMenuItem onClick={onCancel} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Document
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
