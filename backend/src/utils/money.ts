import { Decimal } from 'decimal.js';
import numberToWords from 'number-to-words';

// Standardize precision
// Rates/Subtotals/Totals: 2 decimals
// Quantities/Stock: 4 decimals
// VAT Rate: 2 decimals

export const ROUNDING_MODE = Decimal.ROUND_HALF_UP;

/**
 * Creates a Decimal instance from string/number/Decimal, defaulting to 0.
 */
export function toDecimal(value: string | number | Decimal | null | undefined): Decimal {
  if (!value) return new Decimal(0);
  try {
    return new Decimal(value);
  } catch {
    return new Decimal(0);
  }
}

/**
 * Rounds a Decimal or number to 2 decimal places.
 */
export function roundToTwo(value: string | number | Decimal): Decimal {
  return toDecimal(value).toDecimalPlaces(2, ROUNDING_MODE);
}

/**
 * Rounds a Decimal or number to 4 decimal places (used for quantities).
 */
export function roundToFour(value: string | number | Decimal): Decimal {
  return toDecimal(value).toDecimalPlaces(4, ROUNDING_MODE);
}

/**
 * Formats a number/Decimal to an AED string. e.g. "AED 1,234.56"
 */
export function formatAED(value: string | number | Decimal): string {
  const dec = roundToTwo(value);
  return `AED ${dec.toNumber().toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Converts an amount to words in English.
 */
export function amountInWordsAED(value: string | number | Decimal): string {
  const dec = roundToTwo(value);
  const total = dec.toNumber();
  
  if (total === 0) return 'Zero Dirhams Only';

  const dirhams = Math.floor(total);
  const fils = Math.round((total - dirhams) * 100);

  const dirhamsWords = numberToWords.toWords(dirhams);
  const capitalizedDirhams = capitalizeWords(dirhamsWords);

  if (fils === 0) {
    return `${capitalizedDirhams} Dirhams Only`;
  }

  const filsWords = numberToWords.toWords(fils);
  const capitalizedFils = capitalizeWords(filsWords);

  return `${capitalizedDirhams} Dirhams And ${capitalizedFils} Fils Only`;
}

function capitalizeWords(str: string): string {
  // capitalize first letter of every word
  return str.replace(/\b\w/g, char => char.toUpperCase()).replace(/-/g, ' ');
}

export interface LineItemInput {
  quantity: string | number | Decimal;
  rate: string | number | Decimal;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | null;
  discountValue?: string | number | Decimal | null;
  vatRate?: string | number | Decimal | null;
}

export interface LineItemResult {
  lineSubtotal: Decimal;
  discountAmount: Decimal;
  taxableAmount: Decimal;
  vatAmount: Decimal;
  lineTotal: Decimal;
}

export function calculateLineItem(input: LineItemInput): LineItemResult {
  const quantity = roundToFour(input.quantity);
  const rate = roundToTwo(input.rate);
  const lineSubtotal = roundToTwo(quantity.mul(rate));

  let discountAmount = new Decimal(0);
  if (input.discountValue && input.discountType) {
    const dVal = toDecimal(input.discountValue);
    if (input.discountType === 'PERCENTAGE') {
      discountAmount = roundToTwo(lineSubtotal.mul(dVal).div(100));
    } else if (input.discountType === 'FIXED_AMOUNT') {
      discountAmount = roundToTwo(dVal);
    }
  }

  if (discountAmount.gt(lineSubtotal)) {
    discountAmount = lineSubtotal;
  }

  const taxableAmount = lineSubtotal.sub(discountAmount);

  const vatRate = input.vatRate ? roundToTwo(input.vatRate) : new Decimal(5); // Default 5%
  const vatAmount = roundToTwo(taxableAmount.mul(vatRate).div(100));

  const lineTotal = taxableAmount.add(vatAmount);

  return {
    lineSubtotal,
    discountAmount,
    taxableAmount,
    vatAmount,
    lineTotal,
  };
}

export function calculateDocumentTotals(lines: LineItemResult[]) {
  const subtotal = lines.reduce((acc, line) => acc.add(line.lineSubtotal), new Decimal(0));
  const discountAmount = lines.reduce((acc, line) => acc.add(line.discountAmount), new Decimal(0));
  const taxableAmount = lines.reduce((acc, line) => acc.add(line.taxableAmount), new Decimal(0));
  const vatAmount = lines.reduce((acc, line) => acc.add(line.vatAmount), new Decimal(0));
  const grandTotal = lines.reduce((acc, line) => acc.add(line.lineTotal), new Decimal(0));

  return {
    subtotal: roundToTwo(subtotal),
    discountAmount: roundToTwo(discountAmount),
    taxableAmount: roundToTwo(taxableAmount),
    vatAmount: roundToTwo(vatAmount),
    grandTotal: roundToTwo(grandTotal),
  };
}
