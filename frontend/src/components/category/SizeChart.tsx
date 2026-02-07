import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PencilRuler } from "lucide-react";
import api from "@/lib/api";

interface SizeChartProps {
  categoryId?: number | string;
  label?: string;
  disabled?: boolean;
}

export default function SizeChart({
  categoryId,
  label = "View Size Chart",
  disabled = false,
}: SizeChartProps) {
  const [open, setOpen] = useState(false);
  const [sizeChartUrl, setSizeChartUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setSizeChartUrl(null);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get(`/categories/${categoryId}`, { headers: { "x-silent": "1" } })
      .then((res) => {
        const url = res.data?.sizeChart || null;
        setSizeChartUrl(url);
      })
      .catch(() => {
        setError("Failed to load size chart");
        setSizeChartUrl(null);
      })
      .finally(() => setLoading(false));
  }, [categoryId]);

  // Show disabled button if no chart
  if (!categoryId || loading) {
    return (
      <Button size="sm" variant="outline" disabled>
        <PencilRuler className="h-4 w-4" />{" "}
        {loading ? "Loading..." : "No Size Chart"}
      </Button>
    );
  }

  if (!sizeChartUrl) {
    return (
      <Button size="sm" variant="outline" disabled>
        <PencilRuler className="h-4 w-4" /> No Size Chart
      </Button>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(true)}>
        <PencilRuler className="h-4 w-4" /> {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Size Chart</DialogTitle>
            <DialogDescription>
              Reference size chart for this category.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <img
              src={sizeChartUrl}
              alt="Size chart"
              className="w-full h-auto max-h-[70vh] object-contain"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
