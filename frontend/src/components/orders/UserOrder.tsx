import { useState, useEffect } from "react";
import type { Order, OrderItem } from "@/types/order";
import type { Address } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import UserAddress from "@/components/common/UserAddress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  CreditCard,
  AlertCircle,
  Pencil,
  X,
  Save,
  RotateCcw,
  Banknote,
  ShoppingBag,
  MapPin,
  Receipt,
  Wallet,
  Ticket,
} from "lucide-react";

import instapay from "@/assets/instapay.png";

export interface UserOrderProps {
  order: Order;
  onUpdated?: (order: Order) => void;
  onReordered?: (order: Order) => void;
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
      return method;
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
    case "return-request":
      return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-100";
    case "returned":
      return "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-100";
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

export default function UserOrder({
  order,
  onUpdated,
  onReordered,
}: UserOrderProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [draftItems, setDraftItems] = useState<OrderItem[]>(order.items);
  const [draftAddress, setDraftAddress] = useState<Address>(
    order.shippingAddress,
  );
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [requestingReturn, setRequestingReturn] = useState(false);

  const isEditable = order.orderStatus === "processing";
  const isConfirmed = order.orderStatus === "confirmed";
  const isDelivered = order.orderStatus === "delivered";
  const isReturnRequest = order.orderStatus === "return-request";

  // Check 2 days
  const referenceDate = order.updatedAt
    ? new Date(order.updatedAt)
    : new Date(order.placedAt);
  const diffDays =
    (new Date().getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
  const isWithinReturnPeriod = diffDays <= 2;
  const showReturnButton = (isDelivered || isReturnRequest) && !editing;

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
      const { data } = await api.patch<Order>(
        `/orders/${order._id}/customer`,
        payload,
      );
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

  const handleReturnRequest = async (cancel = false) => {
    setRequestingReturn(true);
    try {
      const status = cancel ? "delivered" : "return-request";
      const { data } = await api.patch<Order>(`/orders/${order._id}/customer`, {
        orderStatus: status,
      });
      toast.success(
        cancel
          ? "Return request cancelled"
          : "Return request submitted successfully",
      );
      setReturnDialogOpen(false);
      onUpdated?.(data);
    } catch (e: any) {
      toast.error(
        e.response?.data?.message || e.message || "Failed to update order",
      );
    } finally {
      setRequestingReturn(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!isEditable) return;
    setCancelling(true);
    try {
      const { data } = await api.post<Order>(
        `/orders/${order._id}/customer/cancel`,
      );
      toast.success("Order cancelled");
      setEditing(false);
      onUpdated?.(data);
    } catch (e: any) {
      toast.error(e?.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setDraftItems(order.items);
    setDraftAddress(order.shippingAddress);
  };

  const handleReorder = async () => {
    if (order.orderStatus !== "cancelled") return;
    setReordering(true);
    try {
      const payload = {
        userId: order.userId,
        items: order.items.map((it) => ({
          productId: it.productId,
          sku: it.sku,
          quantity: it.quantity,
          priceAtPurchase: it.priceAtPurchase,
        })),
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        total: order.total,
      };
      const { data } = await api.post<Order>("/orders", payload);
      toast.success(`Order #${data?._id || "created"} placed again`);
      onReordered?.(data);
    } catch (e: any) {
      toast.error(e?.message || "Failed to re-order");
    } finally {
      setReordering(false);
    }
  };

  const itemsToShow = editing ? draftItems : order.items;
  const addressToShow = editing ? draftAddress : order.shippingAddress;
  const totalsSubtotal = editing ? subtotal : order.subtotal;
  const totalsTotal =
    totalsSubtotal - (order.discountTotal || 0) + order.shippingFee;
  const [productMap, setProductMap] = useState<Record<string, any>>({});

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
        if (r && r.id) map[String(r.id)] = r.data;
      });
      setProductMap(map);
    });
    return () => {
      mounted = false;
    };
  }, [order.items]);

  return (
    <div className="rounded-2xl border p-4 space-y-4 bg-background/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="size-4" />
            <span>Order #{order._id}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span>Placed on {formatDate(order.placedAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="default"
            className={`flex items-center gap-1 ${statusBadgeClasses(order.orderStatus)}`}>
            {order.orderStatus === "processing" && <Clock className="size-3" />}
            {order.orderStatus === "confirmed" && (
              <CheckCircle2 className="size-3" />
            )}
            {order.orderStatus === "shipped" && <Truck className="size-3" />}
            {order.orderStatus === "cancelled" && (
              <XCircle className="size-3" />
            )}
            {order.orderStatus === "delivered" && (
              <CheckCircle2 className="size-3" />
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
                  const prod = productMap[String(it.productId)];
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
                          className="hidden md:block h-12 w-12 rounded-lg object-cover"
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
            <span>Shipping Address</span>
          </div>
          {editing && isEditable ? (
            <UserAddress value={draftAddress} onChange={setDraftAddress} />
          ) : (
            <div className="rounded-2xl border p-3 text-sm space-y-1">
              <div>
                {addressToShow.city}
                {addressToShow.area ? ` • ${addressToShow.area}` : ""}
              </div>
              <div className="text-muted-foreground">
                {addressToShow.street}
                {addressToShow.building ? ` • ${addressToShow.building}` : ""}
              </div>
              {addressToShow.apartment && (
                <div className="text-muted-foreground">
                  Apt {addressToShow.apartment}
                </div>
              )}
              {addressToShow.notes && (
                <div className="text-xs text-muted-foreground">
                  {addressToShow.notes}
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
                <span className="inline-flex items-center gap-1 text-emerald-600/80">
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
            <div className="flex items-center justify-between pt-1-1">
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
        {isConfirmed && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground max-w-md">
            <AlertCircle className="mt-0.5 size-4 text-amber-500" />
            <p>
              Your order is confirmed and being prepared. To make any changes or
              cancel, please contact us on{" "}
              <a
                href="https://wa.me/+201276008484"
                target="_blank"
                className="underline text-primary">
                WhatsApp
              </a>{" "}
              or{" "}
              <a
                href="https://www.instagram.com/rova___eg/"
                target="_blank"
                className="underline text-primary">
                Instagram
              </a>
              .
            </p>
          </div>
        )}
        {isDelivered && !isWithinReturnPeriod && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground max-w-md">
            <AlertCircle className="mt-0.5 size-4 text-blue-500" />
            <p>
              The 2-day return period has passed. If you have any issues with
              your order, please contact us on{" "}
              <a
                href="https://wa.me/+201276008484"
                target="_blank"
                className="underline text-primary">
                WhatsApp
              </a>{" "}
              or{" "}
              <a
                href="https://www.instagram.com/rova___eg/"
                target="_blank"
                className="underline text-primary">
                Instagram
              </a>
              .
            </p>
          </div>
        )}
        <div className="w-full grid grid-cols-1 gap-2 md:w-auto md:flex md:flex-row md:justify-end">
          {isEditable && !editing && (
            <>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="w-full md:w-auto justify-center">
                {cancelling ? (
                  "Cancelling…"
                ) : (
                  <>
                    <XCircle className="mr-1.5 size-4" />
                    Cancel order
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setEditing(true)}
                className="w-full md:w-auto justify-center">
                <Pencil className="mr-1.5 size-4" />
                Edit order
              </Button>
            </>
          )}
          {order.orderStatus === "cancelled" && !editing && (
            <Button
              type="button"
              size="sm"
              onClick={handleReorder}
              disabled={reordering}
              className="w-full md:w-auto justify-center">
              {reordering ? (
                "Re-ordering…"
              ) : (
                <>
                  <RotateCcw className="mr-1.5 size-4" />
                  Re-order
                </>
              )}
            </Button>
          )}
          {showReturnButton && (
            <Button
              type="button"
              size="sm"
              variant={"destructive"}
              onClick={() =>
                isReturnRequest
                  ? handleReturnRequest(true)
                  : setReturnDialogOpen(true)
              }
              disabled={requestingReturn || !isWithinReturnPeriod}
              className="w-full md:w-auto justify-center">
              {requestingReturn ? (
                "Processing…"
              ) : isReturnRequest ? (
                <>
                  <XCircle className="mr-1.5 size-4" />
                  Cancel Return Request
                </>
              ) : (
                <>
                  <RotateCcw className="mr-1.5 size-4" />
                  Request Return
                </>
              )}
            </Button>
          )}
          {editing && (
            <>
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={handleCancelEdit}
                disabled={saving}
                className="w-full md:w-auto justify-center">
                <X className="mr-1.5 size-4" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="w-full md:w-auto justify-center">
                {saving ? (
                  "Saving…"
                ) : (
                  <>
                    <Save className="mr-1.5 size-4" />
                    Save changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Return</DialogTitle>
            <DialogDescription>
              Are you sure you want to request a return for this order? Our team
              will review your request and contact you shortly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setReturnDialogOpen(false)}
              disabled={requestingReturn}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReturnRequest(false)}
              disabled={requestingReturn}>
              {requestingReturn ? "Submitting..." : "Confirm Return Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
