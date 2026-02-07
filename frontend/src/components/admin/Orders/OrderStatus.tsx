import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Order } from "@/types/order";
import { Check, Truck, CheckCircle2, RotateCcw } from "lucide-react";

export type OrderStatusProps = {
  order: Order;
  disabled?: boolean;
  onUpdated?: (order: Order) => void;
};

export default function OrderStatus({
  order,
  disabled,
  onUpdated,
}: OrderStatusProps) {
  // Determine next action based on current status
  let label = "";
  let nextStatus: Order["orderStatus"] | null = null;
  let Icon: any = null;

  switch (order.orderStatus) {
    case "processing":
      label = "Confirm order";
      nextStatus = "confirmed";
      Icon = Check;
      break;
    case "confirmed":
      label = "Ship order";
      nextStatus = "shipped";
      Icon = Truck;
      break;
    case "shipped":
      label = "Finish";
      nextStatus = "delivered";
      Icon = CheckCircle2;
      break;
    case "delivered":
      label = "Completed";
      nextStatus = null;
      Icon = CheckCircle2;
      break;
    case "return-request":
      label = "Approve Return";
      nextStatus = "returned";
      Icon = RotateCcw;
      break;
    case "returned":
      label = "Returned";
      nextStatus = null;
      Icon = CheckCircle2;
      break;
    case "cancelled":
      label = "Cancelled";
      nextStatus = null;
      Icon = CheckCircle2;
      break;
    default:
      label = "Completed";
      nextStatus = null;
      Icon = CheckCircle2;
      break;
  }

  const handleClick = async () => {
    if (!nextStatus) return;
    try {
      const id = Number(order._id);
      const { data } = await api.patch<Order>(`/orders/${id}`, {
        orderStatus: nextStatus,
      });
      toast.success(`Order ${label.toLowerCase()}`);
      onUpdated?.(data);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update order status");
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleClick}
      variant={
        order.orderStatus === "returned" || order.orderStatus === "delivered" || order.orderStatus === "cancelled"
          ? "success"
          : "default"
      }
      disabled={disabled || !nextStatus}
      className="flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4" />} {label}
    </Button>
  );
}
