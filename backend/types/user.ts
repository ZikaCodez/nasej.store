export interface IAddress {
  street: string;
  city: string;
  governorate: string;
  buildingNumber: string;
  apartmentNumber?: string;
  isDefault: boolean;
}

export interface IUser {
  _id: number; // 6-digit integer
  googleId: string; // Unique ID from Google
  email: string;
  name: string;
  phone?: string; // Optional on creation, required for Checkout
  role: "customer" | "admin" | "editor";
  avatar?: string; // Google profile picture
  addresses: IAddress[];
  wishlist: number[]; // Array of Product IDs
  cartItems: ICartItem[]; // Persisted cart items
  createdAt: Date;
  lastLogin?: Date;
}

export interface ICartItem {
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  priceAtPurchase: number;
  image?: string;
  color?: string;
  size?: string;
}
