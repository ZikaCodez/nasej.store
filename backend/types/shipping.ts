export interface ShippingEntry {
  _id: string; // governorate id string (matches frontend egyptLocations GOVERNORATES ids)
  label?: string; // human label (e.g., "Cairo - القاهرة")
  price: number; // non-negative number (EGP)
  currency?: string; // default EGP
  updatedAt?: Date;
}

export interface ShippingListResult {
  items: ShippingEntry[];
  total: number;
}
