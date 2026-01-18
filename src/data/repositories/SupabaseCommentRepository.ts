import type { Comment } from '../../domain/models/comment';
import type { CommentRepository } from '../../domain/repositories/CommentRepository';
import { CacheKey, CACHE_TTL_MS } from '../cache/cachePolicy';
import { cacheFirst } from '../cache/cacheHelpers';
import { getCache, setCache } from '../cache/cacheStore';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';

const USER_AVATAR_BUCKET = 'user-avatars';

type CommentRow = {
  id: number;
  content: string;
  user_id: string;
  post_id: number;
  created_at?: string;
  profiles?: {
    name?: string;
    photo_url?: string | null;
  } | null;
};

function isRemoteUrl(url: string) {
  return url.startsWith('http://') || url.startsWith('https://');
}

function resolveUserPhotoUrl(photoUrl?: string | null): string | null {
  if (!photoUrl) {
    return null;
  }
  if (isRemoteUrl(photoUrl)) {
    return photoUrl;
  }
  const { data } = supabase.storage.from(USER_AVATAR_BUCKET).getPublicUrl(photoUrl);
  return data?.publicUrl ?? null;
}

function toDomain(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    userImageUrl: resolveUserPhotoUrl(row.profiles?.photo_url ?? null),
    userName: row.profiles?.name,
    content: row.content,
    createdAt: row.created_at,
  };
}

export class SupabaseCommentRepository implements CommentRepository {
  async getCommentsForPost(postId: number): Promise<Comment[]> {
    const cacheKey = CacheKey.commentsByPost(postId);
    const cached = await cacheFirst<Comment[]>(cacheKey, CACHE_TTL_MS.comments, async () => {
      const { data, error } = await supabase
        .from(TABLES.comments)
        .select('*, profiles(name, photo_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }
      return (data ?? []).map((row) => toDomain(row as CommentRow));
    });

    return cached ?? [];
  }

  async saveComment(comment: Comment): Promise<Comment> {
    const { data, error } = await supabase
      .from(TABLES.comments)
      .insert({
        content: comment.content,
        post_id: comment.postId,
        user_id: comment.userId,
      })
      .select('*, profiles(name, photo_url)')
      .single<CommentRow>();

    if (error) {
      throw error;
    }
    const created = toDomain(data);
    const cacheKey = CacheKey.commentsByPost(created.postId);
    const existing = (await getCache<Comment[]>(cacheKey, { allowExpired: true })) ?? [];
    await setCache(cacheKey, [...existing, created], CACHE_TTL_MS.comments);
    return created;
  }
}
