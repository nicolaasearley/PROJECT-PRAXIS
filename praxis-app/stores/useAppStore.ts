import { create } from 'zustand';

interface AppState {
  // Add your app state here
  isInitialized: boolean;
  setInitialized: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isInitialized: false,
  setInitialized: (value: boolean) => set({ isInitialized: value }),
}));
