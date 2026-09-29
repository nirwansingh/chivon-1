import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './SharedStyles';
import { PdfHeader, PdfFooter, CompanySettingProps } from './SharedComponents';
import { format } from 'date-fns';

interface SalesOrderPdfProps {
  setting: CompanySettingProps;
  salesOrder: any;
}

export const SalesOrderDocument = ({ setting, salesOrder }: SalesOrderPdfProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader 
          setting={setting} 
          title="SALES ORDER" 
          reference={salesOrder.number}
          date={salesOrder.date}
        />

        <View style={styles.customerBlock}>
          <View style={styles.customerLeft}>
            <Text style={styles.sectionTitle}>Billed To:</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, marginBottom: 4 }}>
              {salesOrder.customer.companyName}
            </Text>
            {salesOrder.customer.trn && (
              <Text style={styles.metaText}>TRN: {salesOrder.customer.trn}</Text>
            )}
          </View>
          <View style={styles.customerRight}>
            <Text style={styles.sectionTitle}>Details:</Text>
            {salesOrder.quotation && (
              <Text style={styles.metaText}><Text style={styles.metaLabel}>Quotation Ref: </Text>{salesOrder.quotation.number}</Text>
            )}
            <Text style={styles.metaText}><Text style={styles.metaLabel}>Status: </Text>{salesOrder.status}</Text>
            <Text style={styles.metaText}><Text style={styles.metaLabel}>Prepared By: </Text>{salesOrder.createdBy?.name || 'System'}</Text>
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
          
          {salesOrder.items.map((item: any, index: number) => (
            <View key={item.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.metaText, styles.colNo]}>{index + 1}</Text>
              <Text style={[styles.metaText, styles.colDesc]}>{item.description || (item.product ? item.product.name : 'Item')}</Text>
              <Text style={[styles.metaText, styles.colQty]}>{item.orderedQty.toString()}</Text>
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
            <Text style={styles.value}>{salesOrder.subtotal.toFixed(2)}</Text>
          </View>
          {salesOrder.discountAmount?.toNumber() > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.label}>Discount:</Text>
              <Text style={styles.value}>-{salesOrder.discountAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.label}>Taxable Amount:</Text>
            <Text style={styles.value}>{salesOrder.taxableAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.label}>VAT (5%):</Text>
            <Text style={styles.value}>{salesOrder.vatAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRowFinal}>
            <Text style={styles.label}>Grand Total (AED):</Text>
            <Text style={styles.value}>{salesOrder.grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Terms */}
        {(salesOrder.terms || setting.paymentInstructions) && (
          <View style={[styles.section, { marginTop: 30 }]} wrap={false}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <Text style={styles.metaText}>{salesOrder.terms || setting.paymentInstructions}</Text>
          </View>
        )}

        <PdfFooter setting={setting} text="This is a computer generated document and requires no signature." />
      </Page>
    </Document>
  );
};
