import { useEffect, useRef, useState } from "react";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import ProductImages from "./ProductImages";
import type { Color } from "@/types/color";

const REQUIRED_STAR = <span className="text-destructive">*</span>;

export type VariantValue = {
  id: string;
  sku: string;
  color: string;
  size: string;
  priceModifier: number | "";
  imageUrls: string[];
};

export type VariantsEditorProps = {
  variants: VariantValue[];
  onChange?: (variants: VariantValue[]) => void;
  disabled?: boolean;
  colors?: Color[];
  onOpenCreateColor?: () => void;
  productSlug?: string;
};

const SIZES = ["S", "M", "L", "XL", "XXL", "OS"] as const;

export default function VariantsEditor({
  variants,
  onChange,
  disabled,
  colors,
  onOpenCreateColor,
  productSlug,
}: VariantsEditorProps) {
  const [counter, setCounter] = useState(variants.length || 1);
  const [pendingColorVariantId, setPendingColorVariantId] = useState<
    string | null
  >(null);

  const emit = (next: VariantValue[]) => {
    onChange?.(next);
  };

  const buildSku = (slug: string | undefined, color: string, size: string) => {
    const base = (slug || "").toUpperCase();
    const colorCode = (color || "").substring(0, 3).toUpperCase();
    const sizeCode = (size || "").toUpperCase();
    if (!base && !colorCode && !sizeCode) return "";
    return [base, colorCode, sizeCode].filter(Boolean).join("-");
  };

  /**
   * Find images from the first variant with the same color
   * Returns empty array if no variant with that color exists or if the new variant already has images
   */
  const getImagesFromSameColor = (
    color: string,
    currentVariantId: string,
    currentImages: string[],
  ): string[] => {
    // If the variant already has images, don't override
    if (currentImages.length > 0) {
      return currentImages;
    }

    // If no color selected, return empty
    if (!color) {
      return [];
    }

    // Find the first variant with the same color (excluding current variant)
    const variantWithSameColor = variants.find(
      (v) => v.id !== currentVariantId && v.color === color,
    );

    // Return images from the variant with same color, or empty array if not found
    return variantWithSameColor?.imageUrls || [];
  };

  const handleAdd = () => {
    const id = `variant-${Date.now()}-${counter}`;
    setCounter((c) => c + 1);
    const baseVariant: VariantValue = {
      id,
      sku: "",
      color: "",
      size: "M",
      priceModifier: "",
      imageUrls: [],
    };
    const withSku: VariantValue = {
      ...baseVariant,
      sku: buildSku(productSlug, baseVariant.color, baseVariant.size),
    };
    emit([...variants, withSku]);
  };

  const handleChange = (id: string, next: Partial<VariantValue>) => {
    // Helper to compare arrays (order-sensitive)
    const arraysEqual = (a: string[] = [], b: string[] = []) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    };

    // Special propagation rule: when imageUrls change for a variant,
    // apply the new images to other variants of the SAME COLOR only if
    // they already share the exact same images array as the old one.
    if (next.imageUrls !== undefined) {
      const target = variants.find((v) => v.id === id);
      if (!target) {
        emit(variants);
        return;
      }
      const oldImages = target.imageUrls || [];
      const newImages = next.imageUrls || [];
      const targetColor = target.color;

      const newVariants = variants.map((v) => {
        if (v.id === id) {
          const updated: VariantValue = { ...v, imageUrls: newImages };
          // SKU remains consistent; recompute for safety
          updated.sku = buildSku(productSlug, updated.color, updated.size);
          return updated;
        }
        if (
          v.color === targetColor &&
          arraysEqual(v.imageUrls || [], oldImages)
        ) {
          return { ...v, imageUrls: newImages };
        }
        return v;
      });
      emit(newVariants);
      return;
    }

    // Default field update flow, including auto-copy on color change
    emit(
      variants.map((v) => {
        if (v.id !== id) return v;
        const updated: VariantValue = { ...v, ...next };
        updated.sku = buildSku(productSlug, updated.color, updated.size);

        // If color is being changed, auto-copy images from same color variant
        if (next.color !== undefined) {
          const copiedImages = getImagesFromSameColor(
            next.color,
            id,
            updated.imageUrls,
          );
          updated.imageUrls = copiedImages;
        }

        return updated;
      }),
    );
  };

  const handleRemove = (id: string) => {
    emit(variants.filter((v) => v.id !== id));
  };

  const colorsInitializedRef = useRef(false);
  const prevColorsLengthRef = useRef(colors?.length ?? 0);

  useEffect(() => {
    if (!colors) return;
    if (!colorsInitializedRef.current) {
      colorsInitializedRef.current = true;
      prevColorsLengthRef.current = colors.length;
      return;
    }
    if (pendingColorVariantId && colors.length > prevColorsLengthRef.current) {
      const newlyAdded = colors[colors.length - 1];
      if (newlyAdded) {
        handleChange(pendingColorVariantId, { color: newlyAdded._id });
        setPendingColorVariantId(null);
      }
    }
    prevColorsLengthRef.current = colors.length;
  }, [colors, pendingColorVariantId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-muted-foreground">
          Variants
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleAdd}
          disabled={disabled}>
          <Plus /> Add variant
        </Button>
      </div>
      <div className="space-y-2">
        {variants.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No variants yet. Add at least one variant with SKU, color, and size.
          </p>
        )}
        {variants.map((variant) => {
          return (
            <div
              key={variant.id}
              className="relative grid grid-cols-1 gap-2 rounded-2xl border bg-muted/30 p-3 sm:grid-cols-[2fr,1.5fr,1fr,1fr]">
              {/* Delete button at top-right, hidden if only one variant */}
              {variants.length > 1 && (
                <div className="absolute right-2 top-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemove(variant.id)}
                    disabled={disabled}
                    aria-label="Remove variant">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
              <Field>
                <FieldLabel>SKU</FieldLabel>
                <Input
                  disabled
                  value={variant.sku}
                  placeholder="TSHIRT-BLU-L"
                />
              </Field>
              <Field>
                <FieldLabel>Color {REQUIRED_STAR}</FieldLabel>
                <FieldContent>
                  <Select
                    disabled={disabled}
                    value={variant.color || undefined}
                    onValueChange={(val) => {
                      if (val === "__new__") {
                        setPendingColorVariantId(variant.id);
                        onOpenCreateColor?.();
                        return;
                      }
                      handleChange(variant.id, { color: val });
                    }}>
                    <SelectTrigger className="h-9 w-full md:w-max">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colors?.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-full border"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span>
                              {c._id.charAt(0).toUpperCase() + c._id.slice(1)}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                      <SelectItem value="__new__">+ New color…</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Size {REQUIRED_STAR}</FieldLabel>
                <FieldContent>
                  <Select
                    disabled={disabled}
                    value={variant.size}
                    onValueChange={(val) =>
                      handleChange(variant.id, { size: val })
                    }>
                    <SelectTrigger className="h-9 w-full md:w-max">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Custom price (EGP)</FieldLabel>
                <Input
                  type="number"
                  disabled={disabled}
                  value={
                    variant.priceModifier === ""
                      ? ""
                      : String(variant.priceModifier)
                  }
                  onChange={(e) =>
                    handleChange(variant.id, {
                      priceModifier:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  placeholder="0"
                />
              </Field>
              {/* Delete button moved to top-right; column removed */}
              <div className="col-span-1 md:col-span-5">
                <Field>
                  <FieldLabel>Images {REQUIRED_STAR}</FieldLabel>
                  <ProductImages
                    urls={variant.imageUrls}
                    onChange={(urls) =>
                      handleChange(variant.id, { imageUrls: urls })
                    }
                    disabled={disabled}
                    showGridPreview
                  />
                </Field>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
