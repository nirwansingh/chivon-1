import { StyleSheet, Font } from '@react-pdf/renderer';

// Register standard fonts if needed, or use default Helvetica
// For real applications, registering a font that supports required character sets (like Arabic for UAE) is important.
// Font.register({ family: 'Inter', src: '...' });

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333333',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '1 solid #eaeaea',
    paddingBottom: 15,
  },
  headerLeft: {
    flexDirection: 'column',
    maxWidth: '60%',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    maxWidth: '35%',
  },
  logo: {
    width: 120,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  documentTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 9,
    marginBottom: 3,
  },
  metaLabel: {
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#111111',
    backgroundColor: '#f5f5f5',
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  customerBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  customerLeft: {
    maxWidth: '50%',
  },
  customerRight: {
    maxWidth: '45%',
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1 solid #111111',
    borderTop: '1 solid #111111',
    paddingVertical: 6,
    backgroundColor: '#fafafa',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #eaeaea',
    paddingVertical: 6,
    minHeight: 24,
  },
  tableColHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  colNo: { width: '5%' },
  colDesc: { width: '45%' },
  colQty: { width: '10%', textAlign: 'right' },
  colRate: { width: '15%', textAlign: 'right' },
  colTax: { width: '10%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
  totalsBlock: {
    width: '40%',
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: '1 solid #eaeaea',
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottom: '2 solid #111111',
    borderTop: '1 solid #111111',
    marginTop: 2,
    fontFamily: 'Helvetica-Bold',
  },
  label: {
    fontFamily: 'Helvetica-Bold',
  },
  value: {
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#888888',
    borderTop: '1 solid #eaeaea',
    paddingTop: 10,
  },
  footerText: {
    textAlign: 'center',
    marginBottom: 2,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: '#888888',
  }
});
