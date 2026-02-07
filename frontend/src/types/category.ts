export type Category = {
  _id: number;
  name: string;
  slug: string;
  parentCategory?: string;
  image?: string;
  description?: string;
  sizeChart?: string;
  productCount?: number;
  discount?: {
    type: "percentage" | "fixed";
    value: number;
    isActive: boolean;
  };
};
