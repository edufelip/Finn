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
  status?: string | null;
  posts?: {
    content?: string;
    image_url?: string | null;
    user_id?: string;
    profiles?: {
      name?: string;
    } | null;
  } | null;
  profiles?: {
    name?: string;
    photo_url?: string | null;
  } | null;
};

function toDomain(row: PostReportRow): PostReport {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    userName: row.profiles?.name,
    userPhotoUrl: row.profiles?.photo_url ?? null,
    reason: row.reason,
    createdAt: row.created_at,
    status: (row.status as PostReport['status']) ?? 'pending',
    postContent: row.posts?.content,
    postImageUrl: row.posts?.image_url ?? null,
    postAuthorId: row.posts?.user_id,
    postAuthorName: row.posts?.profiles?.name,
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

  async getReportsForCommunity(communityId: number): Promise<PostReport[]> {
    const { data, error } = await supabase
      .from(TABLES.postReports)
      .select(`
        *,
        profiles:user_id (name, photo_url),
        posts:post_id (
          content,
          image_url,
          user_id,
          profiles:user_id (name)
        )
      `)
      .eq('posts.community_id', communityId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => toDomain(row as unknown as PostReportRow));
  }

  async updateReportStatus(reportId: number, status: PostReport['status']): Promise<void> {
    const { error } = await supabase
      .from(TABLES.postReports)
      .update({ status })
      .eq('id', reportId);

    if (error) {
      throw error;
    }
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
