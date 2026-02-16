import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/providers/CartProvider";
import ProductCard from "@/components/product/ProductCard";
import api from "@/lib/api";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import SizeChart from "@/components/category/SizeChart";
import type { Category } from "@/types/category";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useColors } from "@/hooks/useColors";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import {
  calculateDiscountedPrice,
  getDiscountLabel,
  type Discount,
} from "@/lib/discounts";

type Variant = {
  sku: string;
  priceModifier?: number;
  price?: number;
  images?: string[];
  color?: string;
  size?: string;
  discount?: Discount;
  stock?: number;
};

type Product = {
  _id: number;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  category: number; // category id
  variants?: Variant[];
  discount?: Discount;
};

export default function Product() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { colorsMap } = useColors();
  const [product, setProduct] = useState<Product | null>(null);
  const [recs, setRecs] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [selectedColorKey, setSelectedColorKey] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ items: Product[] }>("/products", {
          params: {
            filter: JSON.stringify({ slug }),
            limit: 1,
            _ts: Date.now(),
          },
        });
        const p = res.data.items?.[0] || null;
        setProduct(p);
        if (p) {
          // Determine initial color/size from first variant
          const first = (p.variants || [])[0];
          const initialColor =
            (first?.color || parseColor(first?.sku))?.trim().toLowerCase() ||
            null;
          const initialSize =
            (first?.size || parseSize(first?.sku))?.trim().toLowerCase() ||
            null;
          if (initialColor) setSelectedColorKey(initialColor);
          if (initialSize) setSelectedSize(initialSize);

          // Fetch recommendations filtered by category + initial color
          const filter: any = {
            category: p.category,
            slug: { $ne: p.slug },
          };
          if (initialColor) filter["variants.color"] = initialColor;
          const rec = await api.get<{ items: Product[] }>("/products", {
            params: {
              filter: JSON.stringify(filter),
              sort: JSON.stringify({ createdAt: -1 }),
              limit: 8,
              _ts: Date.now(),
            },
          });
          setRecs(rec.data.items || []);
        } else {
          setRecs([]);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Fetch category by id when product loads
  useEffect(() => {
    async function loadCat() {
      if (!product || !product.category) return;
      try {
        const res = await api.get(`/categories/${product.category}`, {
          headers: { "x-silent": "1" },
        });
        setCategory(res.data || null);
      } catch {
        setCategory(null);
      }
    }
    loadCat();
  }, [product]);

  // Refresh recommendations when color filter changes
  useEffect(() => {
    async function loadColorFiltered() {
      if (!product) return;
      try {
        const filter: any = {
          category: product.category,
          slug: { $ne: product.slug },
        };
        if (selectedColorKey) {
          filter["variants.color"] = selectedColorKey;
        }
        const rec = await api.get<{ items: Product[] }>("/products", {
          params: {
            filter: JSON.stringify(filter),
            sort: JSON.stringify({ createdAt: -1 }),
            limit: 8,
            _ts: Date.now(),
          },
        });
        setRecs(rec.data.items || []);
      } catch {
        // ignore
      }
    }
    loadColorFiltered();
  }, [product?.category, product?.slug, selectedColorKey]);

  // Helpers similar to ProductCard
  const norm = (v?: string) => (v ? v.trim().toLowerCase() : undefined);
  const getVariantColorKey = (v: Variant) =>
    norm(v.color) || norm(parseColor(v.sku));
  const getVariantSize = (v: Variant) => norm(v.size) || norm(parseSize(v.sku));
  const findVariantIndex = (
    colorKey?: string | null,
    sizeKey?: string | null,
  ) => {
    const c = norm(colorKey || undefined);
    const s = norm(sizeKey || undefined);
    const list = product?.variants || [];
    if (list.length === 0) return 0;
    const exact = list.findIndex(
      (v) => getVariantColorKey(v) === c && getVariantSize(v) === s,
    );
    if (exact >= 0) return exact;
    if (c) {
      const byColor = list.findIndex((v) => getVariantColorKey(v) === c);
      if (byColor >= 0) return byColor;
    }
    if (s) {
      const bySize = list.findIndex((v) => getVariantSize(v) === s);
      if (bySize >= 0) return bySize;
    }
    return 0;
  };

  const imageForColor = (colorKey: string | null) => {
    const c = norm(colorKey || undefined);
    const list = product?.variants || [];
    if (c) {
      const v = list.find((vv) => getVariantColorKey(vv) === c);
      const img = v?.images?.[0];
      if (img) return img;
    }
    const v = list[selectedIdx];
    return v?.images?.[0];
  };

  const currentImage = useMemo(
    () => imageForColor(selectedColorKey) || undefined,
    [product, selectedIdx, selectedColorKey],
  );
  const currentImages: string[] =
    product?.variants?.[selectedIdx]?.images || [];

  // Use product-level discount only (variants no longer support individual discounts)
  const effectiveDiscount = product?.discount;

  const currentPrice = useMemo(() => {
    if (!product) return 0;
    const v = product.variants?.[selectedIdx];
    let basePrice = 0;
    if (v?.price !== undefined && v.price !== null) {
      basePrice = Math.max(0, v.price);
    } else {
      const mod = v?.priceModifier || 0;
      basePrice = Math.max(0, product.basePrice + mod);
    }
    return basePrice;
  }, [product, selectedIdx]);

  const discountedPrice = useMemo(() => {
    return calculateDiscountedPrice(currentPrice, effectiveDiscount);
  }, [currentPrice, effectiveDiscount]);

  const discountLabel = useMemo(() => {
    return getDiscountLabel(effectiveDiscount);
  }, [effectiveDiscount]);

  // Initialize default color/size once product loads
  useEffect(() => {
    if (
      !product ||
      !Array.isArray(product.variants) ||
      !product.variants.length
    )
      return;
    const first = product.variants[0];
    const c =
      (first.color || parseColor(first.sku))?.trim().toLowerCase() || null;
    const s =
      (first.size || parseSize(first.sku))?.trim().toLowerCase() || null;
    setSelectedColorKey(c);
    setSelectedSize(s);
    setSelectedIdx(0);
  }, [product]);

  // Keep selectedIdx in sync with color/size
  useEffect(() => {
    if (!product) return;
    const idx = findVariantIndex(selectedColorKey, selectedSize);
    setSelectedIdx(idx);
  }, [selectedColorKey, selectedSize]);

  // Dynamic SEO + OG for product page
  useEffect(() => {
    if (!product) return;
    const title = `${product.name} – Nasej`;
    const description =
      product.description ||
      "Premium local clothing from Nasej. Discover fit, fabric, and finish you'll love.";
    const fallbackImage = product.variants?.[0]?.images?.[0] || "/logo.png";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const image = (currentImage || fallbackImage).startsWith("http")
      ? currentImage || fallbackImage
      : `${origin}${currentImage || fallbackImage}`;
    const url =
      typeof window !== "undefined" ? window.location.href : undefined;

    document.title = title;
    const ensureMeta = (selector: string, attrs: Record<string, string>) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        Object.entries(attrs).forEach(([k, v]) => {
          (el as any)[k] = v;
        });
        document.head.appendChild(el);
      }
      return el;
    };

    const desc = ensureMeta('meta[name="description"]', {
      name: "description",
    });
    desc.content = description;
    const ogTitle = ensureMeta('meta[property="og:title"]', {
      setAttribute: "property",
    } as any);
    ogTitle.setAttribute("property", "og:title");
    ogTitle.setAttribute("content", title);
    const ogDesc = ensureMeta('meta[property="og:description"]', {
      setAttribute: "property",
    } as any);
    ogDesc.setAttribute("property", "og:description");
    ogDesc.setAttribute("content", description);
    const ogImage = ensureMeta('meta[property="og:image"]', {
      setAttribute: "property",
    } as any);
    ogImage.setAttribute("property", "og:image");
    ogImage.setAttribute("content", image);
    const ogType = ensureMeta('meta[property="og:type"]', {
      setAttribute: "property",
    } as any);
    ogType.setAttribute("property", "og:type");
    ogType.setAttribute("content", "product");
    const ogUrl = ensureMeta('meta[property="og:url"]', {
      setAttribute: "property",
    } as any);
    ogUrl.setAttribute("property", "og:url");
    if (url) ogUrl.setAttribute("content", url);
  }, [product, currentImage]);
  const handleAdd = () => {
    if (!product || typeof product._id !== "number") return;
    const list = product.variants || [];
    const c = selectedColorKey?.toLowerCase() || undefined;
    const s = selectedSize?.toLowerCase() || undefined;
    let v = list.find(
      (vv) => getVariantColorKey(vv) === c && getVariantSize(vv) === s,
    );
    if (!v && c) v = list.find((vv) => getVariantColorKey(vv) === c);
    if (!v) v = list[0];
    if (!v || !v.sku) return;
    const finalSku = v.sku;
    const finalImage = v.images?.[0] || currentImage;
    const finalPrice =
      v.price !== undefined && v.price !== null
        ? Math.max(0, v.price)
        : Math.max(0, product.basePrice + (v.priceModifier || 0));

    addToCart({
      productId: product._id,
      sku: finalSku,
      name: product.name,
      quantity: 1,
      priceAtPurchase: finalPrice,
      image: finalImage,
      color: c,
      size: s,
    });
    const colorLabel = selectedColorKey?.toUpperCase();
    const sizeLabel = selectedSize?.toUpperCase();
    const desc =
      colorLabel && sizeLabel
        ? `${product.name} • ${colorLabel} / ${sizeLabel}`
        : product.name;
    toast.success("Added to cart", {
      description: desc,
    });
  };

  // Stock display logic
  const currentVariant = product?.variants?.[selectedIdx];
  const stock = currentVariant?.stock ?? undefined;
  const outOfStock = stock === 0;
  const lowStock = typeof stock === "number" && stock > 0 && stock <= 5;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="relative w-full pb-[100%]">
          <Skeleton className="absolute inset-0 h-full w-full" />
        </div>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }
  if (error || !product) {
    return <div className="text-red-500">{error || "Product not found"}</div>;
  }

  const colors = Array.from(
    (product.variants || []).reduce((m, v, idx) => {
      const c = getVariantColorKey(v);
      if (c && !m.has(c)) m.set(c, idx);
      return m;
    }, new Map<string, number>()),
  );
  const sizesForColor = selectedColorKey
    ? Array.from(
        new Set(
          (product.variants || [])
            .filter((v) => getVariantColorKey(v) === selectedColorKey)
            .map((v) => getVariantSize(v))
            .filter((s): s is string => !!s),
        ),
      )
    : Array.from(
        new Set(
          (product.variants || [])
            .map((v) => getVariantSize(v))
            .filter((s): s is string => !!s),
        ),
      );

  function parseColor(vSku?: string) {
    if (!vSku) return undefined;
    const parts = vSku.split("/").map((p) => p.trim());
    if (parts.length > 0) return parts[0];
    const dash = vSku.split("-");
    if (dash.length >= 2) return dash[1];
    return undefined;
  }
  function parseSize(vSku?: string) {
    if (!vSku) return undefined;
    const parts = vSku.split("/").map((p) => p.trim());
    if (parts.length > 1) return parts[1];
    const dash = vSku.split("-");
    if (dash.length > 1) return dash[dash.length - 1];
    return undefined;
  }

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

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/shop">Products</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                to={
                  category?.slug
                    ? `/shop?category=${encodeURIComponent(category.slug)}`
                    : "/shop"
                }>
                {category?.name || ""}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative w-full pb-[100%]">
          <div className="absolute inset-0">
            {currentImages.length > 1 ? (
              <Carousel className="h-full w-full">
                <CarouselContent className="h-full w-full">
                  {currentImages.map((src, idx) => (
                    <CarouselItem
                      key={`pdp-img-${idx}`}
                      className="h-full w-full">
                      <div className="h-full w-full p-2">
                        <img
                          src={src}
                          alt={`${product.name} image ${idx + 1}`}
                          className="h-full w-full object-cover border rounded-2xl"
                          loading="lazy"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-4 bg-accent" />
                <CarouselNext className="-right-4 bg-accent" />
              </Carousel>
            ) : (
              <div className="h-full w-full p-2">
                <img
                  src={
                    currentImage ||
                    product.variants?.[0]?.images?.[0] ||
                    "https://via.placeholder.com/600x800?text=Nasej"
                  }
                  alt={product.name}
                  className="h-full w-full object-cover border rounded-2xl"
                />
              </div>
            )}
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold">{product.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            {effectiveDiscount ? (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  EGP {currentPrice.toFixed(0)}
                </span>
                <span className="text-lg font-bold text-primary">
                  EGP {discountedPrice.toFixed(0)}
                </span>
                {discountLabel && (
                  <Badge variant="destructive">{discountLabel}</Badge>
                )}
              </>
            ) : (
              <span className="text-lg font-medium">
                EGP {currentPrice.toFixed(0)}
              </span>
            )}
          </div>
          {/* Premium badges */}
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="default">100% Egyptian Cotton</Badge>
            <Badge variant="default">Ethically Made</Badge>
            <Badge variant="default">Breathable Weave</Badge>
          </div>

          {/* Color selector (first occurrence per color) */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Color:</span>
            {colors.map(([colorName, idx]) => {
              const selected = selectedColorKey === (colorName || "");
              const label =
                String(colorName).charAt(0).toUpperCase() +
                String(colorName).slice(1);
              return (
                <button
                  key={`pd-color-${String(colorName)}-${idx}`}
                  type="button"
                  aria-label={label}
                  onClick={() => {
                    const cn = colorName || null;
                    setSelectedColorKey(cn);
                    // Auto-pick first size for this color
                    const sizes = Array.from(
                      new Set(
                        (product.variants || [])
                          .filter((v) => getVariantColorKey(v) === cn)
                          .map((v) => getVariantSize(v))
                          .filter((s): s is string => !!s),
                      ),
                    );
                    if (sizes.length > 0)
                      setSelectedSize(sizes[0].toLowerCase());
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

          {/* Size selector */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Size:</span>
            {sizesForColor.map((s) => {
              const isSelected = selectedSize === s?.toLowerCase();
              return (
                <button
                  key={`pd-size-${s}`}
                  type="button"
                  aria-label={`Select size ${s}`}
                  onClick={() => setSelectedSize(s.toLowerCase())}
                  className={`text-xs rounded-full border px-2 py-0.5 ${isSelected ? "ring-2 ring-foreground" : "ring-0"}`}>
                  {s?.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Stock warning display */}
          {outOfStock ? (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                OUT OF STOCK
              </Badge>
            </div>
          ) : lowStock ? (
            <div className="mt-2">
              <Badge variant="destructive" className="text-xs h-5 px-1.5">
                {stock} LEFT IN STOCK
              </Badge>
            </div>
          ) : null}

          <div className="mt-3">
            <Button
              variant="default"
              className="rounded-full w-full md:w-auto bg-linear-to-r"
              onClick={handleAdd}
              aria-label="Add to cart"
              disabled={outOfStock}>
              <ShoppingCart className="size-4" />
              <span className="ml-2">
                {outOfStock ? "OUT OF STOCK" : "Add to cart"}
              </span>
            </Button>
          </div>
          {category?._id && (
            <div className="mt-3">
              <SizeChart categoryId={category._id} />
            </div>
          )}
          {/* Description below CTA */}
          <p className="mt-3 w-full md:w-3/4">
            {product.description ||
              "Crafted with premium long‑staple cotton for exceptional softness and durability. Designed for everyday comfort with a tailored, modern fit."}
          </p>
        </div>
      </div>

      {/* Recommended products */}
      {recs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>
              More{" "}
              {category
                ? category.name.charAt(0).toUpperCase() + category.name.slice(1)
                : ""}
              {selectedColorKey ? " in" : ""}
            </span>
            {selectedColorKey && (
              <span className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-sm">
                <span
                  aria-hidden="true"
                  className="size-4 rounded-full border"
                  style={swatchStyles(selectedColorKey)}
                />
                <span>
                  {selectedColorKey.charAt(0).toUpperCase() +
                    selectedColorKey.slice(1)}
                </span>
              </span>
            )}
          </h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recs.map((p) => {
              const preferred = selectedColorKey || undefined;
              const matched = (p.variants || []).find(
                (v) =>
                  (
                    v.color ||
                    (v.sku && v.sku.split("-")[1]) ||
                    ""
                  )?.toLowerCase() === preferred,
              );
              const fallbackVariant = p.variants?.[0];
              const image =
                matched?.images?.[0] || fallbackVariant?.images?.[0];
              const sku = matched?.sku || fallbackVariant?.sku;
              const priceMod =
                matched?.priceModifier ?? fallbackVariant?.priceModifier ?? 0;
              const price = Math.max(0, p.basePrice + (priceMod || 0));

              // Use product-level discount only (variants no longer support individual discounts)
              const recDiscount = p.discount;

              return (
                <ProductCard
                  key={`rec-${p._id}`}
                  productId={p._id}
                  slug={p.slug}
                  sku={sku}
                  title={p.name}
                  price={price}
                  image={
                    image || "https://via.placeholder.com/600x800?text=Nasej"
                  }
                  categoryId={p.category}
                  variants={p.variants}
                  basePrice={p.basePrice}
                  initialColor={preferred}
                  discount={recDiscount}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
