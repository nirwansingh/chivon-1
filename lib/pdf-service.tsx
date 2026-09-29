import { prisma } from './prisma';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { QuotationDocument } from '@/components/pdf/QuotationDocument';
import { SalesOrderDocument } from '@/components/pdf/SalesOrderDocument';
import { InvoiceDocument } from '@/components/pdf/InvoiceDocument';

export class PdfService {
  private static async getCompanySetting() {
    const setting = await prisma.companySetting.findUnique({
      where: { id: 'default' }
    });
    return setting || { companyName: 'Chivon Mechanical' };
  }

  /**
   * Generates a PDF buffer for a quotation revision using React-PDF.
   */
  static async generateQuotationPdf(quotationId: string, revisionId: string): Promise<Buffer> {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        customer: true,
        contact: true,
        createdBy: true,
      }
    });

    const revision = await prisma.quotationRevision.findUnique({
      where: { id: revisionId },
      include: {
        items: {
          include: { product: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!quotation || !revision) {
      throw new Error('Quotation or revision not found');
    }

    const setting = await this.getCompanySetting();

    const pdfBuffer = await renderToBuffer(
      <QuotationDocument 
        setting={setting as any} 
        quotation={quotation} 
        revision={revision} 
      />
    );

    return pdfBuffer;
  }

  // Next steps: Implement generateSalesOrderPdf, generateInvoicePdf, generateCreditNotePdf, generatePaymentReceiptPdf, generateSOAPdf
  // using the same pattern.
  
  static async generateSalesOrderPdf(salesOrderId: string): Promise<Buffer> {
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: { customer: true, items: true }
    });

    if (!salesOrder) throw new Error('Sales order not found');

    const setting = await this.getCompanySetting();
    const pdfBuffer = await renderToBuffer(
      <SalesOrderDocument 
        setting={setting as any} 
        salesOrder={salesOrder} 
      />
    );
    return pdfBuffer;
  }

  static async generateInvoicePdf(invoiceId: string): Promise<Buffer> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, items: true }
    });

    if (!invoice) throw new Error('Invoice not found');

    const setting = await this.getCompanySetting();
    const pdfBuffer = await renderToBuffer(
      <InvoiceDocument 
        setting={setting as any} 
        invoice={invoice} 
      />
    );
    return pdfBuffer;
  }

  static async generateCreditNotePdf(creditNoteId: string): Promise<Buffer> {
    const htmlContent = `<html><body><h1>Credit Note ${creditNoteId}</h1></body></html>`;
    return Buffer.from(htmlContent, 'utf-8');
  }

  static async generatePaymentReceiptPdf(paymentId: string): Promise<Buffer> {
    const htmlContent = `<html><body><h1>Payment Receipt ${paymentId}</h1></body></html>`;
    return Buffer.from(htmlContent, 'utf-8');
  }

  static async generateSOAPdf(customerId: string, fromDate: Date, toDate: Date): Promise<Buffer> {
    const htmlContent = `<html><body><h1>Statement of Account</h1></body></html>`;
    return Buffer.from(htmlContent, 'utf-8');
  }
}
