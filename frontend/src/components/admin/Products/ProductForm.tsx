import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProductListItem } from "@/types/product";
import type { Category } from "@/types/category";
import CreateProduct, { type ProductFormValue } from "./CreateProduct";
import VariantsEditor, { type VariantValue } from "./VariantsEditor";
import ProductStatusToggle from "./ProductStatusToggle";
import FeaturedToggle from "./FeaturedToggle";

export type ProductFormState = {
  meta: ProductFormValue;
  variants: VariantValue[];
  active: boolean;
  featured: boolean;
};

export type ProductFormProps = {
  initial?: ProductFormState;
  product?: ProductListItem | null;
  saving?: boolean;
  onSubmit?: (state: ProductFormState) => void;
  onCancel?: () => void;
  categories: Category[];
  onOpenCategoryDialog: () => void;
  colors: import("@/types/color").Color[];
  onOpenColorDialog: () => void;
};

export default function ProductForm({
  initial,
  product,
  saving,
  onSubmit,
  onCancel,
  categories,
  onOpenCategoryDialog,
  colors,
  onOpenColorDialog,
}: ProductFormProps) {
  const initialState: ProductFormState = useMemo(
    () => ({
      meta: {
        name: product?.name || "",
        slug: product?.slug || "",
        description: "",
        basePrice: product?.basePrice ?? "",
        category: product?.category || "",
        tags: "",
        imageUrls: [],
        ...(initial?.meta || {}),
      },
      variants:
        initial?.variants && initial.variants.length > 0
          ? initial.variants
          : [
              {
                id: `variant-${Date.now()}-0`,
                sku: "",
                color: "",
                size: "M",
                priceModifier: "",
                imageUrls: [],
                stock: "",
              },
            ],
      active: initial?.active ?? product?.isActive ?? true,
      featured: initial?.featured ?? product?.isFeatured ?? false,
    }),
    [initial, product],
  );

  const [state, setState] = useState<ProductFormState>(initialState);

  // Ensure every variant has required fields: color, size and at least one image
  const allVariantsValid =
    state.variants.length > 0 &&
    state.variants.every((v) => {
      const hasColor = !!v.color && String(v.color).trim() !== "";
      const hasSize = !!v.size && String(v.size).trim() !== "";
      const hasImages = Array.isArray(v.imageUrls) && v.imageUrls.length > 0;
      return hasColor && hasSize && hasImages;
    });

  const canSubmit =
    !!state.meta.name &&
    String(state.meta.name).trim() !== "" &&
    !!state.meta.slug &&
    String(state.meta.slug).trim() !== "" &&
    state.meta.category !== "" &&
    !isNaN(Number(state.meta.category)) &&
    Number(state.meta.category) > 0 &&
    state.meta.basePrice !== "" &&
    allVariantsValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    // Ensure category is sent as a number
    const fixedState = {
      ...state,
      meta: {
        ...state.meta,
        category: Number(state.meta.category),
      },
    };
    onSubmit?.(fixedState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1.2fr)]">
        <div className="space-y-4">
          <CreateProduct
            value={state.meta}
            categories={categories}
            onOpenCreateCategory={onOpenCategoryDialog}
            onChange={(meta) =>
              setState((prev) => {
                const slugChanged = prev.meta.slug !== meta.slug;
                if (!slugChanged) {
                  return { ...prev, meta };
                }
                const updatedVariants = prev.variants.map((v) => {
                  const base = (meta.slug || "").toUpperCase();
                  const colorCode = (v.color || "")
                    .substring(0, 3)
                    .toUpperCase();
                  const sizeCode = (v.size || "").toUpperCase();
                  const sku =
                    base || colorCode || sizeCode
                      ? [base, colorCode, sizeCode].filter(Boolean).join("-")
                      : "";
                  return { ...v, sku };
                });
                return { ...prev, meta, variants: updatedVariants };
              })
            }
          />
          <VariantsEditor
            variants={state.variants}
            onChange={(variants) => setState((prev) => ({ ...prev, variants }))}
            colors={colors}
            onOpenCreateColor={onOpenColorDialog}
            productSlug={state.meta.slug}
          />
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border bg-muted/30 p-3 space-y-3">
            <ProductStatusToggle
              active={state.active}
              onChange={(active) => setState((prev) => ({ ...prev, active }))}
            />
            <FeaturedToggle
              featured={state.featured}
              onChange={(featured) =>
                setState((prev) => ({ ...prev, featured }))
              }
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit || saving}>
          {saving ? "Saving…" : product ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
