import { prisma } from '../lib/prisma';
import { PaymentService } from '../lib/payment-service';
import { InvoiceService } from '../lib/invoice-service';
import { SalesOrderService } from '../lib/sales-order-service';
import { QuotationService } from '../lib/quotation-service';
import { Decimal } from 'decimal.js';

async function main() {
  console.log("=== Testing T-01, T-05, T-06 ===");

  // Find a customer and product to create an invoice
  const customer = await prisma.customer.findFirst();
  const product = await prisma.product.findFirst();
  const user = await prisma.user.findFirst();

  if (!customer || !product || !user) {
    console.error("No customer, product or user found");
    return;
  }
  
  const userId = user.id;

  const invoice = await prisma.invoice.create({
    data: {
      number: `INV-TEST-${Date.now()}`,
      customerId: customer.id,
      status: 'ISSUED',
      dueDate: new Date(),
      subtotal: 1000,
      taxableAmount: 1000,
      vatAmount: 50,
      grandTotal: 1050,
      createdById: userId,
      items: {
        create: [{
          description: 'Test Item',
          quantity: 10,
          unit: 'NOS',
          rate: 100,
          vatRate: 5,
          vatAmount: 50,
          lineSubtotal: 1000,
          lineTotal: 1050,
        }]
      }
    }
  });

  console.log(`Invoice ${invoice.number} created with total: ${invoice.grandTotal.toNumber()}`);

  // Test T-01: Auto-update invoice status on partial payment
  console.log("\\nTesting T-01 (Partial Payment)");
  let payment1 = await PaymentService.create({
    customerId: customer.id,
    amount: 500,
    paymentMethod: 'Bank Transfer'
  }, userId);

  payment1 = await PaymentService.allocate(payment1.id, [{
    invoiceId: invoice.id,
    amount: 500
  }], userId) as any;

  let invAfterP1 = await prisma.invoice.findUnique({ where: { id: invoice.id } });
  console.log(`Invoice Status after 500 payment: ${invAfterP1?.status} (Expected: PARTIALLY_PAID)`);
  if (invAfterP1?.status !== 'PARTIALLY_PAID') throw new Error("T-01 Failed for Partial");

  // Test T-05: Block over-allocation
  console.log("\\nTesting T-05 (Over-allocation Block)");
  const outstanding = await InvoiceService.calculateOutstanding(invoice.id);
  console.log(`Outstanding balance: ${outstanding}`);
  
  let payment2 = await PaymentService.create({
    customerId: customer.id,
    amount: 1000,
    paymentMethod: 'Bank Transfer'
  }, userId);

  try {
    await PaymentService.allocate(payment2.id, [{
      invoiceId: invoice.id,
      amount: outstanding + 100 // OVER ALLOCATE
    }], userId);
    throw new Error("T-05 Failed! Allowed over allocation");
  } catch (err: any) {
    console.log(`Successfully blocked over-allocation. Error: ${err.message}`);
  }

  // Allocate exactly the remaining
  console.log(`\\nAllocating remaining ${outstanding}`);
  payment2 = await PaymentService.allocate(payment2.id, [{
    invoiceId: invoice.id,
    amount: outstanding
  }], userId) as any;

  let invAfterP2 = await prisma.invoice.findUnique({ where: { id: invoice.id } });
  console.log(`Invoice Status after full payment: ${invAfterP2?.status} (Expected: PAID)`);
  if (invAfterP2?.status !== 'PAID') throw new Error("T-01 Failed for Full Payment");

  // Test T-06: Reverse Payment
  console.log("\\nTesting T-06 (Payment Reversal)");
  await PaymentService.reversePayment(payment2.id, "Bounced Cheque", userId);
  
  let invAfterRev = await prisma.invoice.findUnique({ where: { id: invoice.id } });
  console.log(`Invoice Status after reversal: ${invAfterRev?.status} (Expected: PARTIALLY_PAID)`);
  if (invAfterRev?.status !== 'PARTIALLY_PAID') throw new Error("T-06 Failed! Invoice status not reverted correctly");

  let p2After = await prisma.payment.findUnique({ where: { id: payment2.id }, include: { allocations: true } });
  console.log(`Payment2 Status: Reversed=${p2After?.isReversed}, AllocationsReversed=${p2After?.allocations[0].isReversed}`);
  if (!p2After?.isReversed || !p2After?.allocations[0].isReversed) throw new Error("T-06 Failed! Allocations not reversed.");

  console.log("\\nAll Payment tests passed successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
