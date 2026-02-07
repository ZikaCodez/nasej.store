import { useMemo } from "react";
import DiscountCard from "./DiscountCard";
import type { Discount } from "@/types/offer";

interface ProductDiscount {
  productId: number;
  productName: string;
  discount: Discount;
  basePrice: number;
}

export interface DiscountsContainerProps {
  type: "product";
  /** Array of discounts to display */
  discounts: ProductDiscount[];
  /** Delete callback */
  onDelete: (type: "product", targetId: number | string) => void;
  /** Edit callback */
  onEdit: (
    discount: Discount,
    type: "product",
    targetId: number | string,
  ) => void;
  /** Optional title for the container */
  title?: string;
  /** Optional CSS class */
  className?: string;
}

export default function DiscountsContainer({
  discounts,
  onDelete,
  onEdit,
  title,
  className = "",
}: DiscountsContainerProps) {
  const groupedDiscounts = useMemo(() => {
    return discounts;
  }, [discounts]);

  if (groupedDiscounts.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        No discounts found
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {title && <h3 className="font-semibold text-sm">{title}</h3>}
      <div className="space-y-3">
        {(groupedDiscounts as ProductDiscount[]).map((item) => (
          <DiscountCard
            key={`prod-${item.productId}`}
            type="product"
            discount={item.discount}
            targetName={item.productName}
            targetId={item.productId}
            examplePrice={item.basePrice}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
