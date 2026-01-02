import type { Post } from '../../domain/models/post';
import type { PostRepository } from '../../domain/repositories/PostRepository';
import { CacheKey, CACHE_TTL_MS } from '../cache/cachePolicy';
import { cacheFirst } from '../cache/cacheHelpers';
import { clearCache } from '../cache/cacheStore';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';

const PAGE_SIZE = 20;
const COMMUNITY_IMAGE_BUCKET = 'community-images';
const POST_IMAGE_BUCKET = 'post-images';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;

type PostRow = {
  id: number;
  content: string;
  image_url?: string | null;
  created_at?: string;
  community_id: number;
  user_id: string;
  communities?: {
    title?: string;
    image_url?: string | null;
  } | null;
  profiles?: {
    name?: string;
  } | null;
  likes?: { count: number }[] | null;
  comments?: { count: number }[] | null;
};

type SavedPostRow = {
  post_id: number;
};

function toDomain(row: PostRow, extras?: Partial<Post>): Post {
  return {
    id: row.id,
    content: row.content,
    imageUrl: row.image_url ?? null,
    createdAt: row.created_at,
    communityId: row.community_id,
    communityTitle: row.communities?.title,
    communityImageUrl: row.communities?.image_url ?? null,
    userId: row.user_id,
    userName: row.profiles?.name,
    likesCount: row.likes?.[0]?.count ?? 0,
    commentsCount: row.comments?.[0]?.count ?? 0,
    ...extras,
  };
}

function isRemoteUrl(url: string) {
  return url.startsWith('http://') || url.startsWith('https://');
}

function isLocalFile(uri: string) {
  return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');
}

async function resolvePostImageUrl(imageUrl?: string | null): Promise<string | null> {
  if (!imageUrl) {
    return null;
  }
  if (isRemoteUrl(imageUrl)) {
    return imageUrl;
  }

  const { data, error } = await supabase.storage
    .from(POST_IMAGE_BUCKET)
    .createSignedUrl(imageUrl, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

async function resolveCommunityImageUrl(imageUrl?: string | null): Promise<string | null> {
  if (!imageUrl) {
    return null;
  }
  if (isRemoteUrl(imageUrl)) {
    return imageUrl;
  }

  const { data, error } = await supabase.storage
    .from(COMMUNITY_IMAGE_BUCKET)
    .createSignedUrl(imageUrl, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

async function toDomainWithImages(row: PostRow, extras?: Partial<Post>): Promise<Post> {
  const [communityImageUrl, postImageUrl] = await Promise.all([
    resolveCommunityImageUrl(row.communities?.image_url ?? null),
    resolvePostImageUrl(row.image_url ?? null),
  ]);
  return toDomain(row, { communityImageUrl, imageUrl: postImageUrl, ...extras });
}

async function uploadPostImage(imageUri: string, userId: string): Promise<string> {
  if (!isLocalFile(imageUri)) {
    return imageUri;
  }

  const response = await fetch(imageUri);
  const blob = await response.blob();
  const extension = imageUri.split('?')[0]?.split('.').pop()?.toLowerCase() || 'jpg';
  const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension;
  const contentType =
    blob.type || (normalizedExtension === 'jpg' ? 'image/jpeg' : `image/${normalizedExtension}`);
  const filePath = `${userId}/${Date.now()}.${normalizedExtension}`;

  const { data, error } = await supabase.storage
    .from(POST_IMAGE_BUCKET)
    .upload(filePath, blob, { upsert: true, contentType });

  if (error) {
    throw error;
  }

  return data.path;
}

export class SupabasePostRepository implements PostRepository {
  async getUserFeed(userId: string, page: number): Promise<Post[]> {
    const cacheKey = CacheKey.feedByUser(userId, page);
    const cached = await cacheFirst<Post[]>(cacheKey, CACHE_TTL_MS.feed, async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: subscriptions, error: subsError } = await supabase
        .from(TABLES.subscriptions)
        .select('community_id')
        .eq('user_id', userId);

      if (subsError) {
        throw subsError;
      }

      const communityIds = (subscriptions ?? []).map((row) => row.community_id);
      const filter =
        communityIds.length > 0
          ? `community_id.in.(${communityIds.join(',')}),user_id.eq.${userId}`
          : `user_id.eq.${userId}`;

      const { data, error } = await supabase
        .from(TABLES.posts)
        .select('*, communities(title, image_url), profiles(name), likes(count), comments(count)')
        .or(filter)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }
      const rows = (data ?? []) as PostRow[];
      if (!rows.length) {
        return [];
      }

      const postIds = rows.map((row) => row.id);
      const { data: likesData, error: likesError } = await supabase
        .from(TABLES.likes)
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      if (likesError) {
        throw likesError;
      }

      const { data: savedData, error: savedError } = await supabase
        .from(TABLES.savedPosts)
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      if (savedError) {
        throw savedError;
      }

      const likedSet = new Set((likesData ?? []).map((row) => row.post_id));
      const savedSet = new Set((savedData ?? []).map((row) => row.post_id));
      return Promise.all(
        rows.map((row) =>
          toDomainWithImages(row, {
            isLiked: likedSet.has(row.id),
            isSaved: savedSet.has(row.id),
          })
        )
      );
    });

    return cached ?? [];
  }

  async getPostsFromCommunity(communityId: number, page: number): Promise<Post[]> {
    const cacheKey = CacheKey.postsByCommunity(communityId, page);
    const cached = await cacheFirst<Post[]>(cacheKey, CACHE_TTL_MS.feed, async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from(TABLES.posts)
        .select('*, communities(title, image_url), profiles(name), likes(count), comments(count)')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }
      return Promise.all((data ?? []).map((row) => toDomainWithImages(row as PostRow)));
    });

    return cached ?? [];
  }

  async getPostsFromUser(userId: string, page: number): Promise<Post[]> {
    const cacheKey = CacheKey.postsByUser(userId, page);
    const cached = await cacheFirst<Post[]>(cacheKey, CACHE_TTL_MS.feed, async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from(TABLES.posts)
        .select('*, communities(title, image_url), profiles(name), likes(count), comments(count)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      const rows = (data ?? []) as PostRow[];
      if (!rows.length) {
        return [];
      }

      const postIds = rows.map((row) => row.id);
      const { data: savedData, error: savedError } = await supabase
        .from(TABLES.savedPosts)
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      if (savedError) {
        throw savedError;
      }

      const { data: likesData, error: likesError } = await supabase
        .from(TABLES.likes)
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      if (likesError) {
        throw likesError;
      }

      const savedSet = new Set((savedData ?? []).map((row) => row.post_id));
      const likedSet = new Set((likesData ?? []).map((row) => row.post_id));
      return Promise.all(
        rows.map((row) =>
          toDomainWithImages(row, {
            isSaved: savedSet.has(row.id),
            isLiked: likedSet.has(row.id),
          })
        )
      );
    });

    return cached ?? [];
  }

  async getSavedPosts(userId: string, page: number): Promise<Post[]> {
    const cacheKey = CacheKey.savedPostsByUser(userId, page);
    const cached = await cacheFirst<Post[]>(cacheKey, CACHE_TTL_MS.savedPosts, async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: savedRows, error: savedError } = await supabase
        .from(TABLES.savedPosts)
        .select('post_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (savedError) {
        throw savedError;
      }

      const postIds = (savedRows ?? []).map((row) => (row as SavedPostRow).post_id);
      if (!postIds.length) {
        return [];
      }

      const { data: postsData, error: postsError } = await supabase
        .from(TABLES.posts)
        .select('*, communities(title, image_url), profiles(name), likes(count), comments(count)')
        .in('id', postIds);

      if (postsError) {
        throw postsError;
      }

      const { data: likesData, error: likesError } = await supabase
        .from(TABLES.likes)
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      if (likesError) {
        throw likesError;
      }

      const likedSet = new Set((likesData ?? []).map((row) => row.post_id));
      const mapped = new Map<number, Post>();
      const mappedEntries = await Promise.all(
        (postsData ?? []).map(async (row) => {
          const post = await toDomainWithImages(row as PostRow, {
            isSaved: true,
            isLiked: likedSet.has((row as PostRow).id),
          });
          return [post.id, post] as const;
        })
      );
      mappedEntries.forEach(([id, post]) => {
        mapped.set(id, post);
      });

      return postIds
        .map((id) => mapped.get(id))
        .filter((post): post is Post => Boolean(post));
    });

    return cached ?? [];
  }

  async getPostLikes(postId: number): Promise<number> {
    const { count, error } = await supabase
      .from(TABLES.likes)
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) {
      throw error;
    }
    return count ?? 0;
  }

  async findLike(postId: number, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(TABLES.likes)
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return Boolean(data);
  }

  async findSavedPost(postId: number, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(TABLES.savedPosts)
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return Boolean(data);
  }

  async likePost(postId: number, userId: string): Promise<void> {
    const { error } = await supabase.from(TABLES.likes).insert({
      post_id: postId,
      user_id: userId,
    });
    if (error) {
      throw error;
    }
  }

  async dislikePost(postId: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.likes)
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) {
      throw error;
    }
  }

  async bookmarkPost(postId: number, userId: string): Promise<void> {
    const { error } = await supabase.from(TABLES.savedPosts).insert({
      post_id: postId,
      user_id: userId,
    });
    if (error) {
      throw error;
    }
    await clearCache(CacheKey.savedPostsByUser(userId, 0));
    await clearCache(CacheKey.feedByUser(userId, 0));
    await clearCache(CacheKey.postsByUser(userId, 0));
  }

  async unbookmarkPost(postId: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.savedPosts)
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) {
      throw error;
    }
    await clearCache(CacheKey.savedPostsByUser(userId, 0));
    await clearCache(CacheKey.feedByUser(userId, 0));
    await clearCache(CacheKey.postsByUser(userId, 0));
  }

  async savePost(post: Post, imageUri?: string | null): Promise<Post> {
    const resolvedImageUrl = imageUri
      ? await uploadPostImage(imageUri, post.userId)
      : post.imageUrl ?? null;

    const { data, error } = await supabase
      .from(TABLES.posts)
      .insert({
        content: post.content,
        community_id: post.communityId,
        user_id: post.userId,
        image_url: resolvedImageUrl,
      })
      .select('*, communities(title, image_url), profiles(name), likes(count), comments(count)')
      .single<PostRow>();

    if (error) {
      throw error;
    }
    const created = await toDomainWithImages(data);
    await clearCache(CacheKey.feedByUser(post.userId, 0));
    return created;
  }

  async deletePost(postId: number): Promise<void> {
    const { error } = await supabase.from(TABLES.posts).delete().eq('id', postId);
    if (error) {
      throw error;
    }
  }
}
