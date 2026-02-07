import { useEffect, useState } from "react";
import AdminLayout from "@/pages/Admin/AdminLayout";
import StatsCard from "@/components/admin/Overview/StatsCard";
import SalesChart from "@/components/admin/Overview/SalesChart";
import TopProductCard from "@/components/admin/Overview/TopProductCard";
import api from "@/lib/api";
import type { Order } from "@/types/order";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Package,
  ShoppingBag,
  Loader2,
  Users,
  CircleDollarSign,
  PoundSterling,
  HandCoins,
  RefreshCw,
} from "lucide-react";

type ListResponse<T> = {
  items: T[];
  total: number;
};

type TopProductSummary = {
  productId: number;
  name: string;
  image?: string;
  totalQuantity: number;
  totalRevenue: number;
  topVariantSku: string;
  topVariantQuantity: number;
};

export default function Dashboard() {
  const [productCount, setProductCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [completedOrderCount, setCompletedOrderCount] = useState<number | null>(
    null,
  );
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [avgOrderValue, setAvgOrderValue] = useState<number | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, usersRes, ordersRes] = await Promise.all([
        api.get<ListResponse<unknown>>("/products", {
          params: { limit: 1, _ts: Date.now() },
        }),
        api.get<ListResponse<unknown>>("/users", {
          params: { limit: 1, _ts: Date.now() },
        }),
        api.get<ListResponse<Order>>("/orders", {
          params: { limit: 200, _ts: Date.now() },
        }),
      ]);
      setProductCount(productsRes.data.total ?? productsRes.data.items.length);
      setUserCount(usersRes.data.total ?? usersRes.data.items.length);

      const orders = (ordersRes.data.items || []) as Order[];
      setOrderCount(ordersRes.data.total ?? orders.length);

      const completed = orders.filter(
        (o) => o.paymentStatus === "paid" && o.orderStatus === "delivered",
      );
      const completedCount = completed.length;
      setCompletedOrderCount(completedCount);

      const revenue = completed.reduce((sum, o) => sum + o.total, 0);
      setTotalRevenue(revenue);
      setAvgOrderValue(completedCount > 0 ? revenue / completedCount : null);

      const productMap = new Map<
        number,
        {
          totalQuantity: number;
          totalRevenue: number;
          name: string;
          image?: string;
          variants: Map<string, number>;
        }
      >();

      for (const order of completed) {
        for (const item of order.items || []) {
          const quantity = item.quantity || 0;
          const lineRevenue = item.priceAtPurchase * quantity;
          const existing = productMap.get(item.productId);

          if (existing) {
            existing.totalQuantity += quantity;
            existing.totalRevenue += lineRevenue;
            const skuCount = existing.variants.get(item.sku) || 0;
            existing.variants.set(item.sku, skuCount + quantity);
          } else {
            const variants = new Map<string, number>();
            variants.set(item.sku, quantity);
            productMap.set(item.productId, {
              name: item.name || `Product ${item.productId}`,
              image: item.image,
              totalQuantity: quantity,
              totalRevenue: lineRevenue,
              variants,
            });
          }
        }
      }

      const top = Array.from(productMap.entries())
        .map(([productId, data]) => {
          let topVariantSku = "";
          let topVariantQuantity = 0;

          for (const [sku, qty] of data.variants.entries()) {
            if (qty > topVariantQuantity) {
              topVariantQuantity = qty;
              topVariantSku = sku;
            }
          }

          return {
            productId,
            name: data.name,
            image: data.image,
            totalQuantity: data.totalQuantity,
            totalRevenue: data.totalRevenue,
            topVariantSku,
            topVariantQuantity,
          };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 2);
      setTopProducts(top);
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    // Keep only core dashboard stats loading here
  }, []);

  const displayValue = (v: number | null) => (v == null ? "–" : v.toString());
  const displayCurrency = (v: number | null) =>
    v == null
      ? "–"
      : new Intl.NumberFormat("en-EG", {
          style: "currency",
          currency: "EGP",
          maximumFractionDigits: 0,
        }).format(v);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Overview</h1>
            <p className="text-sm text-muted-foreground">
              Quick glance at your products, customers, and orders.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => load()}
            disabled={loading}>
            <RefreshCw
              className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {loading && !error && (
          <div className="flex items-center justify-center rounded-2xl border bg-card p-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Loading statistics…
              </p>
            </div>
          </div>
        )}
        {!loading && !error && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatsCard
                title="Products"
                description="Total products currently in your catalog."
                value={displayValue(productCount)}
                icon={<Package className="h-5 w-5 text-primary" />}
              />
              <StatsCard
                title="Users"
                description="Registered customers who can place orders."
                value={displayValue(userCount)}
                icon={<Users className="h-5 w-5 text-primary" />}
              />
              <StatsCard
                title="Orders"
                description="All orders created in your store."
                value={displayValue(orderCount)}
                icon={<ShoppingBag className="h-5 w-5 text-primary" />}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatsCard
                title="Completed sales"
                description="Orders that are paid and delivered."
                value={displayValue(completedOrderCount)}
                icon={<CircleDollarSign className="h-5 w-5 text-primary" />}
              />
              <StatsCard
                title="Revenue (EGP)"
                description="Total revenue from completed sales."
                value={displayCurrency(totalRevenue)}
                icon={<PoundSterling className="h-5 w-5 text-primary" />}
              />
              <StatsCard
                title="Avg. order value"
                description="Average revenue per completed order."
                value={displayCurrency(avgOrderValue)}
                icon={<HandCoins className="h-5 w-5 text-primary" />}
              />
            </div>

            <SalesChart />

            <div className="grid gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Top products</h2>
                </div>
                {topProducts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                    No bestsellers yet. Top products will show here once you
                    have paid & delivered orders.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topProducts.map((product) => (
                      <TopProductCard
                        key={product.productId}
                        productId={product.productId}
                        name={product.name}
                        image={product.image}
                        totalSold={product.totalQuantity}
                        totalRevenue={product.totalRevenue}
                        topVariantSku={product.topVariantSku}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
