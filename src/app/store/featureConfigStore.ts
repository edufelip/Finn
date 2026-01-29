import { create } from 'zustand';

import type { FeatureConfigEntry, FeatureConfigValue } from '../../domain/models/featureConfig';

type FeatureConfigState = {
  values: Record<string, FeatureConfigValue>;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  setConfigs: (entries: FeatureConfigEntry[]) => void;
  setValue: (key: string, value: FeatureConfigValue) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
  setLastFetchedAt: (timestamp: number | null) => void;
  reset: () => void;
};

export const useFeatureConfigStore = create<FeatureConfigState>((set) => ({
  values: {},
  isLoading: false,
  error: null,
  lastFetchedAt: null,
  setConfigs: (entries) =>
    set({
      values: entries.reduce<Record<string, FeatureConfigValue>>((acc, entry) => {
        acc[entry.key] = entry.value;
        return acc;
      }, {}),
    }),
  setValue: (key, value) =>
    set((state) => ({
      values: {
        ...state.values,
        [key]: value,
      },
    })),
  setLoading: (value) => set({ isLoading: value }),
  setError: (error) => set({ error }),
  setLastFetchedAt: (timestamp) => set({ lastFetchedAt: timestamp }),
  reset: () => set({ values: {}, isLoading: false, error: null, lastFetchedAt: null }),
}));
