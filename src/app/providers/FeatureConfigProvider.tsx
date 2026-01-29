import React, { createContext, useCallback, useContext, useEffect } from 'react';

import { useRepositories } from './RepositoryProvider';
import { useFeatureConfigStore } from '../store/featureConfigStore';

export type FeatureConfigContextValue = {
  refresh: () => Promise<void>;
};

const FeatureConfigContext = createContext<FeatureConfigContextValue | undefined>(undefined);

export function FeatureConfigProvider({ children }: { children: React.ReactNode }) {
  const { featureConfigs: featureConfigRepository } = useRepositories();
  const setConfigs = useFeatureConfigStore((state) => state.setConfigs);
  const setLoading = useFeatureConfigStore((state) => state.setLoading);
  const setError = useFeatureConfigStore((state) => state.setError);
  const setLastFetchedAt = useFeatureConfigStore((state) => state.setLastFetchedAt);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const configs = await featureConfigRepository.getAll();
      setConfigs(configs);
      setLastFetchedAt(Date.now());
    } catch (error) {
      setConfigs([]);
      setLastFetchedAt(null);
      const message = error instanceof Error ? error.message : 'Failed to load feature config.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [featureConfigRepository, setConfigs, setError, setLastFetchedAt, setLoading]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <FeatureConfigContext.Provider value={{ refresh }}>
      {children}
    </FeatureConfigContext.Provider>
  );
}

export function useFeatureConfig() {
  const context = useContext(FeatureConfigContext);
  if (!context) {
    throw new Error('useFeatureConfig must be used within FeatureConfigProvider');
  }
  return context;
}
