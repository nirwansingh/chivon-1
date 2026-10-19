import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './SharedStyles';
import { PdfHeader, PdfFooter, CompanySettingProps } from './SharedComponents';
import { format } from 'date-fns';

interface InvoicePdfProps {
  setting: CompanySettingProps;
  invoice: any;
}

export const InvoiceDocument = ({ setting, invoice }: InvoicePdfProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader 
          setting={setting} 
          title="TAX INVOICE" 
          reference={invoice.number}
          date={invoice.date}
        />

        <View style={styles.customerBlock}>
          <View style={styles.customerLeft}>
            <Text style={styles.sectionTitle}>Billed To:</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, marginBottom: 4 }}>
              {invoice.customer.companyName}
            </Text>
            {invoice.customer.trn && (
              <Text style={styles.metaText}>TRN: {invoice.customer.trn}</Text>
            )}
          </View>
          <View style={styles.customerRight}>
            <Text style={styles.sectionTitle}>Details:</Text>
            {invoice.dueDate && (
              <Text style={styles.metaText}><Text style={styles.metaLabel}>Due Date: </Text>{format(invoice.dueDate, 'dd MMM yyyy')}</Text>
            )}
            {invoice.salesOrder && (
              <Text style={styles.metaText}><Text style={styles.metaLabel}>SO Ref: </Text>{invoice.salesOrder.number}</Text>
            )}
            {invoice.paymentTerms && (
              <Text style={styles.metaText}><Text style={styles.metaLabel}>Terms: </Text>{invoice.paymentTerms}</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.tableColHeader, styles.colNo]}>#</Text>
            <Text style={[styles.tableColHeader, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableColHeader, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableColHeader, styles.colRate]}>Rate (AED)</Text>
            <Text style={[styles.tableColHeader, styles.colTax]}>VAT</Text>
            <Text style={[styles.tableColHeader, styles.colTotal]}>Total (AED)</Text>
          </View>
          
          {invoice.items.map((item: any, index: number) => (
            <View key={item.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.metaText, styles.colNo]}>{index + 1}</Text>
              <Text style={[styles.metaText, styles.colDesc]}>{item.description || (item.product ? item.product.name : 'Item')}</Text>
              <Text style={[styles.metaText, styles.colQty]}>{item.quantity.toString()}</Text>
              <Text style={[styles.metaText, styles.colRate]}>{item.rate.toFixed(2)}</Text>
              <Text style={[styles.metaText, styles.colTax]}>{item.vatAmount.toFixed(2)}</Text>
              <Text style={[styles.metaText, styles.colTotal]}>{item.lineTotal.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals wrap independently */}
        <View style={styles.totalsBlock} wrap={false}>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Subtotal:</Text>
            <Text style={styles.value}>{invoice.subtotal.toFixed(2)}</Text>
          </View>
          {invoice.discountAmount?.toNumber() > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.label}>Discount:</Text>
              <Text style={styles.value}>-{invoice.discountAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.label}>Taxable Amount:</Text>
            <Text style={styles.value}>{invoice.taxableAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.label}>VAT (5%):</Text>
            <Text style={styles.value}>{invoice.vatAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRowFinal}>
            <Text style={styles.label}>Grand Total (AED):</Text>
            <Text style={styles.value}>{invoice.grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Bank Details & Terms */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 }} wrap={false}>
          <View style={{ width: '48%' }}>
            {setting.bankName && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bank Details</Text>
                <Text style={styles.metaText}><Text style={styles.label}>Bank: </Text>{setting.bankName}</Text>
                <Text style={styles.metaText}><Text style={styles.label}>Account Name: </Text>{setting.accountName}</Text>
                <Text style={styles.metaText}><Text style={styles.label}>IBAN: </Text>{setting.iban}</Text>
                {setting.swift && <Text style={styles.metaText}><Text style={styles.label}>SWIFT: </Text>{setting.swift}</Text>}
              </View>
            )}
          </View>
          <View style={{ width: '48%' }}>
            {(invoice.notes || setting.paymentInstructions) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Instructions & Notes</Text>
                <Text style={styles.metaText}>{invoice.notes || setting.paymentInstructions}</Text>
              </View>
            )}
          </View>
        </View>

        <PdfFooter setting={setting} text="Thank you for your business! This is a computer generated document and requires no signature." />
      </Page>
    </Document>
  );
};
