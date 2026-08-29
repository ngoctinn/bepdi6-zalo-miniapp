import NoteInput from "@/components/common/note-input";
import { useState, useMemo, useEffect } from "react";
import QuantityStepper from "@/components/common/quantity-stepper";
import { CheckIcon } from "@/components/common/vectors";
import { useProduct } from "@/services/product/product.queries";
import { useCartStore } from "@/stores/cart.store";
import { Spinner, Text } from "zmp-ui";
import { copy } from "@/constants/copy";
import { formatCurrency } from "@/utils/format";
import { Option, OptionGroup } from "@/types/product.types";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/common/badge";
import defaultProductImg from "@/static/logo.png";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

type SelectedOptionsState = {
  [groupId: number]: number[];
};

export default function ProductDetailPage() {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editCartItemId = searchParams.get("editCartItemId");
  const isEditMode = !!editCartItemId;

  const {
    data: product,
    isLoading,
    isError,
  } = useProduct(productId ? String(productId) : undefined);
  const { addToCart, updateCartItem, items } = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptionsState>(
    {},
  );
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;

    if (isEditMode && editCartItemId) {
      const cartItem = items.find((item) => item.id === editCartItemId);
      if (cartItem) {
        setQuantity(cartItem.quantity);
        setNote(cartItem.note || "");
        const loadedSelections: SelectedOptionsState = {};
        cartItem.options?.forEach((opt) => {
          product.option_groups?.forEach((group) => {
            if (group.options?.some((o) => o.id === opt.option_id)) {
              if (!loadedSelections[group.id]) {
                loadedSelections[group.id] = [];
              }
              loadedSelections[group.id].push(opt.option_id);
            }
          });
        });
        setSelectedOptions(loadedSelections);
        return;
      }
    }

    setQuantity(1);
    setNote("");
    setValidationError(null);

    const initialSelections: SelectedOptionsState = {};
    if (product.option_groups) {
      product.option_groups.forEach((group) => {
        if (
          group.is_required &&
          group.max_select === 1 &&
          group.options?.length > 0
        ) {
          const availableOpt = group.options.find(
            (o) => o.status === "AVAILABLE",
          );
          if (availableOpt) {
            initialSelections[group.id] = [availableOpt.id];
          }
        } else {
          initialSelections[group.id] = [];
        }
      });
    }
    setSelectedOptions(initialSelections);
  }, [product, isEditMode, editCartItemId, items]);

  const handleOptionToggle = (group: OptionGroup, option: Option) => {
    if (option.status === "INACTIVE") return;

    setSelectedOptions((prev) => {
      const currentSelected = prev[group.id] || [];

      if (group.max_select === 1) {
        return {
          ...prev,
          [group.id]: [option.id],
        };
      } else {
        const isAlreadySelected = currentSelected.includes(option.id);
        if (isAlreadySelected) {
          return {
            ...prev,
            [group.id]: currentSelected.filter((optId) => optId !== option.id),
          };
        } else {
          if (group.max_select && currentSelected.length >= group.max_select) {
            return prev;
          }
          return {
            ...prev,
            [group.id]: [...currentSelected, option.id],
          };
        }
      }
    });
    setValidationError(null);
  };

  const { optionsTotal, selectedOptionsList } = useMemo(() => {
    if (!product || !product.option_groups) {
      return { optionsTotal: 0, selectedOptionsList: [] };
    }

    let total = 0;
    const selectedList: Array<{
      option_id: number;
      option_name: string;
      price: number;
      quantity: number;
    }> = [];

    product.option_groups.forEach((group) => {
      const selectedIds = selectedOptions[group.id] || [];
      group.options?.forEach((opt) => {
        if (selectedIds.includes(opt.id)) {
          total += Number(opt.price || 0);
          selectedList.push({
            option_id: opt.id,
            option_name: opt.name,
            price: Number(opt.price || 0),
            quantity: 1,
          });
        }
      });
    });

    return { optionsTotal: total, selectedOptionsList: selectedList };
  }, [product, selectedOptions]);

  const baseUnitPrice =
    product?.has_promotion && product.effective_price != null
      ? Number(product.effective_price)
      : Number(product?.price || 0);

  const unitPrice = baseUnitPrice + optionsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    if (!product) return;

    if (product.option_groups) {
      for (const group of product.option_groups) {
        const count = (selectedOptions[group.id] || []).length;
        if (group.is_required && count === 0) {
          setValidationError(`Vui lòng chọn tùy chọn trong "${group.name}"`);
          const el = document.getElementById(`option-group-${group.id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return;
        }
        if (group.min_select > 0 && count < group.min_select) {
          setValidationError(
            `Vui lòng chọn tối thiểu ${group.min_select} tùy chọn trong "${group.name}"`,
          );
          const el = document.getElementById(`option-group-${group.id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return;
        }
      }
    }

    const cartItemPayload = {
      product_id: product.id,
      product_name: product.name,
      product_image:
        product.effective_image_url || product.image_url || product.image || "",
      unit_price: baseUnitPrice,
      quantity,
      note: note.trim() || undefined,
      options: selectedOptionsList,
    };

    if (isEditMode && editCartItemId) {
      updateCartItem(editCartItemId, cartItemPayload);
      navigate("/cart", { replace: true });
    } else {
      addToCart(cartItemPayload);
      navigate(-1);
    }
  };

  const imageUrl =
    product?.effective_image_url ||
    product?.image_url ||
    product?.image ||
    defaultProductImg;

  return (
    <div className="relative flex min-h-full w-full flex-col bg-background">
      <div className="flex-1 space-y-4 px-4 pb-[120px] pt-4">
        {!product && isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner />
            <Text size="xSmall" className="mt-2 text-neutral500">
              Đang tải chi tiết món...
            </Text>
          </div>
        ) : isError || !product ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-neutral500">
            <p>Không tìm thấy thông tin món ăn này.</p>
          </div>
        ) : (
          <>
            {/* Hero Image */}
            <div className="shadow-xs relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-amber-100/40 ring-1 ring-black/5">
              <img
                draggable={false}
                className="h-full w-full object-cover"
                src={imageUrl}
                alt={product.name}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
              {product.has_promotion &&
                product.discount_percent != null &&
                product.discount_percent > 0 && (
                  <div className="shadow-xs backdrop-blur-xs absolute left-3 top-3 z-10 flex items-center rounded-md border border-amber-300/60 bg-amber-100/95 px-2 py-0.5">
                    <span className="text-xs font-bold leading-none tracking-tight text-amber-900">
                      -{product.discount_percent}%
                    </span>
                  </div>
                )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-bold leading-snug text-neutral900">
                  {product.name}
                </h2>
                <div className="flex shrink-0 flex-col items-end">
                  {product.has_promotion && product.effective_price != null ? (
                    <>
                      <div className="text-lg font-extrabold leading-tight text-amber-800">
                        {formatCurrency(product.effective_price)}
                        <span className="ml-0.5 text-sm font-semibold text-amber-800/80">
                          đ
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-xs font-normal text-neutral400 line-through">
                          {formatCurrency(product.price)}đ
                        </span>
                        <span className="rounded-md border border-amber-300/60 bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          -{product.discount_percent}%
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-lg font-extrabold leading-tight text-neutral900">
                      {formatCurrency(product.price)}
                      <span className="ml-0.5 text-sm font-medium text-neutral500">
                        đ
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {product.description && (
                <p className="text-xs leading-relaxed text-neutral600">
                  {product.description}
                </p>
              )}
            </div>

            {/* Option Groups */}
            {product.option_groups && product.option_groups.length > 0 && (
              <div className="space-y-5 border-t border-black/5 pt-3">
                {product.option_groups.map((group) => {
                  const currentGroupSelections =
                    selectedOptions[group.id] || [];
                  return (
                    <div
                      key={group.id}
                      id={`option-group-${group.id}`}
                      className="scroll-mt-4 space-y-2.5"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold text-neutral900">
                            {group.name}
                          </span>
                          {group.is_required ? (
                            <Badge variant="error" size="small">
                              {copy.product.required || "Bắt buộc"}
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="small">
                              Tùy chọn
                            </Badge>
                          )}
                        </div>
                        <span className="shrink-0 text-[10px] font-medium text-neutral400">
                          {group.max_select === 1
                            ? "Chọn 1"
                            : currentGroupSelections.length > 0
                              ? `Đã chọn ${currentGroupSelections.length}/${group.max_select}`
                              : `Tối đa ${group.max_select}`}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {group.options?.map((option) => {
                          const isSelected = currentGroupSelections.includes(
                            option.id,
                          );
                          const isUnavailable = option.status === "INACTIVE";
                          const hasExtraPrice = Number(option.price) > 0;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              disabled={isUnavailable}
                              onClick={() =>
                                !isUnavailable &&
                                handleOptionToggle(group, option)
                              }
                              className={cn(
                                "flex min-h-[44px] w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-all duration-150 active:scale-[0.99]",
                                isSelected
                                  ? "shadow-xs border border-primary/30 bg-olive50/80 font-semibold text-primaryDark"
                                  : "border border-black/[0.06] bg-white font-medium text-neutral800 hover:border-black/10 active:bg-black/[0.02]",
                                isUnavailable &&
                                  "cursor-not-allowed opacity-40",
                              )}
                            >
                              <div className="flex flex-col items-start gap-0.5">
                                <span
                                  className={cn(
                                    "text-xs leading-snug",
                                    isSelected
                                      ? "font-semibold text-olive900"
                                      : "font-medium text-neutral800",
                                  )}
                                >
                                  {option.name}
                                </span>
                                {hasExtraPrice && (
                                  <span
                                    className={cn(
                                      "text-[11px]",
                                      isSelected
                                        ? "font-medium text-primary"
                                        : "text-neutral500",
                                    )}
                                  >
                                    +{formatCurrency(option.price)}đ
                                  </span>
                                )}
                              </div>
                              <span
                                className={cn(
                                  "ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-150",
                                  isSelected
                                    ? "shadow-xs border border-primary/40 bg-primary text-white"
                                    : "border border-stone-300 bg-transparent",
                                )}
                              >
                                {isSelected && (
                                  <CheckIcon className="h-3 w-3 text-white" />
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Note Input */}
            <div className="border-t border-black/5 pt-2">
              <span className="mb-1.5 block text-xs font-bold text-neutral800">
                Ghi chú cho quán
              </span>
              <NoteInput
                value={note}
                onChange={setNote}
                placeholder="Ví dụ: ít ngọt, thêm đá, không hành..."
              />
            </div>
          </>
        )}
      </div>

      {/* Bottom Action Bar */}
      {product && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/5 bg-background/95 px-4 py-3 pb-[max(16px,calc(var(--app-safe-area-bottom,0px)+12px))] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md">
          {validationError && (
            <div className="mb-2 rounded-xl border border-red-200 bg-red-500/10 py-1.5 text-center text-xs font-medium text-red-600">
              ⚠️ {validationError}
            </div>
          )}
          <div className="flex items-center gap-3">
            <QuantityStepper
              value={quantity}
              onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
              onIncrease={() => setQuantity(quantity + 1)}
              minValue={1}
              variant="rounded"
            />
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex flex-1 items-center justify-between rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-primaryDark active:scale-[0.98]"
            >
              <span>
                {isEditMode ? copy.common.updateCart : copy.common.addToCart}
              </span>
              <span>{formatCurrency(totalPrice)}đ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
