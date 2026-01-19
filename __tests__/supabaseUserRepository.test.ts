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

  it('fetches followers count using HEAD request', async () => {
    // Mock follow counts queries
    const countResult = {
      data: [],
      count: 5,
      error: null,
    };
    const countEq = jest.fn().mockResolvedValue(countResult);
    const countSelect = jest.fn().mockReturnValue({ eq: countEq });

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.userFollows) {
        return { select: countSelect };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const repository = new SupabaseUserRepository();
    const count = await repository.getFollowersCount('user-1');

    expect(count).toBe(5);

    // Verify calls to user_follows
    expect(countSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(countEq).toHaveBeenCalledWith('following_id', 'user-1');
  });
});