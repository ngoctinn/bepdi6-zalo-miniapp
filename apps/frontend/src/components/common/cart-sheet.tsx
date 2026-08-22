import { Button, Sheet, Text } from "zmp-ui";
import { CloseIcon } from "./vectors";
import CartItemCard from "./cart-item-card";
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
  const handleEdit = (itemId: string) => {
    if (onEdit) {
      onEdit(itemId);
    }
  };

  const totalAmount = calculateCartTotal(items);

  return (
    <Sheet autoHeight visible={visible} onClose={onClose}>
      <div className="relative flex max-h-[75vh] w-full flex-col overflow-y-scroll bg-background">
        <div className="flex items-center border-b border-black/5 px-4 py-3">
          <Button
            onClick={onClose}
            className="absolute flex h-8 w-8 items-center justify-center bg-transparent active:bg-transparent"
            type="neutral"
            size="small"
            fullWidth
          >
            <CloseIcon />
          </Button>
          <div className="flex-1 py-1 text-center text-base font-bold text-green800">
            {copy.common.updateCart}
          </div>
        </div>

        <div className="w-full overflow-y-auto bg-transparent p-3">
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
              <Text className="mb-1 text-base font-medium text-text-primary">
                {copy.cart.empty}
              </Text>
              <Text size="xSmall" className="text-center text-text-secondary">
                {copy.cart.emptyHint}
              </Text>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  variant="editable"
                  onUpdateQuantity={onUpdateQuantity}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-black/5 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onConfirm}
                className="flex flex-1 items-center justify-between rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-green800 active:scale-[0.98]"
              >
                <span>Thanh toán</span>
                <span>{formatCurrency(totalAmount)}đ</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
