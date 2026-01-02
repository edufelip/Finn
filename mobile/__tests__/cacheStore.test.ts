import { getCache, setCache } from '../src/data/cache/cacheStore';

describe('cacheStore', () => {
  it('returns stored value before expiry', async () => {
    await setCache('test:key', { ok: true }, 10_000);
    const value = await getCache<{ ok: boolean }>('test:key');
    expect(value).toEqual({ ok: true });
  });
});
