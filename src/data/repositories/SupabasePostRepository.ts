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
const USER_AVATAR_BUCKET = 'user-avatars';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;
const POST_SELECT_WITH_COUNTS =
  '*, communities(title, image_url), profiles(name, photo_url), likes(count), comments(count)';
const POST_SELECT_BASE = '*, communities(title, image_url), profiles(name, photo_url)';

type PostRow = {
  id: number;
  content: string;
  image_url?: string | null;
  created_at?: string;
  community_id: number;
  user_id: string;
  moderation_status?: string | null;
  communities?: {
    title?: string;
    image_url?: string | null;
  } | null;
  profiles?: {
    name?: string;
    photo_url?: string | null;
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
    moderationStatus: (row.moderation_status as Post['moderationStatus']) ?? 'approved',
    // userPhotoUrl is handled in toDomainWithImages
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

async function selectPostsWithFallback<T>(
  runner: (select: string) => PromiseLike<{ data: T | null; error: unknown | null }>
): Promise<{ data: T | null; error: unknown | null }> {
  const withCounts = await runner(POST_SELECT_WITH_COUNTS);
  if (withCounts.error && (withCounts.error as { code?: string }).code === 'PGRST200') {
    return runner(POST_SELECT_BASE);
  }
  return withCounts;
}

async function resolvePostImageUrl(imageUrl?: string | null): Promise<string | null> {
  if (!imageUrl) {
    return null;
  }
  if (isRemoteUrl(imageUrl)) {
    return imageUrl;
  }

  const { data } = supabase.storage.from(POST_IMAGE_BUCKET).getPublicUrl(imageUrl);
  return data?.publicUrl ?? null;
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

async function resolveUserPhotoUrl(photoUrl?: string | null): Promise<string | null> {
  if (!photoUrl) {
    return null;
  }
  if (isRemoteUrl(photoUrl)) {
    return photoUrl;
  }
  const { data } = supabase.storage.from(USER_AVATAR_BUCKET).getPublicUrl(photoUrl);
  return data?.publicUrl ?? null;
}

async function toDomainWithImages(row: PostRow, extras?: Partial<Post>): Promise<Post> {
  const [communityImageUrl, postImageUrl, userPhotoUrl] = await Promise.all([
    resolveCommunityImageUrl(row.communities?.image_url ?? null),
    resolvePostImageUrl(row.image_url ?? null),
    resolveUserPhotoUrl(row.profiles?.photo_url ?? null),
  ]);
  return toDomain(row, { communityImageUrl, imageUrl: postImageUrl, userPhotoUrl, ...extras });
}

type UploadResult = {
  path: string;
  wasUploaded: boolean;
};

async function uploadPostImage(imageUri: string, userId: string): Promise<UploadResult> {
  if (!isLocalFile(imageUri) && !isRemoteUrl(imageUri)) {
    return { path: imageUri, wasUploaded: false };
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

  return { path: data.path, wasUploaded: true };
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

      const { data, error } = await selectPostsWithFallback((select) =>
        supabase
          .from(TABLES.posts)
          .select(select)
          .or(filter)
          .order('created_at', { ascending: false })
          .range(from, to)
      );

      if (error) {
        throw error;
      }
      const rows = (data ?? []) as unknown as PostRow[];
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

  async getFollowingFeed(userId: string, page: number): Promise<Post[]> {
    const cacheKey = CacheKey.feedByFollowing(userId, page);
    const cached = await cacheFirst<Post[]>(cacheKey, CACHE_TTL_MS.feed, async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Get list of followed user IDs
      const { data: follows, error: followsError } = await supabase
        .from(TABLES.userFollows)
        .select('following_id')
        .eq('follower_id', userId);

      if (followsError) {
        throw followsError;
      }

      const followingIds = (follows ?? []).map((f) => f.following_id);

      if (followingIds.length === 0) {
        return [];
      }

      const { data, error } = await selectPostsWithFallback((select) =>
        supabase
          .from(TABLES.posts)
          .select(select)
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .range(from, to)
      );

      if (error) {
        throw error;
      }

      const rows = (data ?? []) as unknown as PostRow[];
      if (!rows.length) {
        return [];
      }

      const postIds = rows.map((row) => row.id);
      const [likesData, savedData] = await Promise.all([
        supabase
          .from(TABLES.likes)
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postIds),
        supabase
          .from(TABLES.savedPosts)
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postIds),
      ]);

      if (likesData.error) throw likesData.error;
      if (savedData.error) throw savedData.error;

      const likedSet = new Set((likesData.data ?? []).map((row) => row.post_id));
      const savedSet = new Set((savedData.data ?? []).map((row) => row.post_id));

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

  async getPublicFeed(page: number): Promise<Post[]> {
    const cacheKey = CacheKey.feedByUser('public', page);
    const cached = await cacheFirst<Post[]>(cacheKey, CACHE_TTL_MS.feed, async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await selectPostsWithFallback((select) =>
        supabase
          .from(TABLES.posts)
          .select(select)
          .order('created_at', { ascending: false })
          .range(from, to)
      );

      if (error) {
        throw error;
      }

      return Promise.all((data ?? []).map((row) => toDomainWithImages(row as unknown as PostRow)));
    });

    return cached ?? [];
  }

  async getPostsFromCommunity(communityId: number, page: number): Promise<Post[]> {
    const cacheKey = CacheKey.postsByCommunity(communityId, page);
    const cached = await cacheFirst<Post[]>(cacheKey, CACHE_TTL_MS.feed, async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await selectPostsWithFallback((select) =>
        supabase
          .from(TABLES.posts)
          .select(select)
          .eq('community_id', communityId)
          .order('created_at', { ascending: false })
          .range(from, to)
      );

      if (error) {
        throw error;
      }
      return Promise.all((data ?? []).map((row) => toDomainWithImages(row as unknown as PostRow)));
    });

    return cached ?? [];
  }

  async getPostsFromUser(userId: string, page: number): Promise<Post[]> {
    const cacheKey = CacheKey.postsByUser(userId, page);
    const cached = await cacheFirst<Post[]>(cacheKey, CACHE_TTL_MS.feed, async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await selectPostsWithFallback((select) =>
        supabase
          .from(TABLES.posts)
          .select(select)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(from, to)
      );

      if (error) {
        throw error;
      }

      const rows = (data ?? []) as unknown as PostRow[];
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

      const { data: postsData, error: postsError } = await selectPostsWithFallback((select) =>
        supabase.from(TABLES.posts).select(select).in('id', postIds)
      );

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
          const post = await toDomainWithImages(row as unknown as PostRow, {
            isSaved: true,
            isLiked: likedSet.has((row as unknown as PostRow).id),
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

  async getSavedPostsCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from(TABLES.savedPosts)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
    return count ?? 0;
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
    const { error } = await supabase.from(TABLES.likes).upsert(
      {
        post_id: postId,
        user_id: userId,
      },
      { onConflict: 'post_id,user_id', ignoreDuplicates: true }
    );
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
    const shouldUpload = Boolean(imageUri && (isLocalFile(imageUri) || isRemoteUrl(imageUri)));
    const insertImageUrl = !imageUri ? post.imageUrl ?? null : shouldUpload ? null : imageUri;

    const { data: createdRow, error: createError } = await selectPostsWithFallback((select) =>
      supabase
        .from(TABLES.posts)
        .insert({
          content: post.content,
          community_id: post.communityId,
          user_id: post.userId,
          image_url: insertImageUrl,
        })
        .select(select)
        .single<PostRow>()
    );

    if (createError) {
      throw createError;
    }

    if (!createdRow) {
      throw new Error('Failed to create post: no data returned');
    }

    if (!shouldUpload || !imageUri) {
      const created = await toDomainWithImages(createdRow);
      await clearCache(CacheKey.feedByUser(post.userId, 0));
      return created;
    }

    let uploadedPath: string | null = null;

    try {
      const upload = await uploadPostImage(imageUri, post.userId);
      uploadedPath = upload.path;
      const { data: updatedRow, error: updateError } = await selectPostsWithFallback((select) =>
        supabase
          .from(TABLES.posts)
          .update({ image_url: upload.path })
          .eq('id', createdRow.id)
          .select(select)
          .single<PostRow>()
      );

      if (updateError) {
        throw updateError;
      }

      if (!updatedRow) {
        throw new Error('Failed to update post image: no data returned');
      }

      const created = await toDomainWithImages(updatedRow);
      await clearCache(CacheKey.feedByUser(post.userId, 0));
      return created;
    } catch (error) {
      if (uploadedPath) {
        try {
          await supabase.storage.from(POST_IMAGE_BUCKET).remove([uploadedPath]);
        } catch {
          // Ignore cleanup failures to preserve the original error context.
        }
      }
      try {
        await supabase.from(TABLES.posts).delete().eq('id', createdRow.id);
      } catch {
        // Ignore rollback failures to preserve the original error context.
      }
      throw error;
    }
  }

  async getPendingPosts(communityId: number): Promise<Post[]> {
    const { data, error } = await selectPostsWithFallback((select) =>
      supabase
        .from(TABLES.posts)
        .select(select)
        .eq('community_id', communityId)
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false })
    );

    if (error) {
      throw error;
    }

    return Promise.all((data ?? []).map((row) => toDomainWithImages(row as unknown as PostRow)));
  }

  async updateModerationStatus(postId: number, status: Post['moderationStatus']): Promise<void> {
    const { error } = await supabase
      .from(TABLES.posts)
      .update({ moderation_status: status })
      .eq('id', postId);

    if (error) {
      throw error;
    }

    // Clear relevant caches
    await clearCache(CacheKey.feedByUser('public', 0));
  }

  async markPostForReview(postId: number): Promise<void> {
    const { error } = await supabase
      .from(TABLES.posts)
      .update({ moderation_status: 'pending' })
      .eq('id', postId);

    if (error) {
      throw error;
    }

    // Clear relevant caches
    await clearCache(CacheKey.feedByUser('public', 0));
  }

  async deletePost(postId: number): Promise<void> {
    const { error } = await supabase.from(TABLES.posts).delete().eq('id', postId);
    if (error) {
      throw error;
    }
  }
}
