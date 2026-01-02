import { SupabasePostRepository } from '../src/data/repositories/SupabasePostRepository';
import { TABLES } from '../src/data/supabase/tables';
import { CacheKey } from '../src/data/cache/cachePolicy';

jest.mock('../src/data/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    storage: { from: jest.fn() },
    auth: { getSession: jest.fn() },
  },
}));

jest.mock('../src/data/cache/cacheHelpers', () => ({
  cacheFirst: jest.fn((_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()),
}));

jest.mock('../src/data/cache/cacheStore', () => ({
  clearCache: jest.fn(),
}));

const { supabase } = jest.requireMock('../src/data/supabase/client');
const { clearCache } = jest.requireMock('../src/data/cache/cacheStore');

describe('SupabasePostRepository', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    supabase.from.mockReset();
    supabase.storage.from.mockReset();
    supabase.storage.from.mockReturnValue({
      createSignedUrl: jest.fn().mockResolvedValue({
        data: { signedUrl: 'https://signed.example.com/community.jpg' },
        error: null,
      }),
    });
    clearCache.mockReset();
  });

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      delete (global as { fetch?: typeof fetch }).fetch;
    }
  });

  it('builds feed filter for subscriptions', async () => {
    const subscriptionsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [{ community_id: 10 }, { community_id: 20 }],
        error: null,
      }),
    };

    const postsQuery = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    const likesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    const savedQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.subscriptions) return subscriptionsQuery;
      if (table === TABLES.posts) return postsQuery;
      if (table === TABLES.likes) return likesQuery;
      if (table === TABLES.savedPosts) return savedQuery;
      throw new Error(`Unexpected table ${table}`);
    });

    const repository = new SupabasePostRepository();
    await repository.getUserFeed('user-1', 0);

    expect(postsQuery.or).toHaveBeenCalledWith('community_id.in.(10,20),user_id.eq.user-1');
  });

  it('builds feed filter without subscriptions', async () => {
    const subscriptionsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    const postsQuery = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    const likesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    const savedQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.subscriptions) return subscriptionsQuery;
      if (table === TABLES.posts) return postsQuery;
      if (table === TABLES.likes) return likesQuery;
      if (table === TABLES.savedPosts) return savedQuery;
      throw new Error(`Unexpected table ${table}`);
    });

    const repository = new SupabasePostRepository();
    await repository.getUserFeed('user-2', 0);

    expect(postsQuery.or).toHaveBeenCalledWith('user_id.eq.user-2');
  });

  it('clears feed cache on savePost', async () => {
    const postsQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          content: 'hello',
          community_id: 1,
          user_id: 'user-1',
          communities: { title: 'General', image_url: null },
          profiles: { name: 'User' },
        },
        error: null,
      }),
    };

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.posts) return postsQuery;
      throw new Error(`Unexpected table ${table}`);
    });

    const repository = new SupabasePostRepository();
    await repository.savePost({
      id: 0,
      content: 'hello',
      communityId: 1,
      userId: 'user-1',
    });

    expect(clearCache).toHaveBeenCalledWith(CacheKey.feedByUser('user-1', 0));
  });

  it('uploads post image when using a local uri', async () => {
    const upload = jest.fn().mockResolvedValue({
      data: { path: 'user-1/post.jpg' },
      error: null,
    });
    supabase.storage.from.mockReturnValue({
      upload,
      createSignedUrl: jest.fn().mockResolvedValue({
        data: { signedUrl: 'https://signed.example.com/post.jpg' },
        error: null,
      }),
    });

    const postsQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 4,
          content: 'hello',
          community_id: 1,
          user_id: 'user-1',
          image_url: 'user-1/post.jpg',
          communities: { title: 'General', image_url: null },
          profiles: { name: 'User' },
        },
        error: null,
      }),
    };

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.posts) return postsQuery;
      throw new Error(`Unexpected table ${table}`);
    });

    const blob = { type: 'image/jpeg' } as Blob;
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(blob),
    }) as unknown as typeof fetch;

    const repository = new SupabasePostRepository();
    await repository.savePost(
      {
        id: 0,
        content: 'hello',
        communityId: 1,
        userId: 'user-1',
      },
      'file://post.jpg'
    );

    expect(supabase.storage.from).toHaveBeenCalledWith('post-images');
    expect(upload).toHaveBeenCalledWith(expect.stringContaining('user-1/'), blob, {
      upsert: true,
      contentType: 'image/jpeg',
    });
  });

  it('marks posts as liked for current user', async () => {
    const subscriptionsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    const postsQuery = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            content: 'Post 1',
            community_id: 1,
            user_id: 'user-1',
            communities: { title: 'General', image_url: null },
            profiles: { name: 'User' },
          },
          {
            id: 2,
            content: 'Post 2',
            community_id: 1,
            user_id: 'user-1',
            communities: { title: 'General', image_url: null },
            profiles: { name: 'User' },
          },
        ],
        error: null,
      }),
    };

    const likesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [{ post_id: 2 }],
        error: null,
      }),
    };

    const savedQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.subscriptions) return subscriptionsQuery;
      if (table === TABLES.posts) return postsQuery;
      if (table === TABLES.likes) return likesQuery;
      if (table === TABLES.savedPosts) return savedQuery;
      throw new Error(`Unexpected table ${table}`);
    });

    const repository = new SupabasePostRepository();
    const result = await repository.getUserFeed('user-1', 0);

    expect(result.find((post) => post.id === 2)?.isLiked).toBe(true);
    expect(result.find((post) => post.id === 1)?.isLiked).toBe(false);
  });

  it('marks posts as saved for current user', async () => {
    const subscriptionsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    const postsQuery = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            content: 'Post 1',
            community_id: 1,
            user_id: 'user-1',
            communities: { title: 'General', image_url: null },
            profiles: { name: 'User' },
          },
          {
            id: 2,
            content: 'Post 2',
            community_id: 1,
            user_id: 'user-1',
            communities: { title: 'General', image_url: null },
            profiles: { name: 'User' },
          },
        ],
        error: null,
      }),
    };

    const likesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    const savedQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [{ post_id: 1 }],
        error: null,
      }),
    };

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.subscriptions) return subscriptionsQuery;
      if (table === TABLES.posts) return postsQuery;
      if (table === TABLES.likes) return likesQuery;
      if (table === TABLES.savedPosts) return savedQuery;
      throw new Error(`Unexpected table ${table}`);
    });

    const repository = new SupabasePostRepository();
    const result = await repository.getUserFeed('user-1', 0);

    expect(result.find((post) => post.id === 1)?.isSaved).toBe(true);
    expect(result.find((post) => post.id === 2)?.isSaved).toBe(false);
  });

  it('returns saved posts in saved order', async () => {
    const savedQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: [{ post_id: 2 }, { post_id: 1 }],
        error: null,
      }),
    };

    const postsQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            content: 'Post 1',
            community_id: 1,
            user_id: 'user-1',
            communities: { title: 'General', image_url: null },
            profiles: { name: 'User' },
          },
          {
            id: 2,
            content: 'Post 2',
            community_id: 1,
            user_id: 'user-1',
            communities: { title: 'General', image_url: null },
            profiles: { name: 'User' },
          },
        ],
        error: null,
      }),
    };

    const likesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.savedPosts) return savedQuery;
      if (table === TABLES.posts) return postsQuery;
      if (table === TABLES.likes) return likesQuery;
      throw new Error(`Unexpected table ${table}`);
    });

    const repository = new SupabasePostRepository();
    const result = await repository.getSavedPosts('user-1', 0);

    expect(result.map((post) => post.id)).toEqual([2, 1]);
    expect(result.every((post) => post.isSaved)).toBe(true);
  });

  it('resolves signed community image urls', async () => {
    const subscriptionsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    const postsQuery = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            content: 'Post 1',
            community_id: 1,
            user_id: 'user-1',
            communities: { title: 'General', image_url: 'user-1/community.jpg' },
            profiles: { name: 'User' },
          },
        ],
        error: null,
      }),
    };

    const likesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    const savedQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.subscriptions) return subscriptionsQuery;
      if (table === TABLES.posts) return postsQuery;
      if (table === TABLES.likes) return likesQuery;
      if (table === TABLES.savedPosts) return savedQuery;
      throw new Error(`Unexpected table ${table}`);
    });

    const repository = new SupabasePostRepository();
    const result = await repository.getUserFeed('user-1', 0);

    expect(result[0].communityImageUrl).toBe('https://signed.example.com/community.jpg');
    expect(supabase.storage.from).toHaveBeenCalledWith('community-images');
  });

  it('resolves signed post image urls', async () => {
    const createSignedUrl = jest
      .fn()
      .mockResolvedValueOnce({
        data: { signedUrl: 'https://signed.example.com/community.jpg' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { signedUrl: 'https://signed.example.com/post.jpg' },
        error: null,
      });
    supabase.storage.from.mockReturnValue({ createSignedUrl });

    const subscriptionsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    const postsQuery = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            content: 'Post 1',
            community_id: 1,
            user_id: 'user-1',
            image_url: 'user-1/post.jpg',
            communities: { title: 'General', image_url: 'user-1/community.jpg' },
            profiles: { name: 'User' },
          },
        ],
        error: null,
      }),
    };

    const likesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    const savedQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.subscriptions) return subscriptionsQuery;
      if (table === TABLES.posts) return postsQuery;
      if (table === TABLES.likes) return likesQuery;
      if (table === TABLES.savedPosts) return savedQuery;
      throw new Error(`Unexpected table ${table}`);
    });

    const repository = new SupabasePostRepository();
    const result = await repository.getUserFeed('user-1', 0);

    expect(result[0].communityImageUrl).toBe('https://signed.example.com/community.jpg');
    expect(result[0].imageUrl).toBe('https://signed.example.com/post.jpg');
  });
});
