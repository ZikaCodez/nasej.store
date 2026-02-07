import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "@/components/common/SectionHeader";
import ProductCard from "@/components/product/ProductCard";
import CategoryCard from "@/components/category/CategoryCard";
import { Button } from "@/components/ui/button";
import { Meteors } from "@/components/ui/meteors";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { useTheme } from "@/providers/ThemeProvider";
import api from "@/lib/api";
import {
  Truck,
  ShieldCheck,
  RefreshCw,
  HandCoins,
  ShoppingBag,
  Telescope,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

import brandConfig from "@/brand-config.json";

type Variant = {
  sku: string;
  priceModifier?: number;
  images?: string[];
};

type Product = {
  _id: number;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  category: number; // category id
  variants?: Variant[];
  createdAt?: string | Date;
  discount?: any;
};

type ListResponse<T> = {
  items: T[];
  total: number;
};

export default function Home() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const newArrivalsRef = useRef<HTMLElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [newArrivalsApi, setNewArrivalsApi] = useState<CarouselApi | null>(
    null,
  );
  const [newArrivalsPaused, setNewArrivalsPaused] = useState(false);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [featApi, setFeatApi] = useState<CarouselApi | null>(null);
  const [featPaused, setFeatPaused] = useState(false);
  const [categories, setCategories] = useState<
    Array<{ _id: number; name: string; slug: string; description?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Static SEO + OG for Home
  useEffect(() => {
    const title = `${brandConfig.brandName} – Premium Local Clothing`;
    const description = `Premium local clothing crafted in Egypt. Discover essentials and seasonal highlights from ${brandConfig.brandName}.`;
    const imagePath =
      theme === "dark" ? brandConfig.logoDark : brandConfig.logoLight;
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

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const sort = JSON.stringify({ createdAt: -1 });
        const [newestRes, featuredRes, categoriesRes] = await Promise.all([
          api.get<ListResponse<Product>>("/products", {
            params: { limit: 8, sort, _ts: Date.now() },
          }),
          api.get<ListResponse<Product>>("/products", {
            params: {
              limit: 8,
              filter: JSON.stringify({ isActive: true, isFeatured: true }),
              _ts: Date.now(),
            },
          }),
          api.get<
            ListResponse<{
              _id: number;
              name: string;
              slug: string;
              description?: string;
            }>
          >("/categories", {
            params: {
              limit: 6,
              sort: JSON.stringify({ name: 1 }),
              _ts: Date.now(),
            },
          }),
        ]);
        setProducts(
          Array.isArray(newestRes.data.items) ? newestRes.data.items : [],
        );
        setFeatured(
          Array.isArray(featuredRes.data.items) ? featuredRes.data.items : [],
        );
        setCategories(
          Array.isArray(categoriesRes.data.items)
            ? categoriesRes.data.items
            : [],
        );
      } catch (e: any) {
        setError(e?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Autoplay New Arrivals carousel when more than 3 items
  useEffect(() => {
    if (!newArrivalsApi || products.length <= 3) return;
    const interval = setInterval(() => {
      if (!newArrivalsPaused) {
        newArrivalsApi.scrollNext();
      }
    }, 4500); // Slightly different timing than featured for variety
    return () => clearInterval(interval);
  }, [newArrivalsApi, newArrivalsPaused, products.length]);

  // Autoplay Featured carousel when more than 3 items
  useEffect(() => {
    if (!featApi || featured.length <= 3) return;
    const interval = setInterval(() => {
      if (!featPaused) {
        featApi.scrollNext();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [featApi, featPaused, featured.length]);

  const cards = useMemo(() => {
    return products.map((p) => {
      const firstImage = p.variants?.[0]?.images?.[0];
      const firstSku = p.variants?.[0]?.sku;
      const priceMod = p.variants?.[0]?.priceModifier || 0;
      const price = Math.max(0, p.basePrice + priceMod);
      return {
        key: p._id,
        productId: p._id,
        slug: p.slug,
        sku: firstSku,
        title: p.name,
        price,
        image: firstImage || "https://via.placeholder.com/600x800?text=Rova",
        categoryId: p.category,
        variants: p.variants,
        basePrice: p.basePrice,
        discount: p.discount,
        onQuickAdd: undefined,
      };
    });
  }, [products, categories, navigate]);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-slate-50 dark:bg-slate-950 px-6 py-20 md:py-32 flex flex-col items-center justify-center text-center transition-colors duration-300">
        <Meteors number={30} className="opacity-50 dark:opacity-100" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-1 text-xs md:text-sm font-medium backdrop-blur-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2" />
            <AnimatedShinyText className="inline-flex items-center justify-center transition-all ease-in hover:text-slate-800 dark:hover:text-neutral-300">
              <span>New Season Collection is Live</span>
            </AnimatedShinyText>
          </div>

          <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white">
            Elevate Your <span className="text-primary italic">Essential</span>{" "}
            Style With{" "}
            <img
              src={
                theme === "dark" ? brandConfig.logoDark : brandConfig.logoLight
              }
              alt={brandConfig.brandName}
              className="inline-block h-20 md:h-50 hover:scale-105 transition-transform"
            />
          </h1>

          <p className="text-base md:text-xl text-slate-600 dark:text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Premium local clothing crafted in Egypt. Discover the perfect blend
            of comfort, quality, and timeless design.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-full px-10 py-6 text-base font-bold shadow-sm cursor-pointer"
              onClick={() => navigate("/shop")}>
              <ShoppingBag /> Shop All Items
            </Button>
            {cards.length > 0 && (
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto rounded-full px-10 py-6 text-base border-slate-200 dark:border-white/20 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                onClick={() =>
                  newArrivalsRef.current?.scrollIntoView({ behavior: "smooth" })
                }>
                <Telescope /> Explore New Drops
              </Button>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px] z-0 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] z-0 pointer-events-none" />
      </section>

      {/* Shop by Category */}
      {(loading || categories.length > 0) && (
        <section>
          <SectionHeader
            title="Shop by Category"
            description="Find your style across our collections."
            align="center"
          />
          <div className="mt-6">
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <CategoryCard key={`cat-skeleton-${idx}`} loading={true} />
                ))}
              </div>
            )}

            {error && <div className="text-center text-red-500">{error}</div>}

            {!loading && !error && categories.length > 0 && (
              <div
                className={
                  categories.length === 1
                    ? "grid grid-cols-1 gap-4 max-w-sm mx-auto"
                    : categories.length === 2
                      ? "grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto"
                      : "grid grid-cols-2 md:grid-cols-3 gap-4"
                }>
                {categories.map((c) => (
                  <CategoryCard
                    key={c._id}
                    name={c.name}
                    slug={c.slug}
                    description={c.description}
                    onClick={() =>
                      navigate(`/shop?category=${encodeURIComponent(c.slug)}`)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recent Products (Grid) */}
      <section ref={newArrivalsRef} className="scroll-mt-20">
        {(loading || cards.length > 0) && (
          <>
            <SectionHeader
              title="New Arrivals"
              description="Freshly added pieces — explore the latest drops."
              align="center"
            />
            <div className="mt-6">
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <ProductCard key={`skeleton-${idx}`} loading />
                  ))}
                </div>
              )}
              {error && <div className="text-center text-red-500">{error}</div>}
              {!loading && !error && cards.length > 0 && (
                <>
                  <Carousel
                    opts={{ align: "start", loop: true }}
                    setApi={setNewArrivalsApi}
                    onMouseEnter={() => setNewArrivalsPaused(true)}
                    onMouseLeave={() => setNewArrivalsPaused(false)}>
                    <CarouselContent
                      className={cards.length < 3 ? "justify-center" : ""}>
                      {cards.map((c) => (
                        <CarouselItem
                          key={`arrival-${c.key}`}
                          className="basis-full md:basis-1/3">
                          <ProductCard
                            productId={c.productId}
                            slug={c.slug}
                            sku={c.sku}
                            title={c.title}
                            price={c.price}
                            image={c.image}
                            categoryId={c.categoryId}
                            variants={c.variants}
                            basePrice={c.basePrice}
                            discount={c.discount}
                            onQuickAdd={c.onQuickAdd}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious
                      className={`hidden ${cards.length > 3 ? "md:flex" : cards.length > 2 ? "flex" : ""} -left-4 bg-secondary hover:bg-primary`}
                    />
                    <CarouselNext
                      className={`hidden ${cards.length > 3 ? "md:flex" : cards.length > 2 ? "flex" : ""} -right-4 bg-secondary hover:bg-primary`}
                    />
                  </Carousel>
                </>
              )}
            </div>
          </>
        )}
      </section>

      {/* Benefits */}
      <section className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 rounded-2xl border p-4 hover:shadow-sm transition-shadow">
            <div className="mt-0.5 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary size-10">
              <Truck className="size-5" />
            </div>
            <div>
              <div className="text-base font-semibold">Fast Delivery</div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Nationwide in 3–7 business days
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border p-4 hover:shadow-sm transition-shadow">
            <div className="mt-0.5 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary size-10">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="text-base font-semibold">Premium Quality</div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Locally crafted fabrics & finishes
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border p-4 hover:shadow-sm transition-shadow">
            <div className="mt-0.5 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary size-10">
              <RefreshCw className="size-5" />
            </div>
            <div>
              <div className="text-base font-semibold">7‑Day Returns</div>
              <div className="text-xs md:text-sm text-muted-foreground">
                First 2 days hassle‑free, full 7 days for defects
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border p-4 hover:shadow-sm transition-shadow">
            <div className="mt-0.5 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary size-10">
              <HandCoins className="size-5" />
            </div>
            <div>
              <div className="text-base font-semibold">Cash on Delivery</div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Pay safely on arrival
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs md:text-sm text-muted-foreground text-center max-w-3xl mx-auto">
          We’re committed to a premium, worry‑free experience from checkout to
          your doorstep — with quality you can feel and service you can trust.
        </p>
      </section>

      {/* Featured Picks */}
      <section>
        {(loading || featured.length > 0) && (
          <SectionHeader
            title="Featured Picks"
            description="Highlighted styles we’re loving right now."
            align="center"
          />
        )}
        {error && <div className="text-center text-red-500">{error}</div>}
        <div className="mt-6">
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <ProductCard key={`feat-skeleton-${idx}`} loading />
              ))}
            </div>
          )}

          {!loading && !error && featured.length > 0 && (
            <>
              {featured.length > 3 ? (
                <Carousel
                  opts={{ align: "start", loop: true }}
                  setApi={setFeatApi}
                  onMouseEnter={() => setFeatPaused(true)}
                  onMouseLeave={() => setFeatPaused(false)}>
                  <CarouselContent
                    className={featured.length < 3 ? "justify-center" : ""}>
                    {featured.map((p) => {
                      const firstImage = p.variants?.[0]?.images?.[0];
                      const firstSku = p.variants?.[0]?.sku;
                      const priceMod = p.variants?.[0]?.priceModifier || 0;
                      const price = Math.max(0, p.basePrice + priceMod);
                      return (
                        <CarouselItem
                          key={`feat-${p._id}`}
                          className={`basis-full md:basis-1/3`}>
                          <ProductCard
                            productId={p._id}
                            slug={p.slug}
                            sku={firstSku}
                            title={p.name}
                            price={price}
                            image={
                              firstImage ||
                              "https://via.placeholder.com/600x800?text=Rova"
                            }
                            categoryId={p.category}
                            variants={p.variants}
                            basePrice={p.basePrice}
                          />
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <CarouselPrevious
                    className={`hidden ${featured.length > 3 ? "md:flex" : featured.length > 2 ? "flex" : ""} -left-4 bg-secondary hover:bg-primary`}
                  />
                  <CarouselNext
                    className={`hidden ${featured.length > 3 ? "md:flex" : featured.length > 2 ? "flex" : ""} -right-4 bg-secondary hover:bg-primary`}
                  />
                </Carousel>
              ) : (
                <div
                  className={
                    featured.length === 1
                      ? "grid grid-cols-1 gap-4 max-w-sm mx-auto"
                      : featured.length === 2
                        ? "grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto"
                        : "grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
                  }>
                  {featured.map((p) => {
                    const firstImage = p.variants?.[0]?.images?.[0];
                    const firstSku = p.variants?.[0]?.sku;
                    const priceMod = p.variants?.[0]?.priceModifier || 0;
                    const price = Math.max(0, p.basePrice + priceMod);
                    return (
                      <ProductCard
                        key={`feat-${p._id}`}
                        productId={p._id}
                        slug={p.slug}
                        sku={firstSku}
                        title={p.name}
                        price={price}
                        image={
                          firstImage ||
                          "https://via.placeholder.com/600x800?text=Rova"
                        }
                        categoryId={p.category}
                        variants={p.variants}
                        basePrice={p.basePrice}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>
      {/* Structured Data for Featured Products */}
      {featured.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: featured.map((p, index) => {
                const firstImage = p.variants?.[0]?.images?.[0];
                const priceMod = p.variants?.[0]?.priceModifier || 0;
                const price = Math.max(0, p.basePrice + priceMod);
                return {
                  "@type": "Product",
                  position: index + 1,
                  name: p.name,
                  image:
                    firstImage ||
                    "https://via.placeholder.com/600x800?text=Rova",
                  category: p.category,
                  offers: {
                    "@type": "Offer",
                    price: price,
                    priceCurrency: "EGP",
                    availability: "https://schema.org/PreOrder",
                  },
                };
              }),
            }),
          }}
        />
      )}

      {/* Brand Story CTA */}
      <section className="rounded-2xl border p-6 md:p-8 text-center">
        <h3 className="text-xl md:text-2xl font-semibold">
          Crafted for Everyday Comfort
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
          Inspired by local culture and modern minimalism. We obsess over fit,
          fabric, and finish so you don’t have to.
        </p>
        <div className="mt-4">
          <Button
            className="rounded-full"
            size="sm"
            onClick={() => navigate("/shop")}>
            Explore the Collection
          </Button>
        </div>
      </section>
    </div>
  );
}
