import { describe, it, expect } from 'vitest';
import { 
  toDecimal, 
  roundToTwo, 
  roundToFour, 
  formatAED, 
  amountInWordsAED, 
  calculateLineItem, 
  calculateDocumentTotals 
} from '../lib/money';
import { Decimal } from 'decimal.js';

describe('money library', () => {
  it('toDecimal should convert values safely', () => {
    expect(toDecimal(10).toNumber()).toBe(10);
    expect(toDecimal('10.5').toNumber()).toBe(10.5);
    expect(toDecimal(null).toNumber()).toBe(0);
    expect(toDecimal(undefined).toNumber()).toBe(0);
  });

  it('roundToTwo should round to 2 decimal places', () => {
    expect(roundToTwo(10.123).toNumber()).toBe(10.12);
    expect(roundToTwo(10.125).toNumber()).toBe(10.13); // Half up
  });

  it('roundToFour should round to 4 decimal places', () => {
    expect(roundToFour(10.12345).toNumber()).toBe(10.1235);
  });

  it('formatAED should format correctly', () => {
    expect(formatAED(1234.5)).toBe('AED 1,234.50');
  });

  it('amountInWordsAED should convert correctly', () => {
    expect(amountInWordsAED(123.45)).toBe('One Hundred Twenty Three Dirhams And Forty Five Fils Only');
    expect(amountInWordsAED(100)).toBe('One Hundred Dirhams Only');
    expect(amountInWordsAED(0)).toBe('Zero Dirhams Only');
  });

  describe('calculateLineItem', () => {
    it('calculates without discount correctly', () => {
      const res = calculateLineItem({ quantity: 2, rate: 100, vatRate: 5 });
      expect(res.lineSubtotal.toNumber()).toBe(200);
      expect(res.discountAmount.toNumber()).toBe(0);
      expect(res.taxableAmount.toNumber()).toBe(200);
      expect(res.vatAmount.toNumber()).toBe(10);
      expect(res.lineTotal.toNumber()).toBe(210);
    });

    it('calculates with percentage discount correctly', () => {
      const res = calculateLineItem({ 
        quantity: 1, 
        rate: 100, 
        vatRate: 5, 
        discountType: 'PERCENTAGE', 
        discountValue: 10 
      });
      expect(res.lineSubtotal.toNumber()).toBe(100);
      expect(res.discountAmount.toNumber()).toBe(10); // 10% of 100
      expect(res.taxableAmount.toNumber()).toBe(90);
      expect(res.vatAmount.toNumber()).toBe(4.5); // 5% of 90
      expect(res.lineTotal.toNumber()).toBe(94.5);
    });

    it('calculates with fixed amount discount correctly', () => {
      const res = calculateLineItem({ 
        quantity: 2, 
        rate: 50, 
        vatRate: 5, 
        discountType: 'FIXED_AMOUNT', 
        discountValue: 20 
      });
      expect(res.lineSubtotal.toNumber()).toBe(100);
      expect(res.discountAmount.toNumber()).toBe(20);
      expect(res.taxableAmount.toNumber()).toBe(80);
      expect(res.vatAmount.toNumber()).toBe(4);
      expect(res.lineTotal.toNumber()).toBe(84);
    });
  });

  describe('calculateDocumentTotals', () => {
    it('calculates totals correctly from multiple lines', () => {
      const line1 = calculateLineItem({ quantity: 1, rate: 100, vatRate: 5, discountType: 'PERCENTAGE', discountValue: 10 });
      const line2 = calculateLineItem({ quantity: 2, rate: 50, vatRate: 5 });
      
      const totals = calculateDocumentTotals([line1, line2]);
      
      expect(totals.subtotal.toNumber()).toBe(200); // 100 + 100
      expect(totals.discountAmount.toNumber()).toBe(10); // 10 + 0
      expect(totals.taxableAmount.toNumber()).toBe(190); // 90 + 100
      expect(totals.vatAmount.toNumber()).toBe(9.5); // 4.5 + 5
      expect(totals.grandTotal.toNumber()).toBe(199.5); // 94.5 + 105
    });
  });
});
