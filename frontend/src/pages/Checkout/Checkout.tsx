import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";
import type { Address } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import UserAddress from "@/components/common/UserAddress";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Banknote,
  Ticket,
  X,
  MapPin,
  ShoppingCart,
  Truck,
  CreditCard,
} from "lucide-react";
import type { IPromoCode } from "@/types/promo";

import instapay from "@/assets/instapay.png";
import vfcash from "@/assets/vfcash.png";

export default function Checkout() {
  const { user, isLoggedIn, login } = useAuth();
  const { items, clearCart, removeFromCart, promoCode, setPromoCode } =
    useCart();
  const navigate = useNavigate();

  const savedAddresses = useMemo(() => user?.addresses || [], [user]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [newAddress, setNewAddress] = useState<Address>({
    city: "",
    area: "",
    street: "",
    building: "",
    apartment: "",
    notes: "",
  });
  const [usingNew, setUsingNew] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "COD" | "InstaPay" | "VodafoneCash"
  >("COD");

  // Promo Code States
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<IPromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  // Shipping entries fetched from server
  type ShippingEntry = {
    _id: string;
    label?: string;
    price: number;
    currency?: string;
  };
  const [shippingItems, setShippingItems] = useState<ShippingEntry[]>([]);

  // Fresh product data fetched from database
  type ProductInfo = {
    _id: number;
    name: string;
    basePrice: number;
    discount?: any;
    variants?: Array<{
      sku: string;
      price?: number;
      priceModifier?: number;
      color?: string;
      size?: string;
      images?: string[];
    }>;
  };
  const [productDataMap, setProductDataMap] = useState<
    Record<number, ProductInfo>
  >({});

  useEffect(() => {
    if (!isLoggedIn) return;
    if (!user?.phone) {
      navigate(
        `/complete-register?redirect=${encodeURIComponent("/checkout")}`,
      );
    }
  }, [isLoggedIn, user?.phone, navigate]);

  // Sync promo code from cart to checkout
  useEffect(() => {
    if (promoCode) {
      // Load and validate the promo code from cart
      const validateStoredPromo = async () => {
        try {
          const { data } = await api.get<IPromoCode>(
            `/promos/validate/${promoCode}`,
          );
          setAppliedPromo(data);
          setPromoInput(promoCode);
        } catch {
          // If promo is invalid, clear it
          setPromoCode(undefined);
          setAppliedPromo(null);
          setPromoInput("");
        }
      };
      validateStoredPromo();
    }
  }, [promoCode]);

  // Fetch fresh product data from database when items change
  useEffect(() => {
    if (items.length === 0) {
      setProductDataMap({});
      return;
    }

    const fetchProductData = async () => {
      const uniqueProductIds = Array.from(
        new Set(items.map((item) => item.productId)),
      );

      const fetchedData: Record<number, ProductInfo> = {};
      await Promise.all(
        uniqueProductIds.map(async (productId) => {
          try {
            const { data } = await api.get(`/products/${productId}`, {
              headers: { "x-silent": "1" },
            });
            fetchedData[productId] = data;
          } catch {
            // If fetch fails, we'll fall back to cart data
          }
        }),
      );

      setProductDataMap(fetchedData);
    };

    fetchProductData();
  }, [items]);

  // Fetch shipping fees once
  useEffect(() => {
    const loadShipping = async () => {
      try {
        const res = await api.get("/shipping", {
          headers: { "x-silent": "1" },
        });
        setShippingItems(Array.isArray(res.data?.items) ? res.data.items : []);
      } catch {
        // ignore; default shipping is 0
      }
    };
    loadShipping();
  }, []);

  const addressValid = (a: Address) =>
    !!a.city?.trim() &&
    !!a.area?.trim() &&
    !!a.street?.trim() &&
    !!a.building?.trim();

  const chosenAddress: Address | null = usingNew
    ? newAddress
    : savedAddresses[selectedIndex] || null;

  const canPlace =
    isLoggedIn &&
    items.length > 0 &&
    !!user?.phone &&
    !!chosenAddress &&
    addressValid(chosenAddress);

  // Helper to get fresh product data or fallback to cart data
  const getProductData = (productId: number) => {
    return productDataMap[productId];
  };

  // Helper to calculate price with current discount
  const getPriceWithDiscount = (productId: number, basePrice: number) => {
    const product = getProductData(productId);
    if (!product?.discount) return basePrice;

    const discount = product.discount;
    if (!discount || !discount.isActive) return basePrice;

    if (discount.type === "percentage") {
      return basePrice * (1 - discount.value / 100);
    } else {
      return Math.max(0, basePrice - discount.value);
    }
  };

  // Calculate fresh subtotal using current product prices and discounts
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const freshProduct = getProductData(item.productId);
      let basePrice = item.priceAtPurchase;

      if (freshProduct) {
        const variant = freshProduct.variants?.find((v) => v.sku === item.sku);
        basePrice =
          variant?.price ?? freshProduct.basePrice ?? item.priceAtPurchase;
      }

      // Apply fresh discount if available
      const finalPrice = getPriceWithDiscount(item.productId, basePrice);
      return sum + finalPrice * item.quantity;
    }, 0);
  }, [items, productDataMap]);

  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === "percentage") {
      return (subtotal * appliedPromo.value) / 100;
    }
    return appliedPromo.value;
  }, [appliedPromo, subtotal]);

  const shippingFee = useMemo(() => {
    const city = chosenAddress?.city?.trim().toLowerCase();
    if (!city) return 0;
    const entry = shippingItems.find(
      (it) => (it.label || "").trim().toLowerCase() === city,
    );
    return typeof entry?.price === "number" ? entry!.price : 0;
  }, [chosenAddress?.city, shippingItems]);
  const total = subtotal - discountAmount + shippingFee;

  const onApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setValidatingPromo(true);
    setPromoError(null);
    try {
      const { data } = await api.get<IPromoCode>(
        `/promos/validate/${promoInput.trim()}`,
      );
      // Extra frontend validation for minOrderAmount
      if (data.minOrderAmount && subtotal < data.minOrderAmount) {
        setPromoError(
          `This promo requires a minimum order of EGP ${data.minOrderAmount}`,
        );
        return;
      }
      setAppliedPromo(data);
      setPromoCode(promoInput.trim());
      toast.success("Promo code applied!");
    } catch (e: any) {
      setPromoError(e.response?.data?.message || "Invalid promo code");
    } finally {
      setValidatingPromo(false);
    }
  };

  const onRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError(null);
    setPromoCode(undefined);
  };

  const onSaveNewAddress = async () => {
    if (!user) return;
    if (!addressValid(newAddress)) {
      toast.error("Please complete the required address fields");
      return;
    }
    try {
      setSavingAddress(true);
      const existing = Array.isArray(user.addresses) ? user.addresses : [];
      const nextAddresses = [...existing, newAddress];
      const { data } = await api.patch(`/users/${user._id}`, {
        addresses: nextAddresses,
      });
      const updatedAddresses = Array.isArray(data.addresses)
        ? data.addresses
        : nextAddresses;
      login({
        ...user,
        addresses: updatedAddresses,
      });
      // Select the newly saved address and close the new-address form
      setUsingNew(false);
      setSelectedIndex(updatedAddresses.length - 1);
      toast.success("Address saved to your profile");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const onPlaceOrder = async () => {
    if (!user) return;
    if (!canPlace) return;
    setPlacing(true);
    try {
      // Validate items against server state (ensure product & variant still available and stock is sufficient)
      const validatedItems = [] as typeof items;
      for (const i of items) {
        try {
          const res = await api.get(`/products/${i.productId}`);
          const p = res.data;
          const variant = Array.isArray(p.variants)
            ? p.variants.find((v: any) => v.sku === i.sku)
            : null;
          if (!variant) {
            removeFromCart(i.productId, i.sku);
            toast.error(
              `${p.name || `Product ${i.productId}`} has gone out of stock, so it got removed from your cart`,
            );
            setPlacing(false);
            return;
          }
          const stock =
            typeof variant.stock === "number" ? variant.stock : undefined;
          if (stock === 0) {
            removeFromCart(i.productId, i.sku);
            toast.error(
              `${p.name || `Product ${i.productId}`} has gone out of stock, so it got removed from your cart`,
            );
            setPlacing(false);
            return;
          }
          if (typeof stock === "number" && i.quantity > stock) {
            removeFromCart(i.productId, i.sku);
            toast.error(
              `We removed ${i.quantity - stock} from ${p.name || `Product ${i.productId}`} due to stock level`,
            );
            setPlacing(false);
            return;
          }
          // Use server-side variant price (or product basePrice)
          const serverPrice = variant.price ?? p.basePrice ?? 0;
          validatedItems.push({
            ...i,
            priceAtPurchase: serverPrice,
          });
        } catch (e: any) {
          toast.error(
            e?.message || `Failed to validate product ${i.productId}`,
          );
          setPlacing(false);
          return;
        }
      }
      const payload = {
        userId: user._id,
        items: validatedItems.map((i) => ({
          productId: i.productId,
          sku: i.sku,
          quantity: i.quantity,
          priceAtPurchase: i.priceAtPurchase,
        })),
        shippingAddress: chosenAddress,
        paymentMethod,
        subtotal,
        shippingFee,
        discountTotal: discountAmount,
        promoCode: appliedPromo?.code,
        total,
      };
      const { data } = await api.post("/orders", payload);
      clearCart();
      navigate("/orders", {
        state: {
          checkoutSuccess: {
            orderId: data?._id,
            paymentMethod,
          },
        },
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/shop">Products</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Checkout</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping Address */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Shipping Address
          </div>
          <RadioGroup
            value={usingNew ? "new" : String(selectedIndex)}
            onValueChange={(val) => {
              if (val === "new") setUsingNew(true);
              else {
                setUsingNew(false);
                setSelectedIndex(parseInt(val, 10) || 0);
              }
            }}>
            {savedAddresses.map((a, idx) => (
              <label
                key={idx}
                className="flex items-start gap-3 p-3 rounded-2xl border cursor-pointer hover:bg-accent/40">
                <RadioGroupItem value={String(idx)} />
                <div className="text-sm">
                  <div className="font-medium">
                    {a.city} {a.area ? `• ${a.area}` : ""}
                  </div>
                  <div className="text-muted-foreground">
                    {a.street} {a.building ? `• ${a.building}` : ""}
                  </div>
                </div>
              </label>
            ))}
            <label className="flex items-center gap-3 p-3 rounded-2xl border cursor-pointer hover:bg-accent/40">
              <RadioGroupItem value="new" />
              <div className="text-sm font-medium">Use a new address</div>
            </label>
          </RadioGroup>
          {usingNew && (
            <>
              <UserAddress value={newAddress} onChange={setNewAddress} />
              <div className="mt-2 flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onSaveNewAddress}
                  disabled={!addressValid(newAddress) || savingAddress}>
                  {savingAddress
                    ? "Saving address…"
                    : "Save this address to My Addresses"}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ShoppingCart className="h-4 w-4" />
            Order Summary
          </div>
          <div className="rounded-2xl border divide-y">
            {items.map((i) => {
              // Get fresh product data from database
              const freshProduct = getProductData(i.productId);
              const productName = freshProduct?.name ?? i.name;

              // Calculate fresh price with current discount
              let basePrice = i.priceAtPurchase;
              let discountedPrice = basePrice;

              if (freshProduct) {
                // Get the variant price if available
                const variant = freshProduct.variants?.find(
                  (v) => v.sku === i.sku,
                );
                basePrice =
                  variant?.price ?? freshProduct.basePrice ?? i.priceAtPurchase;

                // Apply fresh discount if it exists
                discountedPrice = getPriceWithDiscount(i.productId, basePrice);
              }

              const hasDiscount =
                freshProduct?.discount &&
                freshProduct.discount.isActive &&
                discountedPrice < basePrice;
              const discountPercent = hasDiscount
                ? Math.round(
                    ((basePrice - discountedPrice) / basePrice) * 100 || 0,
                  )
                : 0;

              const finalPrice = hasDiscount ? discountedPrice : basePrice;

              return (
                <div
                  key={`${i.productId}-${i.sku}`}
                  className="p-3 flex items-start justify-between text-sm">
                  <div className="flex-1 pr-2">
                    <div className="font-medium line-clamp-1">
                      {productName}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      x{i.quantity} • {i.sku}
                    </div>
                    {hasDiscount && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-xs text-muted-foreground line-through">
                          EGP {(basePrice * i.quantity).toLocaleString()}
                        </span>
                        <Badge
                          variant="default"
                          className="text-[9px] h-4 px-0.5 shrink-0">
                          {discountPercent}% OFF
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="font-medium text-right">
                    {hasDiscount && (
                      <div className="text-xs text-muted-foreground line-through">
                        EGP {(basePrice * i.quantity).toLocaleString()}
                      </div>
                    )}
                    <div
                      className={
                        hasDiscount ? "text-primary font-semibold" : ""
                      }>
                      EGP {(finalPrice * i.quantity).toLocaleString()}
                    </div>
                    {hasDiscount && (
                      <div className="text-[10px] text-green-600 font-medium">
                        Save EGP{" "}
                        {(
                          (basePrice - finalPrice) *
                          i.quantity
                        ).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="p-3 space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Promo Code
              </div>
              {!appliedPromo ? (
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Enter code"
                        value={promoInput}
                        onChange={(e) =>
                          setPromoInput(e.target.value.toUpperCase())
                        }
                        className="w-full pl-9 pr-3 py-2 bg-accent/30 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={onApplyPromo}
                      disabled={!promoInput.trim() || validatingPromo}
                      className="rounded-xl">
                      {validatingPromo ? "..." : "Apply"}
                    </Button>
                  </div>
                  {promoError && (
                    <div className="text-[10px] text-destructive px-1">
                      {promoError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-success">
                      {appliedPromo.code}
                    </span>
                    <span className="text-[10px] bg-green-500/20 text-green-500 px-1.5 rounded-full">
                      {appliedPromo.type === "percentage"
                        ? `${appliedPromo.value}% OFF`
                        : `EGP ${appliedPromo.value} OFF`}
                    </span>
                  </div>
                  <button
                    onClick={onRemovePromo}
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Banknote className="h-4 w-4" />
                Subtotal
              </div>
              <div className="font-medium">EGP {subtotal.toLocaleString()}</div>
            </div>
            {discountAmount > 0 && (
              <div className="p-3 flex items-center justify-between text-sm text-green-500 bg-accent">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  <span>Discount</span>
                  {appliedPromo && (
                    <span className="text-[10px] font-bold">
                      ({appliedPromo.code})
                    </span>
                  )}
                </div>
                <div className="font-bold">
                  - EGP {discountAmount.toLocaleString()}
                </div>
              </div>
            )}
            <div className="p-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck className="h-4 w-4" />
                Shipping
              </div>
              <div className="font-medium">
                EGP {shippingFee.toLocaleString()}
              </div>
            </div>
            <div className="p-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <ShoppingCart className="h-4 w-4" />
                Total
              </div>
              <div className="font-semibold">EGP {total.toLocaleString()}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Payment Method
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("COD")}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-sm transition hover:bg-accent/40 ${paymentMethod === "COD" ? "ring-2 ring-foreground" : "ring-0"}`}>
                <Banknote className="h-5 w-5 text-emerald-500" />
                <div className="flex-1">
                  <div className="font-medium">Cash on Delivery</div>
                  <div className="text-xs text-muted-foreground">
                    Pay in cash when your order arrives.
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("InstaPay")}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-sm transition hover:bg-accent/40 ${paymentMethod === "InstaPay" ? "ring-2 ring-foreground" : "ring-0"}`}>
                <img
                  src={instapay}
                  alt="InstaPay"
                  className="h-8 w-8 rounded-md object-contain bg-white"
                  loading="lazy"
                />
                <div className="flex-1">
                  <div className="font-medium">InstaPay transfer</div>
                  <div className="text-xs text-muted-foreground">
                    Place your order now, then send a transfer and confirm with
                    us.
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("VodafoneCash")}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-sm transition hover:bg-accent/40 ${paymentMethod === "VodafoneCash" ? "ring-2 ring-foreground" : "ring-0"}`}>
                <img
                  src={vfcash}
                  alt="Vodafone Cash"
                  className="h-8 w-8 rounded-md object-contain bg-white"
                  loading="lazy"
                />
                <div className="flex-1">
                  <div className="font-medium">Vodafone Cash transfer</div>
                  <div className="text-xs text-muted-foreground">
                    Place your order now, then send a Vodafone Cash transfer and
                    confirm with us.
                  </div>
                </div>
              </button>
            </div>
          </div>
          <Button
            onClick={onPlaceOrder}
            disabled={!canPlace || placing}
            className="w-full">
            {placing ? "Placing Order…" : "Place Order"}
          </Button>
          {items.length === 0 && (
            <div className="text-xs text-muted-foreground text-center">
              Your cart is empty. Add some items from the shop to place an
              order.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
