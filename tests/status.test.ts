import { describe, it, expect } from 'vitest';
import { 
  canTransitionQuotation, 
  canTransitionSalesOrder, 
  canTransitionInvoice 
} from '../lib/status';

describe('Status Machine Helpers', () => {
  describe('Quotation', () => {
    it('allows valid transitions', () => {
      expect(canTransitionQuotation('DRAFT', 'SENT')).toBe(true);
      expect(canTransitionQuotation('SENT', 'ACCEPTED')).toBe(true);
    });

    it('rejects invalid transitions', () => {
      expect(canTransitionQuotation('ACCEPTED', 'SENT')).toBe(false);
      expect(canTransitionQuotation('CANCELLED', 'DRAFT')).toBe(false);
    });
  });

  describe('SalesOrder', () => {
    it('allows valid transitions', () => {
      expect(canTransitionSalesOrder('DRAFT', 'CONFIRMED')).toBe(true);
      expect(canTransitionSalesOrder('CONFIRMED', 'IN_PROGRESS')).toBe(true);
    });

    it('rejects invalid transitions', () => {
      expect(canTransitionSalesOrder('FULFILLED', 'IN_PROGRESS')).toBe(false);
      expect(canTransitionSalesOrder('DRAFT', 'FULFILLED')).toBe(false);
    });
  });

  describe('Invoice', () => {
    it('allows valid transitions', () => {
      expect(canTransitionInvoice('DRAFT', 'ISSUED')).toBe(true);
      expect(canTransitionInvoice('ISSUED', 'PARTIALLY_PAID')).toBe(true);
      expect(canTransitionInvoice('PARTIALLY_PAID', 'PAID')).toBe(true);
    });

    it('rejects invalid transitions', () => {
      expect(canTransitionInvoice('PAID', 'ISSUED')).toBe(false);
      expect(canTransitionInvoice('CANCELLED', 'DRAFT')).toBe(false);
    });
  });
});
