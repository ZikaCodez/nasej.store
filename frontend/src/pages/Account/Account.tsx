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
import UserAddress from "@/components/common/UserAddress";
import type { Address } from "@/types/auth";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Mail, Phone, Plus, Save, User } from "lucide-react";

export default function Account() {
  const { user, login, startGoogleLogin } = useAuth();
  const [name, setName] = useState<string>(user?.name || "");
  const [phone, setPhone] = useState<string>(user?.phone || "");
  const [addresses, setAddresses] = useState<Address[]>(
    user?.addresses && user.addresses.length > 0
      ? user.addresses
      : [
          {
            city: "",
            area: "",
            street: "",
            building: "",
            apartment: "",
            notes: "",
          },
        ],
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      if (Array.isArray(user.addresses) && user.addresses.length > 0) {
        setAddresses(user.addresses);
      }
    }
  }, [user]);

  const validPhone = useMemo(() => {
    if (!phone) return false;
    const digits = phone.replace(/\D/g, "");
    return /^0?1[0-9]{9}$/.test(digits);
  }, [phone]);

  const canSubmit = useMemo(() => {
    if (!user) return false;
    if (!name.trim()) return false;
    if (!validPhone) return false;
    if (!addresses.length) return false;
    return addresses.every(
      (a) =>
        a.city?.trim() &&
        a.area?.trim() &&
        a.street?.trim() &&
        a.building?.trim(),
    );
  }, [user, name, validPhone, addresses]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      startGoogleLogin("/account");
      return;
    }
    if (!canSubmit) {
      toast.error("Please fill all required fields correctly");
      return;
    }
    setSaving(true);
    try {
      let phoneLocal = phone.replace(/\D/g, "");
      if (/^1[0-9]{9}$/.test(phoneLocal)) {
        phoneLocal = "0" + phoneLocal;
      }
      const payload = { name, phone: phoneLocal, addresses };
      const { data } = await api.patch(`/users/${user._id}`, payload);
      const updated = {
        ...user,
        name: data.name ?? name,
        phone: data.phone ?? phoneLocal,
        addresses: data.addresses ?? addresses,
      };
      login(updated);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-8 space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Account</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-muted-foreground text-sm">
          Sign in with Google to manage your profile and addresses.
        </p>
        <Button onClick={() => startGoogleLogin("/account")}>
          Continue with Google
        </Button>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Account</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl font-semibold mb-2">Account settings</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Update your name, phone number, and saved addresses.
      </p>
      <form
        onSubmit={onSubmit}
        className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4 col-span-2 md:col-span-1">
          <Field>
            <FieldLabel>
              <User /> Name <span className="text-destructive">*</span>
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
            <FieldLabel>
              <Mail /> Email
            </FieldLabel>
            <Input value={user.email} disabled readOnly />
          </Field>
          <Field>
            <FieldLabel>
              <Phone /> Phone <span className="text-destructive">*</span>
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
        </div>
        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">
            Addresses
          </div>
          {addresses.map((addr, idx) => (
            <UserAddress
              key={`${addr.city || ""}-${addr.street || ""}-${addr.building || ""}-${idx}`}
              index={idx}
              value={addr}
              isDefault={idx === 0}
              onMakeDefault={
                user?.addresses &&
                user.addresses.length > 1 &&
                idx !== 0 &&
                idx < user.addresses.length
                  ? () =>
                      setAddresses((prev) => {
                        const next = [...prev];
                        const [chosen] = next.splice(idx, 1);
                        return [chosen, ...next];
                      })
                  : undefined
              }
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
              className="w-full"
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
              <Plus /> Add Address
            </Button>
          </div>
        </div>
        <div className="flex justify-center gap-2 col-span-2">
          <Button
            type="submit"
            disabled={!canSubmit || saving}
            className="w-full md:w-1/2 mx-auto font-bold">
            <Save /> {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </>
  );
}
