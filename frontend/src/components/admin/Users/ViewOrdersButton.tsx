import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Loader2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function statusLabel(status: any) {
  switch (status) {
    case "processing":
      return "Processing";
    case "confirmed":
      return "Confirmed";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return status || "unknown";
  }
}

function statusBadgeClasses(status: any) {
  switch (status) {
    case "processing":
      return "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-100";
    case "confirmed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-100";
    case "shipped":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-100";
    case "delivered":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-100";
    default:
      return "bg-muted/10 text-muted-foreground";
  }
}
import type { Order } from "@/types/order";
import { useEffect } from "react";

export default function ViewOrdersButton({ userId }: { userId: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    const numericUserId = Number(userId);
    api
      .get<any>("/orders", {
        params: { userId: numericUserId, limit: 200, _ts: Date.now() },
      })
      .then((res) => {
        if (!mounted) return;
        // Support both shapes: { items: Order[] } or Order[]
        const items: Order[] = Array.isArray(res.data)
          ? res.data
          : (res.data?.items ?? []);
        // Defensive owner extraction (backend may use different shapes)
        const ownerOf = (o: any) =>
          Number(
            o.userId ??
              o.user?._id ??
              o.userIdString ??
              o.customerId ??
              o.customer?._id ??
              NaN,
          );
        // Ensure we only show orders that belong to this user as a safety net
        const filtered = items.filter((o) => ownerOf(o) === numericUserId);
        setOrders(filtered);
      })
      .catch(() => setOrders([]))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Eye />
          View
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" /> Orders
            </div>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] p-2">
          {loading ? (
            <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
              <Loader2 className="animate-spin mr-2" /> Loading…
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <Package className="h-16 w-16 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">No orders</div>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o._id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium">Order #{o._id}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.items?.length ?? 0} items
                      </div>
                    </div>
                    <div className="text-xs font-medium text-right">
                      <Badge
                        className={`inline-flex items-center px-2 py-0.5 text-[11px] ${statusBadgeClasses(o.orderStatus)}`}>
                        {statusLabel(o.orderStatus)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Package className="h-4 w-4 text-primary" />
                    <div className="text-sm font-semibold">
                      EGP {o.total?.toLocaleString?.() ?? o.total}
                    </div>
                    <div className="text-xs text-muted-foreground">•</div>
                    <div className="text-xs text-muted-foreground">
                      {o.paymentMethod ?? "Payment info unavailable"}
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      {o.placedAt ? new Date(o.placedAt).toLocaleString() : "—"}
                    </div>
                  </div>

                  {o.shippingAddress && (
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        const a: any = o.shippingAddress;
                        const parts = [
                          a.street,
                          a.buildingNumber ?? a.building,
                          a.apartmentNumber ?? a.apartment,
                          a.city,
                          a.governorate ?? a.area,
                          a.country,
                        ];
                        return parts.filter(Boolean).join(", ");
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
