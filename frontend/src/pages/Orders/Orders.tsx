import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import type { Order } from "@/types/order";
import UserOrder from "@/components/orders/UserOrder";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Instagram,
  PhoneCall,
  Shirt,
  ShoppingBag,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Banknote } from "lucide-react";

import instapay from "@/assets/instapay.png";
import vfcash from "@/assets/vfcash.png";

type ListResponse<T> = {
  items: T[];
  total: number;
};

export default function Orders() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    orderId?: number;
    paymentMethod?: Order["paymentMethod"];
  } | null>(null);

  useEffect(() => {
    const state = location.state as
      | {
          checkoutSuccess?: {
            orderId?: number;
            paymentMethod?: Order["paymentMethod"];
          };
        }
      | null
      | undefined;
    if (state && state.checkoutSuccess) {
      setSuccessInfo(state.checkoutSuccess);
      setSuccessOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!user?._id) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<ListResponse<Order>>("/orders", {
          params: {
            filter: JSON.stringify({ userId: user?._id }),
            sort: JSON.stringify({ placedAt: -1 }),
            limit: 50,
            _ts: Date.now(),
          },
        });
        setOrders(data.items || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?._id]);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-4">
      <Dialog open={successOpen && !!successInfo} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thank you for your order!</DialogTitle>
            <DialogDescription>
              {successInfo?.orderId
                ? `Order #${successInfo.orderId} has been placed successfully.`
                : "Your order has been placed successfully."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4 text-sm">
            {successInfo?.paymentMethod === "COD" && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Banknote className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">Cash on delivery</div>
                  <p className="text-xs text-muted-foreground">
                    Please have the cash amount ready when your order arrives.
                  </p>
                </div>
              </div>
            )}
            {successInfo?.paymentMethod === "InstaPay" && (
              <div className="flex items-start gap-3">
                <img
                  src={instapay}
                  alt="InstaPay"
                  className="mt-0.5 h-9 w-9 rounded-md object-contain bg-white"
                />
                <div>
                  <div className="font-medium">InstaPay transfer</div>
                  <p className="text-sm text-muted-foreground">
                    Your order is placed. Please send your InstaPay transfer and
                    then contact us using the Instagram or WhatsApp buttons at
                    the top of this page so we can confirm your payment.
                  </p>
                </div>
              </div>
            )}
            {successInfo?.paymentMethod === "VodafoneCash" && (
              <div className="flex items-start gap-3">
                <img
                  src={vfcash}
                  alt="Vodafone Cash"
                  className="mt-0.5 h-9 w-9 rounded-md object-contain bg-white"
                />
                <div>
                  <div className="font-medium">Vodafone Cash transfer</div>
                  <p className="text-sm text-muted-foreground">
                    Your order is placed. Please send your Vodafone Cash
                    transfer and then contact us using the Instagram or WhatsApp
                    buttons at the top of this page so we can confirm your
                    payment.
                  </p>
                </div>
              </div>
            )}
            {!successInfo?.paymentMethod && (
              <p className="text-xs text-muted-foreground">
                We&apos;ve received your order. You can always review it and get
                in touch with us from this Orders page.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:flex-row sm:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-start">
              <Button asChild variant="outline" size="sm">
                <a
                  href="https://www.instagram.com/rova___eg/"
                  target="_blank"
                  rel="noreferrer">
                  <Instagram className="mr-1.5 size-4" />
                  Instagram
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a
                  href="https://wa.me/+201276008484"
                  target="_blank"
                  rel="noreferrer">
                  <PhoneCall className="mr-1.5 size-4" />
                  WhatsApp
                </a>
              </Button>
            </div>
            <Button onClick={() => setSuccessOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/account">Account</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Orders</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl font-semibold">Your Orders</h1>
      <div className="rounded-2xl border bg-accent/30 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MessageCircle className="mt-0.5 size-4" />
          <div>
            <div className="font-medium text-foreground">
              Need help with an order?
            </div>
            <p>
              Contact us on Instagram or WhatsApp and we&apos;ll be happy to
              help.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-start sm:justify-end">
          <Button asChild variant="outline" size="sm">
            <a
              href="https://www.instagram.com/rova___eg/"
              target="_blank"
              rel="noreferrer">
              <Instagram className="mr-1.5 size-4" />
              Instagram
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a
              href="https://wa.me/+201276008484"
              target="_blank"
              rel="noreferrer">
              <PhoneCall className="mr-1.5 size-4" />
              WhatsApp
            </a>
          </Button>
        </div>
      </div>
      {!loading && !error && orders.length > 0 && (
        <div className="flex justify-center">
          <Button asChild size="sm" className="mt-1 font-bold">
            <Link to="/shop">
              <Shirt className="mr-1.5 size-4" />
              Find Your Fit
            </Link>
          </Button>
        </div>
      )}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={`ord-skel-${i}`}
              className="h-32 w-full rounded-2xl"
            />
          ))}
        </div>
      )}
      {error && !loading && <div className="text-sm text-red-500">{error}</div>}
      {!loading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            You don&apos;t have any orders yet.
          </div>
          <Button asChild size="sm" className="font-bold mt-1">
            <Link to="/shop">Make Your First Order</Link>
          </Button>
        </div>
      )}
      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((o) => (
            <UserOrder
              key={o._id}
              order={o}
              onUpdated={(next) =>
                setOrders((prev) =>
                  prev.map((ord) => (ord._id === next._id ? next : ord)),
                )
              }
              onReordered={(created) => setOrders((prev) => [created, ...prev])}
            />
          ))}
        </div>
      )}
    </div>
  );
}
