import { prisma } from '../lib/prisma';
import { CreditNoteService } from '../lib/credit-note-service';

async function testCreditNote() {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");

  const invoice = await prisma.invoice.findFirst({
    include: { items: true },
    where: { status: 'ISSUED' }
  });

  if (!invoice) {
    console.log("No issued invoice found");
    return;
  }

  console.log(`Found Invoice: ${invoice.number}, Grand Total: ${invoice.grandTotal}`);

  try {
    const cn = await CreditNoteService.create(
      invoice.id,
      [
        {
          description: "Test Refund",
          quantity: 1,
          rate: 10,
          vatRate: 5
        }
      ],
      "Test credit note",
      user.id
    );
    console.log(`Successfully created Credit Note: ${cn.number} for AED ${cn.grandTotal}`);
  } catch (err: any) {
    console.error("Failed to create CN:", err.message);
  }
}

testCreditNote().catch(console.error).finally(() => prisma.$disconnect());
