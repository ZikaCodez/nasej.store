export type PromoCode = {
  _id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
  minOrderAmount?: number;
  usageLimit?: number;
  usageCount: number;
  startDate?: string | Date;
  endDate?: string | Date;
};

export type Discount = {
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
  startDate?: string | Date;
  endDate?: string | Date;
};
