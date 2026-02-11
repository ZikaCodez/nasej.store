import { IColor } from "./color";

export interface IDiscount {
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface IVariant {
  sku: string; // e.g., "TSHIRT-BLU-L"
  color: IColor["_id"]; // color id, lowercase name
  size: "S" | "M" | "L" | "XL" | "XXL" | "OS";
  priceModifier: number; // Added to basePrice
  images: string[]; // Color-specific photos
  stock: number; // Available quantity for this variant
}

export interface IProduct {
  _id?: number; // MongoDB ObjectId
  name: string;
  slug: string; // URL-friendly name
  description: string;
  basePrice: number;
  category: number; // Category id (number)
  tags: string[]; // e.g., ["summer", "oversized"]
  variants: IVariant[];
  isFeatured: boolean;
  isActive: boolean; // For "Soft Deletes"
  createdAt: Date;
  updatedAt: Date;
  discount?: IDiscount;
}
