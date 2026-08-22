import { copy } from "@/constants/copy";
import { CartItem } from "@/types/cart.types";

type VariantFormatOptions = {
  separator?: string;
  emptyLabel?: string;
};

export const calculateCartItemPrice = (item: CartItem): number => {
  const optionsTotal = (item.options || []).reduce(
    (sum, opt) => sum + opt.price * (opt.quantity || 1),
    0,
  );
  return item.unit_price + optionsTotal;
};

export const calculateCartTotal = (items: CartItem[]): number =>
  items.reduce(
    (sum, item) => sum + calculateCartItemPrice(item) * item.quantity,
    0,
  );

export const formatVariantWithPercentage = (
  options?: CartItem["options"],
  formatOpts: VariantFormatOptions = {},
): string => {
  const { separator = copy.common.listSeparator || ", ", emptyLabel = "" } =
    formatOpts;

  if (!options || options.length === 0) {
    return emptyLabel;
  }

  const parts = options.map((opt) => {
    if (opt.quantity && opt.quantity > 1) {
      return `${opt.option_name} x${opt.quantity}`;
    }
    return opt.option_name;
  });

  return parts.join(separator);
};
