import { SupabaseUserRepository } from '../src/data/repositories/SupabaseUserRepository';
import { TABLES } from '../src/data/supabase/tables';

jest.mock('../src/data/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    storage: { from: jest.fn() },
  },
}));

jest.mock('../src/data/cache/cacheHelpers', () => ({
  cacheFirst: jest.fn((_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()),
}));

jest.mock('../src/data/cache/cacheStore', () => ({
  setCache: jest.fn(),
  getCache: jest.fn(),
  clearCache: jest.fn(),
}));

const { supabase } = jest.requireMock('../src/data/supabase/client');

describe('SupabaseUserRepository', () => {
  beforeEach(() => {
    supabase.from.mockReset();
    supabase.storage.from.mockReset();
  });

  it('fetches followers count from profiles cache column', async () => {
    const countResult = {
      data: { followers_count: 5 },
      error: null,
    };
    const maybeSingle = jest.fn().mockResolvedValue(countResult);
    const countEq = jest.fn().mockReturnValue({ maybeSingle });
    const countSelect = jest.fn().mockReturnValue({ eq: countEq });

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.users) {
        return { select: countSelect };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const repository = new SupabaseUserRepository();
    const count = await repository.getFollowersCount('user-1');

    expect(count).toBe(5);
    expect(countSelect).toHaveBeenCalledWith('followers_count');
    expect(countEq).toHaveBeenCalledWith('id', 'user-1');
    expect(maybeSingle).toHaveBeenCalled();
  });

  it('fetches following count from profiles cache column', async () => {
    const countResult = {
      data: { following_count: 3 },
      error: null,
    };
    const maybeSingle = jest.fn().mockResolvedValue(countResult);
    const countEq = jest.fn().mockReturnValue({ maybeSingle });
    const countSelect = jest.fn().mockReturnValue({ eq: countEq });

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.users) {
        return { select: countSelect };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const repository = new SupabaseUserRepository();
    const count = await repository.getFollowingCount('user-1');

    expect(count).toBe(3);
    expect(countSelect).toHaveBeenCalledWith('following_count');
    expect(countEq).toHaveBeenCalledWith('id', 'user-1');
    expect(maybeSingle).toHaveBeenCalled();
  });
});
