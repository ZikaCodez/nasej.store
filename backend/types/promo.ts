export interface IPromoCode {
  _id?: number;
  code: string; // uppercase
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
  minOrderAmount?: number;
  usageLimit?: number;
  usageCount: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
}
