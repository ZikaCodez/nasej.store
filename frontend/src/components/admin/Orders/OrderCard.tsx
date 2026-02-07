import { useEffect, useState } from "react";
import type { Order, OrderItem } from "@/types/order";
import type { Address } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import UserAddress from "@/components/common/UserAddress";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ActionButtons from "./ActionButtons";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  CreditCard,
  Banknote,
  ShoppingBag,
  MapPin,
  Receipt,
  Wallet,
  Eye,
  RotateCcw,
  Phone,
  Ticket,
  Trash,
} from "lucide-react";
import instapay from "@/assets/instapay.png";

export interface OrderCardProps {
  order: Order;
  onUpdated?: (order: Order) => void;
  onReordered?: (order: Order) => void;
  view?: "grid" | "compact";
  onDeleted?: (orderId: number) => void;
}

function formatDate(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function statusLabel(status: Order["orderStatus"]) {
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
    case "returned":
      return "Returned";
    case "return-request":
      return "Return Requested";
    default:
      return status;
  }
}

function paymentLabel(status: Order["paymentStatus"]) {
  switch (status) {
    case "pending":
      return "Payment Pending";
    case "paid":
      return "Paid";
    case "failed":
      return "Payment Failed";
    default:
      return status;
  }
}

function paymentMethodLabel(method: Order["paymentMethod"]) {
  switch (method) {
    case "COD":
      return "Cash on Delivery";
    case "InstaPay":
      return "InstaPay";
    default:
      return method as string;
  }
}

function statusBadgeClasses(status: Order["orderStatus"]) {
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
    case "returned":
      return "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-100";
    case "return-request":
      return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-100";
    default:
      return "";
  }
}

function paymentBadgeClasses(status: Order["paymentStatus"]) {
  switch (status) {
    case "pending":
      return "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-100";
    case "paid":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-100";
    default:
      return "";
  }
}

export default function OrderCard({
  order,
  onUpdated,
  view = "grid",
  onDeleted,
}: OrderCardProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [draftItems, setDraftItems] = useState<OrderItem[]>(order.items);
  const [draftAddress, setDraftAddress] = useState<Address>(
    order.shippingAddress as Address,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditable =
    order.orderStatus !== "shipped" &&
    order.orderStatus !== "delivered" &&
    order.orderStatus !== "cancelled" &&
    order.orderStatus !== "returned";

  const handleQtyChange = (index: number, next: number) => {
    if (!editing) return;
    setDraftItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, quantity: Math.max(1, next) } : it,
      ),
    );
  };

  const handleRemoveItem = (index: number) => {
    if (!editing) return;
    setDraftItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = draftItems.reduce(
    (sum, it) => sum + it.priceAtPurchase * it.quantity,
    0,
  );

  const handleSave = async () => {
    if (!isEditable) return;
    if (draftItems.length === 0) {
      toast.error("Order must contain at least one item");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        items: draftItems.map((it) => ({
          productId: it.productId,
          sku: it.sku,
          quantity: it.quantity,
          priceAtPurchase: it.priceAtPurchase,
        })),
        shippingAddress: draftAddress,
      };
      const id = Number(order._id);
      const { data } = await api.patch<Order>(`/orders/${id}`, payload);
      toast.success("Order updated");
      setEditing(false);
      setDraftItems(data.items as OrderItem[]);
      setDraftAddress(data.shippingAddress as Address);
      onUpdated?.(data);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!isEditable) return;
    setCancelling(true);
    try {
      const id = Number(order._id);
      const { data } = await api.patch<Order>(`/orders/${id}`, {
        orderStatus: "cancelled",
      });
      toast.success("Order cancelled");
      setEditing(false);
      onUpdated?.(data);
    } catch (e: any) {
      toast.error(e?.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const itemsToShow = editing ? draftItems : order.items;
  const addressToShow = editing ? draftAddress : order.shippingAddress;
  const totalsSubtotal = editing ? subtotal : order.subtotal;
  const totalsTotal =
    totalsSubtotal - (order.discountTotal || 0) + order.shippingFee;
  const [productMap, setProductMap] = useState<Record<string, any>>({});
  const [user, setUser] = useState<any>(null);

  // fetch user
  useEffect(() => {
    if (!order.userId) return;
    let mounted = true;
    api
      .get(`/users/${order.userId}`, { headers: { "x-silent": "1" } })
      .then((r) => {
        if (mounted) setUser(r.data);
      })
      .catch(() => {
        if (mounted) setUser({ name: `User N/A` });
      });
    return () => {
      mounted = false;
    };
  }, [order.userId]);

  // fetch products for items to resolve variant images and product name
  useEffect(() => {
    const ids = Array.from(new Set(order.items.map((it) => it.productId)));
    if (ids.length === 0) return;
    let mounted = true;
    Promise.all(
      ids.map((id) =>
        api
          .get(`/products/${id}`, { headers: { "x-silent": "1" } })
          .then((r) => ({ id, data: r.data }))
          .catch(() => ({ id, data: null })),
      ),
    ).then((results) => {
      if (!mounted) return;
      const map: Record<string, any> = {};
      results.forEach((r) => {
        if (r && r.id) map[r.id] = r.data;
      });
      setProductMap(map);
    });
    return () => {
      mounted = false;
    };
  }, [order.items]);

  const handleDeleteOrder = async () => {
    setDeleting(true);
    try {
      const id = Number(order._id);
      await api.delete(`/orders/${id}`);
      toast.success(`Order #${id} deleted`);
      setDeleteOpen(false);
      onDeleted?.(id);
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete order");
    } finally {
      setDeleting(false);
    }
  };
  // Full card layout reused in dialog and grid view
  const fullLayout = (singleColumn = false) => (
    <div className="rounded-2xl border p-4 space-y-4 bg-background/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="size-4" />
            <span>Order #{order._id}</span>
            <span className="text-xs">•</span>
            <span className="text-xs font-medium text-foreground">
              {user?.name || "Loading..."}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span>Placed on {formatDate(order.placedAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="default"
            className={cn(
              "flex items-center gap-1",
              statusBadgeClasses(order.orderStatus),
              (order.orderStatus === "processing" ||
                order.orderStatus === "return-request") &&
                "ring-2 ring-red-500/20 animate-in fade-in duration-500",
            )}>
            {(order.orderStatus === "processing" ||
              order.orderStatus === "return-request") && (
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
            {order.orderStatus === "processing" && <Clock className="size-3" />}
            {order.orderStatus === "confirmed" && (
              <CheckCircle2 className="size-3" />
            )}
            {order.orderStatus === "shipped" && <Truck className="size-3" />}
            {order.orderStatus === "cancelled" && (
              <XCircle className="size-3" />
            )}
            {order.orderStatus === "returned" && (
              <RotateCcw className="size-3" />
            )}
            {order.orderStatus === "return-request" && (
              <RotateCcw className="size-3" />
            )}
            {order.orderStatus === "delivered" && (
              <CheckCircle2 className="size-3" />
            )}
            <span>{statusLabel(order.orderStatus)}</span>
          </Badge>
          {order.orderStatus !== "cancelled" && (
            <Badge
              variant="default"
              className={`flex items-center gap-1 ${paymentBadgeClasses(order.paymentStatus)}`}>
              <CreditCard className="size-3" />
              <span>{paymentLabel(order.paymentStatus)}</span>
            </Badge>
          )}
          {order.trackingNumber && (
            <Badge variant="default" className="flex items-center gap-1">
              <Truck className="size-3" />
              <span>Tracking: {order.trackingNumber}</span>
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ShoppingBag className="size-4" />
            <span>Items</span>
          </div>
          <div className="divide-y rounded-2xl border">
            {itemsToShow.map((it, idx) => (
              <div
                key={`${it.productId}-${it.sku}-${idx}`}
                className="flex items-center gap-3 p-3 text-sm">
                {(() => {
                  const prod = productMap[it.productId];
                  const variant = prod?.variants?.find(
                    (v: any) => v.sku === it.sku,
                  );
                  const thumb =
                    it.image || variant?.images?.[0] || prod?.thumbnail;
                  const title =
                    it.name || prod?.name || `Product N/A (#${it.productId})`;
                  return (
                    <>
                      {thumb && (
                        <img
                          src={thumb}
                          alt={title}
                          className={`${singleColumn ? "h-10 w-10 block" : "hidden md:block h-12 w-12"} rounded-lg object-cover`}
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium line-clamp-1">{title}</div>
                        <div className="text-xs text-muted-foreground">
                          {it.sku}
                        </div>
                      </div>
                    </>
                  );
                })()}
                <div className="flex items-center gap-2">
                  {editing && isEditable ? (
                    <Input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) =>
                        handleQtyChange(idx, Number(e.target.value) || 1)
                      }
                      className="w-16 h-8 text-xs"
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      x{it.quantity}
                    </div>
                  )}
                  <div className="text-sm font-medium text-right">
                    {it.discountApplied &&
                    typeof it.originalPrice === "number" &&
                    it.originalPrice > it.priceAtPurchase ? (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground line-through">
                          EGP {Number(it.originalPrice).toLocaleString()} each
                        </div>
                        <div>
                          EGP{" "}
                          {(it.priceAtPurchase * it.quantity).toLocaleString()}
                        </div>
                        <div className="text-xs text-emerald-600">
                          Save EGP{" "}
                          {(
                            (Number(it.originalPrice) - it.priceAtPurchase) *
                            it.quantity
                          ).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div>
                        EGP{" "}
                        {(it.priceAtPurchase * it.quantity).toLocaleString()}
                      </div>
                    )}
                  </div>
                  {editing && isEditable && (
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleRemoveItem(idx)}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MapPin className="size-4" />
            <span>Shipping & Contact Info</span>
          </div>
          {editing && isEditable ? (
            <UserAddress value={draftAddress} onChange={setDraftAddress} />
          ) : (
            <div className="rounded-2xl border p-3 text-sm space-y-2">
              <div className="space-y-1">
                <div className="break-w font-medium">
                  {(addressToShow as Address).city}
                  {(addressToShow as Address).area
                    ? ` • ${(addressToShow as Address).area}`
                    : ""}
                </div>
                <div className="text-muted-foreground wrap-break-word">
                  {(addressToShow as Address).street}
                  {(addressToShow as Address).building
                    ? ` • ${(addressToShow as Address).building}`
                    : ""}
                </div>
                {(addressToShow as Address).apartment && (
                  <div className="text-muted-foreground wrap-break-word">
                    Apt {(addressToShow as Address).apartment}
                  </div>
                )}
                {(addressToShow as Address).notes && (
                  <div className="text-xs text-muted-foreground wrap-break-word font-italic">
                    Note: {(addressToShow as Address).notes}
                  </div>
                )}
              </div>

              {user?.phone && (
                <div className="pt-2 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Phone className="size-3" />
                    <a href={`tel:${user.phone}`} className="hover:underline">
                      {user.phone}
                    </a>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://wa.me/+2${user.phone.replace(/\D/g, "")}`,
                        "_blank",
                      )
                    }
                    title="Open in WhatsApp">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="#fff">
                      <g clip-path="url(#clip0_4418_8964)">
                        <path
                          d="M21.98 11.4104C21.64 5.61044 16.37 1.14045 10.3 2.14045C6.12004 2.83045 2.77005 6.22043 2.12005 10.4004C1.74005 12.8204 2.24007 15.1104 3.33007 17.0004L2.44006 20.3104C2.24006 21.0604 2.93004 21.7404 3.67004 21.5304L6.93005 20.6304C8.41005 21.5004 10.14 22.0004 11.99 22.0004C17.63 22.0004 22.31 17.0304 21.98 11.4104ZM16.8801 15.7204C16.7901 15.9004 16.68 16.0704 16.54 16.2304C16.29 16.5004 16.02 16.7004 15.72 16.8204C15.42 16.9504 15.09 17.0104 14.74 17.0104C14.23 17.0104 13.68 16.8905 13.11 16.6405C12.53 16.3905 11.9601 16.0604 11.3901 15.6504C10.8101 15.2304 10.2701 14.7604 9.75005 14.2504C9.23005 13.7304 8.77003 13.1804 8.35003 12.6104C7.94003 12.0404 7.61005 11.4704 7.37005 10.9004C7.13005 10.3304 7.01006 9.78045 7.01006 9.26045C7.01006 8.92044 7.07006 8.59044 7.19006 8.29044C7.31006 7.98044 7.50007 7.70045 7.77007 7.45045C8.09007 7.13045 8.44005 6.98045 8.81005 6.98045C8.95005 6.98045 9.09002 7.01044 9.22002 7.07044C9.35002 7.13044 9.47005 7.22044 9.56005 7.35044L10.72 8.99043C10.81 9.12043 10.88 9.23043 10.92 9.34043C10.97 9.45043 10.99 9.55043 10.99 9.65043C10.99 9.77043 10.9501 9.89045 10.8801 10.0104C10.8101 10.1304 10.72 10.2504 10.6 10.3704L10.22 10.7704C10.16 10.8304 10.1401 10.8904 10.1401 10.9704C10.1401 11.0104 10.15 11.0504 10.16 11.0904C10.18 11.1304 10.1901 11.1604 10.2001 11.1904C10.2901 11.3604 10.45 11.5704 10.67 11.8304C10.9 12.0904 11.1401 12.3604 11.4001 12.6204C11.6701 12.8904 11.9301 13.1304 12.2001 13.3604C12.4601 13.5804 12.68 13.7304 12.85 13.8204C12.88 13.8304 12.9101 13.8504 12.9401 13.8604C12.9801 13.8804 13.0201 13.8804 13.0701 13.8804C13.1601 13.8804 13.2201 13.8504 13.2801 13.7904L13.66 13.4104C13.79 13.2804 13.9101 13.1904 14.0201 13.1304C14.1401 13.0604 14.2501 13.0204 14.3801 13.0204C14.4801 13.0204 14.5801 13.0404 14.6901 13.0904C14.8001 13.1404 14.92 13.2004 15.04 13.2904L16.7001 14.4704C16.8301 14.5604 16.92 14.6704 16.98 14.7904C17.03 14.9204 17.0601 15.0404 17.0601 15.1804C17.0001 15.3504 16.9601 15.5404 16.8801 15.7204Z"
                          fill="white"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_4418_8964">
                          <rect width="24" height="24" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    Chat
                  </Button>
                </div>
              )}
            </div>
          )}
          <div className="rounded-2xl border p-3 text-sm space-y-1 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Receipt className="size-3" />
                <span>Subtotal</span>
              </span>
              <span className="font-medium">
                EGP {totalsSubtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Truck className="size-3" />
                <span>Shipping</span>
              </span>
              <span className="font-medium">
                EGP {order.shippingFee.toLocaleString()}
              </span>
            </div>
            {order.discountTotal ? (
              <div className="flex items-center justify-between text-emerald-600">
                <span className="inline-flex items-center gap-1">
                  <Ticket className="size-3" />
                  <span className="text-xs">
                    Discount {order.promoCode ? `(${order.promoCode})` : ""}
                  </span>
                </span>
                <span className="font-medium">
                  - EGP {order.discountTotal.toLocaleString()}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between pt-1 border-t mt-1">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Wallet className="size-3" />
                <span>Total</span>
              </span>
              <span className="font-semibold">
                EGP {totalsTotal.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="rounded-2xl border p-3 text-sm space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="size-4" />
              <span>Payment Details</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Method</span>
              <span className="font-medium flex items-center gap-2">
                {order.paymentMethod === "InstaPay" && (
                  <img
                    src={instapay}
                    alt="InstaPay"
                    className="inline-block h-5 w-5 rounded-md object-contain bg-white mr-1"
                  />
                )}
                {order.paymentMethod === "COD" && (
                  <Banknote className="h-5 w-5 text-emerald-500" />
                )}
                {paymentMethodLabel(order.paymentMethod)}
              </span>
            </div>
            {order.orderStatus !== "cancelled" && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${paymentBadgeClasses(order.paymentStatus)}`}>
                  <CreditCard className="size-3" />
                  <span>{paymentLabel(order.paymentStatus)}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="w-full grid grid-cols-1 gap-2 md:w-auto md:flex md:flex-row md:justify-end">
          <ActionButtons
            order={order}
            editing={editing}
            saving={saving}
            cancelling={cancelling}
            onEdit={() => {
              if (editing) {
                setEditing(false);
                setDraftItems(order.items);
                setDraftAddress(order.shippingAddress);
              } else {
                setEditing(true);
              }
            }}
            onCancel={handleCancelOrder}
            onSave={handleSave}
            onUpdated={onUpdated}
          />
          {!editing && (
            <>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
                disabled={deleting}
                className="inline-flex items-center gap-1">
                <Trash className="size-3" />
                <span>{deleting ? "Deleting…" : "Delete order"}</span>
              </Button>
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Order #{order._id}?</DialogTitle>
                  </DialogHeader>
                  <div className="text-sm text-muted-foreground">
                    This action cannot be undone.
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDeleteOrder}
                      disabled={deleting}
                      className="inline-flex items-center gap-1">
                      <Trash className="size-3" />
                      <span>{deleting ? "Deleting…" : "Confirm delete"}</span>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Layout: grid = full card, compact = stacked compact view
  if (view === "compact") {
    const addr = addressToShow as Address;
    const shortAddr = `${addr.city || ""}${addr.area ? ` • ${addr.area}` : ""}${addr.street ? ` • ${addr.street}` : ""}`;
    return (
      <>
        <div className="rounded-2xl border p-3 bg-background/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full mb-2">
                      <Eye /> View details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-screen max-w-none sm:max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Order #{order._id}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[70vh] p-3">
                      {fullLayout(true)}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="size-4" />
                <span>Order #{order._id}</span>
                <span className="text-xs">•</span>
                <span className="text-xs font-medium text-foreground">
                  {user?.name || "Loading..."}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(order.placedAt)}
              </div>
              <div className="mt-2 text-sm font-medium">
                {statusLabel(order.orderStatus)}
              </div>
              <div className="text-xs text-muted-foreground">
                {paymentLabel(order.paymentStatus)} •{" "}
                {paymentMethodLabel(order.paymentMethod)}
              </div>
              <div className="mt-2 text-sm">
                <div className="text-xs text-muted-foreground">
                  Items: {order.items?.length ?? 0}
                </div>
                {user?.phone && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="size-3" />
                    <a href={`tel:${user.phone}`} className="hover:underline">
                      {user.phone}
                    </a>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Subtotal: EGP {totalsSubtotal.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Shipping: EGP {order.shippingFee.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Address: <span className="wrap-break-word">{shortAddr}</span>
                </div>
              </div>
            </div>
          </div>
          {/* bottom actions card for compact view */}
          <div className="mt-3 pt-3 border-t bg-background/30">
            <ActionButtons
              order={order}
              editing={editing}
              saving={saving}
              cancelling={cancelling}
              onEdit={() => setEditing((s) => !s)}
              onCancel={handleCancelOrder}
              onSave={handleSave}
              onUpdated={onUpdated}
            />
            {!editing && (
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                  disabled={deleting}
                  className="inline-flex items-center gap-1">
                  <Trash className="size-3" />
                  <span>{deleting ? "Deleting…" : "Delete order"}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return fullLayout(false);
}
