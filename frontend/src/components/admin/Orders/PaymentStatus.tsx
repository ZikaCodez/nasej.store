import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Order } from "@/types/order";
import { Check, CheckCircle2 } from "lucide-react";

export type PaymentStatusProps = {
  order: Order;
  disabled?: boolean;
  onUpdated?: (order: Order) => void;
};

export default function PaymentStatus({
  order,
  disabled,
  onUpdated,
}: PaymentStatusProps) {
  let label = "";
  let nextStatus: Order["paymentStatus"] | null = null;
  let Icon: any = null;

  switch (order.paymentStatus) {
    case "pending":
      label = "Mark paid";
      nextStatus = "paid";
      Icon = Check;
      break;
    case "failed":
      label = "Retry";
      nextStatus = "pending";
      Icon = Check;
      break;
    default:
      label = "Paid";
      nextStatus = null;
      Icon = CheckCircle2;
      break;
  }

  const handleClick = async () => {
    if (!nextStatus) return;
    const id = Number(order._id);
    try {
      // use silent header to prevent global interceptor from double-toasting
      const resp = await api.patch<Order>(
        `/orders/${id}`,
        { paymentStatus: nextStatus },
        { headers: { "x-silent": "1" } },
      );
      const data = resp.data;
      toast.success(`Payment ${label.toLowerCase()}`);
      onUpdated?.(data);
    } catch (err: any) {
      const server = err?.response?.data;
      const msg =
        server?.details ||
        server?.message ||
        err?.message ||
        "Failed to update payment status";
      toast.error(String(msg));
    }
  };

  return (
    <Button
      size="sm"
      variant={order.paymentStatus === "paid" ? "success" : "default"}
      onClick={handleClick}
      disabled={disabled || !nextStatus}
      className="flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4" />} {label}
    </Button>
  );
}
