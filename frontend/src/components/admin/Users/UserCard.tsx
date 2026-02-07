import { useEffect, useState } from "react";
import type { AuthUser } from "@/types/auth";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  ShoppingCart,
  MapPin,
  FileText,
  ClipboardCopy,
  Phone,
  ShoppingBag,
} from "lucide-react";
import ViewOrdersButton from "./ViewOrdersButton";
import ViewAddressesButton from "./ViewAddressesButton";
import ViewCartButton from "./ViewCartButton";
import ChangeRole from "./ChangeRole";
import EditUserButton from "./EditUserButton";
import DeleteUserButton from "./DeleteUserButton";
import api from "@/lib/api";
import { toast } from "sonner";

type UserType = AuthUser & {
  _id: number;
  _count?: { orders?: number };
  addresses?: any[];
  cart?: any;
  createdAt?: string;
  created_at?: string;
  role?: string;
};

export interface UserCardProps {
  user: UserType;
  onDeleted?: (u: UserType) => void;
  onUpdated?: (u: UserType) => void;
}

export default function UserCard({
  user,
  onDeleted,
  onUpdated,
}: UserCardProps) {
  const [details, setDetails] = useState<UserType | null>(null);
  const [ordersCount, setOrdersCount] = useState<number | null>(
    user._count?.orders ?? null,
  );
  const [addressesCount, setAddressesCount] = useState<number | null>(
    user.addresses?.length ?? null,
  );
  const [cartCount, setCartCount] = useState<number | null>(
    user.cartItems?.length ?? user.cart?.items?.length ?? null,
  );

  // Prefetch missing details (addresses/cart/ counts) once for improved UX
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (
          addressesCount == null ||
          cartCount == null ||
          ordersCount == null
        ) {
          const numericUserId = Number(user._id);
          const [userRes, ordersRes, cartRes] = await Promise.all([
            api.get(`/users/${numericUserId}`).catch(() => ({ data: null })),
            api
              .get(`/orders`, {
                // request more items so we can count per-user client-side
                params: { userId: numericUserId, limit: 200, _ts: Date.now() },
              })
              .catch(() => ({ data: { total: null } })),
            api.get(`/users/${numericUserId}`).catch(() => ({ data: null })),
          ]);

          if (!mounted) return;

          if (userRes.data) {
            setDetails(userRes.data as UserType);
            if (addressesCount == null)
              setAddressesCount((userRes.data.addresses || []).length);
          }

          if (ordersRes.data) {
            const items = Array.isArray(ordersRes.data)
              ? ordersRes.data
              : (ordersRes.data.items ?? []);
            const ownerOf = (o: any) =>
              Number(
                o.userId ??
                  o.user?._id ??
                  o.customerId ??
                  o.customer?._id ??
                  NaN,
              );
            setOrdersCount(
              items.filter((it: any) => ownerOf(it) === numericUserId).length,
            );
          }

          if (cartRes.data) {
            setCartCount(
              cartRes.data?.cartItems?.length ??
                cartRes.data?.cart?.items?.length ??
                0,
            );
          }
        }
      } catch (e) {
        // silent
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user._id]);

  const shown = details ?? user;

  return (
    <div className="w-full rounded-2xl border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted/40 text-foreground">
            <User className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="font-medium warp-break-words flex items-center gap-2">
              {shown.name || shown.email}{" "}
              <span className="text-xs text-muted-foreground">
                #{shown._id}
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Mail className="h-3 w-3" /> <span>{shown.email}</span>
              <Button
                size="icon-xs"
                onClick={() => {
                  navigator.clipboard?.writeText(shown.email || "");
                  toast.success("Email copied to clipboard");
                }}>
                <ClipboardCopy className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <FileText className="h-3 w-3" />{" "}
              <span>
                Joined{" "}
                {new Date(
                  shown.createdAt || shown.created_at || "",
                ).toLocaleDateString()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Phone className="h-3 w-3" /> <span>{shown.phone || "–"}</span>
              <Button
                size="icon-xs"
                onClick={() => {
                  navigator.clipboard?.writeText(shown.phone || "");
                  toast.success("Phone number copied to clipboard");
                }}>
                <ClipboardCopy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShoppingBag className="h-4 w-4 text-primary" />{" "}
              <span>Orders</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{ordersCount ?? "–"}</span>
              <ViewOrdersButton userId={user._id} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" /> <span>Addresses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {addressesCount ?? "–"}
              </span>
              <ViewAddressesButton userId={user._id} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShoppingCart className="h-4 w-4 text-primary" />{" "}
              <span>Cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{cartCount ?? "–"}</span>
              <ViewCartButton userId={user._id} />
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="grid grid-cols-1 md:flex justify-end gap-2">
            <ChangeRole
              userId={user._id}
              currentRole={(shown.role as any) || "customer"}
              onUpdated={onUpdated}
            />
            <EditUserButton user={shown} onUpdated={onUpdated} />
            <DeleteUserButton
              userId={user._id}
              onDeleted={() => onDeleted?.(shown)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
