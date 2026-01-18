import { SupabaseCommunityRepository } from '../src/data/repositories/SupabaseCommunityRepository';
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

describe('SupabaseCommunityRepository', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    supabase.from.mockReset();
    supabase.storage.from.mockReset();
  });

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      delete (global as { fetch?: typeof fetch }).fetch;
    }
  });

  it('uploads community image when using a local uri', async () => {
    const upload = jest.fn().mockResolvedValue({
      data: { path: 'user-1/uploaded.jpg' },
      error: null,
    });
    const createSignedUrl = jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://signed.example.com/community.jpg' },
      error: null,
    });
    supabase.storage.from.mockReturnValue({ upload, createSignedUrl });

    const insert = jest.fn().mockReturnThis();
    const select = jest.fn().mockReturnThis();
    const single = jest.fn().mockResolvedValue({
      data: {
        id: 1,
        title: 'Community',
        description: 'Details',
        image_url: 'user-1/uploaded.jpg',
        owner_id: 'user-1',
      },
      error: null,
    });

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.communities) {
        return { insert, select, single };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const blob = { type: 'image/jpeg' } as Blob;
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(blob),
    }) as unknown as typeof fetch;

    const repository = new SupabaseCommunityRepository();
    await repository.saveCommunity(
      {
        id: 0,
        title: 'Community',
        description: 'Details',
        ownerId: 'user-1',
      },
      'file://community.jpg'
    );

    expect(supabase.storage.from).toHaveBeenCalledWith('community-images');
    expect(upload).toHaveBeenCalledWith(expect.stringContaining('user-1/'), blob, {
      upsert: true,
      contentType: 'image/jpeg',
    });
    expect(createSignedUrl).toHaveBeenCalledWith('user-1/uploaded.jpg', expect.any(Number));
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        image_url: 'user-1/uploaded.jpg',
      })
    );
  });

  it('skips upload when image uri is already remote', async () => {
    const insert = jest.fn().mockReturnThis();
    const select = jest.fn().mockReturnThis();
    const single = jest.fn().mockResolvedValue({
      data: {
        id: 2,
        title: 'Community',
        description: 'Details',
        image_url: 'https://example.com/image.png',
        owner_id: 'user-1',
      },
      error: null,
    });

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.communities) {
        return { insert, select, single };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const repository = new SupabaseCommunityRepository();
    await repository.saveCommunity(
      {
        id: 0,
        title: 'Community',
        description: 'Details',
        ownerId: 'user-1',
      },
      'https://example.com/image.png'
    );

    expect(supabase.storage.from).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        image_url: 'https://example.com/image.png',
      })
    );
  });

  it('resolves signed urls when loading communities', async () => {
    const createSignedUrl = jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://signed.example.com/community.jpg' },
      error: null,
    });
    supabase.storage.from.mockReturnValue({ createSignedUrl });

    const communitiesQuery = {
      select: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) =>
        resolve({
          data: [
            {
              id: 1,
              title: 'General',
              description: 'General',
              image_url: 'user-1/community.jpg',
              owner_id: 'user-1',
            },
          ],
          error: null,
        })
      ),
    };

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.communities) {
        return communitiesQuery;
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const repository = new SupabaseCommunityRepository();
    const result = await repository.getCommunities();

    expect(createSignedUrl).toHaveBeenCalledWith('user-1/community.jpg', expect.any(Number));
    expect(result[0].imageUrl).toBe('https://signed.example.com/community.jpg');
  });

  it('resolves signed url when loading a single community', async () => {
    const createSignedUrl = jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://signed.example.com/one.jpg' },
      error: null,
    });
    supabase.storage.from.mockReturnValue({ createSignedUrl });

    const select = jest.fn().mockReturnThis();
    const eq = jest.fn().mockReturnThis();
    const maybeSingle = jest.fn().mockResolvedValue({
      data: {
        id: 2,
        title: 'Single',
        description: 'Details',
        image_url: 'user-1/one.jpg',
        owner_id: 'user-1',
      },
      error: null,
    });

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.communities) {
        return { select, eq, maybeSingle };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const repository = new SupabaseCommunityRepository();
    const result = await repository.getCommunity(2);

    expect(createSignedUrl).toHaveBeenCalledWith('user-1/one.jpg', expect.any(Number));
    expect(result?.imageUrl).toBe('https://signed.example.com/one.jpg');
  });
});
