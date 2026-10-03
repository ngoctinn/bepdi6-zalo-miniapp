import { create } from "zustand";
import { Address } from "../types/customer.types";
import {
  nativeStorageGet,
  nativeStorageSet,
  nativeStorageRemove,
} from "../lib/storage";

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
        const json = JSON.stringify(address);
        localStorage.setItem(SELECTED_ADDRESS_KEY, json);
        void nativeStorageSet(SELECTED_ADDRESS_KEY, json);
      } else {
        localStorage.removeItem(SELECTED_ADDRESS_KEY);
        void nativeStorageRemove(SELECTED_ADDRESS_KEY);
      }
    } catch {
      // Ignore storage errors
    }
    set({ selectedAddress: address });
  },
}));

// Hydrate selectedAddress asynchronously from native storage if localStorage was empty
if (typeof window !== "undefined") {
  void nativeStorageGet(SELECTED_ADDRESS_KEY).then((nativeSaved) => {
    if (nativeSaved) {
      try {
        const parsed = JSON.parse(nativeSaved);
        if (parsed && typeof parsed === "object") {
          const currentAddress = useLocationStore.getState().selectedAddress;
          if (!currentAddress) {
            useLocationStore.setState({ selectedAddress: parsed });
          }
        }
      } catch {
        // Ignore
      }
    }
  });
}
