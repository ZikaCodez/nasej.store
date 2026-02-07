export type CartItem = {
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  priceAtPurchase: number;
  originalPrice?: number; // Pre-discount price for display purposes
  image?: string;
  color?: string;
  size?: string;
};

export type CartState = {
  items: CartItem[];
  promoCode?: string;
};

export type CartContextValue = {
  items: CartItem[];
  promoCode?: string;
  setPromoCode: (code: string | undefined) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number, sku: string) => void;
  clearCart: () => void;
  updateItemQuantity: (
    productId: number,
    sku: string,
    quantity: number,
  ) => void;
  updateItemVariant: (
    productId: number,
    sku: string,
    nextSku: string,
    nextPrice: number,
    nextImage?: string,
    nextColor?: string,
    nextSize?: string,
  ) => void;
  cartTotal: number;
  itemCount: number;
  refreshCart?: () => Promise<void>;
  validateLocalCart?: () => Promise<void>;
};
