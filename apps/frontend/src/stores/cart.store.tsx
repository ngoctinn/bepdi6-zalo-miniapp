import { create } from "zustand";
import { CartItem, CartStore } from "../types/cart.types";
import { calculateCartTotal } from "../utils/cart";

const CART_STORAGE_KEY = "bepdi6_cart_items";

const loadSavedCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
};

const getOptionsSignature = (options?: CartItem["options"]) =>
  (options || [])
    .map((o) => `${o.option_id}:${o.quantity || 1}`)
    .sort()
    .join("|");

export const useCartStore = create<CartStore>((set, get) => ({
  items: loadSavedCart(),

  addToCart: (itemData) => {
    const { items } = get();

    // Check trùng món cùng options và cùng ghi chú
    const newSignature = getOptionsSignature(itemData.options);
    const existingIndex = items.findIndex(
      (item) =>
        item.product_id === itemData.product_id &&
        (item.note || "") === (itemData.note || "") &&
        getOptionsSignature(item.options) === newSignature,
    );

    let updatedItems: CartItem[];
    if (existingIndex > -1) {
      updatedItems = items.map((item, idx) =>
        idx === existingIndex
          ? {
              ...item,
              unit_price: itemData.unit_price,
              quantity: item.quantity + itemData.quantity,
            }
          : item,
      );
    } else {
      const newItem: CartItem = {
        ...itemData,
        id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      };
      updatedItems = [...items, newItem];
    }

    saveCart(updatedItems);
    set({ items: updatedItems });
  },

  updateCartItem: (id, itemData) => {
    const { items } = get();
    const targetItem = items.find((item) => item.id === id);
    if (!targetItem) return;

    const mergedPayload = { ...targetItem, ...itemData };
    if (mergedPayload.quantity <= 0) {
      get().removeFromCart(id);
      return;
    }

    const targetSignature = getOptionsSignature(mergedPayload.options);
    const duplicateItemIndex = items.findIndex(
      (item) =>
        item.id !== id &&
        item.product_id === mergedPayload.product_id &&
        (item.note || "") === (mergedPayload.note || "") &&
        getOptionsSignature(item.options) === targetSignature,
    );

    let updatedItems: CartItem[];
    if (duplicateItemIndex > -1) {
      // Nếu sau khi sửa bị trùng với 1 item khác: gộp quantity và xóa item hiện tại
      const targetExisting = items[duplicateItemIndex];
      updatedItems = items
        .filter((item) => item.id !== id)
        .map((item) =>
          item.id === targetExisting.id
            ? { ...item, quantity: item.quantity + mergedPayload.quantity }
            : item,
        );
    } else {
      updatedItems = items.map((item) =>
        item.id === id ? mergedPayload : item,
      );
    }
    saveCart(updatedItems);
    set({ items: updatedItems });
  },

  removeFromCart: (id) => {
    const { items } = get();
    const updatedItems = items.filter((item) => item.id !== id);
    saveCart(updatedItems);
    set({ items: updatedItems });
  },

  updateQuantity: (id, quantity) => {
    const { items } = get();
    if (quantity <= 0) {
      get().removeFromCart(id);
      return;
    }
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, quantity } : item,
    );
    saveCart(updatedItems);
    set({ items: updatedItems });
  },

  clearCart: () => {
    saveCart([]);
    set({ items: [] });
  },

  get totalItems() {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  get subtotal() {
    return calculateCartTotal(get().items);
  },
}));
