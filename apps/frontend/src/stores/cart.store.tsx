import { create } from "zustand";
import { CartItem, CartStore } from "../types/cart.types";

const CART_STORAGE_KEY = "bepdi6_cart_items";

const loadSavedCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
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

export const useCartStore = create<CartStore>((set, get) => ({
  items: loadSavedCart(),

  addToCart: (itemData) => {
    const { items } = get();

    // Check trùng món cùng options và cùng ghi chú
    const optionsSignature = (options?: typeof itemData.options) =>
      (options || [])
        .map((o) => `${o.option_id}:${o.quantity}`)
        .sort()
        .join("|");

    const newSignature = optionsSignature(itemData.options);
    const existingIndex = items.findIndex(
      (item) =>
        item.product_id === itemData.product_id &&
        (item.note || "") === (itemData.note || "") &&
        optionsSignature(item.options) === newSignature,
    );

    let updatedItems: CartItem[];
    if (existingIndex > -1) {
      updatedItems = items.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: item.quantity + itemData.quantity }
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
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, ...itemData } : item,
    );
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
    return get().items.reduce((sum, item) => {
      const optionsPrice = (item.options || []).reduce(
        (optSum, opt) => optSum + Number(opt.price || 0) * (opt.quantity || 1),
        0,
      );
      return (
        sum + (Number(item.unit_price || 0) + optionsPrice) * item.quantity
      );
    }, 0);
  },
}));
