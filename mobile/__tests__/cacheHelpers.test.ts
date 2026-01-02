import AsyncStorage from '@react-native-async-storage/async-storage';
import { cacheFirst } from '../src/data/cache/cacheHelpers';
import { setCache } from '../src/data/cache/cacheStore';

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

const network = jest.requireMock('expo-network');

describe('cacheFirst', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await setCache('test:key', { ok: true }, 1);
  });

  it('returns cached value without calling fetcher', async () => {
    const fetcher = jest.fn().mockResolvedValue({ ok: false });
    const value = await cacheFirst('test:key', 1000, fetcher);
    expect(value).toEqual({ ok: true });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('returns null when offline and no cache', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
    const fetcher = jest.fn().mockResolvedValue({ ok: true });
    const value = await cacheFirst('missing:key', 1000, fetcher);
    expect(value).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('falls back to stale cache on fetcher error', async () => {
    jest.useFakeTimers();
    await setCache('stale:key', { ok: 'stale' }, 1);
    jest.advanceTimersByTime(10);
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
    const fetcher = jest.fn().mockRejectedValue(new Error('network'));
    const value = await cacheFirst('stale:key', 1, fetcher);
    expect(value).toEqual({ ok: 'stale' });
    jest.useRealTimers();
  });
});
