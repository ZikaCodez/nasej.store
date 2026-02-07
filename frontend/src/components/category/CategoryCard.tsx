// no-op import removed to satisfy lint rules
import { MagicCard } from "@/components/ui/magic-card";

export type CategoryCardProps = {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  onClick?: () => void;
  loading?: boolean;
};

export default function CategoryCard({
  name,
  description,
  image,
  onClick,
  loading,
}: CategoryCardProps) {
  if (loading) {
    return (
      <div
        aria-hidden
        className="animate-pulse relative overflow-hidden rounded-2xl border p-5 md:p-6 text-left bg-transparent">
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-4" />
        <div className="mt-4 h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    );
  }
  return (
    <MagicCard className="rounded-2xl"
      gradientColor="#3B82F6"
      gradientFrom="#93C5FD"
      gradientTo="#1E40AF"
      gradientOpacity={0.12}
      >
      <button
        onClick={onClick}
        aria-label={`Shop ${name}`}
        className="relative overflow-hidden rounded-2xl border p-5 md:p-6 text-left hover:shadow-lg transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background w-full">
        {/* Optional image as subtle background with hover zoom */}
        {image && (
          <img
            src={image}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover opacity-20 group-hover:opacity-25 transition-opacity duration-300 scale-100 group-hover:scale-105"
            loading="lazy"
          />
        )}

        {/* Content */}
        <div className="relative">
          <div className="text-xs font-medium text-muted-foreground">
            Category
          </div>
          <div className="mt-0.5 text-lg md:text-xl font-semibold tracking-tight">
            {name}
          </div>
          {description && (
            <div className="mt-1 text-xs md:text-sm text-muted-foreground line-clamp-2">
              {description}
            </div>
          )}
          <div className="mt-4 inline-flex items-center gap-1 text-xs md:text-sm font-medium text-primary">
            <span className="underline decoration-primary/30 underline-offset-2 group-hover:decoration-primary">
              Shop now
            </span>
            <span aria-hidden>→</span>
          </div>
        </div>
      </button>
    </MagicCard>
  );
}
