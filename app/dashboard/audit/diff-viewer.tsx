'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DateDisplay } from '@/components/date-display';

interface DiffViewerProps {
  log: any;
  onClose: () => void;
}

export function DiffViewer({ log, onClose }: DiffViewerProps) {
  const beforeJson = log.beforeData ? JSON.stringify(log.beforeData, null, 2) : 'No previous data';
  const afterJson = log.afterData ? JSON.stringify(log.afterData, null, 2) : 'No new data';

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="flex items-center gap-4">
            <span>Audit Log Payload</span>
            <span className="text-xs font-normal text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
              {log.action} : {log.module}
            </span>
          </DialogTitle>
          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
            <span>By: {log.user?.name || 'System'}</span>
            <span>&bull;</span>
            <DateDisplay date={log.createdAt} formatString="PP pp" />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-950">
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold mb-2">Before</h3>
              <pre className="flex-1 p-4 rounded-lg bg-white dark:bg-slate-900 border text-xs font-mono overflow-auto whitespace-pre-wrap text-red-700 dark:text-red-400">
                {beforeJson}
              </pre>
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold mb-2">After</h3>
              <pre className="flex-1 p-4 rounded-lg bg-white dark:bg-slate-900 border text-xs font-mono overflow-auto whitespace-pre-wrap text-green-700 dark:text-green-400">
                {afterJson}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
