import { ProductFeature } from "@/types/product.types";
import { cn } from "@/utils/cn";

interface ProductFeatureListProps {
  features: ProductFeature[];
  selectedId: string | null;
  onFeatureSelect: (feature: ProductFeature) => void;
}

export default function ProductFeatureList({
  features,
  selectedId,
  onFeatureSelect,
}: ProductFeatureListProps) {
  return (
    <div className="no-scrollbar overflow-x-auto">
      <div className="flex min-w-[160vw] flex-wrap gap-2">
        {features.map((feature) => (
          <div
            key={feature.id}
            onClick={() => onFeatureSelect(feature)}
            className={cn(
              "cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium",
              feature.id === selectedId
                ? "border border-primary bg-primary/15 font-semibold text-primaryDark"
                : "border border-black/5 bg-neutral100 font-medium text-neutral600",
            )}
          >
            {feature.name}
          </div>
        ))}
      </div>
    </div>
  );
}
