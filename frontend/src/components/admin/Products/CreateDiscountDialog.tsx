import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";
import { Loader2, Percent } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProductListItem } from "@/types/product";
import type { Discount } from "@/types/offer";
import type { Category } from "@/types/category";

interface CreateDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingDiscount?: {
    discount: Discount;
    type: "product";
    targetId: number | string;
  } | null;
}

export default function CreateDiscountDialog({
  open,
  onOpenChange,
  onSuccess,
  editingDiscount,
}: CreateDiscountDialogProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const [discountData, setDiscountData] = useState({
    type: "percentage" as "percentage" | "fixed",
    value: "",
  });

  // Initialize form with editing data
  useEffect(() => {
    if (editingDiscount && open) {
      const { discount, targetId } = editingDiscount;
      setDiscountData({
        type: discount.type || "percentage",
        value: String(discount.value || ""),
      });
      setSelectedProductIds([String(targetId)]);
    } else {
      // Reset form for new discount
      setDiscountData({ type: "percentage", value: "" });
      setSelectedProductIds([]);
    }
  }, [editingDiscount, open]);

  useEffect(() => {
    if (open && products.length === 0) {
      loadProducts();
    }
  }, [open]);

  useEffect(() => {
    if (open && categories.length === 0) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    try {
      const res = await api.get<{ items: Category[]; total: number }>(
        "/categories",
        { params: { limit: 1000 } },
      );
      setCategories(res.data.items || []);
    } catch (err) {
      // ignore: categories optional for filter
    }
  };

  const visibleProducts = useMemo(() => {
    if (selectedCategoryId === "all") return products;
    return products.filter(
      (p) => String(p.category || "") === selectedCategoryId,
    );
  }, [products, selectedCategoryId]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await api.get("/products", { params: { limit: 1000 } });
      setProducts(res.data.items || []);
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async () => {
    if (!discountData.value) {
      toast.error("Please enter a discount value");
      return;
    }

    // Validate selection
    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    try {
      setLoading(true);
      const discountPayload = {
        type: discountData.type,
        value: Number(discountData.value),
        isActive: true,
      };

      if (editingDiscount) {
        // Update existing discount on a single product
        await api.patch(`/products/${editingDiscount.targetId}`, {
          discount: discountPayload,
        });
        toast.success("Discount updated successfully");
      } else {
        // Apply discount to multiple selected products (one request per product)
        await Promise.all(
          selectedProductIds.map((id) =>
            api.post("/discounts", {
              scope: "product",
              discount: discountPayload,
              targetId: id,
            }),
          ),
        );
        toast.success("Discount applied to selected products");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to apply discount");
    } finally {
      setLoading(false);
    }
  };

  const dialogTitle = editingDiscount ? "Edit Discount" : "Apply Discount";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh] px-1">
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={discountData.type}
                    onValueChange={(val: any) =>
                      setDiscountData({ ...discountData, type: val })
                    }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed (EGP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={discountData.value}
                    onChange={(e) =>
                      setDiscountData({
                        ...discountData,
                        value: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Products</Label>
                  <div className="space-y-2">
                    <Label>Filter by Category</Label>
                    <Select
                      value={selectedCategoryId}
                      onValueChange={(val: string) =>
                        setSelectedCategoryId(val)
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c._id} value={String(c._id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border rounded-md p-2 max-h-48 overflow-auto">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-muted-foreground">
                        {loadingProducts
                          ? "Loading products..."
                          : `${products.length} products`}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const visible = visibleProducts;
                          if (selectedProductIds.length === visible.length) {
                            setSelectedProductIds([]);
                          } else {
                            setSelectedProductIds(
                              visible.map((p) => String(p._id)),
                            );
                          }
                        }}>
                        {selectedProductIds.length === visibleProducts.length
                          ? "Deselect all"
                          : "Select all"}
                      </Button>
                    </div>
                    {visibleProducts.map((p) => {
                      const id = String(p._id);
                      const checked = selectedProductIds.includes(id);
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-3 py-2 px-1 hover:bg-muted/50 rounded-md">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const isChecked = Boolean(v);
                              if (isChecked)
                                setSelectedProductIds((prev) =>
                                  prev.includes(id) ? prev : [...prev, id],
                                );
                              else
                                setSelectedProductIds((prev) =>
                                  prev.filter((x) => x !== id),
                                );
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate">{p.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {p.slug || ""}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {p.basePrice} EGP
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || selectedProductIds.length === 0}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : editingDiscount ? (
              "Update Discount"
            ) : (
              "Apply Discount"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
