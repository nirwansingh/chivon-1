import { prisma } from './prisma';

export class PdfService {
  /**
   * Generates a PDF buffer for a quotation revision.
   * This is a foundational method. In a full implementation, this would use a library like puppeteer,
   * react-pdf, or jspdf to generate the actual PDF layout as specified in §13.9.
   */
  static async generateQuotationPdf(quotationId: string, revisionId: string): Promise<Buffer> {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        customer: true,
        opportunity: true,
      }
    });

    const revision = await prisma.quotationRevision.findUnique({
      where: { id: revisionId },
      include: {
        items: true
      }
    });

    if (!quotation || !revision) {
      throw new Error('Quotation or revision not found');
    }

    // A real implementation would construct the PDF here.
    // We return a dummy buffer for now to satisfy the architectural requirement.
    const htmlContent = `
      <html>
        <head><title>Quotation ${quotation.number}</title></head>
        <body>
          <h1>Quotation ${quotation.number} (Rev ${revision.revisionNumber})</h1>
          <p>Customer: ${quotation.customer.companyName}</p>
          <p>Total: ${revision.grandTotal.toString()} AED</p>
        </body>
      </html>
    `;

    return Buffer.from(htmlContent, 'utf-8');
  }

  static async generateSalesOrderPdf(salesOrderId: string): Promise<Buffer> {
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: {
        customer: true,
        items: true
      }
    });

    if (!salesOrder) {
      throw new Error('Sales order not found');
    }

    const htmlContent = `
      <html>
        <head><title>Sales Order ${salesOrder.number}</title></head>
        <body>
          <h1>Sales Order ${salesOrder.number}</h1>
          <p>Customer: ${salesOrder.customer.companyName}</p>
          <p>Total: ${salesOrder.grandTotal.toString()} AED</p>
        </body>
      </html>
    `;

    return Buffer.from(htmlContent, 'utf-8');
  }

  static async generateInvoicePdf(invoiceId: string): Promise<Buffer> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        items: true
      }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const htmlContent = `
      <html>
        <head><title>Invoice ${invoice.number}</title></head>
        <body>
          <h1>Invoice ${invoice.number}</h1>
          <p>Customer: ${invoice.customer.companyName}</p>
          <p>Total: ${invoice.grandTotal.toString()} AED</p>
        </body>
      </html>
    `;

    return Buffer.from(htmlContent, 'utf-8');
  }

  static async generateCreditNotePdf(creditNoteId: string): Promise<Buffer> {
    const cn = await prisma.creditNote.findUnique({
      where: { id: creditNoteId },
      include: {
        invoice: {
          include: { customer: true }
        },
        items: true
      }
    });

    if (!cn) {
      throw new Error('Credit Note not found');
    }

    const htmlContent = `
      <html>
        <head><title>Credit Note ${cn.number}</title></head>
        <body>
          <h1>Credit Note ${cn.number}</h1>
          <p>Customer: ${cn.invoice.customer.companyName}</p>
          <p>Original Invoice: ${cn.invoice.number}</p>
          <p>Total: ${cn.grandTotal.toString()} AED</p>
        </body>
      </html>
    `;

    return Buffer.from(htmlContent, 'utf-8');
  }

  static async generatePaymentReceiptPdf(paymentId: string): Promise<Buffer> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        customer: true,
        allocations: {
          include: { invoice: true }
        }
      }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const htmlContent = `
      <html>
        <head><title>Payment Receipt ${payment.number}</title></head>
        <body>
          <h1>Payment Receipt ${payment.number}</h1>
          <p>Customer: ${payment.customer.companyName}</p>
          <p>Amount: ${payment.amount.toString()} AED</p>
          <p>Method: ${payment.paymentMethod}</p>
        </body>
      </html>
    `;

    return Buffer.from(htmlContent, 'utf-8');
  }

  static async generateSOAPdf(customerId: string, fromDate: Date, toDate: Date): Promise<Buffer> {
    const { SOAService } = await import('./soa-service');
    const soa = await SOAService.generateSOA(customerId, fromDate, toDate);

    const htmlContent = `
      <html>
        <head>
          <title>Statement of Account - ${soa.customerName}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Statement of Account</h1>
          <h2>Customer: ${soa.customerName}</h2>
          <p>Period: ${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}</p>
          <p>Opening Balance: ${soa.openingBalance}</p>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Reference</th>
                <th>Description</th>
                <th class="right">Debit</th>
                <th class="right">Credit</th>
                <th class="right">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${soa.entries.map((entry: any) => `
                <tr>
                  <td>${entry.date.toLocaleDateString()}</td>
                  <td>${entry.type}</td>
                  <td>${entry.reference}</td>
                  <td>${entry.description}</td>
                  <td class="right">${entry.debit > 0 ? entry.debit.toFixed(2) : '-'}</td>
                  <td class="right">${entry.credit > 0 ? entry.credit.toFixed(2) : '-'}</td>
                  <td class="right">${entry.balance.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p>Closing Balance: ${soa.closingBalance}</p>
        </body>
      </html>
    `;

    return Buffer.from(htmlContent, 'utf-8');
  }
}
