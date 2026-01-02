import AsyncStorage from '@react-native-async-storage/async-storage';

type CacheEntry<T> = {
  value: T;
  updatedAt: number;
  ttlMs: number;
};

export async function setCache<T>(key: string, value: T, ttlMs: number) {
  const entry: CacheEntry<T> = {
    value,
    updatedAt: Date.now(),
    ttlMs,
  };
  await AsyncStorage.setItem(key, JSON.stringify(entry));
}

export async function getCache<T>(
  key: string,
  options?: { allowExpired?: boolean }
): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as CacheEntry<T>;
    const isExpired = Date.now() - entry.updatedAt > entry.ttlMs;
    if (isExpired && !options?.allowExpired) {
      return null;
    }
    return entry.value;
  } catch {
    await AsyncStorage.removeItem(key);
    return null;
  }
}

export async function clearCache(key: string) {
  await AsyncStorage.removeItem(key);
}
