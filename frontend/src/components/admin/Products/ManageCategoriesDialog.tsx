import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Plus,
  Loader2,
  FolderOpen,
  Package,
  ArrowRight,
  Tags,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Category } from "@/types/category";
import CreateCategoryDialog from "./CreateCategoryDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type ManageCategoriesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onRefresh: () => void;
};

export default function ManageCategoriesDialog({
  open,
  onOpenChange,
  categories,
  onRefresh,
}: ManageCategoriesDialogProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(editFile);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreviewUrl(null);
    };
  }, [editFile]);
  const [deleteData, setDeleteData] = useState<{
    cat: Category;
    action: "delete-products" | "move-products";
    moveTo?: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteData) return;
    const { cat, action, moveTo } = deleteData;
    if (action === "move-products" && !moveTo) {
      toast.error("Please select a category to move products to");
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/categories/${cat._id}`, {
        params: {
          action,
          moveToIndex: moveTo,
        },
      });
      toast.success("Category deleted");
      setDeleteData(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Manage Categories
            </DialogTitle>
            <DialogDescription>
              View and manage your product categories.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Tags className="h-4 w-4" />
              {categories.length} Categories
            </span>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New category
            </Button>
          </div>

          <div className="max-h-75 overflow-y-auto space-y-2 py-2">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center justify-between p-2 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/5 p-2 rounded-md">
                    <FolderOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{cat.name}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>/{cat.slug}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {cat.productCount ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditCat(cat);
                      setEditName(cat.name || "");
                      setEditFile(null);
                    }}>
                    <Edit /> Edit
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() =>
                      setDeleteData({ cat, action: "move-products" })
                    }>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No categories found.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateCategoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(newCat) => {
          onRefresh();
          setCreateOpen(false);
          if (deleteData) {
            setDeleteData((prev) =>
              prev ? { ...prev, moveTo: String(newCat._id) } : null,
            );
          }
        }}
      />

      {/* Edit Category Dialog */}
      <Dialog open={!!editCat} onOpenChange={(v) => !v && setEditCat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update name and size chart image.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!editCat) return;
              if (!editName.trim()) {
                toast.error("Category name is required");
                return;
              }
              try {
                setSavingEdit(true);
                let sizeChartUrl = editCat.sizeChart;
                if (editFile) {
                  const fd = new FormData();
                  fd.append("image", editFile);
                  const up = await api.post("/image", fd);
                  sizeChartUrl = up.data?.data?.url || sizeChartUrl;
                }
                // Coerce id to number to match backend expectations
                const idToPatch = Number(editCat._id);
                await api.patch(
                  `/categories/${idToPatch}`,
                  {
                    name: editName.trim(),
                    sizeChart: sizeChartUrl || undefined,
                  },
                  { headers: { "x-silent": "1" } },
                );
                toast.success("Category updated");
                setEditCat(null);
                onRefresh();
              } catch (err: any) {
                // Try to extract server-provided message (axios style)
                const serverMsg =
                  err?.response?.data?.message ||
                  err?.response?.data?.error ||
                  err?.message ||
                  "Failed to update category";
                // If category truly doesn't exist on the server, refresh list
                if (
                  String(serverMsg).toLowerCase().includes("category not found")
                ) {
                  toast.error("Category not found on server — refreshing list");
                  setEditCat(null);
                  onRefresh();
                } else {
                  toast.error(String(serverMsg));
                }
              } finally {
                setSavingEdit(false);
              }
            }}
            className="space-y-3 pt-2">
            <Field>
              <FieldLabel>
                Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel>Size chart image</FieldLabel>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setEditFile(e.target.files?.[0] || null)}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const f = e.dataTransfer?.files?.[0];
                  if (f) setEditFile(f as File);
                }}
                className={`mt-2 flex flex-col items-center justify-center gap-3 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-border"
                }`}>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="max-h-36 object-contain"
                  />
                ) : editCat?.sizeChart ? (
                  <img
                    src={editCat.sizeChart}
                    alt="size chart"
                    className="max-h-36 object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center text-sm text-muted-foreground">
                    <Plus className="h-6 w-6 text-primary mb-1" />
                    <div>Drag & drop an image, or click to choose</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Max 25MB, images only
                    </div>
                  </div>
                )}

                {(editFile || editCat?.sizeChart) && (
                  <div className="flex items-center gap-2">
                    {editFile && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setEditFile(null);
                        }}>
                        Remove
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        fileInputRef.current?.click();
                      }}>
                      Replace
                    </Button>
                  </div>
                )}
              </div>
            </Field>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setEditCat(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingEdit}>
                {savingEdit ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {deleteData && (
        <AlertDialog
          open={!!deleteData}
          onOpenChange={(open) => !open && setDeleteData(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Delete Category: {deleteData.cat.name}
              </AlertDialogTitle>
              <AlertDialogDescription>
                This category contains{" "}
                <strong>{deleteData.cat.productCount ?? 0} products</strong>.
                How would you like to handle them?
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="py-4 space-y-4">
              <RadioGroup
                value={deleteData.action}
                onValueChange={(val: "delete-products" | "move-products") =>
                  setDeleteData({ ...deleteData, action: val })
                }>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="move-products" id="move" />
                  <Label
                    htmlFor="move"
                    className="flex items-center gap-2 cursor-pointer">
                    <ArrowRight className="h-4 w-4" />
                    Move products to another category
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delete-products" id="delete" />
                  <Label
                    htmlFor="delete"
                    className="flex items-center gap-2 text-destructive cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                    Delete all products in this category
                  </Label>
                </div>
              </RadioGroup>

              {deleteData.action === "move-products" && (
                <div className="pt-2">
                  <Label className="text-xs mb-1.5 block items-center gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5" />
                    Target Category
                  </Label>
                  <Select
                    value={deleteData.moveTo}
                    onValueChange={(val) => {
                      if (val === "__new__") {
                        setCreateOpen(true);
                        return;
                      }
                      setDeleteData({ ...deleteData, moveTo: val });
                    }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c._id !== deleteData.cat._id)
                        .map((cat) => (
                          <SelectItem key={cat._id} value={String(cat._id)}>
                            <div className="flex items-center gap-2">
                              <FolderOpen className="h-4 w-4 opacity-50" />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      <SelectItem value="__new__">
                        <div className="flex items-center gap-2 text-primary">
                          <Plus className="h-4 w-4" />
                          New category…
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={
                  deleting ||
                  (deleteData.action === "move-products" && !deleteData.moveTo)
                }>
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Confirm Delete
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
