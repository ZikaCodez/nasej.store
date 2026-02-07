import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Edit } from "lucide-react";

export default function EditUserButton({
  user,
  onUpdated,
}: {
  user: any;
  onUpdated?: (u: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
    }
  }, [open, user, reset]);

  async function onSave(values: any) {
    try {
      const { data } = await api.patch(`/users/${user._id}`, values);
      toast.success("User updated");
      onUpdated?.(data);
      setOpen(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to update user";
      toast.error(msg);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Edit className="mr-1.5" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4 p-2">
          <div>
            <Label>Name</Label>
            <Input {...register("name")} className="w-full" />
          </div>
          <div>
            <Label>Email</Label>
            <Input {...register("email")} className="w-full" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input {...register("phone")} className="w-full" />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
