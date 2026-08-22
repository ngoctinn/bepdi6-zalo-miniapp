import { create } from "zustand";
import { Address } from "../types/customer.types";

const SELECTED_ADDRESS_KEY = "bepdi6_selected_address";

interface LocationStore {
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
}

const loadSavedAddress = (): Address | null => {
  try {
    const saved = localStorage.getItem(SELECTED_ADDRESS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const useLocationStore = create<LocationStore>((set) => ({
  selectedAddress: loadSavedAddress(),
  setSelectedAddress: (address) => {
    try {
      if (address) {
        localStorage.setItem(SELECTED_ADDRESS_KEY, JSON.stringify(address));
      } else {
        localStorage.removeItem(SELECTED_ADDRESS_KEY);
      }
    } catch {
      // Ignore storage errors
    }
    set({ selectedAddress: address });
  },
}));
