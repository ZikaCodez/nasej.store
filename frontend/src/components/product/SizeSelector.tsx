import { Button } from "@/components/ui/button";

export interface SizeSelectorProps {
  sizes?: string[];
  selectedSize?: string;
  unavailable?: string[];
  onSelect?: (size: string) => void;
}

export default function SizeSelector({
  sizes = ["S", "M", "L", "XL"],
  selectedSize,
  unavailable = ["XS"],
  onSelect,
}: SizeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => {
        const isUnavailable = unavailable.includes(size);
        const isSelected = selectedSize === size;
        return (
          <Button
            key={size}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            disabled={isUnavailable}
            onClick={() => onSelect?.(size)}
            className={`${isUnavailable ? "opacity-50 line-through" : ""}`}
            aria-pressed={isSelected}
            aria-label={`Size ${size}${isUnavailable ? " (Unavailable)" : ""}`}>
            {size}
          </Button>
        );
      })}
    </div>
  );
}
