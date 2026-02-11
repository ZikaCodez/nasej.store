import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import VariantStock from "@/components/admin/Products/VariantStock";
import type { ProductListItem } from "@/types/product";
import { useEffect, useState } from "react";
import api, { createApiUrl } from "@/lib/api";

interface ProductStockProps {
  product: ProductListItem;
  open: boolean;
  onClose: () => void;
}

export default function ProductStock({
  product,
  open,
  onClose,
}: ProductStockProps) {
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<ProductListItem | null>(null);

  useEffect(() => {
    let id: number | undefined = undefined;
    if (typeof product === "number") {
      id = product;
    } else if (typeof product === "object" && product && product._id) {
      id = product._id;
    }
    if (id && open) {
      setLoading(true);
      api
        .get(createApiUrl(`products/${id}`))
        .then((res) => {
          setProductData(res.data);
          setLoading(false);
        })
        .catch(() => {
          setProductData(null);
          setLoading(false);
        });
    } else {
      setProductData(null);
    }
  }, [product, open]);

  const variants = Array.isArray(productData?.variants)
    ? productData?.variants
    : productData?.variants
      ? [productData?.variants]
      : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stock for {productData?.name || "Product"}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-muted-foreground text-sm">
            Loading variants...
          </div>
        ) : productData ? (
          variants.length > 0 ? (
            <div className="space-y-2">
              {variants.map((variant, idx) => (
                <VariantStock key={variant.sku || idx} variant={variant} />
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              No variants found.
            </div>
          )
        ) : (
          <div className="text-destructive text-sm">
            Failed to load product.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
