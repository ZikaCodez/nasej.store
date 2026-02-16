export interface IPromoCode {
  _id?: number;
  code: string; // uppercase
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
  minOrderAmount?: number;
  usageLimit?: number;
  usageCount: number;
  oncePerCustomer?: boolean; // If true, only one use per customer (default: true)
  startDate?: string | Date;
  endDate?: string | Date;
  createdAt: string | Date;
  updatedAt?: string | Date;
}
