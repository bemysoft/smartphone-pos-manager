/**
 * Core calculation engine for NexusPOS POS & ERP.
 * Handles subtotal, line discounts, promotional rules, tax calculations, loyalty points, and cash changes.
 */

export interface CartCalculationInput {
  items: {
    price: number;
    quantity: number;
    discountPercent?: number;
    discountAmount?: number;
  }[];
  globalDiscountPercent?: number;
  globalDiscountAmount?: number;
  taxPercent?: number;
  loyaltyPointsRedeemed?: number;
  pointsToCurrencyRatio?: number; // default: 1 point = 1000 IDR
}

export interface CalculationResult {
  itemsSubtotal: number;
  lineDiscountTotal: number;
  globalDiscountTotal: number;
  totalDiscount: number;
  taxableAmount: number;
  taxTotal: number;
  pointsDiscountTotal: number;
  grandTotal: number;
}

/**
 * Calculates financial breakdown for POS cart transactions
 */
export function calculateCartTotals(input: CartCalculationInput): CalculationResult {
  const pointsRatio = input.pointsToCurrencyRatio ?? 1000;
  
  let itemsSubtotal = 0;
  let lineDiscountTotal = 0;

  for (const item of input.items) {
    const rawPrice = item.price * item.quantity;
    itemsSubtotal += rawPrice;

    let lineDiscount = 0;
    if (item.discountPercent && item.discountPercent > 0) {
      lineDiscount += (rawPrice * item.discountPercent) / 100;
    }
    if (item.discountAmount && item.discountAmount > 0) {
      lineDiscount += item.discountAmount;
    }
    lineDiscountTotal += Math.min(lineDiscount, rawPrice);
  }

  const subtotalAfterLineDiscounts = Math.max(0, itemsSubtotal - lineDiscountTotal);

  let globalDiscountTotal = 0;
  if (input.globalDiscountPercent && input.globalDiscountPercent > 0) {
    globalDiscountTotal += (subtotalAfterLineDiscounts * input.globalDiscountPercent) / 100;
  }
  if (input.globalDiscountAmount && input.globalDiscountAmount > 0) {
    globalDiscountTotal += input.globalDiscountAmount;
  }
  globalDiscountTotal = Math.min(globalDiscountTotal, subtotalAfterLineDiscounts);

  const totalDiscount = lineDiscountTotal + globalDiscountTotal;
  const taxableAmount = Math.max(0, itemsSubtotal - totalDiscount);

  let taxTotal = 0;
  if (input.taxPercent && input.taxPercent > 0) {
    taxTotal = Math.round((taxableAmount * input.taxPercent) / 100);
  }

  const pointsDiscountTotal = Math.max(0, (input.loyaltyPointsRedeemed || 0) * pointsRatio);
  const grandTotal = Math.max(0, taxableAmount + taxTotal - pointsDiscountTotal);

  return {
    itemsSubtotal,
    lineDiscountTotal,
    globalDiscountTotal,
    totalDiscount,
    taxableAmount,
    taxTotal,
    pointsDiscountTotal,
    grandTotal,
  };
}

/**
 * Calculates change for cash payments
 */
export function calculateChange(grandTotal: number, cashReceived: number): {
  change: number;
  isSufficient: boolean;
  shortfall: number;
} {
  const change = cashReceived - grandTotal;
  return {
    change: Math.max(0, change),
    isSufficient: change >= 0,
    shortfall: Math.max(0, -change),
  };
}

/**
 * Formats a numeric value into Indonesian Rupiah (IDR) currency string
 */
export function formatCurrencyIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
