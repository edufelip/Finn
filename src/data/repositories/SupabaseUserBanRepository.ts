import type { UserBan } from '../../domain/models/userBan';
import type { UserBanRepository } from '../../domain/repositories/UserBanRepository';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';

type UserBanRow = {
  id: number;
  user_id: string;
  banned_by: string | null;
  reason?: string | null;
  source_post_id?: number | null;
  created_at: string;
};

const toDomain = (row: UserBanRow): UserBan => ({
  id: row.id,
  userId: row.user_id,
  bannedBy: row.banned_by ?? null,
  reason: row.reason ?? null,
  sourcePostId: row.source_post_id ?? null,
  createdAt: row.created_at,
});

export class SupabaseUserBanRepository implements UserBanRepository {
  async banUser(
    userId: string,
    bannedBy: string,
    reason?: string | null,
    sourcePostId?: number | null
  ): Promise<UserBan> {
    const { data, error } = await supabase
      .from(TABLES.userBans)
      .upsert({
        user_id: userId,
        banned_by: bannedBy,
        reason: reason ?? null,
        source_post_id: sourcePostId ?? null,
      }, { onConflict: 'user_id' })
      .select()
      .single<UserBanRow>();

    if (error) {
      throw error;
    }

    return toDomain(data);
  }

  async unbanUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.userBans)
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }

  async getBan(userId: string): Promise<UserBan | null> {
    const { data, error } = await supabase
      .from(TABLES.userBans)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<UserBanRow>();

    if (error) {
      throw error;
    }

    return data ? toDomain(data) : null;
  }

  async isBanned(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(TABLES.userBans)
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data !== null;
  }
}
