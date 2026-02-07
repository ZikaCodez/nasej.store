/**
 * Discount utilities for calculating prices and formatting discount labels
 */

export interface Discount {
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
  startDate?: string | Date;
  endDate?: string | Date;
}

/**
 * Check if a discount is currently valid (active and within date range)
 */
export function isDiscountValid(discount?: Discount): boolean {
  if (!discount || !discount.isActive) return false;

  const now = new Date();
  if (discount.startDate && now < new Date(discount.startDate)) return false;
  if (discount.endDate && now > new Date(discount.endDate)) return false;

  return true;
}

/**
 * Calculate the final price after discount
 */
export function calculateDiscountedPrice(
  basePrice: number,
  discount?: Discount,
): number {
  if (!isDiscountValid(discount)) return basePrice;

  if (discount && discount.type === "percentage") {
    return Math.max(0, basePrice * (1 - discount.value / 100));
  } else if (discount && discount.type === "fixed") {
    return Math.max(0, basePrice - discount.value);
  }

  return basePrice;
}

/**
 * Get discount label (e.g., "20% OFF" or "50 EGP OFF")
 */
export function getDiscountLabel(discount?: Discount): string | null {
  if (!isDiscountValid(discount)) return null;

  if (discount && discount.type === "percentage") {
    return `${Math.round(discount.value)}% OFF`;
  } else if (discount && discount.type === "fixed") {
    return `${Math.round(discount.value)} EGP OFF`;
  }

  return null;
}

/**
 * Calculate savings amount
 */
export function calculateSavings(
  basePrice: number,
  discount?: Discount,
): number {
  if (!isDiscountValid(discount)) return 0;

  const discountedPrice = calculateDiscountedPrice(basePrice, discount);
  return Math.max(0, basePrice - discountedPrice);
}

/**
 * Check if any discount object is valid
 */
export function hasValidDiscount(discount?: Discount): boolean {
  return isDiscountValid(discount);
}

/**
 * Check if all variants have the same discount
 * If all variants have the same valid discount, it can be shown as product-level
 */
export function getAllVariantsHaveSameDiscount(
  variants: Array<{ discount?: Discount }>,
): Discount | null {
  if (!variants || variants.length === 0) return null;

  // Get all valid discounts from variants
  const validDiscounts = variants
    .map((v) => v.discount)
    .filter((d): d is Discount => d != null && isDiscountValid(d));

  // If no discounts or not all variants have discounts, return null
  if (validDiscounts.length !== variants.length) return null;

  // Check if all discounts are identical
  const firstDiscount = validDiscounts[0];
  if (!firstDiscount) return null;

  const allSame = validDiscounts.every(
    (d) =>
      d && d.type === firstDiscount.type && d.value === firstDiscount.value,
  );

  return allSame ? firstDiscount : null;
}
