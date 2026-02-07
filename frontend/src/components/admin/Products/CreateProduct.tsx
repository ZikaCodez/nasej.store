import { useEffect, useMemo, useRef, useState } from "react";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/types/category";

export type ProductFormValue = {
  name: string;
  slug: string;
  description: string;
  basePrice: number | "";
  category: number | "";
  tags: string;
  imageUrls: string[];
};

export type CreateProductProps = {
  value?: ProductFormValue;
  onChange?: (value: ProductFormValue) => void;
  disabled?: boolean;
  categories: Category[];
  onOpenCreateCategory: () => void;
};

const REQUIRED_STAR = <span className="text-destructive">*</span>;

export default function CreateProduct({
  value,
  onChange,
  disabled,
  categories,
  onOpenCreateCategory,
}: CreateProductProps) {
  const initial: ProductFormValue = useMemo(
    () => ({
      name: "",
      slug: "",
      description: "",
      basePrice: "",
      category: "",
      tags: "",
      imageUrls: [],
      ...(value || {}),
    }),
    [value],
  );

  const [form, setForm] = useState<ProductFormValue>(initial);

  const slugify = (raw: string) =>
    raw.toLowerCase().trim().replace(/\s+/g, "-");

  const emit = (next: ProductFormValue) => {
    setForm(next);
    onChange?.(next);
  };

  const onFieldChange = <K extends keyof ProductFormValue>(
    key: K,
    value: ProductFormValue[K],
  ) => {
    emit({ ...form, [key]: value });
  };

  const categoriesInitializedRef = useRef(false);
  const prevCategoriesLengthRef = useRef(categories.length);

  useEffect(() => {
    if (!categoriesInitializedRef.current) {
      categoriesInitializedRef.current = true;
      prevCategoriesLengthRef.current = categories.length;
      return;
    }
    if (categories.length > prevCategoriesLengthRef.current) {
      const newlyAdded = categories[categories.length - 1];
      if (newlyAdded) {
        setForm((prev) => {
          const next = { ...prev, category: newlyAdded._id };
          onChange?.(next);
          return next;
        });
      }
    }
    prevCategoriesLengthRef.current = categories.length;
  }, [categories, onChange]);

  return (
    <div className="border rounded-2xl p-4 space-y-4">
      <div className="text-sm font-medium text-muted-foreground">
        Product details
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field>
          <FieldLabel>Name {REQUIRED_STAR}</FieldLabel>
          <Input
            disabled={disabled}
            value={form.name}
            onChange={(e) => {
              const nextName = e.target.value;
              const autoBefore = slugify(form.name || "");
              const isSlugAuto = !form.slug || form.slug === autoBefore;
              const nextSlug = isSlugAuto ? slugify(nextName) : form.slug;
              emit({ ...form, name: nextName, slug: nextSlug });
            }}
            placeholder="Product name"
          />
        </Field>
        <Field>
          <FieldLabel>Slug</FieldLabel>
          <Input
            disabled={true}
            value={form.slug}
            onChange={(e) => {
              const raw = e.target.value;
              emit({ ...form, slug: slugify(raw) });
            }}
            placeholder="url-friendly-name"
          />
        </Field>
        <Field className="md:col-span-2">
          <FieldLabel>Description</FieldLabel>
          <Textarea
            disabled={disabled}
            value={form.description}
            onChange={(e) => onFieldChange("description", e.target.value)}
            placeholder="Brief description of the product"
            rows={5}
          />
        </Field>
        <Field>
          <FieldLabel>Base price (EGP) {REQUIRED_STAR}</FieldLabel>
          <Input
            type="number"
            min={0}
            step={1}
            disabled={disabled}
            value={form.basePrice === "" ? "" : String(form.basePrice)}
            onChange={(e) =>
              onFieldChange(
                "basePrice",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            placeholder="0"
          />
        </Field>
        <Field>
          <FieldLabel>Category {REQUIRED_STAR}</FieldLabel>
          <FieldContent>
            <Select
              value={form.category === "" ? undefined : String(form.category)}
              onValueChange={(val) => {
                if (val === "__new__") {
                  onOpenCreateCategory();
                  return;
                }
                onFieldChange("category", Number(val));
              }}
              disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={String(cat._id)}>
                    {cat.name}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">+ New category…</SelectItem>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
        <Field className="md:col-span-2">
          <FieldLabel>Tags</FieldLabel>
          <Input
            disabled={disabled}
            value={form.tags}
            onChange={(e) => onFieldChange("tags", e.target.value)}
            placeholder="Comma-separated tags (e.g. summer, oversized)"
          />
        </Field>
      </div>
    </div>
  );
}
