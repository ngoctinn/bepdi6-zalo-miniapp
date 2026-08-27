import NoteInput from "@/components/common/note-input";
import { useState, useMemo, useEffect } from "react";
import QuantityStepper from "@/components/common/quantity-stepper";
import { CheckIcon, CloseIcon } from "@/components/common/vectors";
import { useProduct } from "@/services/product/product.queries";
import { useCartStore } from "@/stores/cart.store";
import { Button, Sheet, Spinner, Text } from "zmp-ui";
import { copy } from "@/constants/copy";
import { formatCurrency } from "@/utils/format";
import { Option, OptionGroup } from "@/types/product.types";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/common/badge";
import defaultProductImg from "@/static/logo.png";

type SelectedOptionsState = {
  [groupId: number]: number[];
};

interface ProductDetailSheetProps {
  productId: string | number | null;
  visible: boolean;
  onClose: () => void;
  editCartItemId?: string | null;
}

export default function ProductDetailSheet({
  productId,
  visible,
  onClose,
  editCartItemId,
}: ProductDetailSheetProps) {
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

  // Reset/Khởi tạo state khi mở sản phẩm
  useEffect(() => {
    if (!visible || !product) return;

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
  }, [visible, product, isEditMode, editCartItemId, items]);

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

  const unitPrice = Number(product?.price || 0) + optionsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    if (!product) return;

    if (product.option_groups) {
      for (const group of product.option_groups) {
        const count = (selectedOptions[group.id] || []).length;
        if (group.is_required && count === 0) {
          setValidationError(`Vui lòng chọn tùy chọn trong "${group.name}"`);
          return;
        }
        if (group.min_select > 0 && count < group.min_select) {
          setValidationError(
            `Vui lòng chọn tối thiểu ${group.min_select} tùy chọn trong "${group.name}"`,
          );
          return;
        }
      }
    }

    const cartItemPayload = {
      product_id: product.id,
      product_name: product.name,
      product_image:
        product.effective_image_url || product.image_url || product.image || "",
      unit_price: Number(product.price || 0),
      quantity,
      note: note.trim() || undefined,
      options: selectedOptionsList,
    };

    if (isEditMode && editCartItemId) {
      updateCartItem(editCartItemId, cartItemPayload);
    } else {
      addToCart(cartItemPayload);
    }

    onClose();
  };

  const imageUrl =
    product?.effective_image_url ||
    product?.image_url ||
    product?.image ||
    defaultProductImg;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      autoHeight={false}
      mask
      handler={true}
    >
      <div className="relative flex h-[80vh] max-h-[85vh] w-full flex-col bg-background">
        {/* Close (X) button at top-left matching cart-sheet */}
        <div className="relative flex shrink-0 items-center px-4 py-2.5">
          <Button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 p-0 text-neutral700 transition-transform hover:bg-black/10 active:scale-90"
            type="neutral"
            size="small"
          >
            <CloseIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Sheet Scrollable Body (Cardless seamless layout) */}
        <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6 pt-1">
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
              {/* Product Hero Image */}
              <div className="shadow-xs relative aspect-video w-full overflow-hidden rounded-2xl bg-amber-100/40 ring-1 ring-black/5">
                <img
                  draggable={false}
                  className="h-full w-full object-cover"
                  src={imageUrl}
                  alt={product.name}
                />
              </div>

              {/* Product Info (Direct text, no card) */}
              <div className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-bold leading-snug text-neutral900">
                    {product.name}
                  </h2>
                  <div className="whitespace-nowrap text-base font-normal text-black">
                    {formatCurrency(product.price)}
                    <span className="ml-0.5 text-xs text-neutral500">đ</span>
                  </div>
                </div>
                {product.description && (
                  <p className="mt-1 text-xs leading-relaxed text-neutral600">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Option Groups (Seamless section with dividers, no cards) */}
              {product.option_groups && product.option_groups.length > 0 && (
                <div className="space-y-4 border-t border-black/5 pt-2">
                  {product.option_groups.map((group) => {
                    const currentGroupSelections =
                      selectedOptions[group.id] || [];

                    return (
                      <div key={group.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-neutral900">
                              {group.name}
                            </span>
                            {group.is_required && (
                              <Badge variant="error" size="small">
                                {copy.product.required || "Bắt buộc"}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xxsmall text-neutral500">
                            {group.max_select === 1
                              ? "Chọn 1"
                              : `Tối đa ${group.max_select}`}
                          </span>
                        </div>

                        <div className="flex flex-col divide-y divide-black/5">
                          {group.options?.map((option) => {
                            const isSelected = currentGroupSelections.includes(
                              option.id,
                            );
                            const isUnavailable = option.status === "INACTIVE";

                            return (
                              <div
                                key={option.id}
                                onClick={() =>
                                  !isUnavailable &&
                                  handleOptionToggle(group, option)
                                }
                                className={cn(
                                  "flex cursor-pointer items-center justify-between py-2.5 transition-colors",
                                  isUnavailable
                                    ? "cursor-not-allowed opacity-40"
                                    : "active:bg-black/[0.02]",
                                )}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={cn(
                                      "flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                                      isSelected
                                        ? "border-primary bg-primary text-white"
                                        : "border-stone-300 bg-transparent",
                                    )}
                                  >
                                    {isSelected && (
                                      <CheckIcon className="h-3 w-3" />
                                    )}
                                  </div>
                                  <span className="text-sm font-normal text-neutral900">
                                    {option.name}
                                  </span>
                                </div>

                                <div className="text-xs font-normal text-black">
                                  {Number(option.price) > 0 ? (
                                    `+${formatCurrency(option.price)}đ`
                                  ) : (
                                    <span className="font-normal text-neutral400">
                                      Miễn phí
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Note Input (Seamless direct section) */}
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

        {/* Bottom Action Bar: Stepper + Add to cart with price inside button (Standard Food App UX) */}
        {product && (
          <div className="shrink-0 border-t border-black/5 bg-background/95 px-4 py-3 pb-[max(16px,calc(var(--app-safe-area-bottom,0px)+12px))] shadow-lg backdrop-blur-md">
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
    </Sheet>
  );
}
