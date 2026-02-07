import { useEffect, useMemo, useState } from "react";
import { type Governorate } from "@/lib/egyptLocations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type ShippingFeesProps = {
  governorate: Governorate;
  currentPrice?: number;
  saving?: boolean;
  onSave: (price: number) => Promise<void> | void;
};

export default function ShippingFees({
  governorate,
  currentPrice,
  saving,
  onSave,
}: ShippingFeesProps) {
  const [value, setValue] = useState<string>(
    currentPrice !== undefined ? String(currentPrice) : "",
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setValue(currentPrice !== undefined ? String(currentPrice) : "");
    setDirty(false);
  }, [currentPrice]);

  const parsed = useMemo(() => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return undefined;
    return n;
  }, [value]);

  const canSave =
    dirty && parsed !== undefined && !saving && parsed !== currentPrice;

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 p-3 sm:p-4 rounded-lg border bg-card/50 hover:bg-card/70 transition-colors shrink-0">
      {/* Mobile: Full width info section */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 md:flex-none md:w-auto">
        <span className="text-muted-foreground font-mono text-[11px] sm:text-xs px-2 py-1 bg-muted rounded shrink-0">
          #{governorate.id}
        </span>
        <span className="font-semibold text-sm sm:text-base truncate flex-1 md:flex-none">
          {governorate.name_en}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {currentPrice === undefined ? (
            <Badge variant="destructive" className="text-xs whitespace-nowrap">
              Not set
            </Badge>
          ) : (
            <Badge
              variant="default"
              className="text-xs whitespace-nowrap">
              EGP {currentPrice}
            </Badge>
          )}
        </div>
      </div>

      {/* Mobile: Full width input section */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setDirty(true);
          }}
          placeholder="Price"
          className="flex-1 md:flex-none md:w-32 text-sm h-9"
          type="number"
          min={0}
          step={1}
        />
        {canSave && (
          <Button
            size="sm"
            onClick={async () => {
              if (parsed === undefined) return;
              await onSave(parsed);
              setDirty(false);
            }}
            className="shrink-0 whitespace-nowrap h-9">
            Save
          </Button>
        )}
      </div>
    </div>
  );
}
