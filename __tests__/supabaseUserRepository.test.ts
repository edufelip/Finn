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
  clearCache: jest.fn(),
}));

const { supabase } = jest.requireMock('../src/data/supabase/client');

describe('SupabaseUserRepository', () => {
  beforeEach(() => {
    supabase.from.mockReset();
    supabase.storage.from.mockReset();
  });

  it('fetches user with follow counts using GET limit(0)', async () => {
    // Mock user profile query
    const profileSelect = jest.fn().mockReturnThis();
    const profileEq = jest.fn().mockReturnThis();
    const profileMaybeSingle = jest.fn().mockResolvedValue({
      data: {
        id: 'user-1',
        name: 'Test User',
      },
      error: null,
    });

    // Mock follow counts queries
    const countSelect = jest.fn().mockReturnThis();
    const countEq = jest.fn().mockReturnThis();
    const countLimit = jest.fn().mockResolvedValue({
      data: [],
      count: 5,
      error: null,
    });

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.users) {
        return { select: profileSelect, eq: profileEq, maybeSingle: profileMaybeSingle };
      }
      if (table === TABLES.userFollows) {
        return { select: countSelect, eq: countEq, limit: countLimit };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const repository = new SupabaseUserRepository();
    const user = await repository.getUser('user-1');

    expect(user).toBeTruthy();
    expect(user?.followersCount).toBe(5);
    expect(user?.followingCount).toBe(5); // We reused the same mock for both

    // Verify calls to user_follows
    expect(countSelect).toHaveBeenCalledWith('*', { count: 'exact', head: false });
    expect(countLimit).toHaveBeenCalledWith(0);
  });
});
