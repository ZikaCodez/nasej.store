import { IAddress } from "./user";

export interface IOrderItem {
  productId: number;
  name: string; // Snapshot of name
  sku: string; // The specific variant bought
  quantity: number;
  priceAtPurchase: number;
  image: string;
}

export interface IOrder {
  _id?: number;
  userId: number;
  items: IOrderItem[];
  shippingAddress: IAddress;
  paymentMethod: "COD" | "InstaPay" | "VodafoneCash";
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus:
    | "processing" // Customer placed order, still editable
    | "confirmed" // Merchant confirmed, preparing order
    | "shipped"
    | "delivered"
    | "cancelled"
    | "return-request"
    | "returned";
  subtotal: number;
  shippingFee: number;
  discountTotal?: number;
  promoCode?: string;
  total: number;
  trackingNumber?: string;
  placedAt: Date;
  updatedAt?: Date;
}
