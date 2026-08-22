import { OrderItemOptionPayload } from "./order.types";

export interface CartItem {
  id: string; // Client unique cart item uuid / timestamp
  product_id: number;
  product_name: string;
  product_image?: string;
  unit_price: number;
  quantity: number;
  note?: string;
  options?: OrderItemOptionPayload[];
}

export interface CartStore {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "id">) => void;
  updateCartItem: (id: string, item: Partial<CartItem>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  checkoutSheetVisible: boolean;
  openCheckoutSheet: () => void;
  closeCheckoutSheet: () => void;
}
