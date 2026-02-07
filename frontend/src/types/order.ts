import type { Address } from "./auth";
import type { Discount } from "./offer";

export type OrderItem = {
  productId: number;
  sku: string;
  quantity: number;
  priceAtPurchase: number;
  name?: string;
  image?: string;
  originalPrice?: number;
  discountSnapshot?: Discount;
  discountApplied?: boolean;
};

export type PaymentStatus = "pending" | "paid" | "failed";

export type OrderStatus =
  | "processing"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "return-request"
  | "returned";

export type Order = {
  _id: number;
  userId: number;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: "COD" | "InstaPay";
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  shippingFee: number;
  discountTotal?: number;
  promoCode?: string;
  /** Store the discount that was applied at time of order */
  appliedDiscount?: Discount;
  total: number;
  trackingNumber?: string;
  placedAt: string | Date;
  updatedAt?: string | Date;
};
