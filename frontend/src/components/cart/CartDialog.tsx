import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import CartItem, { type CartItemProps } from "@/components/cart/CartItem";
import type { CartItem as CartItemType } from "@/types/cart";
import { ShoppingCart, Trash2, ArrowRight, Banknote } from "lucide-react";
import { useCart } from "@/providers/CartProvider";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter as ConfirmFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export interface CartDialogProps {
  items?: Array<CartItemProps | CartItemType>;
  renderTrigger?: boolean;
}

export default function CartDialog({
  items,
  renderTrigger = true,
}: CartDialogProps) {
  const {
    clearCart,
    items: cartItems,
    refreshCart,
    removeFromCart,
    validateLocalCart,
  } = useCart();
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const { isLoggedIn, startGoogleLogin } = useAuth();

  // Fresh product data fetched from database
  type ProductInfo = {
    _id: number;
    name: string;
    basePrice: number;
    discount?: any;
    variants?: Array<{
      stock: any;
      sku: string;
      price?: number;
      priceModifier?: number;
      color?: string;
      size?: string;
      images?: string[];
    }>;
  };
  const [productDataMap, setProductDataMap] = React.useState<
    Record<number, ProductInfo>
  >({});

  // Fetch product data only when dialog is opened or when clicking checkout
  const fetchProductData = React.useCallback(async () => {
    if (cartItems.length === 0) {
      setProductDataMap({});
      return;
    }
    const uniqueProductIds = Array.from(
      new Set(cartItems.map((item) => item.productId)),
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
  }, []); // Remove cartItems from dependency, so it doesn't refetch on cart changes

  // Fetch product data when dialog is opened
  React.useEffect(() => {
    if (open) {
      fetchProductData();
    }
    // Only run when dialog open state changes
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    // For guests, refresh/validate local cart against server products.
    // For logged-in users, validate local cart (remove missing items and persist).
    if (isLoggedIn && typeof validateLocalCart === "function") {
      validateLocalCart().catch(() => {});
    } else if (!isLoggedIn && typeof refreshCart === "function") {
      refreshCart().catch(() => {});
    }

    // If not logged in, validate local cart items against server products
    if (!isLoggedIn) {
      (async () => {
        try {
          const local = cartItems || [];
          if (!local || local.length === 0) return;
          const uniqueIds = Array.from(new Set(local.map((i) => i.productId)));
          const productMap: Record<string, any | null> = {};
          await Promise.all(
            uniqueIds.map(async (id) => {
              try {
                const r = await api.get(`/products/${id}`, {
                  headers: { "x-silent": "1" },
                });
                productMap[String(id)] = r.data || null;
              } catch {
                productMap[String(id)] = null;
              }
            }),
          );
          const removed: Array<{ productId: number; sku: string }> = [];
          for (const it of local) {
            const p = productMap[String(it.productId)];
            if (!p) {
              removeFromCart(it.productId, it.sku);
              removed.push({ productId: it.productId, sku: it.sku });
              continue;
            }
            // If product exists, ensure variant (sku) exists (robust string compare)
            const hasVariant =
              Array.isArray(p.variants) &&
              p.variants.some((v: any) => String(v.sku) === String(it.sku));
            if (!hasVariant) {
              removeFromCart(it.productId, it.sku);
              removed.push({ productId: it.productId, sku: it.sku });
            }
          }
          if (removed.length > 0) {
            toast.error(
              `${removed.length} item(s) removed from cart (no longer available)`,
            );
          }
        } catch {
          // ignore
        }
      })();
    }
    // Only run when dialog open state changes
  }, [open]);

  const currentItems: Array<CartItemType | CartItemProps> =
    (items as CartItemProps[] | undefined) ?? cartItems;

  const total = React.useMemo(() => {
    return currentItems.reduce((sum, i) => {
      const productId = (i as any).productId;
      const qty = (i as any).quantity ?? 1;

      // Get fresh product data
      const freshProduct = productDataMap[productId];
      let basePrice = (i as any).priceAtPurchase ?? (i as any).price ?? 0;

      if (freshProduct) {
        const variant = freshProduct.variants?.find(
          (v) => v.sku === (i as any).sku,
        );
        basePrice = variant?.price ?? freshProduct.basePrice ?? basePrice;
      }

      // Apply fresh discount if it exists
      let finalPrice = basePrice;
      if (freshProduct?.discount && freshProduct.discount.isActive) {
        if (freshProduct.discount.type === "percentage") {
          finalPrice = basePrice * (1 - freshProduct.discount.value / 100);
        } else {
          finalPrice = Math.max(0, basePrice - freshProduct.discount.value);
        }
      }

      return sum + finalPrice * qty;
    }, 0);
  }, [currentItems, productDataMap]);

  const count = currentItems.reduce(
    (sum, i) => sum + ((i as any).quantity ?? 1),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {renderTrigger && (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            data-icon="inline-start"
            className="rounded-full">
            <ShoppingCart className="size-4" />
            <span className="ml-1 hidden md:inline">Cart</span>
            {count > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-foreground text-background text-xs h-5 min-w-5 px-1">
                {count}
              </span>
            )}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-4xl w-screen sm:w-auto p-0">
        <div className="flex flex-col max-h-[80vh]">
          <DialogHeader className="px-6 pt-6">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="size-5 text-primary" />
                Your Cart
              </DialogTitle>
              <div className="md:hidden"></div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 px-4 md:px-6 pb-4">
            {currentItems.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Your cart is empty.
              </div>
            ) : (
              <ScrollArea className="h-full p-4">
                <div className="divide-y">
                  {currentItems.map((item, idx) => {
                    const productId = (item as any).productId;
                    const sku = (item as any).sku;

                    // Get fresh product data from database
                    const freshProduct = productDataMap[productId];
                    const productName =
                      freshProduct?.name ??
                      (item as any).name ??
                      (item as any).title;

                    // Calculate fresh price with current discount
                    let basePrice =
                      (item as any).priceAtPurchase ?? (item as any).price ?? 0;
                    let discountedPrice = basePrice;

                    if (freshProduct) {
                      // Get the variant price if available
                      const variant = freshProduct.variants?.find(
                        (v) => v.sku === sku,
                      );
                      basePrice =
                        variant?.price ?? freshProduct.basePrice ?? basePrice;

                      // Apply fresh discount if it exists
                      if (
                        freshProduct.discount &&
                        freshProduct.discount.isActive
                      ) {
                        if (freshProduct.discount.type === "percentage") {
                          discountedPrice =
                            basePrice * (1 - freshProduct.discount.value / 100);
                        } else {
                          discountedPrice = Math.max(
                            0,
                            basePrice - freshProduct.discount.value,
                          );
                        }
                      }
                    }

                    const hasDiscount = discountedPrice < basePrice;

                    // Find maxQty from variant stock
                    let maxQty = 99;
                    if (freshProduct) {
                      const variant = freshProduct.variants?.find(
                        (v) => v.sku === sku,
                      );
                      if (variant && typeof variant.stock === "number") {
                        maxQty = variant.stock > 0 ? variant.stock : 1;
                      }
                    }
                    return (
                      <CartItem
                        key={idx}
                        productId={productId}
                        sku={sku}
                        image={(item as any).image}
                        title={productName}
                        variant={undefined}
                        price={discountedPrice}
                        originalPrice={hasDiscount ? basePrice : undefined}
                        quantity={(item as any).quantity}
                        color={(item as any).color}
                        size={(item as any).size}
                        discount={
                          hasDiscount
                            ? {
                                type:
                                  freshProduct?.discount?.type ?? "percentage",
                                value:
                                  freshProduct?.discount?.value ??
                                  Math.round(
                                    ((basePrice - discountedPrice) /
                                      basePrice) *
                                      100 || 0,
                                  ),
                                isActive: true,
                              }
                            : undefined
                        }
                        maxQty={maxQty}
                        onRemove={() => removeFromCart(productId, sku)}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter className="border-t px-4 md:px-6 py-4 space-y-4">
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="text-sm bg-muted/40 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Banknote className="size-4" /> Subtotal
                </div>
                <div className="font-semibold">
                  EGP {total.toLocaleString()}
                </div>
              </div>
              <div className="flex-1 md:flex-none w-full md:w-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-full w-full"
                        disabled={currentItems.length === 0}>
                        <Trash2 className="mr-2 size-4" /> Clear Cart
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear cart?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove all items from your cart.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <ConfirmFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            const removedCount = count;
                            clearCart();
                            toast.success("Cart cleared", {
                              description: `${removedCount} item${removedCount === 1 ? "" : "s"} removed`,
                            });
                          }}>
                          Clear
                        </AlertDialogAction>
                      </ConfirmFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    size="sm"
                    className="rounded-full w-full"
                    disabled={currentItems.length === 0}
                    onClick={async () => {
                      await fetchProductData(); // Only fetch here and when dialog opens
                      let invalid = false;
                      for (const item of cartItems) {
                        const productId = item.productId;
                        const sku = item.sku;
                        const freshProduct = productDataMap[productId];
                        if (!freshProduct) continue;
                        const variant = freshProduct.variants?.find(
                          (v) => v.sku === sku,
                        );
                        const stock = variant?.stock ?? 0;
                        if (
                          typeof stock === "number" &&
                          item.quantity > stock
                        ) {
                          invalid = true;
                          break;
                        }
                      }
                      if (invalid) {
                        toast.error(
                          "One or more items exceed available stock. Please review your cart.",
                        );
                        return;
                      }
                      setOpen(false);
                      if (isLoggedIn) {
                        navigate("/checkout");
                      } else {
                        startGoogleLogin("/checkout");
                      }
                    }}>
                    Checkout <ArrowRight className="ml-2 size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
