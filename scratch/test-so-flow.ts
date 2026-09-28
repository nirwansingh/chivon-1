import { prisma } from '../lib/prisma';
import { QuotationService } from '../lib/quotation-service';
import { SalesOrderService } from '../lib/sales-order-service';
import { DocumentNumberService } from '../lib/sequence';

async function main() {
  console.log("Setting up test data...");
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");

  const customer = await prisma.customer.findFirst();
  if (!customer) throw new Error("No customer found");

  console.log("1. Creating a Quote...");
  const quotation = await QuotationService.create({
    customerId: customer.id,
    notes: 'To be converted',
    items: [
      { productId: null, description: 'Test Item 1', quantity: 2, unit: 'NOS', rate: 100, vatRate: 5 }
    ]
  }, user.id);

  console.log("2. Approving the Quote...");
  await QuotationService.updateStatus(quotation.id, 'APPROVED', user.id);

  console.log("3. Converting Quote to SO...");
  const so = await QuotationService.convertToSalesOrder(quotation.id, user.id);
  console.log(`✅ SO Created: ${so.number}`);
  if (so.subtotal.toNumber() !== 200) throw new Error("SO Subtotal mismatch");

  console.log("4. Updating SO...");
  const updatedSo = await SalesOrderService.update(so.id, {
    customerId: customer.id,
    items: [
      { productId: null, description: 'Test Item 1 updated', orderedQty: 3, unit: 'NOS', rate: 100, vatRate: 5 }
    ]
  }, user.id);
  console.log(`✅ SO Updated, new subtotal: ${updatedSo.subtotal}`);
  if (updatedSo.subtotal.toNumber() !== 300) throw new Error("SO update mismatch");

  console.log("5. Testing Cancellation...");
  const cancelledSo = await SalesOrderService.cancel(so.id, user.id, "Testing cancel");
  console.log(`✅ SO Cancelled, status: ${cancelledSo.status}`);
  if (cancelledSo.status !== 'CANCELLED') throw new Error("Cancel failed");

  console.log("6. Testing manual SO creation...");
  const manualSo = await SalesOrderService.create({
    customerId: customer.id,
    items: [
      { productId: null, description: 'Manual Item', orderedQty: 5, unit: 'NOS', rate: 50, vatRate: 5 }
    ]
  }, user.id);
  console.log(`✅ Manual SO Created: ${manualSo.number}`);

  console.log("All SO tests passed!");
}

main()
  .catch(e => {
    console.error("Test failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
