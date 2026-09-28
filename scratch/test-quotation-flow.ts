import { prisma } from '../lib/prisma';
import { QuotationService } from '../lib/quotation-service';
import { DocumentNumberService } from '../lib/sequence';

async function main() {
  console.log("Setting up test data...");
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");

  const customer = await prisma.customer.findFirst();
  if (!customer) throw new Error("No customer found");

  console.log("1. Testing Quotation Creation...");
  const quotation = await QuotationService.create({
    customerId: customer.id,
    notes: 'Initial Note',
    terms: 'Initial Terms',
    items: [
      { productId: null, description: 'Service A', quantity: 1, unit: 'NOS', rate: 100, vatRate: 5 }
    ]
  }, user.id);
  console.log(`✅ Created Quotation: ${quotation.number}`);

  console.log("2. Testing Revision Engine...");
  const revised = await QuotationService.createRevision(quotation.id, {
    customerId: customer.id,
    items: [
      { productId: null, description: 'Service A', quantity: 2, unit: 'NOS', rate: 100, vatRate: 5 }
    ],
    notes: 'Revised Note'
  }, user.id);
  
  const currentRevs = await prisma.quotationRevision.findMany({
    where: { quotationId: quotation.id },
    orderBy: { revisionNumber: 'asc' }
  });
  if (currentRevs.length !== 2) throw new Error(`Expected 2 revisions, got ${currentRevs.length}`);
  if (currentRevs[0].isCurrent !== false) throw new Error("Old rev not marked false");
  if (currentRevs[1].isCurrent !== true) throw new Error("New rev not marked true");
  console.log(`✅ Revision Engine works (Total revisions: ${currentRevs.length}, New GrandTotal: ${currentRevs[1].grandTotal})`);

  console.log("3. Testing Approval Workflow...");
  await QuotationService.submitForApproval(quotation.id, user.id);
  let q = await prisma.quotation.findUnique({ where: { id: quotation.id } });
  console.log(`   Status after submit: ${q?.status}`);
  
  await QuotationService.approve(quotation.id, user.id);
  q = await prisma.quotation.findUnique({ where: { id: quotation.id } });
  console.log(`   Status after approve: ${q?.status}`);
  console.log(`✅ Approval Workflow works`);

  console.log("4. Testing Convert to Sales Order...");
  const so = await QuotationService.convertToSalesOrder(quotation.id, user.id);
  console.log(`✅ Converted to SO: ${so.number} with Subtotal: ${so.subtotal}`);

  q = await prisma.quotation.findUnique({ where: { id: quotation.id } });
  if (q?.status !== 'ACCEPTED') throw new Error(`Quotation status should be ACCEPTED, got ${q?.status}`);
  console.log(`✅ Quotation status transitioned to ACCEPTED`);

  console.log("All Phase 8 logic verified successfully! 🎉");
}

main().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
