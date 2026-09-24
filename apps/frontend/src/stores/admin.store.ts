import { create } from "zustand";

interface AdminState {
  isAdminMode: boolean;
  setIsAdminMode: (isAdminMode: boolean) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  isAdminMode: false,
  setIsAdminMode: (isAdminMode: boolean) => set({ isAdminMode }),
}));
