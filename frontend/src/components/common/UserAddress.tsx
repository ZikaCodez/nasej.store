import { useEffect, useMemo, useState } from "react";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
import type { Address } from "@/types/auth";
import {
  GOVERNORATES_WITH_AREAS,
  getAreaByEnglishName,
  getGovernorateByEnglishName,
  type Governorate,
  type Area,
} from "@/lib/egyptLocations";
import { Button } from "@/components/ui/button";

export type UserAddressProps = {
  value?: Address;
  onChange?: (address: Address) => void;
  onRemove?: () => void;
  index?: number; // for display only
  disabled?: boolean;
  isDefault?: boolean;
  onMakeDefault?: () => void;
};

const REQUIRED_STAR = <span className="text-destructive">*</span>;

export default function UserAddress({
  value,
  onChange,
  onRemove,
  index,
  disabled,
  isDefault,
  onMakeDefault,
}: UserAddressProps) {
  const initial: Address = useMemo(
    () => ({
      city: "",
      area: "",
      street: "",
      building: "",
      apartment: "",
      notes: "",
      ...(value || {}),
    }),
    [value],
  );

  const [addr, setAddr] = useState<Address>(initial);
  const [govQuery, setGovQuery] = useState("");
  const [areaQuery, setAreaQuery] = useState("");

  // Derive selections from English names stored in addr
  const selectedGov: Governorate | undefined = useMemo(
    () => getGovernorateByEnglishName(addr.city),
    [addr.city],
  );
  const selectedArea: Area | undefined = useMemo(
    () => getAreaByEnglishName(addr.area),
    [addr.area],
  );

  const filteredGovernorates = useMemo(() => {
    const q = govQuery.trim().toLowerCase();
    if (!q) return GOVERNORATES_WITH_AREAS;
    return GOVERNORATES_WITH_AREAS.filter(
      (g) =>
        g.label.toLowerCase().includes(q) ||
        g.name_en.toLowerCase().includes(q) ||
        g.name_ar.toLowerCase().includes(q),
    );
  }, [govQuery]);

  const filteredAreas = useMemo(() => {
    const list = selectedGov?.areas || [];
    const q = areaQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.name_en.toLowerCase().includes(q) ||
        a.name_ar.toLowerCase().includes(q),
    );
  }, [areaQuery, selectedGov]);

  useEffect(() => {
    setAddr(initial);
  }, [
    initial.city,
    initial.area,
    initial.street,
    initial.building,
    initial.apartment,
    initial.notes,
  ]);

  // Keep the input text in sync with the selected option's label
  useEffect(() => {
    setGovQuery(selectedGov?.label ?? "");
  }, [selectedGov?.id]);
  useEffect(() => {
    setAreaQuery(selectedArea?.label ?? "");
  }, [selectedArea?.id]);

  const emit = (next: Address) => {
    setAddr(next);
    onChange?.(next);
  };

  const handleSelectGovernorate = (govId: string) => {
    const gov = GOVERNORATES_WITH_AREAS.find((g) => g.id === govId);
    const next: Address = {
      ...addr,
      city: gov ? gov.name_en : "",
      // reset area if governorate changes
      area: "",
    };
    emit(next);
    setGovQuery(gov?.label ?? "");
    setAreaQuery("");
  };

  const handleSelectArea = (areaId: string) => {
    const ar = selectedGov?.areas.find((a) => a.id === areaId);
    const next: Address = {
      ...addr,
      area: ar ? ar.name_en : "",
    };
    emit(next);
    setAreaQuery(ar?.label ?? "");
  };

  const onGovValueChange = (value: string | null) => {
    if (!value) {
      emit({ ...addr, city: "", area: "" });
      setGovQuery("");
      setAreaQuery("");
      return;
    }
    handleSelectGovernorate(value);
  };

  const onAreaValueChange = (value: string | null) => {
    if (!value) {
      emit({ ...addr, area: "" });
      setAreaQuery("");
      return;
    }
    handleSelectArea(value);
  };

  return (
    <div className="border rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {typeof index === "number" ? `Address ${index + 1}` : "Address"}
          {isDefault && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Default
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onMakeDefault && !isDefault && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onMakeDefault}
              disabled={disabled}>
              Make default
            </Button>
          )}
          {onRemove && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onRemove}
              disabled={disabled}>
              Remove
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field>
          <FieldLabel>City (Governorate) {REQUIRED_STAR}</FieldLabel>
          <FieldContent>
            <Combobox
              value={selectedGov?.id ?? null}
              onValueChange={onGovValueChange}>
              <ComboboxInput
                placeholder="Select governorate"
                disabled={disabled}
                showTrigger
                showClear={!disabled && !!selectedGov}
                aria-required
                value={govQuery}
                onChange={(e) =>
                  setGovQuery((e.target as HTMLInputElement).value)
                }
              />
              <ComboboxContent className="max-h-80">
                <ComboboxList className="max-h-64">
                  {filteredGovernorates.map((g) => (
                    <ComboboxItem key={g.id} value={g.id}>
                      {g.label}
                    </ComboboxItem>
                  ))}
                  {filteredGovernorates.length === 0 && (
                    <div className="text-muted-foreground w-full px-3 py-2 text-sm">
                      No matches
                    </div>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </FieldContent>
        </Field>

        {selectedGov && (
          <Field>
            <FieldLabel>Area {REQUIRED_STAR}</FieldLabel>
            <FieldContent>
              <Combobox
                value={selectedArea?.id ?? null}
                onValueChange={onAreaValueChange}>
                <ComboboxInput
                  placeholder="Select area"
                  disabled={disabled}
                  showTrigger
                  showClear={!disabled && !!selectedArea}
                  aria-required
                  value={areaQuery}
                  onChange={(e) =>
                    setAreaQuery((e.target as HTMLInputElement).value)
                  }
                />
                <ComboboxContent className="max-h-80">
                  <ComboboxList className="max-h-64">
                    {filteredAreas.map((a) => (
                      <ComboboxItem key={a.id} value={a.id}>
                        {a.label}
                      </ComboboxItem>
                    ))}
                    {filteredAreas.length === 0 && (
                      <div className="text-muted-foreground w-full px-3 py-2 text-sm">
                        No matches
                      </div>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </FieldContent>
          </Field>
        )}

        <Field>
          <FieldLabel>Street {REQUIRED_STAR}</FieldLabel>
          <Input
            aria-required
            disabled={disabled}
            value={addr.street}
            onChange={(e) => emit({ ...addr, street: e.target.value })}
            placeholder="Street name"
          />
        </Field>

        <Field>
          <FieldLabel>Building {REQUIRED_STAR}</FieldLabel>
          <Input
            aria-required
            disabled={disabled}
            value={addr.building || ""}
            onChange={(e) => emit({ ...addr, building: e.target.value })}
            placeholder="Building / House"
          />
        </Field>

        <Field>
          <FieldLabel>Apartment</FieldLabel>
          <Input
            disabled={disabled}
            value={addr.apartment || ""}
            onChange={(e) => emit({ ...addr, apartment: e.target.value })}
            placeholder="Apartment (optional)"
          />
        </Field>

        <Field>
          <FieldLabel>Notes</FieldLabel>
          <Input
            disabled={disabled}
            value={addr.notes || ""}
            onChange={(e) => emit({ ...addr, notes: e.target.value })}
            placeholder="Delivery notes (optional)"
          />
        </Field>
      </div>
    </div>
  );
}
