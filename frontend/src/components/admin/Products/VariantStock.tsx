import type { ProductVariantStock } from "@/types/product";

interface VariantStockProps {
  variant: ProductVariantStock;
}

export default function VariantStock({ variant }: VariantStockProps) {
  return (
    <div className="flex items-center gap-4 border rounded-lg p-2">
      <div className="font-mono text-xs bg-muted px-2 py-1 rounded">{variant.sku}</div>
      <div className="text-sm">Stock: <span className="font-semibold">{variant.stock}</span></div>
    </div>
  );
}
