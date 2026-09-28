import { prisma } from '../lib/prisma';
import { SOAService } from '../lib/soa-service';

async function main() {
  console.log("=== Testing T-09 (Aging Buckets & SOA) ===");

  const customer = await prisma.customer.findFirst();
  const user = await prisma.user.findFirst();

  if (!customer || !user) {
    console.error("No customer or user found");
    return;
  }

  const now = new Date();
  
  // Create invoices with various due dates
  const invCurrent = await prisma.invoice.create({
    data: {
      number: `INV-AGE-CURR-${Date.now()}`,
      customerId: customer.id,
      status: 'ISSUED',
      dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days (Current)
      subtotal: 100, taxableAmount: 100, vatAmount: 5, grandTotal: 105,
      createdById: user.id,
      items: { create: [{ description: 'Item', quantity: 1, unit: 'NOS', rate: 100, vatRate: 5, vatAmount: 5, lineSubtotal: 100, lineTotal: 105 }] }
    }
  });

  const inv30 = await prisma.invoice.create({
    data: {
      number: `INV-AGE-30-${Date.now()}`,
      customerId: customer.id,
      status: 'ISSUED',
      dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // Due 15 days ago (1-30 bucket)
      subtotal: 200, taxableAmount: 200, vatAmount: 10, grandTotal: 210,
      createdById: user.id,
      items: { create: [{ description: 'Item', quantity: 1, unit: 'NOS', rate: 200, vatRate: 5, vatAmount: 10, lineSubtotal: 200, lineTotal: 210 }] }
    }
  });

  const inv60 = await prisma.invoice.create({
    data: {
      number: `INV-AGE-60-${Date.now()}`,
      customerId: customer.id,
      status: 'ISSUED',
      dueDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), // Due 45 days ago (31-60 bucket)
      subtotal: 300, taxableAmount: 300, vatAmount: 15, grandTotal: 315,
      createdById: user.id,
      items: { create: [{ description: 'Item', quantity: 1, unit: 'NOS', rate: 300, vatRate: 5, vatAmount: 15, lineSubtotal: 300, lineTotal: 315 }] }
    }
  });

  const fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const toDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  const soa = await SOAService.generateSOA(customer.id, fromDate, toDate);

  console.log(`SOA for ${soa.customerName}`);
  console.log(`Opening Balance: ${soa.openingBalance}`);
  console.log(`Closing Balance: ${soa.closingBalance}`);
  
  console.log("\\nAging Buckets:");
  console.log(`Current: ${soa.aging.current} (Expected approx +105)`);
  console.log(`1-30 Days: ${soa.aging.days30} (Expected approx +210)`);
  console.log(`31-60 Days: ${soa.aging.days60} (Expected approx +315)`);
  console.log(`61-90 Days: ${soa.aging.days90}`);
  console.log(`> 90 Days: ${soa.aging.days120Plus}`);
  console.log(`Total Outstanding: ${soa.aging.totalOutstanding}`);

  // Test T-09 checks
  if (soa.aging.current < 105) throw new Error("Current bucket is incorrect");
  if (soa.aging.days30 < 210) throw new Error("1-30 bucket is incorrect");
  if (soa.aging.days60 < 315) throw new Error("31-60 bucket is incorrect");

  console.log("\\nAll T-09 Aging tests passed successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
