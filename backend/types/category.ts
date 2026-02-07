export interface IDiscount {
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface ICategory {
  _id?: number;
  name: string; // e.g., "T-Shirts"
  slug: string; // e.g., "t-shirts"
  parentCategory?: string; // For sub-categories (e.g., "Tops" -> "T-Shirts")
  image?: string;
  sizeChart?: string; // optional URL to size chart image
  description?: string;
}
