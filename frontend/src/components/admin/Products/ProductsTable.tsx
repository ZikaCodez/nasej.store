import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { ProductListItem } from "@/types/product";
import { cn } from "@/lib/utils";
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  EyeOff,
  Check,
  Star,
  Loader2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { NavLink } from "react-router-dom";
import type { Category } from "@/types/category";
import { Badge } from "@/components/ui/badge";
import { getDiscountLabel, isDiscountValid } from "@/lib/discounts";
import ProductStock from "./ProductStock";

export type ProductsTableProps = {
  products: ProductListItem[];
  selectedIds: number[];
  onToggleSelect?: (id: number, checked: boolean) => void;
  onToggleSelectAll?: (checked: boolean) => void;
  onEdit?: (product: ProductListItem) => void;
  onDelete?: (product: ProductListItem) => void;
  onMarkInactive?: (product: ProductListItem) => void;
  onMarkActive?: (product: ProductListItem) => void;
  onToggleFeatured?: (product: ProductListItem) => void;
  pendingIds?: number[];
  categories?: Category[];
};

export default function ProductsTable({
  products,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onMarkInactive,
  onMarkActive,
  onToggleFeatured,
  pendingIds,
  categories,
}: ProductsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProductListItem | null>(
    null,
  );
  const [stockDialogOpen, setStockDialogOpen] = useState<number | null>(null);
  const { user } = useAuth();
  const hasSales = products.some((p) => isDiscountValid(p.discount));

  const formatUpdated = (date: Date | null) => {
    if (!date) return "–";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) {
      // Future timestamp (clock skew) — show absolute
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    }
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const remMin = diffMin % 60;
    if (diffHours === 0) {
      const mins = Math.max(0, diffMin);
      return `${mins} minute${mins === 1 ? "" : "s"} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"}${
        remMin ? ` and ${remMin} minute${remMin === 1 ? "" : "s"}` : ""
      } ago`;
    }
    // 1 day or more — show date + time with seconds (12-hour)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <Checkbox
                checked={
                  products.length > 0 && selectedIds.length === products.length
                    ? true
                    : selectedIds.length > 0
                      ? ("indeterminate" as any)
                      : false
                }
                onCheckedChange={(v) => onToggleSelectAll?.(Boolean(v))}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-center">Category</TableHead>
            <TableHead className="text-center">Base price (EGP)</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            {hasSales && <TableHead className="text-center">Sales</TableHead>}
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Updated</TableHead>
            <TableHead className="w-10 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const selected = selectedIds.includes(product._id);
            const status =
              product.status ||
              (product.isActive === false ? "inactive" : "active");
            const updatedAt = product.updatedAt
              ? new Date(product.updatedAt)
              : null;
            return (
              <TableRow
                key={product._id}
                data-state={selected ? "selected" : undefined}>
                <TableCell className="w-8">
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(v) =>
                      onToggleSelect?.(product._id, Boolean(v))
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    {product.thumbnail ? (
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-12 h-12 rounded-md object-cover hidden md:inline-flex"
                      />
                    ) : null}
                    <div className="flex flex-col">
                      <span>{product.name}</span>
                      <NavLink
                        to={`/product/${product.slug}`}
                        className="text-xs text-link underline text-primary">
                        /{product.slug}
                      </NavLink>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {(() => {
                    const cat = categories?.find(
                      (c) => c._id === product.category,
                    );
                    return cat ? cat.name : "–";
                  })()}
                </TableCell>
                <TableCell className="text-center">
                  {product.basePrice.toLocaleString("en-EG")}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStockDialogOpen(product._id)}>
                    View stock
                  </Button>
                  {stockDialogOpen === product._id && (
                    <ProductStock
                      product={product}
                      open={true}
                      onClose={() => setStockDialogOpen(null)}
                    />
                  )}
                </TableCell>
                {hasSales && (
                  <TableCell className="text-center">
                    {isDiscountValid(product.discount) ? (
                      (() => {
                        const label = getDiscountLabel(product.discount);
                        return label ? (
                          <Badge
                            variant="destructive"
                            className="text-xs h-5 px-1.5">
                            {label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            –
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-xs text-muted-foreground">–</span>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-center">
                  <span
                    className={
                      status === "active"
                        ? "inline-flex rounded-full bg-green-500/20 px-2 py-0.5 text-[11px] font-medium text-green-500"
                        : status === "inactive"
                          ? "inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-500"
                          : "inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    }>
                    {status.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className="text-center text-xs text-muted-foreground">
                  {formatUpdated(updatedAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Actions"
                        disabled={Boolean(pendingIds?.includes(product._id))}>
                        {pendingIds?.includes(product._id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onEdit?.(product)}
                        disabled={Boolean(pendingIds?.includes(product._id))}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />

                      {/* Delete with confirmation */}
                      {user?.role === "admin" && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            setPendingDelete(product);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={Boolean(pendingIds?.includes(product._id))}>
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          <span className="text-destructive">Delete</span>
                        </DropdownMenuItem>
                      )}

                      {product.isActive ? (
                        <DropdownMenuItem
                          onClick={() => onMarkInactive?.(product)}
                          disabled={Boolean(pendingIds?.includes(product._id))}>
                          <EyeOff className="mr-2 h-4 w-4" /> Mark inactive
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => onMarkActive?.(product)}
                          disabled={Boolean(pendingIds?.includes(product._id))}>
                          <Check className="mr-2 h-4 w-4" /> Mark active
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => onToggleFeatured?.(product)}
                        disabled={Boolean(pendingIds?.includes(product._id))}>
                        <Star
                          className={cn(
                            "mr-2 h-4 w-4",
                            product.isFeatured &&
                              "fill-yellow-400 text-yellow-400",
                          )}
                        />
                        {product.isFeatured
                          ? "Unmark featured"
                          : "Mark featured"}
                      </DropdownMenuItem>

                      {/* Confirmation dialog rendered once per row when needed */}
                      <AlertDialog
                        open={
                          deleteDialogOpen && pendingDelete?._id === product._id
                        }
                        onOpenChange={(open) => {
                          setDeleteDialogOpen(open);
                          if (!open) setPendingDelete(null);
                        }}>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete{" "}
                              <b>{product.name}</b>? This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                // Mark inactive instead of delete
                                const toMark = pendingDelete;
                                setDeleteDialogOpen(false);
                                setPendingDelete(null);
                                if (toMark) onMarkInactive?.(toMark);
                              }}>
                              <EyeOff className="mr-2 h-4 w-4" /> Mark inactive
                            </AlertDialogAction>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => {
                                setDeleteDialogOpen(false);
                                const toDelete = pendingDelete;
                                setPendingDelete(null);
                                if (toDelete) onDelete?.(toDelete);
                              }}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        {products.length === 0 && (
          <TableCaption>
            No products found. Try adjusting your filters.
          </TableCaption>
        )}
      </Table>
    </>
  );
}
