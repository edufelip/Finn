import type { UserBlock } from '../../domain/models/userBlock';
import type { UserBlockRepository } from '../../domain/repositories/UserBlockRepository';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';

type UserBlockRow = {
  id: number;
  blocker_id: string;
  blocked_id: string;
  reason: string;
  source_post_id?: number | null;
  created_at: string;
};

const toDomain = (row: UserBlockRow): UserBlock => ({
  id: row.id,
  blockerId: row.blocker_id,
  blockedId: row.blocked_id,
  reason: row.reason,
  sourcePostId: row.source_post_id ?? null,
  createdAt: row.created_at,
});

export class SupabaseUserBlockRepository implements UserBlockRepository {
  async blockUser(
    blockerId: string,
    blockedId: string,
    reason: string,
    sourcePostId?: number | null
  ): Promise<UserBlock> {
    const { data, error } = await supabase
      .from(TABLES.userBlocks)
      .insert({
        blocker_id: blockerId,
        blocked_id: blockedId,
        reason,
        source_post_id: sourcePostId ?? null,
      })
      .select()
      .single<UserBlockRow>();

    if (error) {
      throw error;
    }

    return toDomain(data);
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.userBlocks)
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);

    if (error) {
      throw error;
    }
  }

  async getBlockedUserIds(blockerId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from(TABLES.userBlocks)
      .select('blocked_id')
      .eq('blocker_id', blockerId);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => (row as { blocked_id: string }).blocked_id);
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(TABLES.userBlocks)
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data !== null;
  }
}
