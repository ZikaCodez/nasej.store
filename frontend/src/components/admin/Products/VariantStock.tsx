import type { ProductVariantStock } from "@/types/product";
import { Package, Palette, Ruler, Boxes } from "lucide-react";

interface VariantStockProps {
  variant: ProductVariantStock;
  productName?: string;
  productThumbnail?: string;
}

export default function VariantStock({
  variant,
  productName,
  productThumbnail,
}: VariantStockProps) {
  return (
    <div className="border rounded-lg p-2 md:flex md:items-center md:gap-4 grid grid-cols-1 gap-2 md:grid-cols-none">
      {/* Thumbnail, name, and slug in one column */}
      <div className="flex items-center gap-3">
        {productThumbnail && (
          <div className="relative">
            <img
              src={productThumbnail}
              alt={productName || variant.sku}
              className="w-12 h-12 rounded-md object-cover"
            />
          </div>
        )}
        <div className="flex flex-col min-w-[120px]">
          <div className="flex items-center gap-1 font-semibold text-sm">
            <Package className="w-4 h-4 text-muted-foreground" />
            {productName}
          </div>
          <div className="flex items-center gap-1 font-mono text-xs bg-muted px-2 py-1 rounded">
            <Boxes className="w-3 h-3 text-muted-foreground" />
            {variant.sku}
          </div>
        </div>
      </div>
      {/* Details below */}
      <div className="flex flex-row md:flex-col gap-4 md:gap-1 mt-2">
        <div className="flex items-center gap-1 text-sm">
          <Palette className="w-4 h-4 text-muted-foreground" />
          Color: <span className="font-semibold">{variant.color || "-"}</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Ruler className="w-4 h-4 text-muted-foreground" />
          Size: <span className="font-semibold">{variant.size || "-"}</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Boxes className="w-4 h-4 text-muted-foreground" />
          Stock: <span className={`font-semibold ${variant.stock < 5 ? "text-red-500" : ""}`}>{variant.stock}</span>
        </div>
      </div>
    </div>
  );
}
