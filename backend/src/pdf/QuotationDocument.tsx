import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './SharedStyles';
import { PdfHeader, PdfFooter, CompanySettingProps } from './SharedComponents';
import { format } from 'date-fns';

interface QuotationPdfProps {
  setting: CompanySettingProps;
  quotation: any;
  revision: any;
}

export const QuotationDocument = ({ setting, quotation, revision }: QuotationPdfProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader 
          setting={setting} 
          title="QUOTATION" 
          reference={`${quotation.number} (Rev ${revision.revisionNumber})`}
          date={quotation.date}
        />

        <View style={styles.customerBlock}>
          <View style={styles.customerLeft}>
            <Text style={styles.sectionTitle}>Quoted To:</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, marginBottom: 4 }}>
              {quotation.customer.companyName}
            </Text>
            {quotation.contact && (
              <Text style={styles.metaText}>Attn: {quotation.contact.name}</Text>
            )}
            {quotation.customer.trn && (
              <Text style={styles.metaText}>TRN: {quotation.customer.trn}</Text>
            )}
          </View>
          <View style={styles.customerRight}>
            <Text style={styles.sectionTitle}>Details:</Text>
            <Text style={styles.metaText}><Text style={styles.metaLabel}>Valid Until: </Text>{quotation.validUntil ? format(quotation.validUntil, 'dd MMM yyyy') : 'N/A'}</Text>
            <Text style={styles.metaText}><Text style={styles.metaLabel}>Prepared By: </Text>{quotation.createdBy?.name || 'System'}</Text>
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
          
          {revision.items.map((item: any, index: number) => (
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
            <Text style={styles.value}>{revision.subtotal.toFixed(2)}</Text>
          </View>
          {revision.discountAmount?.toNumber() > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.label}>Discount:</Text>
              <Text style={styles.value}>-{revision.discountAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.label}>Taxable Amount:</Text>
            <Text style={styles.value}>{revision.taxableAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.label}>VAT (5%):</Text>
            <Text style={styles.value}>{revision.vatAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRowFinal}>
            <Text style={styles.label}>Grand Total (AED):</Text>
            <Text style={styles.value}>{revision.grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Terms */}
        {(quotation.terms || setting.paymentInstructions) && (
          <View style={[styles.section, { marginTop: 30 }]} wrap={false}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <Text style={styles.metaText}>{quotation.terms || setting.paymentInstructions}</Text>
          </View>
        )}

        <PdfFooter setting={setting} text="This is a computer generated document and requires no signature." />
      </Page>
    </Document>
  );
};
