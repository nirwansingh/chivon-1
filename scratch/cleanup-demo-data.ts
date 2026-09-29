import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting cleanup of demo data...');

  // Delete in order to respect foreign key constraints
  await prisma.paymentAllocation.deleteMany({});
  console.log('Deleted PaymentAllocations');
  await prisma.payment.deleteMany({});
  console.log('Deleted Payments');
  await prisma.creditNoteItem.deleteMany({});
  await prisma.creditNote.deleteMany({});
  console.log('Deleted CreditNotes');
  
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  console.log('Deleted Invoices');

  await prisma.salesOrderItem.deleteMany({});
  await prisma.salesOrder.deleteMany({});
  console.log('Deleted SalesOrders');

  await prisma.quotationItem.deleteMany({});
  await prisma.quotationRevision.deleteMany({});
  await prisma.quotation.deleteMany({});
  console.log('Deleted Quotations');

  await prisma.stockMovement.deleteMany({});
  console.log('Deleted StockMovements');
  
  await prisma.opportunityItem.deleteMany({});
  await prisma.opportunity.deleteMany({});
  console.log('Deleted Opportunities');

  await prisma.task.deleteMany({});
  console.log('Deleted Tasks');

  await prisma.inquiry.deleteMany({});
  console.log('Deleted Inquiries');

  await prisma.activity.deleteMany({});
  console.log('Deleted Activities');

  await prisma.customerContact.deleteMany({});
  await prisma.customerAddress.deleteMany({});
  await prisma.customer.deleteMany({});
  console.log('Deleted Customers');

  await prisma.product.deleteMany({});
  await prisma.productCategory.deleteMany({});
  console.log('Deleted Products');

  console.log('Cleanup completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
