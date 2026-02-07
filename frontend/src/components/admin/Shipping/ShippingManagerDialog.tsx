import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { GOVERNORATES, type Governorate } from "@/lib/egyptLocations";
import api from "@/lib/api";
import ShippingFees from "./ShippingFees";
import { Truck, Search, RotateCw } from "lucide-react";

type ShippingEntry = {
  _id: string;
  label?: string;
  price: number;
  currency?: string;
};

export type ShippingManagerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ShippingManagerDialog({
  open,
  onOpenChange,
}: ShippingManagerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, number | undefined>>({});
  const [query, setQuery] = useState("");

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/shipping", { headers: { "x-silent": "1" } });
      const items: ShippingEntry[] = res.data?.items || [];
      const map: Record<string, number | undefined> = {};
      for (const it of items) {
        map[String(it._id)] =
          typeof it.price === "number" ? it.price : undefined;
      }
      setPrices(map);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load shipping prices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchPrices();
  }, [open]);

  const handleSave = async (gov: Governorate, price: number) => {
    try {
      setSavingId(gov.id);
      const exists = prices[gov.id] !== undefined;
      if (exists) {
        await api.patch(`/shipping/${gov.id}`, { price });
        toast.success(`Updated ${gov.name_en} shipping to EGP ${price}`);
      } else {
        await api.post(`/shipping`, {
          _id: gov.id,
          label: gov.name_en,
          price,
          currency: "EGP",
        });
        toast.success(`Saved ${gov.name_en} shipping as EGP ${price}`);
      }
      setPrices((prev) => ({ ...prev, [gov.id]: price }));
    } catch (err: any) {
      toast.error(err?.message || "Failed to save shipping price");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-sm md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <span className="text-base sm:text-lg">Manage Shipping Fees</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Set delivery fees per governorate. Unset entries show as "Not set".
          </DialogDescription>
        </DialogHeader>

        {/* Controls: count, search, refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">
            {query.trim()
              ? `Showing ${
                  GOVERNORATES.filter(
                    (g) =>
                      g.name_en
                        .toLowerCase()
                        .includes(query.trim().toLowerCase()) ||
                      String(g.id)
                        .toLowerCase()
                        .includes(query.trim().toLowerCase()),
                  ).length
                } of ${GOVERNORATES.length} Governorates`
              : `${GOVERNORATES.length} Governorates`}
          </span>
          <div className="flex flex-col sm:flex-row sm:ml-auto gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-48 md:w-56">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search governorates..."
                className="pl-8 text-sm"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchPrices}
              disabled={loading}
              className="w-full sm:w-auto">
              {loading ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Refreshing...</span>
                  <span className="sm:hidden">Loading...</span>
                </>
              ) : (
                <>
                  <RotateCw className="h-4 w-4" /> Refresh
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Scrollable list of governorates */}
        <div className="flex-1 overflow-hidden rounded-md border bg-background">
          <ScrollArea className="h-[40vh] md:h-[60vh] p-2">
            <div className="space-y-2">
              {(query.trim()
                ? GOVERNORATES.filter(
                    (g) =>
                      g.name_en
                        .toLowerCase()
                        .includes(query.trim().toLowerCase()) ||
                      String(g.id)
                        .toLowerCase()
                        .includes(query.trim().toLowerCase()),
                  )
                : GOVERNORATES
              ).map((gov) => (
                <ShippingFees
                  key={gov.id}
                  governorate={gov as Governorate}
                  currentPrice={prices[gov.id]}
                  saving={savingId === gov.id}
                  onSave={(price) => handleSave(gov as Governorate, price)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
