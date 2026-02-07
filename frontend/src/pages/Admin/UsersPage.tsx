import { useEffect, useState } from "react";
import AdminLayout from "@/pages/Admin/AdminLayout";
import api from "@/lib/api";
import { Loader2, RefreshCw } from "lucide-react";
import UserCard from "./components/Users/UserCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuthUser } from "@/types/auth";

type User = AuthUser & {
  _id: number;
  _count?: { orders?: number };
  addresses?: any[];
  cart?: any;
  createdAt?: string;
  created_at?: string;
  role?: string;
};

type ListResponse<T> = { items: T[]; total: number };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"az" | "za" | "orders-asc" | "orders-desc">(
    "az",
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ListResponse<User>>("/users", {
        params: { limit: 200, _ts: Date.now() },
      });
      setUsers(res.data.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminLayout>
      <>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Users</h1>
            <p className="text-sm text-muted-foreground">
              View and manage accounts.
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
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3 md:items-center">
          <Input
            placeholder="Search users by name, email, id or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:col-span-2"
          />
          <Select onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger className="w-full md:w-56">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="az">A-Z</SelectItem>
              <SelectItem value="za">Z-A</SelectItem>
              <SelectItem value="orders-asc">Orders ⬆️</SelectItem>
              <SelectItem value="orders-desc">Orders ⬇️</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border bg-card p-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Loading users…
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="text-destructive">{error}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {filteredUsers(users, query, sort).map((u) => (
              <UserCard
                key={u._id}
                user={u}
                onDeleted={() =>
                  setUsers((prev) => prev.filter((p) => p._id !== u._id))
                }
                onUpdated={(next) =>
                  setUsers((prev) =>
                    prev.map((p) => (p._id === next._id ? next : p)),
                  )
                }
              />
            ))}
          </div>
        )}
      </>
    </AdminLayout>
  );
}

function filteredUsers(users: User[], query: string, sort: string) {
  let list = [...users];
  const q = query.trim().toLowerCase();
  if (q) {
    list = list.filter((u) => {
      const idStr = String(u._id || "").toLowerCase();
      const name = String(u.name || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      const phone = String(u.phone || "").toLowerCase();
      return (
        idStr.includes(q) ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q)
      );
    });
  }

  if (sort === "az") {
    list.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );
  } else if (sort === "za") {
    list.sort((a, b) =>
      String(b.name || "").localeCompare(String(a.name || "")),
    );
  } else if (sort === "orders-asc") {
    list.sort((a, b) => (a._count?.orders ?? 0) - (b._count?.orders ?? 0));
  } else if (sort === "orders-desc") {
    list.sort((a, b) => (b._count?.orders ?? 0) - (a._count?.orders ?? 0));
  }

  return list;
}
