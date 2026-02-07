import { useEffect, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import api from "@/lib/api";
import { ShoppingBag, CircleDollarSign, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TopProductCardProps = {
  productId?: number;
  name?: string;
  image?: string;
  totalSold: number;
  totalRevenue: number;
  topVariantSku?: string;
};

const currencyFormatter = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

export default function TopProductCard({
  productId,
  name,
  image,
  totalSold,
  totalRevenue,
  topVariantSku,
}: TopProductCardProps) {
  const [productData, setProductData] = useState<any>(null);
  const [, setLoading] = useState(false);

  useEffect(() => {
    if (productId) {
      setLoading(true);
      api
        .get(`/products/${productId}`)
        .then((r) => {
          setProductData(r.data);
        })
        .catch(() => {
          /* ignore */
        })
        .finally(() => setLoading(false));
    }
  }, [productId]);

  const variantData = productData?.variants?.find(
    (v: any) => v.sku === topVariantSku,
  );

  const displayImage =
    variantData?.images?.[0] ||
    productData?.thumbnail ||
    image ||
    "https://via.placeholder.com/600x800?text=Top+Product";
  const displayName = productData?.name || name || "Product";
  const unitPrice = productData
    ? (productData.basePrice || 0) + (variantData?.priceModifier || 0)
    : 0;

  return (
    <div className="flex flex-col sm:flex-row gap-4 rounded-2xl border bg-background p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-full sm:w-32 shrink-0 overflow-hidden rounded-xl border bg-muted">
        <AspectRatio ratio={1 / 1}>
          <img
            src={displayImage}
            alt={displayName}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </AspectRatio>
      </div>

      <div className="flex flex-col flex-1 justify-between gap-3 min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3
              className="truncate text-base font-bold text-foreground"
              title={displayName}>
              {displayName}
            </h3>
            {variantData && (
              <Badge variant="secondary" className="shrink-0 capitalize">
                {variantData.color} • {variantData.size}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            PID: #{productId} {topVariantSku && `• SKU: ${topVariantSku}`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="flex items-center gap-2 text-sm">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">
                {totalSold.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Total Sold
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <CircleDollarSign className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">
                {currencyFormatter.format(totalRevenue)}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Revenue
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">
                {currencyFormatter.format(unitPrice)}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Price/Piece
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
