import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export type ProductStatusToggleProps = {
  active: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
};

export default function ProductStatusToggle({
  active,
  onChange,
  disabled,
}: ProductStatusToggleProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2">
      <div className="space-y-0.5">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Visibility
        </Label>
        <p className="text-xs text-muted-foreground">
          {active
            ? "Product is visible in the shop."
            : "Product is hidden from customers."}
        </p>
      </div>
      <Switch
        size="sm"
        checked={active}
        disabled={disabled}
        onCheckedChange={(val) => onChange?.(Boolean(val))}
        aria-label={active ? "Set product inactive" : "Set product active"}
      />
    </div>
  );
}
