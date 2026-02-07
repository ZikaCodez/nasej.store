import type { Discount } from "./offer";

export type ProductStatus = "active" | "inactive" | "archived";

export type ProductListItem = {
  _id: number;
  name: string;
  slug: string;
  basePrice: number;
  category?: number; // category id
  isFeatured?: boolean;
  isActive?: boolean;
  status?: ProductStatus;
  updatedAt?: string | Date;
  thumbnail?: string | null;
  discount?: Discount;
};
