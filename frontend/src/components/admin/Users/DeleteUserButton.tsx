import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader, Trash } from "lucide-react";

export default function DeleteUserButton({
  userId,
  onDeleted,
}: {
  userId: number;
  onDeleted?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/users/${userId}`);
      toast.success("User deleted");
      setOpen(false);
      onDeleted?.();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => setOpen(true)}
        disabled={deleting}>
        <Trash className="mr-1.5" /> Delete
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              variant={"destructive"}>
              {deleting ? (
                <Loader className="animate-spin" />
              ) : (
                <Trash />
              )}
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
