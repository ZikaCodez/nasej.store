import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Color } from "@/types/color";

export type CreateColorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (color: Color) => void;
};

function rgbToHex(input: string): string | null {
  const match = input
    .trim()
    .toLowerCase()
    .match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (!match) return null;
  const [r, g, b] = match.slice(1).map((v) => Number(v));
  if ([r, g, b].some((v) => v < 0 || v > 255)) return null;
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function normalizeHex(input: string): string | null {
  let v = input.trim();
  if (!v) return null;
  const rgb = rgbToHex(v);
  if (rgb) return rgb;
  if (!v.startsWith("#")) v = `#${v}`;
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return null;
  return v.toLowerCase();
}

export default function CreateColorDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateColorDialogProps) {
  const [name, setName] = useState("");
  const [hexInput, setHexInput] = useState("#000000");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setHexInput("#000000");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
    }
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Color name is required");
      return;
    }
    const hex = normalizeHex(hexInput);
    if (!hex) {
      toast.error("Please enter a valid hex or rgb() color");
      return;
    }
    const id = name.toLowerCase().trim();
    try {
      setSaving(true);
      const { data } = await api.post<Color>("/colors", {
        _id: id,
        hex,
      });
      toast.success("Color created");
      onCreated?.(data);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create color");
    } finally {
      setSaving(false);
    }
  };

  const handleHexChange = (value: string) => {
    setHexInput(value);
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexInput(e.target.value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New color</DialogTitle>
          <DialogDescription>
            Define a reusable color for product variants.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <Field>
            <FieldLabel>
              Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Black"
              autoFocus
            />
          </Field>
          <Field>
            <FieldLabel>Color (hex or rgb)</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#000000 or rgb(0,0,0)"
                className="flex-1"
              />
              <Input
                type="color"
                value={normalizeHex(hexInput) || "#000000"}
                onChange={handleColorPickerChange}
                className="h-9 w-10 min-w-10 cursor-pointer p-1"
              />
            </div>
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
