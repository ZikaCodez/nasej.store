import type { ReactNode } from "react";

type StatsCardProps = {
  title: string;
  value: number | string;
  icon: ReactNode;
  description?: string;
};

export default function StatsCard({
  title,
  value,
  icon,
  description,
}: StatsCardProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-background p-4">
      <div className="space-y-1.5">
        <div className="text-sm font-medium uppercase tracking-wide text-primary">
          {title}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground/80">{description}</p>
        )}
        <div className="text-2xl font-semibold">{value}</div>
      </div>
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/60 text-foreground">
        {icon}
      </div>
    </div>
  );
}
