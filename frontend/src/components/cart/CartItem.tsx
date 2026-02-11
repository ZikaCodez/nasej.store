import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Trash2, Banknote, Palette, Ruler } from "lucide-react";
import QuantitySelector from "@/components/common/QuantitySelector";
import { useCart } from "@/providers/CartProvider";
import api from "@/lib/api";
import { useColors } from "@/hooks/useColors";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Discount } from "@/types/offer";
import { getDiscountLabel, isDiscountValid } from "@/lib/discounts";
import { toast } from "sonner";

export interface CartItemProps {
  productId?: number;
  sku?: string;
  image?: string;
  title?: string;
  variant?: string; // e.g., "Black / L"
  price?: number; // per unit (after discount)
  originalPrice?: number; // per unit (before discount)
  quantity?: number;
  onRemove?: () => void;
  color?: string;
  size?: string;
  discount?: Discount;
}

export default function CartItem({
  productId,
  sku,
  image = "https://via.placeholder.com/120x120?text=Rova",
  title = "Essential Tee",
  variant = "Black / L",
  price = 499,
  originalPrice,
  quantity = 1,
  onRemove,
  color,
  size,
  discount,
}: CartItemProps) {
  const { items, updateItemQuantity, removeFromCart, updateItemVariant } =
    useCart();
  const { colorsMap } = useColors();
  const subtotal = price * quantity;
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    undefined,
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    undefined,
  );
  const [productVariants, setProductVariants] = useState<
    Array<{
      sku: string;
      size?: string;
      color?: string;
      priceModifier?: number;
      images?: string[];
      stock?: number;
    }>
  >([]);
  const [productBasePrice, setProductBasePrice] = useState<number | undefined>(
    undefined,
  );
  const [colorCodeMap, setColorCodeMap] = useState<Record<string, string>>({});
  const [lastAppliedColor, setLastAppliedColor] = useState<string | undefined>(
    undefined,
  );
  const [lastAppliedSize, setLastAppliedSize] = useState<string | undefined>(
    undefined,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<{
    nextSku: string;
    nextPrice: number;
    nextImage?: string;
    nextColor?: string;
    nextSize?: string;
  } | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        if (typeof productId !== "number") return;
        const res = await api.get<{
          items: Array<{
            variants?: Array<{
              sku: string;
              size?: string;
              color?: string;
              priceModifier?: number;
              images?: string[];
              stock?: number;
            }>;
            basePrice: number;
          }>;
        }>("/products", {
          params: {
            filter: JSON.stringify({ _id: productId }),
            limit: 1,
            _ts: Date.now(),
          },
        });
        const p = res.data.items?.[0];
        const pv = (p?.variants || []) as Array<{
          sku: string;
          size?: string;
          color?: string;
          priceModifier?: number;
          images?: string[];
          stock?: number;
        }>;
        setProductVariants(pv);
        setProductBasePrice(p?.basePrice);
        const codeMap: Record<string, string> = {};
        pv.forEach((v) => {
          const code = parseColor(undefined, v.sku);
          const full = parseColor(v.color, v.sku);
          if (code && full) codeMap[code] = full;
        });
        setColorCodeMap(codeMap);
        const colorsList = Array.from(
          new Set(
            pv
              .map((v) => {
                const full = v.color?.trim().toLowerCase();
                if (full) return full;
                const code = parseColor(undefined, v.sku);
                return code ? codeMap[code] || code : undefined;
              })
              .filter((c): c is string => !!c),
          ),
        );
        setColors(colorsList as string[]);
        const desiredColor = color?.trim().toLowerCase();
        const parsedColorCode = parseColor(undefined, sku);
        const resolvedColorFromSku = parsedColorCode
          ? codeMap[parsedColorCode] || parsedColorCode
          : undefined;
        const initialColor =
          desiredColor || resolvedColorFromSku || colorsList[0];
        setSelectedColor(initialColor);
        let sizesList: string[] = [];
        if (initialColor) {
          sizesList = Array.from(
            new Set(
              pv
                .filter((v) => {
                  const full = v.color?.trim().toLowerCase();
                  const code = parseColor(undefined, v.sku);
                  const resolved =
                    full || (code ? codeMap[code] || code : undefined);
                  return resolved === initialColor;
                })
                .map((v) => (v.size || parseSize(v.sku))!)
                .filter(Boolean),
            ),
          );
        } else {
          sizesList = Array.from(
            new Set(
              pv.map((v) => (v.size || parseSize(v.sku))!).filter(Boolean),
            ),
          );
        }
        setSizes(sizesList as string[]);
        const desiredSizeLower = size?.trim().toLowerCase();
        const parsedSize = parseSize(sku);
        let initialSize = desiredSizeLower || parsedSize || sizesList[0];
        // Normalize to canonical casing from sizes list to match SelectItem values
        if (initialSize && sizesList && sizesList.length) {
          const lower = String(initialSize).toLowerCase();
          const found = sizesList.find((x) => x.toLowerCase() === lower);
          initialSize = found || initialSize;
        }
        setSelectedSize(initialSize);
        if (initialColor || initialSize) {
          const applied = applyVariantOrPrompt(initialColor, initialSize, true);
          if (applied) {
            setLastAppliedColor(initialColor);
            setLastAppliedSize(initialSize);
          }
        }
      } catch {
        // ignore
      }
    }
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const currentSize = useMemo(() => {
    const raw = selectedSize ?? parseSize(sku) ?? (sizes[0] || undefined);
    if (!raw) return raw;
    const lower = String(raw).toLowerCase();
    const found = sizes.find((x) => x.toLowerCase() === lower);
    return found || raw;
  }, [selectedSize, sku, sizes]);
  const currentColor = useMemo(() => {
    if (selectedColor) return selectedColor;
    const code = parseColor(undefined, sku);
    const resolved = code ? colorCodeMap[code] || code : undefined;
    return resolved ?? (colors[0] || undefined);
  }, [selectedColor, sku, colors, colorCodeMap]);

  function parseSize(vSku?: string) {
    if (!vSku) return undefined;
    const parts = vSku.split("/").map((p) => p.trim());
    if (parts.length > 1) return parts[1];
    const dash = vSku.split("-");
    if (dash.length > 1) return dash[dash.length - 1];
    return undefined;
  }
  function parseColor(vColor?: string, vSku?: string) {
    const c = vColor?.trim();
    if (c) return c.toLowerCase();
    if (!vSku) return undefined;
    if (vSku.includes("/")) {
      const parts = vSku.split("/").map((p) => p.trim());
      return parts[0]?.toLowerCase();
    }
    const dash = vSku.split("-").map((p) => p.trim());
    if (dash.length >= 2) return dash[1]?.toLowerCase();
    return undefined;
  }

  function resolveColor(vColor?: string, vSku?: string) {
    const full = vColor?.trim().toLowerCase();
    if (full) return full;
    const code = parseColor(undefined, vSku);
    if (!code) return undefined;
    const mapped = colorCodeMap[code] || code;
    return mapped?.toLowerCase();
  }

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

  function applyVariantOrPrompt(
    nextColor?: string,
    nextSize?: string,
    silent?: boolean,
  ): boolean {
    if (
      typeof productId !== "number" ||
      typeof sku !== "string" ||
      !productBasePrice ||
      productVariants.length === 0
    ) {
      return false;
    }
    const targetColor = (nextColor || currentColor)?.toLowerCase();
    const targetSize = (nextSize || currentSize)?.toLowerCase();
    let match = productVariants.find(
      (v) =>
        resolveColor(v.color, v.sku) === targetColor &&
        (v.size || parseSize(v.sku))?.toLowerCase() === targetSize,
    );
    if (!match && targetColor) {
      match = productVariants.find(
        (v) => resolveColor(v.color, v.sku) === targetColor,
      );
    }
    if (!match) match = productVariants[0];
    if (!match) return false;
    const nextPrice = Math.max(
      0,
      productBasePrice + (match.priceModifier || 0),
    );
    const nextImage = match.images?.[0];

    const existing = items.find(
      (i) => i.productId === productId && i.sku === match!.sku && i.sku !== sku,
    );
    if (!silent && existing) {
      setPending({
        nextSku: match.sku,
        nextPrice,
        nextImage,
        nextColor,
        nextSize,
      });
      setConfirmOpen(true);
      return false;
    }
    updateItemVariant(
      productId,
      sku,
      match.sku,
      nextPrice,
      nextImage,
      targetColor,
      targetSize,
    );
    if (!silent) {
      setLastAppliedColor(nextColor || currentColor);
      setLastAppliedSize(nextSize || currentSize);
    }
    return true;
  }

  // Find current variant stock
  const currentVariant = productVariants.find((v) => v.sku === sku);
  const stock = currentVariant?.stock ?? undefined;
  const maxQty = typeof stock === "number" && stock > 0 ? stock : 1;

  useEffect(() => {
    if (typeof stock === "number" && quantity > stock) {
      updateItemQuantity(productId!, sku!, stock);
      if (stock === 0) {
        removeFromCart(productId!, sku!);
        toast.error(
          `${title} has gone out of stock, so it got removed from your cart`,
        );
      } else {
        toast.error(
          `We removed ${quantity - stock} from ${title} due to stock level`,
        );
      }
    }
  }, [
    stock,
    quantity,
    productId,
    sku,
    title,
    updateItemQuantity,
    removeFromCart,
  ]);

  return (
    <div className="py-2">
      <div className="grid grid-cols-[56px_1fr] md:grid-cols-[96px_1fr_auto] gap-2 md:gap-4 items-start">
        <img
          src={image}
          alt={title}
          className="size-14 md:size-24 rounded-md object-cover border"
        />
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2 md:gap-3">
            <div className="truncate">
              <div className="text-[13px] md:text-base font-semibold truncate">
                {title}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {variant}
              </div>
            </div>
          </div>
          {/* Mobile subtotal */}
          <div className="mt-1 md:hidden text-right">
            <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
              <Banknote className="size-3" /> Subtotal
            </div>
            {originalPrice && originalPrice !== price ? (
              <>
                <div className="flex items-center justify-end gap-1.5">
                  <div className="text-xs text-muted-foreground line-through">
                    EGP {(originalPrice * quantity).toFixed(0)}
                  </div>
                  {isDiscountValid(discount) && (
                    <Badge
                      variant="default"
                      className="text-[9px] h-4 px-0.5 shrink-0">
                      {getDiscountLabel(discount)}
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-semibold text-primary">
                  EGP {subtotal.toFixed(0)}
                </div>
                <div className="text-[10px] text-green-600">
                  Save EGP {((originalPrice - price) * quantity).toFixed(0)}
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold">EGP {subtotal}</div>
                <div className="text-[10px] text-muted-foreground">
                  EGP {price} × {quantity}
                </div>
              </>
            )}
          </div>
        </div>
        {/* Desktop right column: subtotal + actions */}
        <div className="hidden md:flex items-start gap-3 shrink-0">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              <Banknote className="size-3" /> Subtotal
            </div>
            {originalPrice && originalPrice !== price ? (
              <>
                <div className="flex items-center justify-end gap-1.5">
                  <div className="text-xs text-muted-foreground line-through">
                    EGP {(originalPrice * quantity).toFixed(0)}
                  </div>
                  {isDiscountValid(discount) && (
                    <Badge
                      variant="default"
                      className="text-xs h-5 px-1.5 shrink-0">
                      {getDiscountLabel(discount)}
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-semibold text-primary">
                  EGP {subtotal.toFixed(0)}
                </div>
                <div className="text-[10px] text-green-600">
                  Save EGP {((originalPrice - price) * quantity).toFixed(0)}
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold">EGP {subtotal}</div>
                <div className="text-[11px] text-muted-foreground">
                  EGP {price} × {quantity}
                </div>
              </>
            )}
          </div>
          {/* Merge confirmation dialog */}
          <Dialog
            open={confirmOpen}
            onOpenChange={(o) => {
              if (!o) {
                if (lastAppliedColor) setSelectedColor(lastAppliedColor);
                if (lastAppliedSize) setSelectedSize(lastAppliedSize);
                setConfirmOpen(false);
                setPending(null);
              }
            }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Already in your cart</DialogTitle>
                <DialogDescription>
                  You already have a {title} with the same options, so we are
                  just going to increment its amount.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (lastAppliedColor) setSelectedColor(lastAppliedColor);
                      if (lastAppliedSize) setSelectedSize(lastAppliedSize);
                      setConfirmOpen(false);
                      setPending(null);
                    }}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={() => {
                    if (
                      !pending ||
                      typeof productId !== "number" ||
                      typeof sku !== "string"
                    ) {
                      setConfirmOpen(false);
                      setPending(null);
                      return;
                    }
                    const existing = items.find(
                      (i) =>
                        i.productId === productId && i.sku === pending.nextSku,
                    );
                    if (existing) {
                      const newQty = existing.quantity + quantity;
                      updateItemQuantity(productId, pending.nextSku, newQty);
                      removeFromCart(productId, sku);
                    }
                    setConfirmOpen(false);
                    setPending(null);
                  }}>
                  Alright!
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant="destructive"
            size="icon-sm"
            aria-label="Remove"
            onClick={
              onRemove
                ? onRemove
                : () => {
                    if (
                      typeof productId === "number" &&
                      typeof sku === "string"
                    ) {
                      removeFromCart(productId, sku);
                    }
                  }
            }
            className="shrink-0">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <div className="mt-2 md:mt-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-start">
          {/* Line 1: quantity */}
          <div className="w-full flex justify-center md:justify-start">
            <QuantitySelector
              value={quantity}
              onChange={(next) => {
                if (typeof productId === "number" && typeof sku === "string") {
                  const safeQty = Math.min(next, maxQty);
                  updateItemQuantity(productId, sku, safeQty);
                  if (next > maxQty) {
                    toast.error(`Only ${maxQty} left in stock for ${title}`);
                  }
                }
              }}
              max={maxQty}
              min={1}
            />
          </div>

          {/* Line 2: color variant */}
          {colors.length > 0 && (
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Palette className="size-3" /> Color
              </span>
              <Select
                value={currentColor}
                onValueChange={(next) => {
                  const prevColor = currentColor;
                  const prevSize = currentSize;
                  setSelectedColor(next);
                  const colorSizes = Array.from(
                    new Set(
                      productVariants
                        .filter((v) => resolveColor(v.color, v.sku) === next)
                        .map((v) => (v.size || parseSize(v.sku))!)
                        .filter(Boolean),
                    ),
                  );
                  let targetSize = colorSizes.includes(currentSize || "")
                    ? currentSize
                    : colorSizes[0];
                  if (targetSize) {
                    const lower = String(targetSize).toLowerCase();
                    const found = (colorSizes.length ? colorSizes : sizes).find(
                      (x) => x.toLowerCase() === lower,
                    );
                    targetSize = found || targetSize;
                  }
                  if (!targetSize) {
                    const allSizes = Array.from(
                      new Set(
                        productVariants
                          .map((v) => (v.size || parseSize(v.sku))!)
                          .filter(Boolean),
                      ),
                    );
                    targetSize = allSizes[0];
                    setSizes(allSizes as string[]);
                  } else {
                    setSizes(colorSizes as string[]);
                  }
                  setSelectedSize(targetSize);
                  const applied = applyVariantOrPrompt(next, targetSize);
                  if (applied) {
                    setLastAppliedColor(next);
                    setLastAppliedSize(targetSize);
                  } else {
                    setLastAppliedColor(prevColor);
                    setLastAppliedSize(prevSize);
                  }
                }}>
                <SelectTrigger
                  size="sm"
                  className="h-7 rounded-full w-full md:w-32">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((c) => {
                    const label = c.charAt(0).toUpperCase() + c.slice(1);
                    return (
                      <SelectItem
                        key={`ci-color-${c}`}
                        value={c}
                        textValue={label}>
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="size-4 rounded-full border"
                            style={swatchStyles(c)}
                          />
                          {label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Line 3: size variant */}
          {sizes.length > 0 && (
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Ruler className="size-3" /> Size
              </span>
              <Select
                value={currentSize}
                onValueChange={(next) => {
                  const prevColor = currentColor;
                  const prevSize = currentSize;
                  setSelectedSize(next);
                  const applied = applyVariantOrPrompt(currentColor, next);
                  if (applied) {
                    setLastAppliedColor(currentColor);
                    setLastAppliedSize(next);
                  } else {
                    setLastAppliedColor(prevColor);
                    setLastAppliedSize(prevSize);
                  }
                }}>
                <SelectTrigger
                  size="sm"
                  className="h-7 rounded-full w-full md:w-24">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((s) => (
                    <SelectItem key={`ci-size-${s}`} value={s} textValue={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Line 4: mobile remove button */}
          <div className="flex justify-end md:col-span-3 md:hidden">
            <Button
              variant="destructive"
              size="sm"
              aria-label="Remove"
              onClick={
                onRemove
                  ? onRemove
                  : () => {
                      if (
                        typeof productId === "number" &&
                        typeof sku === "string"
                      ) {
                        removeFromCart(productId, sku);
                      }
                    }
              }
              className="flex items-center justify-center gap-2 w-full">
              <Trash2 className="size-4" />
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
