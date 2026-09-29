import { test } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { QuotationService } from '../lib/quotation-service';
import { SalesOrderService } from '../lib/sales-order-service';
import { PdfService } from '../lib/pdf-service';

const prisma = new PrismaClient();

test('Generate Quote, SO, and Invoice PDFs', async () => {
  console.log('Starting PDF Generation Test...');
  try {
    // 1. Setup Data
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found');
    
    let customer = await prisma.customer.findFirst();
    if (!customer) {
      customer = await prisma.customer.create({
        data: { companyName: 'PDF Test Corp', customerType: 'CORPORATE' }
      });
    }

    let product = await prisma.product.findFirst();
    if (!product) {
      product = await prisma.product.create({
        data: { name: 'PDF Test Product', rate: 1000, stockQuantity: 100 }
      });
    }

    const outputDir = path.join(process.cwd(), 'scratch', 'pdfs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 2. Create Quotation & Generate PDF
    console.log('Creating Quotation...');
    const quote = await QuotationService.create({
      customerId: customer.id,
      items: [{
        productId: product.id,
        quantity: 5,
        rate: product.rate.toNumber(),
        unit: 'NOS',
        vatRate: 5
      }]
    }, user.id);
    await QuotationService.approve(quote.id, user.id);

    const fullQuote = await prisma.quotation.findUnique({ where: { id: quote.id }, include: { revisions: true } });
    if (!fullQuote || !fullQuote.revisions.length) throw new Error('Failed to find quote revisions');

    const quotePdfPath = path.join(outputDir, `Quotation_${quote.number}.pdf`);
    const quotePdfBuffer = await PdfService.generateQuotationPdf(quote.id, fullQuote.revisions[0].id);
    fs.writeFileSync(quotePdfPath, quotePdfBuffer);
    console.log(`✅ Saved Quotation PDF to: ${quotePdfPath}`);

    // 3. Convert to Sales Order & Generate PDF
    console.log('Converting to Sales Order...');
    const so = await QuotationService.convertToSalesOrder(quote.id, user.id);
    const soPdfPath = path.join(outputDir, `SalesOrder_${so.number}.pdf`);
    const soPdfBuffer = await PdfService.generateSalesOrderPdf(so.id);
    fs.writeFileSync(soPdfPath, soPdfBuffer);
    console.log(`✅ Saved Sales Order PDF to: ${soPdfPath}`);

    // 4. Convert to Invoice & Generate PDF
    console.log('Generating Invoice...');
    await SalesOrderService.updateStatus(so.id, 'CONFIRMED', user.id);
    const fullSo = await prisma.salesOrder.findUnique({ where: { id: so.id }, include: { items: true } });
    if (!fullSo || !fullSo.items.length) throw new Error('Failed to find SO items');

    const invoiceItems = [{
      salesOrderItemId: fullSo.items[0].id,
      quantity: 2
    }];
    const invoice = await SalesOrderService.convertToInvoice(so.id, invoiceItems, user.id);
    const invoicePdfPath = path.join(outputDir, `Invoice_${invoice.number}.pdf`);
    const invoicePdfBuffer = await PdfService.generateInvoicePdf(invoice.id);
    fs.writeFileSync(invoicePdfPath, invoicePdfBuffer);
    console.log(`✅ Saved Invoice PDF to: ${invoicePdfPath}`);

    console.log('\nAll PDFs generated successfully! You can verify them in the scratch/pdfs folder.');

  } finally {
    await prisma.$disconnect();
  }
});
