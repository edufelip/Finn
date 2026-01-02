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
};

function toDomain(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    photoUrl: row.photo_url ?? null,
    createdAt: row.created_at,
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
    const { data, error } = await supabase
      .from(TABLES.users)
      .insert({
        id: user.id,
        name: user.name,
        photo_url: user.photoUrl ?? null,
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
}
