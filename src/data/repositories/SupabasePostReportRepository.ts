import type { PostReport } from '../../domain/models/postReport';
import type { PostReportRepository } from '../../domain/repositories/PostReportRepository';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';

type PostReportRow = {
  id: number;
  post_id: number;
  user_id: string;
  reason: string;
  created_at: string;
};

function toDomain(row: PostReportRow): PostReport {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

export class SupabasePostReportRepository implements PostReportRepository {
  async reportPost(postId: number, userId: string, reason: string): Promise<PostReport> {
    const { data, error } = await supabase
      .from(TABLES.postReports)
      .insert({
        post_id: postId,
        user_id: userId,
        reason,
      })
      .select()
      .single<PostReportRow>();

    if (error) {
      throw error;
    }

    return toDomain(data);
  }

  async getUserReports(userId: string): Promise<PostReport[]> {
    const { data, error } = await supabase
      .from(TABLES.postReports)
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => toDomain(row as PostReportRow));
  }

  async hasUserReportedPost(postId: number, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(TABLES.postReports)
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data !== null;
  }
}
