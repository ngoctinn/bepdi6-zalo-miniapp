import { useRef, useEffect } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll active tab into view horizontally without touching window/page scroll
  useEffect(() => {
    if (!selectedId || !containerRef.current) return;
    const activeButton = containerRef.current.querySelector(
      `[data-category-id="${selectedId}"]`,
    ) as HTMLElement;

    if (activeButton && containerRef.current) {
      const container = containerRef.current;
      const buttonLeft = activeButton.offsetLeft;
      const buttonWidth = activeButton.offsetWidth;
      const containerWidth = container.offsetWidth;
      const targetScrollLeft =
        buttonLeft - containerWidth / 2 + buttonWidth / 2;

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth",
      });
    }
  }, [selectedId]);

  return (
    <div
      ref={containerRef}
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
            data-category-id={category.id}
            className={cn(
              "flex min-h-[36px] shrink-0 items-center justify-center rounded-xl border px-4 py-2 text-xs font-semibold transition-colors duration-150 active:scale-[0.98]",
              "outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
              "select-none whitespace-nowrap",
              isSelected
                ? "border-primary/30 bg-olive50/80 text-olive900"
                : "border-black/[0.06] bg-stone-50/70 text-neutral700 hover:border-black/10 hover:bg-stone-50 hover:text-olive900",
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
