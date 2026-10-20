import { QuotationStatus, SalesOrderStatus, InvoiceStatus } from '@prisma/client';

/**
 * Valid Quotation Transitions:
 * DRAFT -> PENDING_APPROVAL | APPROVED | SENT | CANCELLED
 * PENDING_APPROVAL -> APPROVED | REJECTED | CANCELLED
 * APPROVED -> SENT | CANCELLED
 * REJECTED -> DRAFT | CANCELLED
 * SENT -> ACCEPTED | REJECTED | EXPIRED | CANCELLED
 * ACCEPTED -> (Cannot change)
 * EXPIRED -> (Cannot change)
 * CANCELLED -> (Cannot change)
 */
export const QuotationTransitions: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: ['PENDING_APPROVAL', 'APPROVED', 'SENT', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['SENT', 'CANCELLED'],
  REJECTED: ['DRAFT', 'CANCELLED'],
  SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
  ACCEPTED: [],
  EXPIRED: [],
  CANCELLED: []
};

/**
 * Valid Sales Order Transitions:
 * DRAFT -> CONFIRMED | CANCELLED
 * CONFIRMED -> IN_PROGRESS | CANCELLED
 * IN_PROGRESS -> PARTIALLY_FULFILLED | FULFILLED | CANCELLED
 * PARTIALLY_FULFILLED -> FULFILLED | CANCELLED
 * FULFILLED -> (Cannot change)
 * CANCELLED -> (Cannot change)
 */
export const SalesOrderTransitions: Record<SalesOrderStatus, SalesOrderStatus[]> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'],
  PARTIALLY_FULFILLED: ['FULFILLED', 'CANCELLED'],
  FULFILLED: [],
  CANCELLED: []
};

/**
 * Valid Invoice Transitions:
 * DRAFT -> PENDING_APPROVAL | APPROVED | ISSUED | CANCELLED
 * PENDING_APPROVAL -> APPROVED | CANCELLED
 * APPROVED -> ISSUED | CANCELLED
 * ISSUED -> PARTIALLY_PAID | PAID | CANCELLED
 * PARTIALLY_PAID -> PAID
 * PAID -> (Cannot change)
 * CANCELLED -> (Cannot change)
 */
export const InvoiceTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ['PENDING_APPROVAL', 'APPROVED', 'ISSUED', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'CANCELLED'],
  APPROVED: ['ISSUED', 'CANCELLED'],
  ISSUED: ['PARTIALLY_PAID', 'PAID', 'CANCELLED'],
  PARTIALLY_PAID: ['PAID'],
  PAID: [],
  CANCELLED: []
};

export function canTransitionQuotation(current: QuotationStatus, next: QuotationStatus): boolean {
  if (current === next) return true;
  return QuotationTransitions[current].includes(next);
}

export function canTransitionSalesOrder(current: SalesOrderStatus, next: SalesOrderStatus): boolean {
  if (current === next) return true;
  return SalesOrderTransitions[current].includes(next);
}

export function canTransitionInvoice(current: InvoiceStatus, next: InvoiceStatus): boolean {
  if (current === next) return true;
  return InvoiceTransitions[current].includes(next);
}
