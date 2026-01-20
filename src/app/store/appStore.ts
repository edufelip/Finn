import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  hasSeenOnboarding: boolean;
  isRehydrated: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setRehydrated: (val: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      isRehydrated: false,
      completeOnboarding: () => set({ hasSeenOnboarding: true }),
      resetOnboarding: () => set({ hasSeenOnboarding: false }),
      setRehydrated: (val: boolean) => set({ isRehydrated: val }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: (state) => {
        return () => {
          state.setRehydrated(true);
        };
      },
    }
  )
);
