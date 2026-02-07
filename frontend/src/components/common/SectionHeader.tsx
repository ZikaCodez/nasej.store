export interface SectionHeaderProps {
  title?: string;
  description?: string;
  align?: "center" | "left" | "right";
}

export default function SectionHeader({
  title = "Featured",
  description = "Curated pieces for the season.",
  align = "center",
}: SectionHeaderProps) {
  const alignment =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";
  return (
    <div className={`${alignment} max-w-2xl mx-auto`}>
      <h2 className="text-2xl font-semibold">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
