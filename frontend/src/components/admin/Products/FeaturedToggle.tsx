import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export type FeaturedToggleProps = {
  featured: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
};

export default function FeaturedToggle({
  featured,
  onChange,
  disabled,
}: FeaturedToggleProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2">
      <div className="space-y-0.5">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Featured
        </Label>
        <p className="text-xs text-muted-foreground">
          {featured
            ? "Product is highlighted in featured sections."
            : "Product is not marked as featured."}
        </p>
      </div>
      <Switch
        size="sm"
        checked={featured}
        disabled={disabled}
        onCheckedChange={(val) => onChange?.(Boolean(val))}
        aria-label={featured ? "Unset featured" : "Set as featured"}
      />
    </div>
  );
}
