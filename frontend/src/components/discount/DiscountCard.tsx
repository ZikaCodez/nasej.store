import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Trash } from "lucide-react";
import { calculateDiscountedPrice, getDiscountLabel } from "@/lib/discounts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Discount } from "@/types/offer";

export interface DiscountCardProps {
  discount: Discount;
  type: "product";
  /** Product name */
  targetName: string;
  /** Example price for preview (product price) */
  examplePrice: number;
  /** Delete callback */
  onDelete: (type: "product", targetId: number | string) => void;
  /** Edit callback */
  onEdit: (
    discount: Discount,
    type: "product",
    targetId: number | string,
  ) => void;
  /** Product ID for the discount */
  targetId: number | string;
}

export default function DiscountCard({
  discount,
  type,
  targetName,
  examplePrice,
  onDelete,
  onEdit,
  targetId,
}: DiscountCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const discountLabel = getDiscountLabel(discount);
  const validPrice =
    typeof examplePrice === "number" && examplePrice > 0 ? examplePrice : 500; // default example price
  const discountedPrice = calculateDiscountedPrice(validPrice, discount);
  const savings = validPrice - discountedPrice;

  const handleDeleteConfirm = () => {
    onDelete(type, targetId);
    setDeleteDialogOpen(false);
  };

  const handleEdit = () => {
    onEdit(discount, type, targetId);
  };

  return (
    <>
      <Card className="p-3 md:p-4 border rounded-lg hover:shadow-md transition-shadow">
        {/* Mobile (stacked) */}
        <div className="md:hidden flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold text-sm">{targetName}</h4>
                {discountLabel && (
                  <Badge variant="default" className="text-xs">
                    {discountLabel}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2 items-start">
              <Button size="sm" variant="outline" onClick={handleEdit}>
                <Edit2 className="size-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>

          <div className="pt-1 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground line-through">
                EGP {validPrice.toFixed(0)}
              </span>
              <span className="text-lg font-bold text-primary">
                EGP {discountedPrice.toFixed(0)}
              </span>
              <span className="text-xs text-muted-foreground">
                (Save {savings.toFixed(0)} EGP)
              </span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-2">
            <div>
              Type: <span className="capitalize">{discount.type}</span>
              {discount.value && ` • ${discount.value}`}
            </div>
            {discount.startDate && (
              <div>
                From: {new Date(discount.startDate).toLocaleDateString()}
              </div>
            )}
            {discount.endDate && (
              <div>
                Until: {new Date(discount.endDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Desktop (side-by-side) */}
        <div className="hidden md:flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">{targetName}</h4>
              {discountLabel && (
                <Badge variant="default" className="text-xs">
                  {discountLabel}
                </Badge>
              )}
            </div>

            <div className="text-sm">
              <span className="text-muted-foreground line-through">
                EGP {validPrice.toFixed(0)}
              </span>
              <span className="ml-2 text-lg font-bold text-primary">
                EGP {discountedPrice.toFixed(0)}
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                (Save {savings.toFixed(0)} EGP)
              </span>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 mt-2">
              <div>
                Type: <span className="capitalize">{discount.type}</span>
                {discount.value && ` • Value: ${discount.value}`}
              </div>
              {discount.startDate && (
                <div>
                  From: {new Date(discount.startDate).toLocaleDateString()}
                </div>
              )}
              {discount.endDate && (
                <div>
                  Until: {new Date(discount.endDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={handleEdit}>
              <Edit2 className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discount</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this discount for{" "}
              <strong>{targetName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={"destructive"}
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
