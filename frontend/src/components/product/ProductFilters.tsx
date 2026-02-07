import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/useColors";

export interface ProductFiltersProps {
  categories?: string[];
  sizes?: string[];
  colors?: string[];
  priceMin?: number;
  priceMax?: number;
  selectedc?: string | null;
  selectedSizes?: string[];
  selectedColors?: string[];
  onChange?: (filters: {
    c: string | null;
    sizes: string[];
    colors: string[];
    priceMin: number;
    priceMax: number;
  }) => void;
  onClear?: () => void;
}

export default function ProductFilters({
  categories = ["Men", "Women", "Accessories"],
  sizes = ["S", "M", "L", "XL"],
  colors = ["Black", "White", "Beige"],
  priceMin = 0,
  priceMax = 2000,
  selectedc: selectedcProp = null,
  selectedSizes: selectedSizesProp = [],
  selectedColors: selectedColorsProp = [],
  onChange,
  onClear,
}: ProductFiltersProps) {
  const { colorsMap } = useColors();
  const [selectedc, setSelectedc] = useState<string | null>(
    selectedcProp ?? null,
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    selectedSizesProp ?? [],
  );
  const [selectedColors, setSelectedColors] = useState<string[]>(
    selectedColorsProp ?? [],
  );
  const [min, setMin] = useState<number>(priceMin);
  const [max, setMax] = useState<number>(priceMax);

  // Sync internal state when props change (controlled-uncontrolled hybrid)
  useEffect(() => {
    // Mark as controlled update to avoid emitting onChange
    setSuppressEmitTrue();
    setMin(priceMin);
  }, [priceMin]);
  useEffect(() => {
    setSuppressEmitTrue();
    setMax(priceMax);
  }, [priceMax]);
  useEffect(() => {
    setSuppressEmitTrue();
    setSelectedc(selectedcProp ?? null);
  }, [selectedcProp]);
  useEffect(() => {
    setSuppressEmitTrue();
    setSelectedSizes(selectedSizesProp ?? []);
  }, [selectedSizesProp]);
  useEffect(() => {
    setSuppressEmitTrue();
    setSelectedColors(selectedColorsProp ?? []);
  }, [selectedColorsProp]);

  // Suppress emit ref to break potential feedback loops
  const suppressEmitRef = useRef(false);
  const setSuppressEmitTrue = () => {
    suppressEmitRef.current = true;
  };

  // Emit changes whenever any filter state updates (unless controlled update)
  useEffect(() => {
    if (suppressEmitRef.current) {
      suppressEmitRef.current = false;
      return;
    }
    onChange?.({
      c: selectedc,
      sizes: selectedSizes,
      colors: selectedColors,
      priceMin: min,
      priceMax: max,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedc, selectedSizes, selectedColors, min, max]);

  const toggleSize = (s: string) => {
    const key = s.toLowerCase();
    setSelectedSizes((prev) =>
      prev.map((v) => v.toLowerCase()).includes(key)
        ? prev.filter((v) => v.toLowerCase() !== key)
        : [...prev, key],
    );
  };

  const toggleColor = (c: string) => {
    const key = c.toLowerCase();
    setSelectedColors((prev) =>
      prev.map((v) => v.toLowerCase()).includes(key)
        ? prev.filter((v) => v.toLowerCase() !== key)
        : [...prev, key],
    );
  };

  const clearAll = () => {
    setSelectedc(null);
    setSelectedSizes([]);
    setSelectedColors([]);
    setMin(priceMin);
    setMax(priceMax);
    onClear?.();
  };

  // Dynamic swatch styles from colorsMap
  function swatchStyles(name?: string): {
    backgroundColor: string;
    borderColor: string;
  } {
    const key = name?.trim().toLowerCase();
    const hex = key ? colorsMap[key] : undefined;
    if (!hex) return { backgroundColor: "#e5e7eb", borderColor: "#9ca3af" };
    const h = hex.replace(/^#/, "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const borderColor = luminance > 180 ? "#9ca3af" : "#ffffff";
    return { backgroundColor: hex, borderColor };
  }

  const sortedColors = [...colors].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Filters</h4>
        <Button
          variant="destructive"
          size="sm"
          onClick={clearAll}
          aria-label="Clear filters">
          Clear
        </Button>
      </div>

      {/* c (button radios) */}
      <div>
        <h5 className="text-xs font-medium text-muted-foreground">Category</h5>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((c) => {
            const selected =
              (selectedc || "").toLowerCase() === c.toLowerCase();
            return (
              <Button
                key={c}
                variant={selected ? "default" : "outline"}
                size="sm"
                className={cn("rounded-full", selected && "font-semibold")}
                onClick={() => {
                  setSelectedc((prev) =>
                    (prev || "").toLowerCase() === c.toLowerCase() ? null : c,
                  );
                }}>
                {c ? c.charAt(0).toUpperCase() + c.slice(1) : ""}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Size (toggle buttons with check) */}
      <div>
        <h5 className="text-xs font-medium text-muted-foreground">Size</h5>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {sizes.map((s) => {
            const selected = selectedSizes
              .map((v) => v.toLowerCase())
              .includes(s.toLowerCase());
            return (
              <Button
                key={s}
                variant={selected ? "default" : "outline"}
                size="sm"
                className={`rounded-full ${selected && "justify-between"}`}
                onClick={() => toggleSize(s)}
                aria-pressed={selected}>
                <span>{s}</span>
                {selected && <Check className="size-4" />}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Color (toggle buttons with check + swatch circle) */}
      <div>
        <h5 className="text-xs font-medium text-muted-foreground">Color</h5>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {sortedColors.map((c) => {
            const selected = selectedColors
              .map((v) => v.toLowerCase())
              .includes(c.toLowerCase());
            return (
              <Button
                key={c}
                variant={selected ? "default" : "outline"}
                size="sm"
                className={`rounded-full ${selected && "justify-between"}`}
                onClick={() => toggleColor(c)}
                aria-pressed={selected}>
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-4 rounded-full border"
                    style={swatchStyles(c)}
                  />
                  {c ? c.charAt(0).toUpperCase() + c.slice(1) : ""}
                </span>
                {selected && <Check className="size-4" />}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h5 className="text-xs font-medium text-muted-foreground">
          Price Range
        </h5>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs">EGP</span>
          <input
            type="number"
            value={min}
            min={0}
            onChange={(e) => {
              setMin(Number(e.target.value));
            }}
            className="w-24 rounded-md border bg-transparent px-2 py-1 text-sm"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <span className="text-xs">EGP</span>
          <input
            type="number"
            value={max}
            min={min}
            onChange={(e) => {
              setMax(Number(e.target.value));
            }}
            className="w-24 rounded-md border bg-transparent px-2 py-1 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
