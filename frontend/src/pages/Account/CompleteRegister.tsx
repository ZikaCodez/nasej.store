import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import type { Address } from "@/types/auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import UserAddress from "@/components/common/UserAddress";
import { User, Phone, MapPin, Plus, CheckCircle } from "lucide-react";

export default function CompleteRegister() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/";
  const safeRedirect = redirectParam.startsWith("/") ? redirectParam : "/";
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([
    { city: "", area: "", street: "", building: "", apartment: "", notes: "" },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
    }
  }, [user]);

  // Accept local mobile input as 01XXXXXXXXX (11) or 1XXXXXXXXX (10)
  const validPhone = /^0?1[0-9]{9}$/.test(phone);
  const canSubmit = useMemo(() => {
    if (!name.trim() || !validPhone) return false;
    if (!addresses.length) return false;
    return addresses.every(
      (a) =>
        a.city?.trim() &&
        a.area?.trim() &&
        a.street?.trim() &&
        a.building?.trim(),
    );
  }, [name, validPhone, addresses]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!canSubmit) {
      toast.error("Please fill all required fields correctly");
      return;
    }
    setSaving(true);
    try {
      // Normalize to local 11-digit format (no country code): ensure leading 0
      let phoneLocal = phone.replace(/\D/g, "");
      if (/^1[0-9]{9}$/.test(phoneLocal)) {
        phoneLocal = "0" + phoneLocal;
      }
      // At this point, phoneLocal should be 11 digits starting with 0
      const payload = { name, phone: phoneLocal, addresses };
      const { data } = await api.patch(`/users/${user._id}`, payload);
      const updated = {
        ...user,
        name: data.name ?? name,
        phone: data.phone ?? phoneLocal,
        addresses: data.addresses ?? addresses,
      };
      login(updated);
      toast.success("Profile completed");
      navigate(safeRedirect);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="grid grid-cols-1 items-center gap-3 mb-4">
        <CheckCircle className="w-8 h-8 md:w-12 md:h-12 text-green-600 mx-auto" />
        <h1 className="text-xl md:text-2xl font-semibold text-center">
          Complete Your Registration
        </h1>
      </div>
      <p className="text-muted-foreground mb-6 text-center">
        Please confirm your name and add your phone and address.
      </p>
      <form onSubmit={onSubmit} className="space-y-6">
        <Field>
          <FieldLabel className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Name <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
            aria-invalid={!name.trim()}
            minLength={2}
          />
        </Field>
        <Field>
          <FieldLabel className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone <span className="text-destructive">*</span>
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <span role="img" aria-label="Egypt" className="mr-1">
                <svg width={24} height={24} fill="none" viewBox="0 0 24 24">
                  <g clipPath="url(#EG_svg__a)">
                    <path
                      d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Z"
                      fill="#F0F0F0"
                    />
                    <path
                      d="M12 0C6.84 0 2.442 3.256.746 7.826h22.507C21.558 3.256 17.16 0 12 0Z"
                      fill="#D80027"
                    />
                    <path
                      d="M12 24c5.16 0 9.558-3.256 11.253-7.826H.746C2.442 20.744 6.84 24 12 24Z"
                      fill="#000"
                    />
                    <path
                      d="M16.174 10.696h-3.13a1.044 1.044 0 0 0-2.087 0h-3.13c0 .576.501 1.043 1.077 1.043H8.87c0 .576.467 1.044 1.043 1.044 0 .576.467 1.043 1.044 1.043h2.087c.576 0 1.043-.467 1.043-1.043.576 0 1.044-.468 1.044-1.044h-.035c.576 0 1.078-.467 1.078-1.043Z"
                      fill="#FF9811"
                    />
                  </g>
                  <defs>
                    <clipPath id="EG_svg__a">
                      <path fill="#fff" d="M0 0h24v24H0z" />
                    </clipPath>
                  </defs>
                </svg>
              </span>{" "}
              +20
            </InputGroupAddon>
            <InputGroupInput
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="1XXXXXXXXX"
              required
              pattern="^0?1[0-9]{9}$"
              maxLength={11}
              aria-invalid={!validPhone && !!phone}
            />
          </InputGroup>
          {!validPhone && phone && (
            <span className="text-destructive text-xs">
              Enter 10-11 digits (starts with 1, may begin with 0).
            </span>
          )}
        </Field>
        <div className="space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Address
          </h2>
          {addresses.map((addr, idx) => (
            <UserAddress
              key={idx}
              index={idx}
              value={addr}
              onChange={(next) =>
                setAddresses((prev) =>
                  prev.map((a, i) => (i === idx ? next : a)),
                )
              }
              onRemove={
                idx > 0
                  ? () =>
                      setAddresses((prev) => prev.filter((_, i) => i !== idx))
                  : undefined
              }
            />
          ))}
          <div>
            <Button
              type="button"
              variant="secondary"
              className="gap-2 w-full"
              onClick={() =>
                setAddresses((prev) => [
                  ...prev,
                  {
                    city: "",
                    area: "",
                    street: "",
                    building: "",
                    apartment: "",
                    notes: "",
                  },
                ])
              }>
              <Plus className="w-4 h-4" />
              Add Address
            </Button>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="submit"
            disabled={!canSubmit || saving}
            className="gap-2 w-full">
            <CheckCircle className="w-4 h-4" />
            {saving ? "Saving..." : "Save and Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
}
