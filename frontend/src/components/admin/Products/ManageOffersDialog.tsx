import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Ticket,
  Percent,
  Plus,
  Trash2,
  Loader2,
  Tag,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import CreatePromoDialog from "./CreatePromoDialog";
import CreateDiscountDialog from "./CreateDiscountDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Category } from "@/types/category";
import type { PromoCode } from "@/types/offer";
import { Badge } from "@/components/ui/badge";
import DiscountsContainer from "@/components/discount/DiscountsContainer";
import type { Discount } from "@/types/offer";

interface ManageOffersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
}

export default function ManageOffersDialog({
  open,
  onOpenChange,
}: ManageOffersDialogProps) {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [discounts, setDiscounts] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [promoOpen, setPromoOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<{
    discount: Discount;
    type: "product";
    targetId: number | string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      loadPromos();
      loadDiscounts();
    }
  }, [open]);

  const loadPromos = async () => {
    try {
      setLoading(true);
      const res = await api.get("/promos");
      setPromos(res.data || []);
    } catch (err) {
      toast.error("Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  const deletePromo = async (id: number) => {
    try {
      await api.delete(`/promos/${id}`);
      setPromos((prev) => prev.filter((p) => p._id !== id));
      toast.success("Promo code deleted");
    } catch (err) {
      toast.error("Failed to delete promo code");
    }
  };

  const loadDiscounts = async () => {
    try {
      const res = await api.get("/discounts");
      setDiscounts(res.data || null);
    } catch (err) {
      // Endpoint may not exist yet
      console.error("Failed to load discounts:", err);
    }
  };

  const deleteDiscount = async (type: string, id: string | number) => {
    try {
      // Call backend to delete discount
      if (type === "product") {
        await api.patch(`/products/${id}`, { discount: null });
        setDiscounts((prev: any) => ({
          ...prev,
          productDiscounts: prev.productDiscounts.filter(
            (d: any) => d.productId !== id,
          ),
        }));
      }
      toast.success("Discount deleted");
    } catch (err) {
      toast.error("Failed to delete discount");
      console.error(err);
    }
  };

  const handleEditDiscount = (
    discount: Discount,
    type: "product",
    targetId: number | string,
  ) => {
    setEditingDiscount({ discount, type, targetId });
    setDiscountOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Manage Offers & Promos
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="promos" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="promos" className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Promo Codes
              </TabsTrigger>
              <TabsTrigger
                value="discounts"
                className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Direct Discounts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="promos" className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Active Promo Codes
                </h3>
                <Button size="sm" onClick={() => setPromoOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> New Promo
                </Button>
              </div>

              <ScrollArea className="h-75 border rounded-md p-2">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : promos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <Ticket className="h-8 w-8 opacity-20" />
                    <p className="text-sm">No promo codes found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {promos.map((promo) => (
                      <div
                        key={promo._id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {promo.code}
                            </code>
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4">
                              {promo.type === "percentage"
                                ? `${promo.value}%`
                                : `${promo.value} EGP`}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {promo.usageCount} / {promo.usageLimit || "∞"}{" "}
                              uses
                            </span>
                            {promo.minOrderAmount && (
                              <span>Min: {promo.minOrderAmount} EGP</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="text-destructive h-8 w-8"
                          onClick={() => deletePromo(promo._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="discounts" className="space-y-4 py-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Applied Discounts
                </h3>
                <Button size="sm" onClick={() => setDiscountOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> New Discount
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !discounts || discounts.productDiscounts?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Percent className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">No Active Discounts</h3>
                    <p className="text-sm text-muted-foreground max-w-75">
                      Apply discounts directly to products.
                    </p>
                  </div>
                  <Button onClick={() => setDiscountOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create Discount Offer
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-96 border rounded-md p-3">
                  <div className="space-y-6">
                    {/* Product Discounts */}
                    {discounts.productDiscounts?.length > 0 && (
                      <DiscountsContainer
                        type="product"
                        discounts={discounts.productDiscounts}
                        onDelete={deleteDiscount}
                        onEdit={handleEditDiscount}
                        title="Product Discounts"
                      />
                    )}
                  </div>
                </ScrollArea>
              )}

              <div className="text-[11px] text-muted-foreground border-t pt-4">
                <p>
                  Note: Regular discounts update the public price on the
                  storefront. Use promo codes for private or checkout-only
                  incentives.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <CreatePromoDialog
        open={promoOpen}
        onOpenChange={setPromoOpen}
        onSuccess={loadPromos}
      />

      <CreateDiscountDialog
        open={discountOpen}
        onOpenChange={(open) => {
          setDiscountOpen(open);
          if (!open) setEditingDiscount(null);
        }}
        editingDiscount={editingDiscount}
        onSuccess={() => {
          setEditingDiscount(null);
          loadDiscounts();
        }}
      />
    </>
  );
}
