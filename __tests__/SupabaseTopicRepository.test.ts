import { SupabaseTopicRepository } from '../src/data/repositories/SupabaseTopicRepository';
import { supabase } from '../src/data/supabase/client';
import type { Topic } from '../src/domain/models/topic';

jest.mock('../src/data/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock('../src/data/cache/cacheHelpers', () => ({
  cacheFirst: jest.fn((key, ttl, fetcher) => fetcher()),
}));

describe('SupabaseTopicRepository', () => {
  let repository: SupabaseTopicRepository;
  const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

  beforeEach(() => {
    repository = new SupabaseTopicRepository();
    jest.clearAllMocks();
    consoleWarnSpy.mockClear();
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('getPopularTopics', () => {
    it('should fetch popular topics using RPC function', async () => {
      const mockTopics = [
        { id: 1, name: 'gaming', label: 'Gaming', icon: 'sports-esports', tone: 'blue', created_at: '2024-01-01' },
        { id: 2, name: 'music', label: 'Music', icon: 'music-note', tone: 'purple', created_at: '2024-01-01' },
      ];

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockTopics,
        error: null,
      });

      const result = await repository.getPopularTopics(8);

      expect(supabase.rpc).toHaveBeenCalledWith('get_popular_topics', { limit_count: 8 });
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        name: 'gaming',
        label: 'Gaming',
        icon: 'sports-esports',
        tone: 'blue',
      });
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should fallback to alphabetical query when RPC fails', async () => {
      const mockTopics = [
        { id: 3, name: 'art', label: 'Art', icon: 'palette', tone: 'orange', created_at: '2024-01-01' },
        { id: 1, name: 'gaming', label: 'Gaming', icon: 'sports-esports', tone: 'blue', created_at: '2024-01-01' },
      ];

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: mockTopics, error: null })),
          })),
        })),
      }));

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'function get_popular_topics does not exist' },
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await repository.getPopularTopics(8);

      expect(supabase.rpc).toHaveBeenCalledWith('get_popular_topics', { limit_count: 8 });
      expect(supabase.from).toHaveBeenCalledWith('topics');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SupabaseTopicRepository] RPC get_popular_topics failed, using alphabetical fallback:',
        'function get_popular_topics does not exist'
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('art');
    });

    it('should throw error when both RPC and fallback fail', async () => {
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Database connection failed' } })),
          })),
        })),
      }));

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      await expect(repository.getPopularTopics(8)).rejects.toEqual({
        message: 'Database connection failed',
      });

      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should handle empty results gracefully', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await repository.getPopularTopics(8);

      expect(result).toEqual([]);
    });

    it('should respect the limit parameter', async () => {
      const mockTopics = [
        { id: 1, name: 'gaming', label: 'Gaming', icon: 'sports-esports', tone: 'blue', created_at: '2024-01-01' },
        { id: 2, name: 'music', label: 'Music', icon: 'music-note', tone: 'purple', created_at: '2024-01-01' },
        { id: 3, name: 'art', label: 'Art', icon: 'palette', tone: 'orange', created_at: '2024-01-01' },
      ];

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockTopics,
        error: null,
      });

      await repository.getPopularTopics(3);

      expect(supabase.rpc).toHaveBeenCalledWith('get_popular_topics', { limit_count: 3 });
    });
  });
});
