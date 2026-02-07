import OrderStatus from "./OrderStatus";
import PaymentStatus from "./PaymentStatus";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types/order";
import { XCircle, Pencil } from "lucide-react";

export type ActionButtonsProps = {
  order: Order;
  editing: boolean;
  saving?: boolean;
  cancelling?: boolean;
  reordering?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  onReorder?: () => void;
  onUpdated?: (order: Order) => void;
};

export default function ActionButtons({
  order,
  editing,
  saving,
  cancelling,
  onEdit,
  onCancel,
  onSave,
  onUpdated,
}: ActionButtonsProps) {
  // Admins can edit if not shipped/delivered/cancelled
  const isEditable =
    order.orderStatus !== "shipped" &&
    order.orderStatus !== "delivered" &&
    order.orderStatus !== "cancelled" &&
    order.orderStatus !== "returned";

  return (
    <div className="flex flex-col md:flex-row gap-2">
      {!editing && (
        <>
          <OrderStatus
            order={order}
            onUpdated={onUpdated}
            disabled={
              !isEditable &&
              order.orderStatus !== "shipped" &&
              order.orderStatus !== "delivered" &&
              order.orderStatus !== "return-request"
            }
          />
          <PaymentStatus order={order} onUpdated={onUpdated} disabled={false} />
        </>
      )}

      {isEditable && !editing && (
        <>
          {onCancel && order.orderStatus === "processing" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onCancel}
              disabled={cancelling}>
              {cancelling ? (
                "Cancelling…"
              ) : (
                <>
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Cancel order
                </>
              )}
            </Button>
          )}

          {onEdit && (
            <Button size="sm" variant="secondary" onClick={onEdit}>
              <Pencil className="mr-1.5 h-4 w-4" /> Edit
            </Button>
          )}
        </>
      )}

      {editing && (
        <>
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              disabled={saving}>
              Cancel
            </Button>
          )}

          {onSave && (
            <Button size="sm" onClick={onSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
