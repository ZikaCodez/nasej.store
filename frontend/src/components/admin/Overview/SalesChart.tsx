import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Order } from "@/types/order";
import { Calendar, Loader2, PoundSterling, ShoppingBag } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/pages/Admin/components/Overview/DatePickerWithRange";

type ListResponse<T> = {
  items: T[];
  total: number;
};

export type SalesPeriod =
  | "today"
  | "week"
  | "month"
  | "year"
  | "all"
  | "custom";

export type SalesPoint = {
  date: string;
  label: string;
  total: number;
  sales: number; // number of products sold for this point
};

const salesChartConfig = {
  sales: {
    label: "Items Sold",
    theme: {
      light: "#f59e0b",
      dark: "#f97316",
    },
  },
  total: {
    label: "Revenue",
    // Provide explicit colors as a fallback in case CSS theme vars aren't defined
    theme: {
      light: "#06b6d4",
      dark: "#38bdf8",
    },
  },
} as const;

function getPeriodStart(period: SalesPeriod, now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return d;
    case "week": {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - 6);
      return weekStart;
    }
    case "month":
      return new Date(d.getFullYear(), d.getMonth(), 1);
    case "year":
      return new Date(d.getFullYear(), 0, 1);
    case "all":
    default:
      return new Date(0);
  }
}

function formatDateLabel(date: Date, period: SalesPeriod): string {
  const options: Intl.DateTimeFormatOptions =
    period === "year" || period === "all"
      ? { month: "short", year: "2-digit" }
      : { month: "short", day: "numeric" };

  return date.toLocaleDateString(undefined, options);
}

function buildSalesSeries(orders: Order[], period: SalesPeriod): SalesPoint[] {
  if (!orders.length) return [];

  const buckets = new Map<
    string,
    { date: Date; total: number; sales: number }
  >();

  for (const order of orders) {
    const placedAt = new Date(order.placedAt);
    if (Number.isNaN(placedAt.getTime())) continue;
    const bucketDate = new Date(
      placedAt.getFullYear(),
      placedAt.getMonth(),
      placedAt.getDate(),
    );

    const itemsSold = (order.items || []).reduce(
      (s: number, it: any) => s + (Number(it?.quantity) || 0),
      0,
    );

    const key = bucketDate.toISOString().slice(0, 10);
    const existing = buckets.get(key);
    if (existing) {
      existing.total += order.total;
      existing.sales += itemsSold;
    } else {
      buckets.set(key, {
        date: bucketDate,
        total: order.total,
        sales: itemsSold,
      });
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ date, total, sales }) => ({
      date: date.toISOString(),
      label: formatDateLabel(date, period),
      total,
      sales,
    }));
}

function filterOrdersForPeriod(
  orders: Order[],
  period: SalesPeriod,
  customRange?: DateRange,
): Order[] {
  if (!orders.length) return [];

  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = null;

  if (period === "custom") {
    if (!customRange?.from || !customRange.to) {
      return [];
    }
    start = new Date(
      customRange.from.getFullYear(),
      customRange.from.getMonth(),
      customRange.from.getDate(),
    );
    end = new Date(
      customRange.to.getFullYear(),
      customRange.to.getMonth(),
      customRange.to.getDate(),
    );
  } else if (period !== "all") {
    start = getPeriodStart(period, now);
    end = now;
  }

  return orders.filter((order) => {
    const placedAt = new Date(order.placedAt);
    if (Number.isNaN(placedAt.getTime())) return false;
    const day = new Date(
      placedAt.getFullYear(),
      placedAt.getMonth(),
      placedAt.getDate(),
    );
    if (start && day < start) return false;
    if (end && day > end) return false;
    return true;
  });
}

function formatRangeLabel(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  const baseOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  const withYear: Intl.DateTimeFormatOptions = sameYear
    ? baseOptions
    : { ...baseOptions, year: "2-digit" };

  const from = start.toLocaleDateString(undefined, withYear);
  const to = end.toLocaleDateString(undefined, withYear);
  return `${from} – ${to}`;
}

function getSalesPeriodLabel(
  period: SalesPeriod,
  customRange?: DateRange,
): string {
  const now = new Date();

  switch (period) {
    case "today":
      return "today";
    case "week": {
      const start = getPeriodStart("week", now);
      return formatRangeLabel(start, now);
    }
    case "month": {
      const start = getPeriodStart("month", now);
      return formatRangeLabel(start, now);
    }
    case "year": {
      const start = getPeriodStart("year", now);
      return formatRangeLabel(start, now);
    }
    case "all":
      return "all time";
    case "custom": {
      if (!customRange?.from || !customRange.to) return "custom";
      const start = new Date(
        customRange.from.getFullYear(),
        customRange.from.getMonth(),
        customRange.from.getDate(),
      );
      const end = new Date(
        customRange.to.getFullYear(),
        customRange.to.getMonth(),
        customRange.to.getDate(),
      );
      return formatRangeLabel(start, end);
    }
    default:
      return "";
  }
}

export default function SalesChart() {
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>("month");
  const [salesData, setSalesData] = useState<SalesPoint[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [periodOrders, setPeriodOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function loadSales() {
      setSalesLoading(true);
      setSalesError(null);
      try {
        const res = await api.get<ListResponse<Order>>("/orders", {
          params: { limit: 365, _ts: Date.now() },
        });
        const items = res.data.items as Order[];
        setOrders(items);
      } catch (e: any) {
        setSalesError(e?.message || "Failed to load sales data");
        setOrders([]);
      } finally {
        setSalesLoading(false);
      }
    }

    loadSales();
  }, []);

  useEffect(() => {
    if (!orders.length) {
      setSalesData([]);
      setPeriodOrders([]);
      return;
    }
    const completed = orders.filter(
      (o) => o.paymentStatus === "paid" && o.orderStatus === "delivered",
    );
    const inPeriod = filterOrdersForPeriod(completed, salesPeriod, customRange);
    setPeriodOrders(inPeriod);
    const series = buildSalesSeries(inPeriod, salesPeriod);
    setSalesData(series);
  }, [orders, salesPeriod, customRange]);

  const totalRevenue = periodOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );
  const totalItemsSold = periodOrders.reduce(
    (sum, order) =>
      sum +
      (order.items || []).reduce(
        (s: number, it: any) => s + (Number(it?.quantity) || 0),
        0,
      ),
    0,
  );
  const periodLabel = getSalesPeriodLabel(salesPeriod, customRange);

  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sales
          </div>
          <p className="text-xs text-muted-foreground">
            Total order revenue over different periods.
          </p>
        </div>
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          <Button
            type="button"
            size="sm"
            variant={salesPeriod === "today" ? "default" : "outline"}
            onClick={() => setSalesPeriod("today")}>
            Today
          </Button>
          <Button
            type="button"
            size="sm"
            variant={salesPeriod === "week" ? "default" : "outline"}
            onClick={() => setSalesPeriod("week")}>
            This week
          </Button>
          <Button
            type="button"
            size="sm"
            variant={salesPeriod === "month" ? "default" : "outline"}
            onClick={() => setSalesPeriod("month")}>
            This month
          </Button>
          <Button
            type="button"
            size="sm"
            variant={salesPeriod === "year" ? "default" : "outline"}
            onClick={() => setSalesPeriod("year")}>
            This year
          </Button>
          <Button
            type="button"
            size="sm"
            variant={salesPeriod === "all" ? "default" : "outline"}
            onClick={() => setSalesPeriod("all")}>
            All time
          </Button>
          <DatePickerWithRange
            value={customRange}
            onChange={(range) => {
              setCustomRange(range);
              setSalesPeriod("custom");
            }}
            variant={salesPeriod === "custom" ? "default" : "outline"}
            size="sm"
          />
        </div>
        <div className="sm:hidden">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="w-full">
                <Calendar /> Change Period
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change period</DialogTitle>
              </DialogHeader>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={salesPeriod === "today" ? "default" : "outline"}
                  onClick={() => setSalesPeriod("today")}>
                  Today
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={salesPeriod === "week" ? "default" : "outline"}
                  onClick={() => setSalesPeriod("week")}>
                  This week
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={salesPeriod === "month" ? "default" : "outline"}
                  onClick={() => setSalesPeriod("month")}>
                  This month
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={salesPeriod === "year" ? "default" : "outline"}
                  onClick={() => setSalesPeriod("year")}>
                  This year
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={salesPeriod === "all" ? "default" : "outline"}
                  onClick={() => setSalesPeriod("all")}>
                  All time
                </Button>
                <DatePickerWithRange
                  value={customRange}
                  onChange={(range) => {
                    setCustomRange(range);
                    setSalesPeriod("custom");
                  }}
                  variant={salesPeriod === "custom" ? "default" : "outline"}
                  size="sm"
                  className="mt-2"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-64 pt-4">
          {salesLoading ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading sales data…
            </div>
          ) : salesError ? (
            <div className="flex h-full items-center justify-center text-xs text-destructive">
              {salesError}
            </div>
          ) : salesData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No sales data for this period.
            </div>
          ) : (
            <ChartContainer config={salesChartConfig} className="h-full w-full">
              <AreaChart data={salesData} margin={{ left: 0, right: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={56}
                />
                <YAxis
                  yAxisId="sales"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={56}
                />
                <ChartTooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={<ChartTooltipContent labelKey="label" />}
                />
                <Area
                  type="monotone"
                  name={String(salesChartConfig.sales.label)}
                  yAxisId="sales"
                  dataKey="sales"
                  stroke="var(--color-sales, #f59e0b)"
                  fill="var(--color-sales, #f59e0b)"
                  strokeWidth={2}
                  fillOpacity={0.12}
                />
                <Area
                  type="monotone"
                  name={String(salesChartConfig.total.label)}
                  dataKey="total"
                  stroke="var(--color-total, #06b6d4)"
                  fill="var(--color-total, #06b6d4)"
                  strokeWidth={2}
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>
        {!salesLoading && !salesError && (
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border bg-muted/40 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Products sold
                      {periodLabel && (
                        <span className="ml-1 text-[11px] font-semibold text-primary">
                          {periodLabel}
                        </span>
                      )}
                    </p>
                    <p className="text-lg font-semibold">
                      {totalItemsSold.toLocaleString()}
                    </p>
                  </div>
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/60 text-foreground">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-muted/40 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Total revenue
                      {periodLabel && (
                        <span className="ml-1 text-[11px] font-semibold text-primary">
                          {periodLabel}
                        </span>
                      )}
                    </p>
                    <p className="text-lg font-semibold">
                      {totalRevenue.toLocaleString("en-EG", {
                        style: "currency",
                        currency: "EGP",
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/60 text-foreground">
                    <PoundSterling className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
