import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import type { CartContextValue, CartItem, CartState } from "@/types/cart";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import { toast } from "sonner";

const CART_STORAGE_KEY = "nasej_cart";

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Initialize cart state from localStorage synchronously to avoid an effect
  // race where a later persist effect could overwrite an existing `nasej_cart`.
  const [state, setState] = useState<CartState>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          items: Array.isArray(parsed.items) ? parsed.items : parsed,
          promoCode: parsed.promoCode,
        };
      }
    } catch {
      // ignore
    }
    return { items: [] };
  });
  const { user, isLoggedIn, sessionVerified } = useAuth();
  const lastSyncedRef = useRef<string>("");

  // initial state loaded synchronously above; no effect needed

  // On login, merge server cart with any local cart in localStorage and persist merged result.
  useEffect(() => {
    if (!isLoggedIn || !user) return;

    (async () => {
      try {
        const serverItems = Array.isArray(user.cartItems) ? user.cartItems : [];

        // Load local storage cart if available
        let localItems: CartItem[] = [];
        try {
          const raw = localStorage.getItem(CART_STORAGE_KEY);
          if (raw) localItems = JSON.parse(raw);
        } catch {
          localItems = [];
        }

        // If local and server carts are identical JSON, treat server as canonical to avoid double-merge
        try {
          const serverJson = JSON.stringify(serverItems || []);
          const localJson = JSON.stringify(localItems || []);
          if (serverJson === localJson) {
            // Use server cart as-is and avoid merging (prevents doubling quantities)
            setState({ items: serverItems || [] });
            lastSyncedRef.current = serverJson;
            return;
          }
        } catch {
          // fall through to merge
        }

        // Merge server + local by productId+sku, summing quantities and preferring local variant details
        const keyFor = (it: any) =>
          `${String(it.productId)}::${String(it.sku)}`;
        const map = new Map<string, CartItem>();
        (serverItems || []).forEach((it: any) => {
          map.set(keyFor(it), { ...it });
        });
        (localItems || []).forEach((it: any) => {
          const k = keyFor(it);
          if (map.has(k)) {
            const existing = map.get(k)!;
            map.set(k, {
              ...existing,
              quantity: (existing.quantity || 0) + (it.quantity || 0),
              image: it.image ?? existing.image,
              color: it.color ?? existing.color,
              size: it.size ?? existing.size,
              priceAtPurchase: it.priceAtPurchase ?? existing.priceAtPurchase,
            });
          } else {
            map.set(k, { ...it });
          }
        });

        const merged = Array.from(map.values());

        // Update local state and localStorage
        setState({ items: merged });

        // Persist merged cart to server if it differs from serverItems
        const serverJson = JSON.stringify(serverItems || []);
        const mergedJson = JSON.stringify(merged || []);
        try {
          lastSyncedRef.current = mergedJson;
        } catch {
          lastSyncedRef.current = "";
        }

        if (mergedJson !== serverJson) {
          try {
            if (Number.isFinite(user._id)) {
              await api.patch(
                `/users/${user._id}`,
                { cartItems: merged },
                { headers: { "x-silent": "1" } },
              );
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?._id]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state.items, state.promoCode]);

  // Persist to backend when logged in and session verified (avoid local-only users)
  useEffect(() => {
    const persist = async () => {
      if (
        isLoggedIn &&
        sessionVerified &&
        user &&
        Number.isFinite(user._id) &&
        state.items.length >= 0
      ) {
        // Avoid re-persisting when items are identical to last synced server copy
        try {
          const cur = JSON.stringify(state.items || []);
          if (cur === lastSyncedRef.current) return;
        } catch {
          // continue
        }
        try {
          await api.patch(
            `/users/${user._id}`,
            { cartItems: state.items },
            { headers: { "x-silent": "1" } },
          );
          try {
            lastSyncedRef.current = JSON.stringify(state.items || []);
          } catch {
            lastSyncedRef.current = "";
          }
        } catch {
          // ignore
        }
      }
    };
    persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, sessionVerified, user?._id, state.items]);

  const addToCart = useCallback((item: CartItem) => {
    setState((prev) => {
      const idx = prev.items.findIndex(
        (i) =>
          String(i.productId) === String(item.productId) && i.sku === item.sku,
      );
      const items = [...prev.items];
      if (idx >= 0) {
        items[idx] = {
          ...items[idx],
          quantity: items[idx].quantity + item.quantity,
          // Persist latest color/size if provided
          color: item.color ?? items[idx].color,
          size: item.size ?? items[idx].size,
        };
      } else {
        items.push(item);
      }
      return { items };
    });
  }, []);

  const removeFromCart = useCallback((productId: number, sku: string) => {
    setState((prev) => ({
      items: prev.items.filter(
        (i) => !(String(i.productId) === String(productId) && i.sku === sku),
      ),
    }));
  }, []);

  const clearCart = useCallback(() => setState({ items: [] }), []);

  const setPromoCode = useCallback((code: string | undefined) => {
    setState((prev) => ({
      ...prev,
      promoCode: code,
    }));
  }, []);

  const updateItemQuantity = useCallback(
    (productId: number, sku: string, quantity: number) => {
      setState((prev) => {
        const items = prev.items.map((i) => {
          if (String(i.productId) === String(productId) && i.sku === sku) {
            return { ...i, quantity: Math.max(1, quantity) };
          }
          return i;
        });
        return { items };
      });
    },
    [],
  );

  const cartTotal = useMemo(
    () =>
      state.items.reduce((sum, i) => sum + i.priceAtPurchase * i.quantity, 0),
    [state.items],
  );

  const itemCount = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items],
  );

  const updateItemVariant = useCallback(
    (
      productId: number,
      sku: string,
      nextSku: string,
      nextPrice: number,
      nextImage?: string,
      nextColor?: string,
      nextSize?: string,
    ) => {
      setState((prev) => {
        const items = prev.items.map((i) => {
          if (String(i.productId) === String(productId) && i.sku === sku) {
            return {
              ...i,
              sku: nextSku,
              priceAtPurchase: nextPrice,
              image: nextImage ?? i.image,
              color: nextColor ?? i.color,
              size: nextSize ?? i.size,
            };
          }
          return i;
        });
        return { items };
      });
    },
    [],
  );

  // Define refreshCart as a stable callback so consumers don't retrigger effects when cart state changes
  const refreshCart = useCallback(async () => {
    if (!isLoggedIn || !user) return;
    try {
      const serverItems = Array.isArray(user.cartItems) ? user.cartItems : [];
      if (serverItems.length === 0) {
        setState({ items: [] });
        try {
          lastSyncedRef.current = JSON.stringify([]);
        } catch {
          lastSyncedRef.current = "";
        }
        return;
      }
      const uniqueIds = Array.from(
        new Set(serverItems.map((i: any) => i.productId)),
      );
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
      const filtered: typeof serverItems = [];
      for (const it of serverItems) {
        const p = productMap[String(it.productId)];
        if (!p || !Array.isArray(p.variants) || p.variants.length === 0)
          continue;
        const v = p.variants.find((v: any) => String(v.sku) === String(it.sku));
        if (!v) continue;
        const stock = typeof v.stock === "number" ? v.stock : undefined;
        if (stock === 0) {
          toast.error(
            `${p.name} has gone out of stock, so it got removed from your cart`,
          );
          continue;
        }
        if (typeof stock === "number" && it.quantity > stock) {
          toast.error(
            `We removed ${it.quantity - stock} from ${p.name} due to stock level`,
          );
          filtered.push({ ...it, quantity: stock });
        } else {
          filtered.push(it);
        }
      }
      // Update local state and localStorage
      setState({ items: filtered });

      // Persist merged cart to server if it differs from serverItems
      const mergedJson = JSON.stringify(filtered || []);
      try {
        lastSyncedRef.current = mergedJson;
      } catch {
        lastSyncedRef.current = "";
      }
    } catch {
      // ignore errors (silent)
    }
  }, [isLoggedIn, user]);

  // Validate current local cart items against product/variant existence.
  // Removes missing items locally and, if logged-in, persists the cleaned cart to the server.
  const validateLocalCart = useCallback(async () => {
    try {
      const local = state.items || [];
      if (!local || local.length === 0) return;
      const uniqueIds = Array.from(new Set(local.map((i: any) => i.productId)));
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
      const filtered: typeof local = [];
      for (const it of local) {
        const p = productMap[String(it.productId)];
        if (!p || !Array.isArray(p.variants) || p.variants.length === 0)
          continue;
        const v = p.variants.find((v: any) => String(v.sku) === String(it.sku));
        if (!v) continue;
        const stock = typeof v.stock === "number" ? v.stock : undefined;
        if (stock === 0) {
          toast.error(
            `${p.name} has gone out of stock, so it got removed from your cart`,
          );
          continue;
        }
        if (typeof stock === "number" && it.quantity > stock) {
          toast.error(
            `We removed ${it.quantity - stock} from ${p.name} due to stock level`,
          );
          filtered.push({ ...it, quantity: stock });
        } else {
          filtered.push(it);
        }
      }
      // Update local state and localStorage
      setState({ items: filtered });

      // Persist merged cart to server if it differs from serverItems
      const mergedJson = JSON.stringify(filtered || []);
      try {
        lastSyncedRef.current = mergedJson;
      } catch {
        lastSyncedRef.current = "";
      }
    } catch {
      // ignore
    }
  }, [state.items, isLoggedIn, user]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      promoCode: state.promoCode,
      setPromoCode,
      refreshCart,
      validateLocalCart,
      addToCart,
      removeFromCart,
      clearCart,
      updateItemQuantity,
      updateItemVariant,
      cartTotal,
      itemCount,
    }),
    [
      state.items,
      state.promoCode,
      cartTotal,
      itemCount,
      addToCart,
      removeFromCart,
      clearCart,
      updateItemQuantity,
      updateItemVariant,
      setPromoCode,
      refreshCart,
      validateLocalCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
