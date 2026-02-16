import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SectionHeader from "@/components/common/SectionHeader";
import ProductCard from "@/components/product/ProductCard";
import ProductFilters from "@/components/product/ProductFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
// Pagination UI removed with infinite scroll
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";
import api from "@/lib/api";

type Variant = {
  sku: string;
  priceModifier?: number;
  images?: string[];
  color?: string;
  size?: string;
};

type Product = {
  _id: number;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  category: number; // category id
  variants?: Variant[];
  discount?: any;
};

type ListResponse<T> = {
  items: T[];
  total: number;
};

export default function Shop() {
  const location = useLocation();
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<
    Array<{ _id: number; name: string; slug: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  // Filters
  const [category, setCategory] = useState<string | null>(null); // slug-based filter from URL
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(2000);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<string>("createdAt_desc");
  const [total, setTotal] = useState<number>(0);
  // Infinite scroll: control how many items are displayed progressively
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Static SEO + OG for Shop
  useEffect(() => {
    const title = "Shop – Nasej";
    const description =
      "Browse the full Nasej collection. Filter, sort, and find your next favorite piece.";
    const imagePath = "/logo.png";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const image = imagePath.startsWith("http")
      ? imagePath
      : `${origin}${imagePath}`;
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
    ogType.setAttribute("content", "website");
    const ogUrl = ensureMeta('meta[property="og:url"]', {
      setAttribute: "property",
    } as any);
    ogUrl.setAttribute("property", "og:url");
    if (url) ogUrl.setAttribute("content", url);
  }, []);

  // Initialize filters/sort from URL query params and keep in sync on navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const qCategory = params.get("category");
    const qSizes = params.get("sizes");
    const qColors = params.get("colors");
    const qPriceMin = params.get("priceMin");
    const qPriceMax = params.get("priceMax");
    const qSort = params.get("sort");
    // page & pageSize no longer used with infinite scroll

    if (qCategory !== null) {
      const lc = qCategory.toLowerCase();
      if (lc !== category) setCategory(lc);
    }
    if (qSizes !== null) {
      const arr = qSizes
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (arr.join(",") !== selectedSizes.join(",")) setSelectedSizes(arr);
    }
    if (qColors !== null) {
      const arr = qColors
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean);
      if (arr.join(",") !== selectedColors.join(",")) setSelectedColors(arr);
    }
    if (qPriceMin !== null) {
      const v = Number(qPriceMin);
      if (!Number.isNaN(v) && v !== priceMin) setPriceMin(v);
    }
    if (qPriceMax !== null) {
      const v = Number(qPriceMax);
      if (!Number.isNaN(v) && v !== priceMax) setPriceMax(v);
    }
    if (qSort !== null && qSort !== sortKey) setSortKey(qSort);
    // ignore legacy pagination params
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Reflect current filters/sort into URL query params (replace history to avoid spam)
  useEffect(() => {
    const params = new URLSearchParams();
    // Only include non-empty/non-defaults so clearing removes params
    if (category) params.set("category", category);
    if (selectedSizes.length > 0) params.set("sizes", selectedSizes.join(","));
    if (selectedColors.length > 0)
      params.set("colors", selectedColors.join(","));
    if (priceMin !== 0) params.set("priceMin", String(priceMin));
    if (priceMax !== 2000) params.set("priceMax", String(priceMax));
    if (sortKey !== "createdAt_desc") params.set("sort", sortKey);
    // Drop page/pageSize from URL for infinite scroll
    const nextSearch = `?${params.toString()}`;
    if (nextSearch !== (location.search || "")) {
      navigate({ search: nextSearch }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, selectedSizes, selectedColors, priceMin, priceMax, sortKey]);

  useEffect(() => {
    async function loadBase() {
      try {
        const res = await api.get<
          ListResponse<{ _id: number; name: string; slug: string }>
        >("/categories", {
          params: {
            limit: 50,
            sort: JSON.stringify({ name: 1 }),
            _ts: Date.now(),
          },
        });
        setCategories(res.data.items || []);
      } catch {
        // ignore
      }
    }
    loadBase();
  }, []);

  // Fetch all products once; subsequent filters/sort/pagination are client-side
  useEffect(() => {
    async function loadAllProducts() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<ListResponse<Product>>("/products", {
          params: {
            limit: 1000,
            sort: JSON.stringify({ createdAt: -1 }),
            filter: JSON.stringify({ isActive: true }),
            _ts: Date.now(),
          },
        });
        setAllProducts(res.data.items || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    loadAllProducts();
  }, []);

  // Client-side filtering/sorting/pagination derived from allProducts
  const selectedCategoryId = useMemo(() => {
    if (!category) return null;
    const match = categories.find(
      (c) => c.slug.toLowerCase() === category.toLowerCase(),
    );
    return match ? match._id : null;
  }, [categories, category]);

  const filteredProducts = useMemo(() => {
    let list = allProducts.slice();
    // Category filter
    if (selectedCategoryId != null)
      list = list.filter((p) => p.category === selectedCategoryId);
    // Price range on basePrice
    list = list.filter((p) => {
      const price = p.basePrice;
      return (
        (priceMin == null || price >= priceMin) &&
        (priceMax == null || price <= priceMax)
      );
    });
    // Size/color filters on variants (AND when both selected)
    if (selectedSizes.length > 0) {
      list = list.filter((p) =>
        (p.variants || []).some((v) => {
          const vs = (v.size || "").toLowerCase();
          return !!vs && selectedSizes.includes(vs);
        }),
      );
    }
    if (selectedColors.length > 0) {
      list = list.filter((p) =>
        (p.variants || []).some((v) => {
          const vc = (v.color || "").toLowerCase();
          return !!vc && selectedColors.includes(vc);
        }),
      );
    }
    // Sorting
    list.sort((a, b) => {
      switch (sortKey) {
        case "price_asc":
          return a.basePrice - b.basePrice;
        case "price_desc":
          return b.basePrice - a.basePrice;
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        default:
          // createdAt_desc
          const ad = (a as any).createdAt
            ? new Date((a as any).createdAt).getTime()
            : 0;
          const bd = (b as any).createdAt
            ? new Date((b as any).createdAt).getTime()
            : 0;
          return bd - ad;
      }
    });
    return list;
  }, [
    allProducts,
    category,
    priceMin,
    priceMax,
    selectedSizes,
    selectedColors,
    sortKey,
  ]);

  useEffect(() => {
    setTotal(filteredProducts.length);
  }, [filteredProducts.length]);

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        _id: c.slug, // use slug as _id for ProductFilters
        name: c.name,
      })),
    [categories],
  );
  // Reset visible items when filters/sort change
  useEffect(() => {
    setVisibleCount(Math.min(6, filteredProducts.length));
  }, [
    category,
    priceMin,
    priceMax,
    selectedSizes,
    selectedColors,
    sortKey,
    allProducts,
  ]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + 6, filteredProducts.length),
          );
          observer.unobserve(el);
          setTimeout(() => {
            // Re-attach after DOM updates so user needs to scroll further
            if (sentinelRef.current) observer.observe(sentinelRef.current);
          }, 100);
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filteredProducts.length]);
  const sizeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of allProducts) {
      for (const v of p.variants || []) {
        if (v.size && typeof v.size === "string") set.add(v.size);
      }
    }
    if (set.size === 0) return ["S", "M", "L", "XL", "OS"];
    return Array.from(set);
  }, [allProducts]);

  const colorOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of allProducts) {
      for (const v of p.variants || []) {
        if (v.color && typeof v.color === "string") set.add(v.color);
      }
    }
    if (set.size === 0)
      return ["Black", "White", "Beige", "Red", "Grey", "Blue"];
    return Array.from(set);
  }, [allProducts]);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Shop Now"
        description="Find your next favorite—filter, sort, and shop your way."
        align="center"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters */}
        <aside className="hidden md:block md:col-span-1 rounded-2xl border p-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-6 w-1/2" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={`fs-${i}`} className="h-7 w-full" />
                ))}
              </div>
              <Skeleton className="h-6 w-1/2" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={`fc-${i}`} className="h-7 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <ProductFilters
              categories={
                categoryOptions.length
                  ? categoryOptions
                  : [
                      { _id: "men", name: "Men" },
                      { _id: "women", name: "Women" },
                      { _id: "accessories", name: "Accessories" },
                    ]
              }
              sizes={sizeOptions}
              colors={colorOptions}
              onChange={(f) => {
                setCategory(f.c ? f.c.toLowerCase() : null);
                setPriceMin(f.priceMin);
                setPriceMax(f.priceMax);
                setSelectedSizes(f.sizes.map((s) => s.toLowerCase()));
                setSelectedColors(f.colors.map((c) => c.toLowerCase()));
                setVisibleCount(6);
              }}
              selectedc={category}
              selectedSizes={selectedSizes}
              selectedColors={selectedColors}
              priceMin={priceMin}
              priceMax={priceMax}
              onClear={() => {
                setCategory(null);
                setPriceMin(0);
                setPriceMax(2000);
                setSelectedSizes([]);
                setSelectedColors([]);
                setVisibleCount(6);
              }}
            />
          )}
        </aside>

        {/* Results */}
        <div className="md:col-span-3">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Mobile filters trigger */}
              <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="md:hidden rounded-full">
                    <SlidersHorizontal className="size-4" />
                    <span className="ml-1">Filters</span>
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="flex flex-col max-h-[85vh]">
                  <DrawerHeader>
                    <DrawerTitle>Filter results</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 flex-1 min-h-0 overflow-y-auto">
                    {loading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-6 w-1/2" />
                        <div className="grid grid-cols-2 gap-2">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={`mfs-${i}`} className="h-8 w-full" />
                          ))}
                        </div>
                        <Skeleton className="h-6 w-1/2" />
                        <div className="grid grid-cols-3 gap-2">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={`mfc-${i}`} className="h-8 w-full" />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <ProductFilters
                        categories={
                          categoryOptions.length
                            ? categoryOptions
                            : [
                                { _id: "men", name: "Men" },
                                { _id: "women", name: "Women" },
                                { _id: "accessories", name: "Accessories" },
                              ]
                        }
                        sizes={sizeOptions}
                        colors={colorOptions}
                        onChange={(f) => {
                          setCategory(f.c ? f.c.toLowerCase() : null);
                          setPriceMin(f.priceMin);
                          setPriceMax(f.priceMax);
                          setSelectedSizes(f.sizes.map((s) => s.toLowerCase()));
                          setSelectedColors(
                            f.colors.map((c) => c.toLowerCase()),
                          );
                          setVisibleCount(6);
                        }}
                        selectedc={category}
                        selectedSizes={selectedSizes}
                        selectedColors={selectedColors}
                        priceMin={priceMin}
                        priceMax={priceMax}
                        onClear={() => {
                          setCategory(null);
                          setPriceMin(0);
                          setPriceMax(2000);
                          setSelectedSizes([]);
                          setSelectedColors([]);
                          setVisibleCount(6);
                        }}
                      />
                    )}
                  </div>
                  <div className="p-4 flex justify-end border-t bg-background/80">
                    <DrawerClose asChild>
                      <Button size="sm" className="rounded-full">
                        Show results
                      </Button>
                    </DrawerClose>
                  </div>
                </DrawerContent>
              </Drawer>
              <div className="text-sm text-muted-foreground hidden md:block">
                Explore {total} items
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={sortKey}
                onValueChange={(v) => {
                  setSortKey(v);
                  setVisibleCount(6);
                }}>
                <SelectTrigger
                  size="sm"
                  aria-label="Sort results"
                  className="rounded-full">
                  <SelectValue placeholder="Sort results" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="createdAt_desc">Newest first</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="name_asc">Name: A–Z</SelectItem>
                  <SelectItem value="name_desc">Name: Z–A</SelectItem>
                </SelectContent>
              </Select>

              {/* Items per page selector removed due to infinite scroll */}
            </div>
          </div>

          {/* Top Pagination removed for infinite scroll */}

          {/* Grid or empty state */}
          <div className="mt-4">
            {loading && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`pcs-${i}`} className="space-y-3">
                      <Skeleton className="aspect-3/4 w-full" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              </>
            )}
            {error && (
              <div className="text-center text-red-500">
                {error} — Please try again.
              </div>
            )}
            {!loading && !error && filteredProducts.length === 0 && (
              <div className="text-center text-muted-foreground">
                No products found, try changing your filters
              </div>
            )}
            {!loading && !error && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.slice(0, visibleCount).map((p) => {
                  const firstImage = p.variants?.[0]?.images?.[0];
                  const firstSku = p.variants?.[0]?.sku;
                  const priceMod = p.variants?.[0]?.priceModifier || 0;
                  const price = Math.max(0, p.basePrice + priceMod);
                  return (
                    <ProductCard
                      key={`plp-${p._id}`}
                      productId={p._id}
                      slug={p.slug}
                      sku={firstSku}
                      title={p.name}
                      price={price}
                      image={
                        firstImage ||
                        "https://via.placeholder.com/600x800?text=Nasej"
                      }
                      categoryId={p.category}
                      variants={p.variants}
                      basePrice={p.basePrice}
                      discount={p.discount}
                    />
                  );
                })}
              </div>
            )}
            {/* Infinite scroll sentinel */}
            {!loading && !error && visibleCount < filteredProducts.length && (
              <div ref={sentinelRef} className="h-8" />
            )}
          </div>
          {/* Bottom Pagination removed for infinite scroll */}
        </div>
      </div>
    </div>
  );
}
