import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/pages/Admin/AdminLayout";
import ProductsTable from "@/components/admin/Products/ProductsTable";
import ProductFilters, {
  type ProductsFilterValue,
} from "@/components/admin/Products/ProductFilters";
import ProductForm, {
  type ProductFormState,
} from "@/components/admin/Products/ProductForm";
import ManageCategoriesDialog from "@/components/admin/Products/ManageCategoriesDialog";
import ManageOffersDialog from "@/components/admin/Products/ManageOffersDialog";
import ShippingManagerDialog from "@/components/admin/Shipping/ShippingManagerDialog";
import CreateColorDialog from "@/components/admin/Products/CreateColorDialog";
import type { ProductListItem } from "@/types/product";
import type { Category } from "@/types/category";
import type { Color } from "@/types/color";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  EyeOff,
  Trash2,
  RefreshCw,
  Check,
  Star,
  Settings2,
  Tag,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";

export default function ProductsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ProductsFilterValue>({
    search: "",
    category: "",
    status: "all",
    sort: "recent",
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingProduct, setEditingProduct] = useState<ProductListItem | null>(
    null,
  );
  const [initialFormState, setInitialFormState] = useState<
    ProductFormState | undefined
  >(undefined);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [offersDialogOpen, setOffersDialogOpen] = useState(false);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [colors, setColors] = useState<Color[]>([]);
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [pendingIds, setPendingIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  async function loadCategories() {
    try {
      const res = await api.get<{ items: Category[]; total: number }>(
        "/categories",
        { params: { limit: 100 } },
      );
      setCategories(res.data.items || []);
    } catch {
      // ignore for now; filters/selects will just be empty
    }
  }

  useEffect(() => {
    async function loadColors() {
      try {
        const res = await api.get<{ items: Color[]; total: number }>(
          "/colors",
          { params: { limit: 1000, _ts: Date.now() } },
        );
        setColors(res.data.items || []);
      } catch {
        // ignore; colors selector will just be empty
      }
    }

    loadCategories();
    loadColors();
    // initial load will call the top-level loadProducts
  }, []);

  // Load products (server-side pagination) — declared in component scope so callers can invoke it
  async function loadProducts() {
    try {
      setLoading(true);
      const res = await api.get<{ items: any[]; total?: number }>("/products", {
        params: { limit: 10000, _ts: Date.now() },
      });
      const items: ProductListItem[] = (res.data.items || []).map((p) => ({
        _id: p._id,
        name: p.name,
        slug: p.slug,
        basePrice: p.basePrice,
        category: p.category,
        isFeatured: p.isFeatured,
        isActive: p.isActive,
        status: p.status,
        updatedAt: p.updatedAt,
        thumbnail:
          (p.variants &&
            Array.isArray(p.variants) &&
            p.variants[0] &&
            (p.variants[0].images?.[0] || p.variants[0].imageUrls?.[0])) ||
          (p.imageUrls && p.imageUrls[0]) ||
          null,
        discount: p.discount,
      }));
      setProducts(items);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
      );
    }

    if (filters.category) {
      list = list.filter((p) => p.category === filters.category);
    }

    if (filters.status !== "all") {
      list = list.filter((p) => {
        const status =
          p.status || (p.isActive === false ? "inactive" : "active");
        return status === filters.status;
      });
    }

    if (filters.sort === "price-asc") {
      list.sort((a, b) => a.basePrice - b.basePrice);
    } else if (filters.sort === "price-desc") {
      list.sort((a, b) => b.basePrice - a.basePrice);
    } else {
      list.sort((a, b) => {
        const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bDate - aDate;
      });
    }

    return list;
  }, [products, filters]);

  const handleToggleSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((existing) => existing !== id),
    );
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? products.map((p) => p._id) : []);
  };

  const handleBulkDelete = () => {
    if (!selectedIds.length) return;
    setBulkDeleteOpen(true);
  };

  const doBulkDelete = async () => {
    if (!selectedIds.length) return;
    const ids = [...selectedIds];
    const prev = products;
    try {
      // optimistic remove
      setProducts((prevList) => prevList.filter((p) => !ids.includes(p._id)));
      // mark pending
      ids.forEach(startPending);
      // run deletions in parallel but allow individual failures
      const ops = ids.map((id) =>
        api
          .delete(`/products/${id}`, { headers: { "x-silent": "1" } })
          .catch((e) => e),
      );
      const results = await Promise.all(ops);
      const errors = results.filter(
        (r) => r && r.response && r.response.status !== 404,
      );
      if (errors.length) {
        // revert to previous state on any real error
        setProducts(prev);
        toast.error("Failed to delete some products");
      } else {
        setSelectedIds([]);
        toast.success("Selected products deleted");
      }
    } catch (err) {
      setProducts(prev);
      toast.error("Failed to delete selected products");
    } finally {
      ids.forEach(endPending);
      setBulkDeleteOpen(false);
    }
  };

  const handleBulkMarkInactive = async () => {
    if (!selectedIds.length) return;
    const prev = products;
    try {
      selectedIds.forEach(startPending);
      setProducts((prevList) =>
        prevList.map((p) =>
          selectedIds.includes(p._id) ? { ...p, isActive: false } : p,
        ),
      );
      await Promise.all(
        selectedIds.map((id) =>
          api.patch(`/products/${id}`, { isActive: false }).catch((e) => e),
        ),
      );
      toast(`Marked ${selectedIds.length} products inactive`, {
        action: {
          label: "Undo",
          onClick: async () => {
            // revert UI
            setProducts(prev);
            try {
              await Promise.all(
                selectedIds.map((id) =>
                  api
                    .patch(`/products/${id}`, { isActive: true })
                    .catch((e) => e),
                ),
              );
              toast.success("Reverted");
            } catch (e) {
              toast.error("Failed to revert");
            }
          },
        },
      });
    } catch (err) {
      setProducts(prev);
      toast.error("Failed to mark selected products inactive");
    } finally {
      selectedIds.forEach(endPending);
    }
  };

  const handleBulkMarkActive = async () => {
    if (!selectedIds.length) return;
    const prev = products;
    try {
      selectedIds.forEach(startPending);
      setProducts((prevList) =>
        prevList.map((p) =>
          selectedIds.includes(p._id) ? { ...p, isActive: true } : p,
        ),
      );
      await Promise.all(
        selectedIds.map((id) =>
          api.patch(`/products/${id}`, { isActive: true }).catch((e) => e),
        ),
      );
      toast.success("Selected products marked active");
    } catch (err) {
      setProducts(prev);
      toast.error("Failed to mark selected products active");
    } finally {
      selectedIds.forEach(endPending);
    }
  };

  const handleBulkMarkFeatured = async () => {
    if (!selectedIds.length) return;
    const prev = products;
    try {
      selectedIds.forEach(startPending);
      setProducts((prevList) =>
        prevList.map((p) =>
          selectedIds.includes(p._id) ? { ...p, isFeatured: true } : p,
        ),
      );
      await Promise.all(
        selectedIds.map((id) =>
          api.patch(`/products/${id}`, { isFeatured: true }).catch((e) => e),
        ),
      );
      toast.success("Selected products marked featured");
    } catch (err) {
      setProducts(prev);
      toast.error("Failed to mark selected products featured");
    } finally {
      selectedIds.forEach(endPending);
    }
  };

  const handleEdit = (product: ProductListItem) => {
    // Load full product details before opening form so all fields are populated
    (async () => {
      try {
        setLoading(true);
        const res = await api.get<any>(`/products/${product._id}`);
        const p = res.data;
        // Build initial form state from full product
        const initial: ProductFormState = {
          meta: {
            name: p.name || "",
            slug: p.slug || "",
            description: p.description || "",
            basePrice: p.basePrice ?? "",
            category: p.category || "",
            tags: Array.isArray(p.tags)
              ? (p.tags || []).join(", ")
              : p.tags || "",
            imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : [],
          },
          variants: Array.isArray(p.variants)
            ? p.variants.map((v: any, idx: number) => ({
                id: v.id || `variant-${p._id}-${idx}`,
                sku: v.sku || "",
                color: v.color || "",
                size: v.size || "",
                // map server-side `price` into the editor's `priceModifier` field
                priceModifier: v.price === undefined ? "" : v.price,
                imageUrls: Array.isArray(v.images)
                  ? v.images
                  : v.imageUrls || [],
                stock:
                  typeof v.stock === "number" && !Number.isNaN(v.stock)
                    ? v.stock
                    : "",
              }))
            : [],
          active: p.isActive !== undefined ? !!p.isActive : true,
          featured: p.isFeatured !== undefined ? !!p.isFeatured : false,
        };

        setEditingProduct({
          _id: p._id,
          name: p.name,
          slug: p.slug,
          basePrice: p.basePrice,
          category: p.category,
          isFeatured: p.isFeatured,
          isActive: p.isActive,
          status: p.status,
          updatedAt: p.updatedAt,
        });
        // pass initial to form via local state by storing it on window (simpler) —
        // instead, keep a new state for initial form values
        setInitialFormState(initial);
        setShowForm(true);
      } catch (err) {
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setInitialFormState(undefined);
    setShowForm(true);
  };

  const startPending = (id: number) =>
    setPendingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const endPending = (id: number) =>
    setPendingIds((prev) => prev.filter((x) => x !== id));

  const handleDelete = async (product: ProductListItem) => {
    startPending(product._id);
    const prev = products;
    try {
      // optimistic remove
      setProducts((prevList) => prevList.filter((p) => p._id !== product._id));
      await api.delete(`/products/${product._id}`, {
        headers: { "x-silent": "1" },
      });
      toast.success("Product deleted");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        // already deleted
        setProducts((prevList) =>
          prevList.filter((p) => p._id !== product._id),
        );
        toast.success("Product deleted");
      } else {
        setProducts(prev);
        toast.error(err?.message || "Failed to delete product");
      }
    } finally {
      endPending(product._id);
    }
  };

  const handleMarkInactive = async (product: ProductListItem) => {
    startPending(product._id);
    const prev = products;
    try {
      setProducts((prevList) =>
        prevList.map((p) =>
          p._id === product._id ? { ...p, isActive: false } : p,
        ),
      );
      await api.patch(`/products/${product._id}`, { isActive: false });
      toast(`${product.name} marked inactive`, {
        action: {
          label: "Undo",
          onClick: async () => {
            setProducts(prev);
            try {
              await api.patch(`/products/${product._id}`, { isActive: true });
              toast.success("Reverted");
            } catch (e) {
              toast.error("Failed to revert");
            }
          },
        },
      });
    } catch (err: any) {
      setProducts(prev);
      toast.error(err?.message || "Failed to mark inactive");
    } finally {
      endPending(product._id);
    }
  };

  const handleMarkActive = async (product: ProductListItem) => {
    startPending(product._id);
    const prev = products;
    try {
      setProducts((prevList) =>
        prevList.map((p) =>
          p._id === product._id ? { ...p, isActive: true } : p,
        ),
      );
      await api.patch(`/products/${product._id}`, { isActive: true });
      toast.success("Product marked active");
    } catch (err: any) {
      setProducts(prev);
      toast.error(err?.message || "Failed to mark active");
    } finally {
      endPending(product._id);
    }
  };

  const handleToggleFeatured = async (product: ProductListItem) => {
    startPending(product._id);
    const prev = products;
    try {
      const next = !product.isFeatured;
      setProducts((prevList) =>
        prevList.map((p) =>
          p._id === product._id ? { ...p, isFeatured: next } : p,
        ),
      );
      const res = await api.patch(`/products/${product._id}`, {
        isFeatured: next,
      });
      const updated = res.data;
      setProducts((prevList) =>
        prevList.map((p) =>
          p._id === updated._id ? { ...p, isFeatured: updated.isFeatured } : p,
        ),
      );
      toast.success(
        next ? "Product marked featured" : "Product unmarked as featured",
      );
    } catch (err: any) {
      setProducts(prev);
      toast.error(err?.message || "Failed to toggle featured");
    } finally {
      endPending(product._id);
    }
  };

  const handleSubmitForm = async (state: ProductFormState) => {
    try {
      setSaving(true);

      const { meta, variants, active, featured } = state;
      const tags = meta.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const normalizedVariants = (variants || []).map((v) => ({
        sku: v.sku,
        color: v.color,
        size: v.size,
        // `price` is the absolute variant price; fallback to product basePrice if empty
        price:
          v.priceModifier === ""
            ? Number(meta.basePrice) || 0
            : Number(v.priceModifier) || Number(meta.basePrice) || 0,
        images: Array.isArray(v.imageUrls) ? v.imageUrls : [],
        stock:
          v.stock === "" || v.stock === undefined
            ? 0
            : Math.max(0, Number(v.stock) || 0),
      }));

      const payload = {
        name: meta.name.trim(),
        slug: meta.slug.trim(),
        description: meta.description.trim(),
        basePrice: meta.basePrice === "" ? 0 : Number(meta.basePrice) || 0,
        category: Number(meta.category),
        tags,
        variants: normalizedVariants,
        isFeatured: featured,
        isActive: active,
      };

      if (editingProduct) {
        await api.patch(`/products/${editingProduct._id}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/products", payload);
        toast.success("Product created");
      }

      // Reload list so UI reflects latest data
      try {
        const res = await api.get<{ items: any[]; total: number }>(
          "/products",
          { params: { limit: 200 } },
        );
        const items: ProductListItem[] = (res.data.items || []).map((p) => ({
          _id: p._id,
          name: p.name,
          slug: p.slug,
          basePrice: p.basePrice,
          category: p.category,
          isFeatured: p.isFeatured,
          isActive: p.isActive,
          status: p.status,
          updatedAt: p.updatedAt,
        }));
        setProducts(items);
      } catch {
        // ignore here; main operation already succeeded
      }

      setShowForm(false);
      setEditingProduct(null);
      setSelectedIds([]);
      setInitialFormState(undefined);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setInitialFormState(undefined);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Products</h1>
            <p className="text-sm text-muted-foreground">
              Manage your catalog of products: create, edit, and organize items.
            </p>
          </div>
          <div className="grid grid-cols-1 md:flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setOffersDialogOpen(true)}>
              <Tag className="mr-1.5 h-4 w-4" /> Manage offers
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShippingDialogOpen(true)}>
              <Truck className="mr-1.5 h-4 w-4" /> Manage shipping
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCategoryDialogOpen(true)}>
              <Settings2 className="mr-1.5 h-4 w-4" /> Manage categories
            </Button>
            <Button type="button" size="sm" onClick={handleCreate}>
              <Plus className="mr-1.5 h-4 w-4" /> New product
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadProducts()}
              disabled={loading}>
              <RefreshCw
                className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        {showForm ? (
          <ProductForm
            initial={initialFormState}
            product={editingProduct}
            categories={categories}
            onOpenCategoryDialog={() => setCategoryDialogOpen(true)}
            colors={colors}
            onOpenColorDialog={() => setColorDialogOpen(true)}
            saving={saving}
            onSubmit={handleSubmitForm}
            onCancel={handleCancelForm}
          />
        ) : (
          <>
            <ProductFilters
              value={filters}
              onChange={setFilters}
              categories={categories}
            />
            {loading ? (
              <div className="flex items-center justify-center rounded-2xl border bg-card p-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Loading products…
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && (
                      <div className="ml-4 flex items-center gap-2">
                        {user?.role === "admin" && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={selectedIds.some((id) =>
                              pendingIds.includes(id),
                            )}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedIds.length})
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleBulkMarkInactive}
                          disabled={selectedIds.some((id) =>
                            pendingIds.includes(id),
                          )}>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Mark inactive
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleBulkMarkActive}
                          disabled={selectedIds.some((id) =>
                            pendingIds.includes(id),
                          )}>
                          <Check className="mr-2 h-4 w-4" />
                          Mark active
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleBulkMarkFeatured}
                          disabled={selectedIds.some((id) =>
                            pendingIds.includes(id),
                          )}>
                          <Star className="mr-2 h-4 w-4" />
                          Mark featured
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {products.length} products
                  </div>
                </div>
                <ProductsTable
                  products={filteredProducts}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onMarkInactive={handleMarkInactive}
                  onMarkActive={handleMarkActive}
                  onToggleFeatured={handleToggleFeatured}
                  pendingIds={pendingIds}
                  categories={categories}
                />
                <div className="mt-3 flex items-center justify-between">
                  <div />
                  <div className="text-sm text-muted-foreground">
                    {products.length} products
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <ManageCategoriesDialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          categories={categories}
          onRefresh={loadCategories}
        />
        <ManageOffersDialog
          open={offersDialogOpen}
          onOpenChange={setOffersDialogOpen}
          categories={categories}
        />
        <ShippingManagerDialog
          open={shippingDialogOpen}
          onOpenChange={setShippingDialogOpen}
        />
        <CreateColorDialog
          open={colorDialogOpen}
          onOpenChange={setColorDialogOpen}
          onCreated={(color) =>
            setColors((prev) =>
              prev.some((c) => c._id === color._id) ? prev : [...prev, color],
            )
          }
        />
        <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete selected products?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the following products? You can
                also choose to mark them inactive instead.
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {selectedIds.map((id) => {
                    const p = products.find((x) => x._id === id);
                    return <li key={id}>{p ? p.name : id}</li>;
                  })}
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  // mark inactive
                  setBulkDeleteOpen(false);
                  handleBulkMarkInactive();
                }}>
                <EyeOff className="mr-2 h-4 w-4" /> Mark inactive
              </AlertDialogAction>
              {user?.role === "admin" && (
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    doBulkDelete();
                  }}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
