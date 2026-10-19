import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DocumentReference {
  id: string;
  type: 'Quotation' | 'Sales Order' | 'Invoice' | 'Payment';
  number: string;
  url: string;
}

interface DocumentLineageProps {
  documents: DocumentReference[];
}

export function DocumentLineage({ documents }: DocumentLineageProps) {
  if (!documents || documents.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md border border-dashed">
      <span className="font-medium mr-2">Lineage:</span>
      {documents.map((doc, index) => (
        <div key={doc.id} className="flex items-center gap-2">
          <Link href={doc.url} className="text-primary hover:underline font-medium">
            {doc.type} {doc.number}
          </Link>
          {index < documents.length - 1 && (
            <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
          )}
        </div>
      ))}
    </div>
  );
}
