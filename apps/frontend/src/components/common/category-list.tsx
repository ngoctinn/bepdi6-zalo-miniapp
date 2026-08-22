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
        "horizontal-scroll w-full min-w-0 select-none items-center gap-2 scroll-smooth py-1 pr-2",
        props.className,
      )}
      {...props}
    >
      {categories.map((category) => {
        const isSelected = String(category.id) === String(selectedId);
        return (
          <button
            type="button"
            key={category.id}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full px-4 py-1.5 text-xs transition-all active:scale-95",
              "select-none whitespace-nowrap",
              isSelected
                ? "shadow-xs border border-green600 bg-emerald-500/15 font-bold text-green800"
                : "border border-black/5 bg-black/[0.03] font-medium text-stone-600 hover:bg-emerald-500/10 hover:text-green800",
            )}
            onClick={() => onCategorySelect?.(category)}
          >
            <span>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}
