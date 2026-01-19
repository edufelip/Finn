import type { Topic } from '../../domain/models/topic';
import type { TopicRepository } from '../../domain/repositories/TopicRepository';
import { CacheKey, CACHE_TTL_MS } from '../cache/cachePolicy';
import { cacheFirst } from '../cache/cacheHelpers';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';

type TopicRow = {
  id: number;
  name: string;
  label: string;
  icon: string;
  tone: 'orange' | 'green' | 'purple' | 'blue';
  created_at?: string;
};

function toDomain(row: TopicRow): Topic {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    icon: row.icon,
    tone: row.tone,
    createdAt: row.created_at,
  };
}

export class SupabaseTopicRepository implements TopicRepository {
  async getTopics(): Promise<Topic[]> {
    const cacheKey = CacheKey.topics();
    const cached = await cacheFirst<Topic[]>(cacheKey, CACHE_TTL_MS.topics, async () => {
      const { data, error } = await supabase
        .from(TABLES.topics)
        .select('*')
        .order('label', { ascending: true });

      if (error) {
        throw error;
      }
      return (data ?? []).map(toDomain);
    });

    return cached ?? [];
  }

  async getTopic(id: number): Promise<Topic | null> {
    const cacheKey = CacheKey.topic(id);
    const cached = await cacheFirst<Topic | null>(cacheKey, CACHE_TTL_MS.topics, async () => {
      const { data, error } = await supabase
        .from(TABLES.topics)
        .select('*')
        .eq('id', id)
        .maybeSingle<TopicRow>();

      if (error) {
        throw error;
      }
      return data ? toDomain(data) : null;
    });

    return cached ?? null;
  }

  async getPopularTopics(limit: number): Promise<Topic[]> {
    const cacheKey = CacheKey.popularTopics(limit);
    const cached = await cacheFirst<Topic[]>(cacheKey, CACHE_TTL_MS.topics, async () => {
      // Use RPC function to get topics with community counts
      const { data, error } = await supabase.rpc('get_popular_topics', { limit_count: limit });

      if (error) {
        // Fallback to simple query if RPC doesn't exist yet
        console.warn('[SupabaseTopicRepository] RPC get_popular_topics failed, using alphabetical fallback:', error.message);
        const fallback = await supabase
          .from(TABLES.topics)
          .select('*')
          .order('label', { ascending: true })
          .limit(limit);
        
        if (fallback.error) {
          throw fallback.error;
        }
        return (fallback.data ?? []).map(toDomain);
      }
      return (data ?? []).map((row: TopicRow) => toDomain(row));
    });

    return cached ?? [];
  }
}
