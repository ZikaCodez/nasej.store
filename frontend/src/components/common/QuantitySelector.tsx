import { Button } from "@/components/ui/button";

export interface QuantitySelectorProps {
  value?: number;
  min?: number;
  max?: number;
  onChange?: (next: number) => void;
  disablePlus?: boolean;
}

export default function QuantitySelector({
  value = 1,
  min = 1,
  max = 99,
  onChange,
  disablePlus = false,
}: QuantitySelectorProps) {
  const decrement = () => {
    const next = Math.max(min, value - 1);
    onChange?.(next);
  };
  const increment = () => {
    const next = Math.min(max, value + 1);
    onChange?.(next);
  };

  return (
    <div className="inline-flex items-center gap-2">
      <Button
        variant="secondary"
        size="icon-sm"
        aria-label="Decrease"
        onClick={decrement}
        disabled={value <= min}>
        −
      </Button>
      <span className="w-8 text-center text-sm">{value}</span>
      <Button
        variant="secondary"
        size="icon-sm"
        aria-label="Increase"
        onClick={increment}
        disabled={disablePlus}>
        +
      </Button>
    </div>
  );
}
