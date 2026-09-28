import { prisma } from '@/lib/prisma';
import { DocumentNumberService } from '@/lib/sequence';
import { calculateLineItem, calculateDocumentTotals } from '@/lib/money';

export class CreditNoteService {
  static async create(
    invoiceId: string,
    items: { description: string; quantity: number; rate: number; vatRate: number }[],
    notes: string,
    userId: string
  ) {
    if (items.length === 0) {
      throw new Error("Credit Note must have at least one item");
    }

    // Since generateNextNumber isn't transactional, we do it before the tx
    const cnNumber = await DocumentNumberService.generateNextNumber('CN');

    return await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { creditNotes: true }
      });

      if (!inv) throw new Error("Invoice not found");
      if (inv.status === 'CANCELLED') throw new Error("Cannot issue credit note for cancelled invoice");

      // Calculate total requested credit
      const newItems = items.map(req => {
        if (req.quantity <= 0) throw new Error("Quantity must be greater than 0");
        const calc = calculateLineItem({
          quantity: req.quantity,
          rate: req.rate,
          discountType: null,
          vatRate: req.vatRate
        });
        return {
          description: req.description,
          quantity: req.quantity,
          rate: req.rate,
          vatRate: req.vatRate,
          vatAmount: calc.vatAmount,
          lineSubtotal: calc.lineSubtotal,
          taxableAmount: calc.taxableAmount,
          lineTotal: calc.lineTotal,
          discountAmount: calc.discountAmount
        };
      });

      const docTotals = calculateDocumentTotals(newItems);

      const cnTotal = inv.creditNotes.reduce((sum, cn) => sum + cn.grandTotal.toNumber(), 0);
      const outstanding = inv.grandTotal.toNumber() - cnTotal; // Ignoring payments for now as per P10

      if (docTotals.grandTotal.toNumber() > outstanding) {
        throw new Error(`Credit Note total (${docTotals.grandTotal}) exceeds outstanding invoice balance (${outstanding})`);
      }

      const cn = await tx.creditNote.create({
        data: {
          number: cnNumber,
          invoiceId: inv.id,
          subtotal: docTotals.subtotal,
          vatAmount: docTotals.vatAmount,
          grandTotal: docTotals.grandTotal,
          notes,
          createdById: userId,
          items: {
            create: newItems.map(i => ({
              description: i.description,
              quantity: i.quantity,
              rate: i.rate,
              vatRate: i.vatRate,
              vatAmount: i.vatAmount,
              lineTotal: i.lineTotal
            }))
          }
        }
      });

      await tx.auditLog.create({
        data: {
          userId,
          module: 'INVOICE',
          entityType: 'CREDIT_NOTE',
          entityId: cn.id,
          action: 'CREATE',
          description: `Credit Note ${cnNumber} created for Invoice ${inv.number}`,
          afterData: { invoiceId: inv.id }
        }
      });

      return cn;
    });
  }
}
