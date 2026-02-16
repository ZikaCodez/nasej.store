import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";
import { Loader2, Ticket } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreatePromoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreatePromoDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePromoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: "",
    minOrderAmount: "",
    usageLimit: "",
    oncePerCustomer: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.value) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await api.post("/promos", {
        ...formData,
        value: Number(formData.value),
        minOrderAmount: formData.minOrderAmount
          ? Number(formData.minOrderAmount)
          : undefined,
        usageLimit: formData.usageLimit
          ? Number(formData.usageLimit)
          : undefined,
        isActive: true,
        oncePerCustomer: formData.oncePerCustomer,
      });
      toast.success("Promo code created successfully");
      onSuccess();
      onOpenChange(false);
      setFormData({
        code: "",
        type: "percentage",
        value: "",
        minOrderAmount: "",
        usageLimit: "",
        oncePerCustomer: true,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create promo code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Create Promo Code
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh] px-1">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Promo Code</Label>
              <Input
                id="code"
                placeholder="SUMMER20"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Discount Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val: string) =>
                    setFormData({
                      ...formData,
                      type: val as "percentage" | "fixed",
                    })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (EGP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder={formData.type === "percentage" ? "20" : "100"}
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minOrder">Minimum Order Amount (Optional)</Label>
              <Input
                id="minOrder"
                type="number"
                placeholder="500"
                value={formData.minOrderAmount}
                onChange={(e) =>
                  setFormData({ ...formData, minOrderAmount: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="oncePerCustomer"
                checked={formData.oncePerCustomer}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, oncePerCustomer: !!checked })
                }
              />
              <Label htmlFor="oncePerCustomer">
                Usable only once per customer
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Total Usage Limit (Optional)</Label>
              <Input
                id="limit"
                type="number"
                placeholder="100"
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({ ...formData, usageLimit: e.target.value })
                }
              />
            </div>
          </form>
        </ScrollArea>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Code"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
