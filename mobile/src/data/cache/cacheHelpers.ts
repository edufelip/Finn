import * as Network from 'expo-network';

import { getCache, setCache } from './cacheStore';

export async function cacheFirst<T>(key: string, ttlMs: number, fetcher: () => Promise<T>) {
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const status = await Network.getNetworkStateAsync();
  if (!status.isConnected) {
    return getCache<T>(key, { allowExpired: true });
  }

  try {
    const data = await fetcher();
    await setCache(key, data, ttlMs);
    return data;
  } catch (error) {
    const stale = await getCache<T>(key, { allowExpired: true });
    if (stale !== null) {
      return stale;
    }
    throw error;
  }
}
