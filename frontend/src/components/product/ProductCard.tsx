import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/providers/CartProvider";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useColors } from "@/hooks/useColors";
// import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import SizeChart from "@/components/category/SizeChart";
import {
  calculateDiscountedPrice,
  getDiscountLabel,
  isDiscountValid,
} from "@/lib/discounts";
import type { Discount } from "@/types/offer";

export interface ProductCardProps {
  title?: string;
  price?: number;
  image?: string;
  categoryId?: number;
  onQuickAdd?: () => void;
  productId?: number;
  sku?: string;
  loading?: boolean;
  variants?: Array<{
    sku: string;
    images?: string[];
    priceModifier?: number;
    price?: number;
    color?: string;
    size?: string;
    stock?: number;
  }>;
  basePrice?: number;
  slug?: string;
  initialColor?: string;
  discount?: Discount;
}

export default function ProductCard({
  title = "Essential Tee",
  price = 499,
  image = "https://via.placeholder.com/600x800?text=Rova",
  categoryId,
  onQuickAdd,
  productId,
  loading = false,
  variants,
  basePrice,
  slug,
  initialColor,
  discount,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { colorsMap } = useColors();
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [selectedColorKey, setSelectedColorKey] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string>("");

  // Ensure initial variant selection (prefer provided initialColor)
  useEffect(() => {
    if (!Array.isArray(variants) || variants.length === 0) return;
    if (selectedVariant != null) return;
    const desired = initialColor?.trim().toLowerCase();
    if (desired) {
      const sizesForColor = Array.from(
        new Set(
          variants
            .filter((v) => getVariantColorKey(v) === desired)
            .map((v) => getVariantSize(v))
            .filter((s): s is string => !!s),
        ),
      );
      const nextSize = sizesForColor[0]?.toLowerCase();
      setSelectedColorKey(desired);
      if (nextSize) setSelectedSize(nextSize);
      const idx = findVariantIndex(desired, nextSize || null);
      setSelectedVariant(idx);
      return;
    }
    // Fallback: first variant
    setSelectedVariant(0);
    const first = variants[0];
    const c = (first.color || parseColor(first.sku))?.trim().toLowerCase();
    const s = (first.size || parseSize(first.sku))?.trim().toLowerCase();
    if (c) setSelectedColorKey(c);
    if (s) setSelectedSize(s);
  }, [variants, selectedVariant, initialColor]);

  const currentVariant =
    selectedVariant != null && variants && variants[selectedVariant]
      ? variants[selectedVariant]
      : undefined;
  const imageForIdx = (idx: number | null) => {
    if (idx == null) return image;
    const img = variants?.[idx]?.images?.[0];
    if (img) return img;
    if (idx > 0) {
      const prevImg = variants?.[idx - 1]?.images?.[0];
      if (prevImg) return prevImg;
    }
    return image;
  };
  // Helpers must be defined before use
  const norm = (v?: string) => (v ? v.trim().toLowerCase() : undefined);
  const getVariantColorKey = (
    v: NonNullable<ProductCardProps["variants"]>[number],
  ) => norm(v.color) || norm(parseColor(v.sku));
  const getVariantSize = (
    v: NonNullable<ProductCardProps["variants"]>[number],
  ) => norm(v.size) || norm(parseSize(v.sku));
  const imageForColor = (colorKey: string | null) => {
    const c = norm(colorKey || undefined);
    if (c && Array.isArray(variants)) {
      const v = variants.find((vv) => getVariantColorKey(vv) === c);
      const img = v?.images?.[0];
      if (img) return img;
    }
    return imageForIdx(selectedVariant);
  };
  const displayImage = imageForColor(selectedColorKey);
  const displayPrice = (() => {
    if (currentVariant?.price !== undefined && currentVariant?.price !== null) {
      return Math.max(0, currentVariant.price);
    }
    if (basePrice != null && currentVariant?.priceModifier != null) {
      return Math.max(0, basePrice + (currentVariant.priceModifier || 0));
    }
    return price;
  })();

  // Use product-level discount only (variants no longer support individual discounts)
  const effectiveDiscount = discount;

  const finalPrice = calculateDiscountedPrice(displayPrice, effectiveDiscount);
  const discountLabel = getDiscountLabel(effectiveDiscount);
  const hasDiscount = isDiscountValid(effectiveDiscount);

  const parseColor = (vSku?: string) => {
    if (!vSku) return undefined;
    // "Black / L" → first segment; "CODE-COLOR-SIZE" → middle segment
    if (vSku.includes("/")) {
      const parts = vSku.split("/").map((p) => p.trim());
      return parts[0]?.trim();
    }
    const dashParts = vSku.split("-").map((p) => p.trim());
    if (dashParts.length >= 2) return dashParts[1];
    return undefined;
  };

  // Dynamic swatch styles from colorsMap
  function swatchStyles(name?: string): {
    backgroundColor: string;
    borderColor: string;
  } {
    const key = name?.trim().toLowerCase();
    const hex = key ? colorsMap[key] : undefined;
    if (!hex) return { backgroundColor: "#e5e7eb", borderColor: "#9ca3af" };
    const h = hex.replace(/^#/, "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const borderColor = luminance > 180 ? "#9ca3af" : "#ffffff";
    return { backgroundColor: hex, borderColor };
  }

  const parseSize = (vSku?: string) => {
    if (!vSku) return undefined;
    const parts = vSku.split("/").map((p) => p.trim());
    if (parts.length > 1) return parts[1];
    const dashParts = vSku.split("-");
    if (dashParts.length > 1) return dashParts[dashParts.length - 1];
    return undefined;
  };

  const findVariantIndex = (
    colorKey?: string | null,
    sizeKey?: string | null,
  ) => {
    const c = norm(colorKey || undefined);
    const s = norm(sizeKey || undefined);
    if (!variants || variants.length === 0) return null;
    // Prefer exact color+size match
    const exact = variants.findIndex(
      (v) => getVariantColorKey(v) === c && getVariantSize(v) === s,
    );
    if (exact >= 0) return exact;
    // Fallback: color-only (ensure image follows color selection)
    if (c) {
      const byColor = variants.findIndex((v) => getVariantColorKey(v) === c);
      if (byColor >= 0) return byColor;
    }
    // Fallback: size-only
    if (s) {
      const bySize = variants.findIndex((v) => getVariantSize(v) === s);
      if (bySize >= 0) return bySize;
    }
    return 0;
  };

  // Ensure a valid size is selected when color changes
  useEffect(() => {
    if (!selectedColorKey || !Array.isArray(variants)) return;
    const sizesForColor = Array.from(
      new Set(
        variants
          .filter((v) => getVariantColorKey(v) === selectedColorKey)
          .map((v) => getVariantSize(v))
          .filter((s): s is string => !!s),
      ),
    );
    if (sizesForColor.length === 0) return;
    const current = selectedSize ? selectedSize.toLowerCase() : null;
    const lowerSizes = sizesForColor.map((x) => x.toLowerCase());
    const isValid = current ? lowerSizes.includes(current) : false;
    const nextSize = isValid ? current : lowerSizes[0];
    if (!isValid) setSelectedSize(nextSize);
    const idx = findVariantIndex(selectedColorKey, nextSize);
    setSelectedVariant(idx);
  }, [selectedColorKey, variants]);

  // SizeChart fetching is handled by the SizeChart component using `categoryId` when available.
  // Fetch category name by id for display
  useEffect(() => {
    let isMounted = true;
    async function loadCategory() {
      try {
        if (!categoryId) {
          if (isMounted) setCategoryName("");
          return;
        }
        const res = await (
          await import("@/lib/api")
        ).default.get(`/categories/${categoryId}`, {
          headers: { "x-silent": "1" },
        });
        const name = res.data?.name || "";
        if (isMounted) setCategoryName(name);
      } catch {
        if (isMounted) setCategoryName("");
      }
    }
    loadCategory();
    return () => {
      isMounted = false;
    };
  }, [categoryId]);

  const navigate = useNavigate();
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    const dx = Math.abs(e.clientX - startRef.current.x);
    const dy = Math.abs(e.clientY - startRef.current.y);
    if (dx + dy > 8) movedRef.current = true;
  };

  const onPointerUp = () => {
    if (!slug) return;
    if (!startRef.current) return;
    if (!movedRef.current) {
      navigate(`/product/${slug}`);
    }
    startRef.current = null;
    movedRef.current = false;
  };

  const onPointerCancel = () => {
    startRef.current = null;
    movedRef.current = false;
  };

  const onImageClick = () => {
    if (!slug) return;
    if (!movedRef.current) {
      navigate(`/product/${slug}`);
    }
  };

  const onImageKeyDown = (e: React.KeyboardEvent) => {
    if (!slug) return;
    if (e.key === "Enter" || e.key === " ") {
      navigate(`/product/${slug}`);
    }
  };

  const handleQuickAdd = () => {
    // Enforce selection of both color and size for cart
    if (!selectedColorKey) {
      toast.error("Select a color", { position: "bottom-left" });
      return;
    }
    if (!selectedSize) {
      toast.error("Select a size", { position: "bottom-left" });
      return;
    }

    if (!variants || variants.length === 0) return;
    const c = selectedColorKey?.toLowerCase();
    const s = selectedSize?.toLowerCase();
    const exactIdx = variants.findIndex(
      (v) => getVariantColorKey(v) === c && getVariantSize(v) === s,
    );
    if (exactIdx < 0) {
      toast.error("Selected size unavailable for this color", {});
      return;
    }
    const v = variants[exactIdx];
    const finalSku = v.sku;
    const finalImage = (v.images && v.images[0]) || displayImage;

    // Calculate base variant price
    let baseVariantPrice = displayPrice;
    if (v.price !== undefined && v.price !== null) {
      baseVariantPrice = Math.max(0, v.price);
    } else if (basePrice != null && v.priceModifier != null) {
      baseVariantPrice = Math.max(0, basePrice + (v.priceModifier || 0));
    }

    // Apply product-level discount to the variant price
    const priceAtPurchase = calculateDiscountedPrice(
      baseVariantPrice,
      effectiveDiscount,
    );

    if (productId && finalSku) {
      addToCart({
        productId,
        sku: finalSku,
        name: title,
        quantity: 1,
        priceAtPurchase,
        originalPrice: baseVariantPrice,
        image: finalImage,
        color: selectedColorKey?.toLowerCase(),
        size: selectedSize?.toLowerCase(),
      });
      toast.success("Added to cart", {
        description: `${title} • ${selectedColorKey.toUpperCase()} / ${selectedSize.toUpperCase()}`,
      });
      return;
    }
    // Fallback: delegate to parent (e.g., navigate to PDP)
    onQuickAdd?.();
  };

  // Stock display logic
  const stock = currentVariant?.stock ?? undefined;
  const outOfStock = stock === 0;
  const lowStock = typeof stock === "number" && stock > 0 && stock <= 5;

  if (loading) {
    return (
      <div className="group relative bg-background border rounded-2xl overflow-hidden shadow-sm">
        <div className="relative w-full pb-[100%]">
          <Skeleton className="absolute inset-0 h-full w-full" />
        </div>
        <div className="p-3">
          <Skeleton className="h-3 w-16" />
          <div className="mt-2 flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="mt-3 sm:hidden">
            <Skeleton className="h-8 w-full rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-background border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {slug ? (
        <div
          role="link"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onClick={onImageClick}
          onKeyDown={onImageKeyDown}
          aria-label={`View ${title}`}
          className="block cursor-pointer pointer-events-auto">
          <div className="relative w-full pb-[100%]">
            <img
              src={displayImage}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              width={800}
              height={800}
              sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, (min-width:640px) 50vw, 75vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      ) : (
        <div className="relative w-full pb-[100%]">
          <img
            src={displayImage}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            width={800}
            height={800}
            sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, (min-width:640px) 50vw, 75vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
      <div className="p-2">
        <div className="text-xs text-muted-foreground">
          {categoryName ? categoryName : ""}
        </div>
        <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div className="flex-1">
            {slug ? (
              <Link
                to={`/product/${slug}`}
                className="text-sm font-semibold line-clamp-1">
                {title}
              </Link>
            ) : (
              <h3 className="text-sm font-semibold line-clamp-1">{title}</h3>
            )}
          </div>

          {/* Price section - responsive layout */}
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                {/* Desktop layout: old price on one line, new price + badge on same line */}
                <div className="hidden gap-2 md:flex md:items-center">
                  <span className="text-xs text-muted-foreground line-through">
                    EGP {displayPrice.toFixed(0)}
                  </span>
                  <span className="text-sm font-bold text-primary">
                    EGP {finalPrice.toFixed(0)}
                  </span>
                  {discountLabel && (
                    <Badge
                      variant="destructive"
                      className="text-xs h-5 px-1.5 shrink-0">
                      {discountLabel}
                    </Badge>
                  )}
                </div>
                {/* Mobile: stacked layout */}
                <div className="flex flex-col gap-0.5 md:hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground line-through">
                      EGP {displayPrice.toFixed(0)}
                    </span>
                    {discountLabel && (
                      <Badge
                        variant="destructive"
                        className="text-xs h-4 px-1 shrink-0">
                        {discountLabel}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm font-bold text-primary">
                    EGP {finalPrice.toFixed(0)}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-sm font-medium">
                EGP {displayPrice.toFixed(0)}
              </div>
            )}
          </div>
        </div>
        {/* Stock warning display */}
        {outOfStock ? (
          <div className="mt-1">
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              OUT OF STOCK
            </Badge>
          </div>
        ) : lowStock ? (
          <div className="mt-1">
            <Badge variant="destructive" className="text-xs h-5 px-1.5">
              {stock} LEFT IN STOCK
            </Badge>
          </div>
        ) : null}
        {/* Variant selectors */}
        {Array.isArray(variants) && variants.length > 0 && (
          <div className="mt-2 space-y-2">
            {/* Colors */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Color:</span>
              {Array.from(
                variants.reduce((m, v, idx) => {
                  const c = getVariantColorKey(v);
                  if (c && !m.has(c)) m.set(c, idx);
                  return m;
                }, new Map<string, number>()),
              ).map(([colorName, firstIdx]) => {
                const selected = selectedColorKey === (colorName || "");
                const label =
                  String(colorName).charAt(0).toUpperCase() +
                  String(colorName).slice(1);
                return (
                  <button
                    key={`color-${String(colorName)}-${firstIdx}`}
                    type="button"
                    aria-label={label}
                    onClick={() => {
                      const cn = colorName || null;
                      setSelectedColorKey(cn);
                      let nextSize = selectedSize || null;
                      if (cn && Array.isArray(variants)) {
                        const sizesForColor = Array.from(
                          new Set(
                            variants
                              .filter((v) => getVariantColorKey(v) === cn)
                              .map((v) => getVariantSize(v))
                              .filter((s): s is string => !!s),
                          ),
                        );
                        if (sizesForColor.length > 0) {
                          nextSize = sizesForColor[0].toLowerCase();
                          setSelectedSize(nextSize);
                        }
                      }
                      const idx = findVariantIndex(cn, nextSize);
                      setSelectedVariant(idx);
                    }}
                    className={`flex items-center gap-1 rounded-full border px-2 py-1 ${selected ? "ring-2 ring-foreground" : "ring-0"}`}>
                    <span
                      aria-hidden="true"
                      className="size-5 rounded-full border"
                      style={swatchStyles(colorName || undefined)}
                    />
                    <span className="text-xs">{label}</span>
                  </button>
                );
              })}
            </div>
            {/* Sizes (display only) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Sizes:</span>
              {(() => {
                const sizesForColor = selectedColorKey
                  ? Array.from(
                      new Set(
                        variants
                          .filter(
                            (v) => getVariantColorKey(v) === selectedColorKey,
                          )
                          .map((v) => getVariantSize(v))
                          .filter((s): s is string => !!s),
                      ),
                    )
                  : Array.from(
                      new Set(
                        variants
                          .map((v) => getVariantSize(v))
                          .filter((s): s is string => !!s),
                      ),
                    );
                return sizesForColor.map((s) => {
                  const isSelected = selectedSize === s.toLowerCase();
                  return (
                    <button
                      key={`size-${s}`}
                      type="button"
                      aria-label={`Select size ${s}`}
                      onClick={() => {
                        const newSize = s.toLowerCase();
                        setSelectedSize(newSize);
                        const idx = findVariantIndex(selectedColorKey, newSize);
                        setSelectedVariant(idx);
                      }}
                      className={`text-xs rounded-full border px-2 py-0.5 ${isSelected ? "ring-2 ring-foreground" : "ring-0"}`}>
                      {s.toUpperCase()}
                    </button>
                  );
                });
              })()}
            </div>
            <div className="mt-2">
              <SizeChart categoryId={categoryId ?? undefined} />
            </div>
          </div>
        )}
        {/* Footer quick add (visible on all sizes) */}
        <div className="mt-3 w-full">
          <Button
            variant="default"
            size="sm"
            className="rounded-full w-full"
            onClick={handleQuickAdd}
            aria-label="Quick Add"
            disabled={outOfStock}>
            <ShoppingCart className="size-4" />
            <span className="ml-1">
              {outOfStock ? "OUT OF STOCK" : "Add to cart"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
