import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShoppingCart,
  Image,
  Tag,
  CircleDollarSign,
  Loader2,
  Eye,
} from "lucide-react";

export default function ViewCartButton({ userId }: { userId: number }) {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    api
      .get(`/users/${userId}`)
      .then(async (res) => {
        if (!mounted) return;
        const data = res.data || {};
        const items = data.cartItems || data.cart?.items || [];

        // Fetch product details for unique productIds to get thumbnails/names
        const uniqueIds = Array.from(
          new Set(items.map((it: any) => it.productId)),
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

        const enriched = (items || []).map((it: any) => {
          const p = productMap[String(it.productId)];
          let thumbnail = it.thumbnail || it.image || null;
          if (p) {
            // prefer variant image if available
            if (Array.isArray(p.variants) && p.variants.length) {
              const v = p.variants.find(
                (vv: any) => String(vv.sku) === String(it.sku),
              );
              if (v) thumbnail = v.image || v.thumbnail || thumbnail;
            }
            thumbnail = thumbnail || p.thumbnail || null;
          }
          return {
            ...it,
            name: it.name || (p && p.name) || `Product ${it.productId}`,
            thumbnail,
          };
        });

        setCart({ items: enriched });
      })
      .catch(() => setCart(null))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Eye />
          View
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Cart
            </div>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] p-2">
          {loading ? (
            <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
              <Loader2 className="animate-spin mr-2" /> Loading…
            </div>
          ) : !cart || !cart.items || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Cart is empty</div>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.items.map((it: any) => (
                <div
                  key={`${it.productId}-${it.sku}`}
                  className="rounded-md border p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {it.thumbnail ? (
                      <img
                        src={it.thumbnail}
                        alt={it.name}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-muted/30 flex items-center justify-center">
                        <Image className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />{" "}
                        <span>{it.sku}</span>
                        <span className="text-primary">x {it.quantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium flex justify-center items-center gap-1">
                    <CircleDollarSign className="w-4 h-4 text-primary" /> EGP{" "}
                    {(it.priceAtPurchase * it.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
