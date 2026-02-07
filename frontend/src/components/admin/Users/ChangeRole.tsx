import { useState } from "react";
import api from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Role = "customer" | "admin" | "editor";

export default function ChangeRole({
  userId,
  currentRole,
  onUpdated,
}: {
  userId: number;
  currentRole?: Role;
  onUpdated?: (u: any) => void;
}) {
  const [role, setRole] = useState<Role>(currentRole || "customer");

  async function change(next: Role) {
    setRole(next);
    try {
      const { data } = await api.patch(`/users/${userId}`, { role: next });
      toast.success("Role updated");
      onUpdated?.(data);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update role");
    }
  }

  return (
    <div>
      <Select onValueChange={(v) => change(v as Role)} value={role}>
        <SelectTrigger className="w-full h-8 text-sm">
          <SelectValue placeholder={role} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="customer">Customer</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="editor">Editor</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
