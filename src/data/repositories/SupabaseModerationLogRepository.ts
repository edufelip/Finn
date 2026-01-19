import type { ModerationLog } from '../../domain/models/moderationLog';
import type { ModerationLogRepository } from '../../domain/repositories/ModerationLogRepository';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';

type ModerationLogRow = {
  id: number;
  community_id: number;
  moderator_id: string;
  post_id: number | null;
  action: string;
  created_at: string;
};

function toDomain(row: ModerationLogRow, profileName?: string, profilePhotoUrl?: string | null): ModerationLog {
  return {
    id: row.id,
    communityId: row.community_id,
    moderatorId: row.moderator_id,
    moderatorName: profileName,
    moderatorPhotoUrl: profilePhotoUrl,
    postId: row.post_id,
    action: row.action as any,
    createdAt: row.created_at,
  };
}

export class SupabaseModerationLogRepository implements ModerationLogRepository {
  async getLogs(communityId: number, limit = 100): Promise<ModerationLog[]> {
    const { data, error } = await supabase
      .from(TABLES.moderationLogs)
      .select(`
        *,
        profiles:moderator_id (
          name,
          photo_url
        )
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map((row) => {
      const profile = (row as any).profiles;
      return toDomain(row, profile?.name, profile?.photo_url);
    });
  }

  async createLog(log: Omit<ModerationLog, 'id' | 'createdAt' | 'moderatorName' | 'moderatorPhotoUrl'>): Promise<ModerationLog> {
    const { data, error } = await supabase
      .from(TABLES.moderationLogs)
      .insert({
        community_id: log.communityId,
        moderator_id: log.moderatorId,
        post_id: log.postId,
        action: log.action,
      })
      .select(`
        *,
        profiles:moderator_id (
          name,
          photo_url
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create moderation log');
    }

    const profile = (data as any).profiles;
    return toDomain(data, profile?.name, profile?.photo_url);
  }
}
