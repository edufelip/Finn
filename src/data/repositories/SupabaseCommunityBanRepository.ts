import type { CommunityBan } from '../../domain/models/communityBan';
import type { CommunityBanRepository } from '../../domain/repositories/CommunityBanRepository';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';

type CommunityBanRow = {
  id: number;
  community_id: number;
  user_id: string;
  banned_by: string | null;
  reason?: string | null;
  source_post_id?: number | null;
  created_at: string;
};

const toDomain = (row: CommunityBanRow): CommunityBan => ({
  id: row.id,
  communityId: row.community_id,
  userId: row.user_id,
  bannedBy: row.banned_by ?? null,
  reason: row.reason ?? null,
  sourcePostId: row.source_post_id ?? null,
  createdAt: row.created_at,
});

export class SupabaseCommunityBanRepository implements CommunityBanRepository {
  async banUser(
    communityId: number,
    userId: string,
    bannedBy: string,
    reason?: string,
    sourcePostId?: number | null
  ): Promise<CommunityBan> {
    const { data, error } = await supabase
      .from(TABLES.communityBans)
      .insert({
        community_id: communityId,
        user_id: userId,
        banned_by: bannedBy,
        reason: reason ?? null,
        source_post_id: sourcePostId ?? null,
      })
      .select()
      .single<CommunityBanRow>();

    if (error) {
      throw error;
    }

    return toDomain(data);
  }

  async unbanUser(communityId: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.communityBans)
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }

  async getBansForCommunity(communityId: number): Promise<CommunityBan[]> {
    const { data, error } = await supabase
      .from(TABLES.communityBans)
      .select('*')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => toDomain(row as CommunityBanRow));
  }
}
