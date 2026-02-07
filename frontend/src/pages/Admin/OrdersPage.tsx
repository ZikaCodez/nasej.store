import { useEffect, useMemo, useState } from "react";
import OrderCard from "@/components/admin/Orders/OrderCard";
import type { Order } from "@/types/order";
import api from "@/lib/api";
import AdminLayout from "@/pages/Admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Grid,
  List,
  RefreshCw,
  Loader2,
  Package,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatsCard from "@/components/admin/Overview/StatsCard";

const STATUS_PRIORITY: Record<string, number> = {
  "return-request": 0,
  processing: 1,
  confirmed: 2,
  shipped: 3,
  delivered: 4,
  returned: 5,
  cancelled: 6,
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
  const [currentTab, setCurrentTab] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<any>("/orders", {
        params: { limit: 10000 },
      });
      // Accept multiple possible list shapes returned by the API
      let list: Order[] = [];
      if (Array.isArray(data)) list = data as Order[];
      else if (Array.isArray(data.results)) list = data.results as Order[];
      else if (Array.isArray(data.items)) list = data.items as Order[];
      else list = [];
      setOrders(list || []);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return orders
      .filter((o) => {
        if (query) {
          const q = query.toLowerCase();
          const idStr = String(o._id || "").toLowerCase();
          const name = (o as any).userName
            ? String((o as any).userName).toLowerCase()
            : "";
          const phone = (o as any).phone
            ? String((o as any).phone).toLowerCase()
            : "";
          if (!(idStr.includes(q) || name.includes(q) || phone.includes(q)))
            return false;
        }
        if (urgentOnly) {
          if (
            o.orderStatus !== "processing" &&
            o.orderStatus !== "return-request"
          )
            return false;
        }
        if (statusFilter) {
          if (o.orderStatus !== statusFilter) return false;
        }
        if (paymentFilter) {
          if (o.paymentStatus !== paymentFilter) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const pA = STATUS_PRIORITY[a.orderStatus] ?? 99;
        const pB = STATUS_PRIORITY[b.orderStatus] ?? 99;
        if (pA !== pB) return pA - pB;
        // If same priority, newest first
        return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();
      });
  }, [orders, query, statusFilter, urgentOnly, paymentFilter]);

  const stats = useMemo(() => {
    const counts = {
      total: orders.length,
      processing: orders.filter((o) => o.orderStatus === "processing").length,
      returning: orders.filter((o) => o.orderStatus === "return-request")
        .length,
      delivered: orders.filter((o) => o.orderStatus === "delivered").length,
    };
    return counts;
  }, [orders]);

  const handleUpdated = (next: Order) => {
    setOrders((prev) => prev.map((p) => (p._id === next._id ? next : p)));
  };

  const handleReordered = () => {
    // reload orders list (or append) depending on API
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Orders</h1>
            <p className="text-sm text-muted-foreground">
              Manage customer orders.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw
              className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Orders"
            value={stats.total}
            icon={<Package className="h-5 w-5 text-blue-500" />}
            description="Lifetime orders"
          />
          <StatsCard
            title="New Orders"
            value={stats.processing}
            icon={<Clock className="h-5 w-5 text-orange-500" />}
            description="Pending processing"
          />
          <StatsCard
            title="Return Requests"
            value={stats.returning}
            icon={<RotateCcw className="h-5 w-5 text-red-500" />}
            description="Urgent attention"
          />
          <StatsCard
            title="Completed"
            value={stats.delivered}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            description="Successfully delivered"
          />
        </div>

        <Tabs
          value={currentTab}
          className="w-full"
          onValueChange={(v) => {
            setCurrentTab(v);
            if (v === "all") {
              setStatusFilter(null);
              setUrgentOnly(false);
            } else if (v === "urgent") {
              setStatusFilter(null);
              setUrgentOnly(true);
            } else {
              setStatusFilter(v);
              setUrgentOnly(false);
            }
          }}>
          <TabsList className="grid w-full grid-cols-5 lg:w-1/2 mx-auto">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              <span className="hidden md:inline">All</span>
            </TabsTrigger>
            <TabsTrigger
              value="urgent"
              className="flex items-center gap-2 text-red-600 data-[state=active]:bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden md:inline">Urgent</span>
            </TabsTrigger>
            <TabsTrigger value="processing" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden md:inline">New</span>
            </TabsTrigger>
            <TabsTrigger
              value="return-request"
              className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden md:inline">Returns</span>
            </TabsTrigger>
            <TabsTrigger value="delivered" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden md:inline">Completed</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {currentTab !== "all" && (
          <p className="text-sm text-muted-foreground text-center">
            Showing {filtered.length} orders (
            <span className="text-primary">{currentTab.replace("-", " ")}</span>)
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 md:flex md:flex-row md:items-center md:justify-between">
          <div className="grid grid-cols-1 md:flex items-center gap-3 w-full md:w-auto">
            <Input
              placeholder="Search orders..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full lg:w-80"
            />
            <Select onValueChange={(v) => setPaymentFilter(v || null)}>
              <SelectTrigger className="w-full md:w-37.5">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 md:flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              onClick={() => setViewMode("grid")}>
              <Grid /> Grid
            </Button>
            <Button
              variant={viewMode === "compact" ? "default" : "outline"}
              onClick={() => setViewMode("compact")}>
              <List /> Compact
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border bg-card p-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Loading orders…
              </p>
            </div>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 gap-4" : "space-y-3"
            }>
            {filtered.map((o) => (
              <OrderCard
                key={o._id}
                order={o}
                view={viewMode}
                onUpdated={handleUpdated}
                onReordered={handleReordered}
              />
            ))}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="text-center text-muted-foreground">
            No orders found.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
