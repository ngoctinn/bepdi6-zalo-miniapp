import NoteInput from "@/components/common/note-input";
import { useState, useMemo, useEffect } from "react";
import QuantityStepper from "@/components/common/quantity-stepper";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackIcon, CheckIcon } from "@/components/common/vectors";
import { useProduct } from "@/services/product/product.queries";
import { useCartStore } from "@/stores/cart.store";
import { Button, Spinner, Text } from "zmp-ui";
import { copy } from "@/constants/copy";
import { formatCurrency } from "@/utils/format";
import { Option, OptionGroup } from "@/types/product.types";
import { cn } from "@/utils/cn";

// Lưu trữ các optionId đã chọn theo từng OptionGroupId
type SelectedOptionsState = {
  [groupId: number]: number[]; // array of option IDs
};

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const editCartItemId = searchParams.get("editCartItemId");
  const isEditMode = !!editCartItemId;

  const { data: product, isLoading, isError } = useProduct(id);
  const { addToCart, updateCartItem, items } = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptionsState>(
    {},
  );
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Khởi tạo mặc định cho các nhóm bắt buộc (chọn option đầu tiên nếu max_select = 1)
  useEffect(() => {
    if (!product || !product.option_groups) return;

    if (isEditMode && editCartItemId) {
      const cartItem = items.find((item) => item.id === editCartItemId);
      if (cartItem) {
        setQuantity(cartItem.quantity);
        setNote(cartItem.note || "");
        const loadedSelections: SelectedOptionsState = {};
        cartItem.options?.forEach((opt) => {
          // Tìm group chứa option này
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

    // Default selections cho new item
    const initialSelections: SelectedOptionsState = {};
    product.option_groups.forEach((group) => {
      if (
        group.is_required &&
        group.max_select === 1 &&
        group.options?.length > 0
      ) {
        // Mặc định chọn option đầu tiên còn hàng
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
    setSelectedOptions(initialSelections);
  }, [product, isEditMode, editCartItemId, items]);

  const handleOptionToggle = (group: OptionGroup, option: Option) => {
    if (option.status === "INACTIVE") return;

    setSelectedOptions((prev) => {
      const currentSelected = prev[group.id] || [];

      if (group.max_select === 1) {
        // Single select (Radio)
        return {
          ...prev,
          [group.id]: [option.id],
        };
      } else {
        // Multi select (Checkbox)
        const isAlreadySelected = currentSelected.includes(option.id);
        if (isAlreadySelected) {
          return {
            ...prev,
            [group.id]: currentSelected.filter((optId) => optId !== option.id),
          };
        } else {
          if (group.max_select && currentSelected.length >= group.max_select) {
            return prev; // Đã đạt số lượng tối đa
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

  // Tính toán tổng tiền
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

    // Kiểm tra validation các nhóm bắt buộc
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

    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Spinner />
          <Text size="xSmall" className="mt-2 text-text-tertiary">
            {copy.product.loading}
          </Text>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Text size="xSmall" className="text-text-tertiary">
          {copy.product.notFound}
        </Text>
        <Button onClick={() => navigate(-1)} size="small">
          Quay lại
        </Button>
      </div>
    );
  }

  const imageUrl =
    product.effective_image_url ||
    product.image_url ||
    product.image ||
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80";

  return (
    <div className="relative flex h-full flex-col bg-background">
      <div className="no-scrollbar flex-1 overflow-y-auto pb-44">
        {/* Header Image */}
        <div className="relative left-0 top-0">
          <img
            draggable={false}
            className="h-[280px] w-full object-cover"
            src={imageUrl}
            alt={product.name}
          />
          <div className="absolute left-0 top-0 z-10 flex h-14 w-full items-center gap-2 px-4 py-2">
            <Button
              className="backdrop-blur-xs flex h-9 w-9 items-center justify-center rounded-full bg-white/80 p-0 text-black shadow-md active:bg-white"
              type="neutral"
              size="small"
              onClick={() => navigate(-1)}
            >
              <BackIcon className="text-neutral900" />
            </Button>
          </div>
          <div className="absolute inset-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
        </div>

        {/* Product Basic Info */}
        <div className="bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-bold leading-snug text-neutral900">
              {product.name}
            </h1>
            <div className="whitespace-nowrap text-lg font-bold text-primary">
              {formatCurrency(product.price)}
              <span className="ml-0.5 text-xs font-normal">đ</span>
            </div>
          </div>
          {product.description && (
            <div className="mt-2 text-xs leading-relaxed text-neutral500">
              {product.description}
            </div>
          )}
        </div>

        {/* Option Groups (Nhóm tùy chọn / Topping) */}
        {product.option_groups && product.option_groups.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {product.option_groups.map((group) => {
              const currentGroupSelections = selectedOptions[group.id] || [];

              return (
                <div key={group.id} className="bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-neutral900">
                        {group.name}
                      </span>
                      {group.is_required && (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-xxxsmall font-semibold text-red-600">
                          Bắt buộc
                        </span>
                      )}
                    </div>
                    <span className="text-xxsmall text-neutral400">
                      {group.max_select === 1
                        ? "Chọn 1"
                        : `Tối đa ${group.max_select}`}
                    </span>
                  </div>

                  <div className="flex flex-col divide-y divide-neutral100">
                    {group.options?.map((option) => {
                      const isSelected = currentGroupSelections.includes(
                        option.id,
                      );
                      const isUnavailable = option.status === "INACTIVE";

                      return (
                        <div
                          key={option.id}
                          onClick={() =>
                            !isUnavailable && handleOptionToggle(group, option)
                          }
                          className={cn(
                            "flex cursor-pointer items-center justify-between py-2.5 transition-colors",
                            isUnavailable
                              ? "cursor-not-allowed opacity-40"
                              : "active:bg-neutral50",
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                                isSelected
                                  ? "border-primary bg-primary text-white"
                                  : "border-neutral300 bg-white",
                              )}
                            >
                              {isSelected && <CheckIcon className="h-3 w-3" />}
                            </div>
                            <span className="text-sm font-medium text-neutral800">
                              {option.name}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-neutral600">
                            {Number(option.price) > 0 ? (
                              `+${formatCurrency(option.price)} đ`
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

        {/* Note Input */}
        <div className="mt-2 bg-white p-4">
          <NoteInput
            value={note}
            onChange={setNote}
            placeholder="Ghi chú cho quán (ví dụ: ít ngọt, không hành...)"
          />
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral200 bg-white px-4 py-3 shadow-lg">
        {validationError && (
          <div className="mb-2 rounded-md bg-red-50 py-1.5 text-center text-xs font-medium text-red-600">
            ⚠️ {validationError}
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <Text className="text-xs text-neutral500">Tạm tính</Text>
          <div className="text-base font-bold text-primary">
            {formatCurrency(totalPrice)}
            <span className="ml-0.5 text-xs font-medium">đ</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <QuantityStepper
            value={quantity}
            onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
            onIncrease={() => setQuantity(quantity + 1)}
            minValue={1}
            variant="rounded"
          />
          <Button
            onClick={handleAddToCart}
            className="active:scale-98 flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md"
          >
            {isEditMode ? copy.common.updateCart : copy.common.addToCart} •{" "}
            {formatCurrency(totalPrice)}đ
          </Button>
        </div>
      </div>
    </div>
  );
}
