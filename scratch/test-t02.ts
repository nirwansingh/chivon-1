import { prisma } from '../lib/prisma';
import { SalesOrderService } from '../lib/sales-order-service';
import { calculateLineItem } from '../lib/money';
import { DocumentNumberService } from '../lib/sequence';

async function main() {
  const customer = await prisma.customer.findFirst();
  if (!customer) throw new Error("No customer found");

  const product = await prisma.product.findFirst();
  if (!product) throw new Error("No product found");

  const userId = "test-user";

  const soNumber = await DocumentNumberService.generateNextNumber('SALES_ORDER');
  const so = await prisma.salesOrder.create({
    data: {
      number: soNumber,
      customerId: customer.id,
      status: 'CONFIRMED',
      date: new Date(),
      subtotal: 100000,
      discountAmount: 0,
      taxableAmount: 100000,
      vatAmount: 5000,
      grandTotal: 105000,
      items: {
        create: [{
          productId: product.id,
          orderedQty: 100,
          rate: 1000, 
          invoicedQty: 0,
          fulfilledQty: 0,
          remainingQty: 100,
          unit: product.unit,
          vatRate: 5,
          vatAmount: 5000,
          lineSubtotal: 100000,
          lineTotal: 105000,
        }]
      }
    },
    include: { items: true }
  });

  console.log(`Created SO: ${so.number} with Qty: 100 (Remaining: ${so.items[0].remainingQty})`);

  try {
    const inv1 = await SalesOrderService.convertToInvoice(so.id, [{ salesOrderItemId: so.items[0].id, quantity: 40 }], userId);
    console.log(`Invoice 1 created: ${inv1.number} for 40 qty`);
  } catch(e: any) { console.error("Invoice 1 failed", e.message); }

  const soAfter1 = await prisma.salesOrder.findUnique({ where: { id: so.id }, include: { items: true } });
  console.log(`SO After Inv 1: Remaining Qty: ${soAfter1?.items[0].remainingQty}`);

  try {
    const inv2 = await SalesOrderService.convertToInvoice(so.id, [{ salesOrderItemId: so.items[0].id, quantity: 60 }], userId);
    console.log(`Invoice 2 created: ${inv2.number} for 60 qty`);
  } catch(e: any) { console.error("Invoice 2 failed", e.message); }

  const soAfter2 = await prisma.salesOrder.findUnique({ where: { id: so.id }, include: { items: true } });
  console.log(`SO After Inv 2: Remaining Qty: ${soAfter2?.items[0].remainingQty}`);
  console.log(`SO Status: ${soAfter2?.status}`);

  try {
    const inv3 = await SalesOrderService.convertToInvoice(so.id, [{ salesOrderItemId: so.items[0].id, quantity: 1 }], userId);
    console.log(`Invoice 3 created (SHOULD NOT HAPPEN): ${inv3.number}`);
  } catch(e: any) { 
    console.log(`✅ Invoice 3 successfully blocked: ${e.message}`);
  }

}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
