import React, { useState } from "react";
import { Button, Sheet, Text } from "zmp-ui";
import { CloseIcon, TrashIcon } from "./vectors";
import CartItemCard from "./cart-item-card";
import SwipeableItem from "./swipeable-item";
import ConfirmModal from "./confirm-modal";
import { CartItem } from "@/types/cart.types";
import { copy } from "@/constants/copy";
import { formatCurrency } from "@/utils/format";
import { calculateCartTotal } from "@/utils/cart";

interface CartSheetProps {
  visible: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onConfirm: () => void;
  onEdit?: (itemId: string) => void;
}

export default function CartSheet({
  visible,
  onClose,
  items,
  onUpdateQuantity,
  onConfirm,
  onEdit,
}: CartSheetProps) {
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const handleEdit = (itemId: string) => {
    if (onEdit) {
      onEdit(itemId);
    }
  };

  const promptDeleteItem = (itemId: string) => {
    const target = items.find((it) => it.id === itemId);
    if (target) {
      setItemToDelete(target);
    }
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      onUpdateQuantity(itemToDelete.id, 0);
      setItemToDelete(null);
    }
  };

  const confirmClearAll = () => {
    items.forEach((item) => onUpdateQuantity(item.id, 0));
    setShowClearConfirm(false);
  };

  const totalAmount = calculateCartTotal(items);

  return (
    <>
      <Sheet autoHeight visible={visible} onClose={onClose}>
        <div className="relative flex max-h-[80vh] min-h-[40vh] w-full flex-col bg-background">
          {/* Header */}
          <div className="relative flex shrink-0 items-center justify-between border-b border-black/5 px-4 py-3">
            <Button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center bg-transparent active:bg-transparent"
              type="neutral"
              size="small"
            >
              <CloseIcon />
            </Button>
            <div className="flex-1 py-1 text-center text-base font-bold text-neutral-900">
              {copy.common.updateCart}
            </div>
            {items.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1 text-xs font-semibold text-danger active:opacity-75"
              >
                <TrashIcon className="h-4 w-4" />
                <span>Xóa hết</span>
              </button>
            ) : (
              <div className="w-8" />
            )}
          </div>

          {/* Scrollable list items */}
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-transparent p-3 pb-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-16">
                <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-neutral100">
                  <svg
                    className="h-16 w-16 text-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <h3 className="mb-1 text-base font-bold text-neutral-900">
                  {copy.cart.empty}
                </h3>
                <p className="max-w-[220px] text-center text-xs text-neutral-500">
                  {copy.cart.emptyHint}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <div className="px-1 text-xxsmall font-medium text-neutral400">
                  💡 Vuốt sang trái trên món ăn để xóa nhanh
                </div>
                {items.map((item) => (
                  <SwipeableItem
                    key={item.id}
                    onDelete={() => promptDeleteItem(item.id)}
                    deleteLabel="Xóa"
                  >
                    <CartItemCard
                      item={item}
                      variant="editable"
                      onUpdateQuantity={onUpdateQuantity}
                      onEdit={handleEdit}
                      onDelete={promptDeleteItem}
                    />
                  </SwipeableItem>
                ))}
              </div>
            )}
          </div>

          {/* Fixed bottom action bar */}
          {items.length > 0 && (
            <div className="shrink-0 border-t border-black/5 bg-background/95 px-4 py-3 pb-[max(12px,calc(var(--zaui-safe-area-inset-bottom,0px)+12px))] shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex flex-1 items-center justify-between rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-primaryDark active:scale-[0.98]"
                >
                  <span>Thanh toán</span>
                  <span>{formatCurrency(totalAmount)}đ</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Sheet>

      {/* Confirmation Dialog: Xóa 1 món */}
      <ConfirmModal
        visible={Boolean(itemToDelete)}
        title="Xóa món khỏi giỏ hàng?"
        description={
          itemToDelete ? (
            <span>
              Bạn có chắc chắn muốn bỏ món{" "}
              <strong className="text-neutral900">
                "{itemToDelete.product_name}"
              </strong>{" "}
              ra khỏi giỏ hàng không?
            </span>
          ) : undefined
        }
        confirmText="Xóa món"
        cancelText="Giữ lại"
        type="danger"
        onConfirm={confirmDeleteItem}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Confirmation Dialog: Dọn sạch giỏ hàng */}
      <ConfirmModal
        visible={showClearConfirm}
        title="Xóa tất cả món?"
        description="Thao tác này sẽ làm trống toàn bộ giỏ hàng hiện tại của bạn."
        confirmText="Xóa tất cả"
        cancelText="Hủy"
        type="danger"
        onConfirm={confirmClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  );
}
