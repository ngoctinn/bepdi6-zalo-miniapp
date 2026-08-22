import { Category } from "@/types/category.types";
import { cn } from "@/utils/cn";

interface CategoryListProps extends React.HTMLAttributes<HTMLDivElement> {
  categories: Category[];
  selectedId?: number | string;
  onCategorySelect?: (category: Category) => void;
}

export default function CategoryList({
  categories,
  selectedId,
  onCategorySelect,
  ...props
}: CategoryListProps) {
  return (
    <div
      className={cn(
        "horizontal-scroll w-full min-w-0 select-none gap-2 scroll-smooth pr-4",
        props.className,
      )}
      {...props}
    >
      {categories.map((category) => (
        <button
          type="button"
          key={category.id}
          className={cn(
            "text-center text-xs font-medium",
            "flex shrink-0 items-center justify-center rounded-xl px-3.5 py-2 transition-all active:scale-95",
            "shadow-2xs whitespace-nowrap",
            String(category.id) === String(selectedId)
              ? "shadow-xs border border-primary bg-primary text-white"
              : "border border-stone-200/80 bg-white text-stone-700 hover:bg-stone-50",
          )}
          onClick={() => onCategorySelect?.(category)}
        >
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );
}
