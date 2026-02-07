import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type ProductsFilterValue = {
  search: string;
  category: number | "";
  status: "all" | "active" | "inactive" | "archived";
  sort: "recent" | "price-asc" | "price-desc";
};

export type ProductFiltersProps = {
  value: ProductsFilterValue;
  onChange?: (value: ProductsFilterValue) => void;
  categories?: import("@/types/category").Category[];
};

export default function ProductFilters({
  value,
  onChange,
  categories,
}: ProductFiltersProps) {
  const emit = (patch: Partial<ProductsFilterValue>) => {
    onChange?.({ ...value, ...patch });
  };

  const reset = () => {
    onChange?.({ search: "", category: "", status: "all", sort: "recent" });
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search by name or slug"
          value={value.search}
          onChange={(e) => emit({ search: e.target.value })}
          className="sm:max-w-xs"
        />
        <Select
          value={value.category === "" ? "all" : String(value.category)}
          onValueChange={(val) =>
            emit({ category: val === "all" ? "" : Number(val) })
          }>
          <SelectTrigger className="w-full md:w-max">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat._id} value={String(cat._id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={value.status}
          onValueChange={(val: ProductsFilterValue["status"]) =>
            emit({ status: val })
          }>
          <SelectTrigger className="w-full md:w-max">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={value.sort}
          onValueChange={(val: ProductsFilterValue["sort"]) =>
            emit({ sort: val })
          }>
          <SelectTrigger className="w-full md:w-max">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Newest first</SelectItem>
            <SelectItem value="price-asc">Price: low to high</SelectItem>
            <SelectItem value="price-desc">Price: high to low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="button" variant="destructive" size="sm" onClick={reset}>
        Reset Filters
      </Button>
    </div>
  );
}
