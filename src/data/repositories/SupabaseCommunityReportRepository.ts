import type { CommunityReport } from '../../domain/models/communityReport';
import type { CommunityReportRepository } from '../../domain/repositories/CommunityReportRepository';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';

type CommunityReportRow = {
  id: number;
  community_id: number;
  user_id: string;
  reason: string;
  created_at: string;
};

const toDomain = (row: CommunityReportRow): CommunityReport => ({
  id: row.id,
  communityId: row.community_id,
  userId: row.user_id,
  reason: row.reason,
  createdAt: row.created_at,
});

export class SupabaseCommunityReportRepository implements CommunityReportRepository {
  async reportCommunity(communityId: number, userId: string, reason: string): Promise<CommunityReport> {
    const { data, error } = await supabase
      .from(TABLES.communityReports)
      .insert({
        community_id: communityId,
        user_id: userId,
        reason,
      })
      .select()
      .single<CommunityReportRow>();

    if (error) {
      throw error;
    }

    return toDomain(data);
  }
}
