import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeftCircle } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/shop");
    }
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="inline-flex items-center justify-center rounded-full bg-accent/60 p-4">
        <ShoppingBag className="h-8 w-8" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t find that page. Explore the collection or go back to
          where you were.
        </p>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          className="font-semibold"
          size="sm"
          onClick={() => navigate("/shop")}>
          <ShoppingBag className="mr-1.5 h-4 w-4" />
          Explore the shop
        </Button>
        <Button variant="outline" size="sm" onClick={goBack}>
          <ArrowLeftCircle className="mr-1.5 h-4 w-4" />
          Go back
        </Button>
      </div>
    </div>
  );
}
