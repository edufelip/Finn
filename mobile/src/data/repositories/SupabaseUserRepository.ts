import type { User } from '../../domain/models/user';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import { CacheKey, CACHE_TTL_MS } from '../cache/cachePolicy';
import { cacheFirst } from '../cache/cacheHelpers';
import { clearCache, setCache } from '../cache/cacheStore';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';

type UserRow = {
  id: string;
  name: string;
  photo_url?: string | null;
  created_at?: string;
  online_visible?: boolean | null;
  last_seen_at?: string | null;
};

function toDomain(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    photoUrl: row.photo_url ?? null,
    createdAt: row.created_at,
    onlineVisible: row.online_visible ?? true,
    lastSeenAt: row.last_seen_at ?? null,
  };
}

export class SupabaseUserRepository implements UserRepository {
  async getUser(id: string): Promise<User | null> {
    const cacheKey = CacheKey.user(id);
    const cached = await cacheFirst<User | null>(cacheKey, CACHE_TTL_MS.profiles, async () => {
      const { data, error } = await supabase
        .from(TABLES.users)
        .select('*')
        .eq('id', id)
        .maybeSingle<UserRow>();

      if (error) {
        throw error;
      }
      return data ? toDomain(data) : null;
    });

    return cached ?? null;
  }

  async createUser(user: User): Promise<User> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLES.users)
      .insert({
        id: user.id,
        name: user.name,
        photo_url: user.photoUrl ?? null,
        online_visible: user.onlineVisible ?? true,
        last_seen_at: user.lastSeenAt ?? now,
      })
      .select('*')
      .single<UserRow>();

    if (error) {
      throw error;
    }
    const created = toDomain(data);
    await setCache(CacheKey.user(created.id), created, CACHE_TTL_MS.profiles);
    return created;
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase.from(TABLES.users).delete().eq('id', id);
    if (error) {
      throw error;
    }
    await clearCache(CacheKey.user(id));
  }

  async setOnlineVisibility(id: string, visible: boolean): Promise<void> {
    const { data, error } = await supabase
      .from(TABLES.users)
      .update({ online_visible: visible })
      .eq('id', id)
      .select('*')
      .single<UserRow>();

    if (error) {
      throw error;
    }
    await setCache(CacheKey.user(id), toDomain(data), CACHE_TTL_MS.profiles);
  }

  async updateLastSeenAt(id: string, timestamp: string): Promise<void> {
    const { data, error } = await supabase
      .from(TABLES.users)
      .update({ last_seen_at: timestamp })
      .eq('id', id)
      .select('*')
      .single<UserRow>();

    if (error) {
      throw error;
    }
    await setCache(CacheKey.user(id), toDomain(data), CACHE_TTL_MS.profiles);
  }
}
