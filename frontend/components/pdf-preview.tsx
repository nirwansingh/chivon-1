'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, Loader2 } from 'lucide-react';

interface PdfPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  pdfUrl?: string | null;
  isLoading?: boolean;
  onDownload?: () => void;
  onPrint?: () => void;
}

export function PdfPreview({
  open,
  onOpenChange,
  title = 'Document Preview',
  pdfUrl,
  isLoading,
  onDownload,
  onPrint,
}: PdfPreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <div className="flex items-center gap-2">
              {onPrint && (
                <Button variant="outline" size="sm" onClick={onPrint} disabled={!pdfUrl || isLoading}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              )}
              {onDownload && (
                <Button variant="default" size="sm" onClick={onDownload} disabled={!pdfUrl || isLoading}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-muted/10 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Generating PDF...</p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=0`}
              className="w-full h-full border-none"
              title="PDF Preview"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <p>No preview available.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
