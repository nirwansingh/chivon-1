import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../lib/prisma';
import { QuotationService } from '../../lib/quotation-service';
import { SalesOrderService } from '../../lib/sales-order-service';
import { PaymentService } from '../../lib/payment-service';
import { InvoiceService } from '../../lib/invoice-service';

describe('Integration: Quote -> SO -> Invoice -> Payment', () => {
  let customerId: string;
  let productId: string;
  let quoteId: string;
  let soId: string;
  let invoiceId: string;
  let paymentId: string;
  const userId = 'system-user';

  beforeAll(async () => {
    // Create a dummy customer
    const customer = await prisma.customer.create({
      data: {
        companyName: 'Test Corp ' + Date.now(),
        customerType: 'CORPORATE',
        status: 'ACTIVE',
      }
    });
    customerId = customer.id;

    // Create a dummy product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        sku: 'TEST-SKU-' + Date.now(),
        type: 'PRODUCT',
        unit: 'NOS',
        rate: 1000,
        status: 'ACTIVE'
      }
    });
    productId = product.id;
    
    const role = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: { name: 'Admin', description: 'Admin role' }
    });

    // Ensure system user exists
    const user = await prisma.user.upsert({
      where: { email: 'test@system.local' },
      update: {},
      create: {
        id: userId,
        email: 'test@system.local',
        name: 'System User',
        passwordHash: 'dummy',
        roleId: role.id
      }
    });
  });

  it('1. Create and approve a Quotation', async () => {
    const quote = await QuotationService.create({
      customerId,
      validUntil: new Date(),
      discountType: 'percentage',
      discountValue: 10,
      notes: 'Integration test',
      items: [
        {
          productId,
          description: 'Test item',
          quantity: 1,
          unit: 'NOS',
          rate: 1000,
          discountType: 'percentage',
          discountValue: 10,
          vatRate: 5,
        }
      ]
    }, userId);
    
    quoteId = quote.id;

    // Approve Quote
    const approved = await QuotationService.approve(quoteId, userId);
    expect(approved.status).toBe('APPROVED');
  });

  it('2. Convert Quote to Sales Order', async () => {
    const so = await QuotationService.convertToSalesOrder(quoteId, userId);
    soId = so.id;
    expect(so.id).toBeDefined();
    expect(so.status).toBe('DRAFT');
    
    // Check that Quote is updated
    const quote = await prisma.quotation.findUnique({ where: { id: quoteId }});
    expect(quote?.status).toBe('ACCEPTED');
  });

  it('3. Generate Invoice from Sales Order', async () => {
    // We need to fetch SO items to invoice
    const soWithItems = await prisma.salesOrder.findUnique({ 
      where: { id: soId },
      include: { items: true }
    });
    
    const itemsToInvoice = soWithItems!.items.map(item => ({
      salesOrderItemId: item.id,
      quantity: item.orderedQty.toNumber()
    }));

    // For SalesOrderService, status needs to be CONFIRMED usually. Let's mock it
    await prisma.salesOrder.update({ where: { id: soId }, data: { status: 'CONFIRMED' }});

    const invoice = await SalesOrderService.convertToInvoice(soId, itemsToInvoice, userId);
    invoiceId = invoice.id;
    expect(invoice.id).toBeDefined();
    
    // Check SO status
    const so = await prisma.salesOrder.findUnique({ where: { id: soId }});
    expect(so?.status).toBe('FULFILLED'); // Entirely invoiced
  });

  it('4. Make a partial payment and verify outstanding calculation', async () => {
    const payment = await PaymentService.create({
      customerId,
      paymentDate: new Date(),
      amount: 500,
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'TRX-12345',
      allocations: [
        {
          invoiceId: invoiceId,
          amount: 500
        }
      ]
    }, userId);
    paymentId = payment.id;
    
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }});
    expect(invoice?.status).toBe('PARTIALLY_PAID');
    const outstanding = await InvoiceService.calculateOutstanding(invoiceId);
    expect(outstanding).toBeGreaterThan(0);
  });

  it('5. Complete the payment', async () => {
    const remaining = await InvoiceService.calculateOutstanding(invoiceId);
    
    await PaymentService.create({
      customerId,
      paymentDate: new Date(),
      amount: remaining,
      paymentMethod: 'CASH',
      allocations: [
        {
          invoiceId: invoiceId,
          amount: remaining
        }
      ]
    }, userId);
    
    const updatedInvoice = await prisma.invoice.findUnique({ where: { id: invoiceId }});
    expect(updatedInvoice?.status).toBe('PAID');
    const finalOutstanding = await InvoiceService.calculateOutstanding(invoiceId);
    expect(finalOutstanding).toBe(0);
  });
});
