import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { styles } from './SharedStyles';
import { format } from 'date-fns';

export interface CompanySettingProps {
  companyName: string;
  logoPath?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  trn?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  iban?: string | null;
  swift?: string | null;
  paymentInstructions?: string | null;
}

export const PdfHeader = ({ setting, title, reference, date }: { setting: CompanySettingProps, title: string, reference: string, date: Date }) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <Image src={`${process.cwd()}/public/logo.png`} style={styles.logo} />
      <Text style={styles.companyDetails}>{setting.address || ''}</Text>
      <Text style={styles.companyDetails}>
        {setting.phone ? `Tel: ${setting.phone}` : ''} {setting.email ? ` | Email: ${setting.email}` : ''}
      </Text>
      {setting.trn && <Text style={styles.companyDetails}>TRN: {setting.trn}</Text>}
    </View>
    <View style={styles.headerRight}>
      <Text style={styles.documentTitle}>{title}</Text>
      <Text style={styles.metaText}><Text style={styles.metaLabel}>Ref: </Text>{reference}</Text>
      <Text style={styles.metaText}><Text style={styles.metaLabel}>Date: </Text>{format(date, 'dd MMM yyyy')}</Text>
    </View>
  </View>
);

export const PdfFooter = ({ setting, text }: { setting: CompanySettingProps, text?: string }) => (
  <View style={styles.footer} fixed>
    {text && <Text style={styles.footerText}>{text}</Text>}
    <Text style={styles.footerText}>
      {setting.companyName} | {setting.email} | {setting.website}
    </Text>
    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
      `Page ${pageNumber} of ${totalPages}`
    )} />
  </View>
);
