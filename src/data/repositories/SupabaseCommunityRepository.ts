import type { Community } from '../../domain/models/community';
import type { Subscription } from '../../domain/models/subscription';
import type { CommunityRepository, CommunitySearchParams } from '../../domain/repositories/CommunityRepository';
import { CacheKey, CACHE_TTL_MS } from '../cache/cachePolicy';
import { cacheFirst } from '../cache/cacheHelpers';
import { clearCache, setCache } from '../cache/cacheStore';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';
import { readUploadBytes } from '../supabase/storageUpload';

const COMMUNITY_IMAGE_BUCKET = 'community-images';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;
const COMMUNITY_PAGE_SIZE = 20;

type CommunityRow = {
  id: number;
  title: string;
  description: string;
  image_url?: string | null;
  owner_id: string;
  topic_id?: number | null;
  created_at?: string;
  post_permission?: string | null;
};

type CommunitySearchRow = CommunityRow & {
  subscribers_count?: number | null;
};

type SubscriptionRow = {
  id: number;
  user_id: string;
  community_id: number;
};

function toSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    communityId: row.community_id,
  };
}

function isRemoteUrl(url: string) {
  return url.startsWith('http://') || url.startsWith('https://');
}

function isLocalFile(uri: string) {
  return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');
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

type UploadResult = {
  path: string;
  wasUploaded: boolean;
};

function isBucketNotFoundError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('bucket') && error.message.toLowerCase().includes('not found');
  }
  return false;
}

async function uploadCommunityImage(imageUri: string, ownerId: string): Promise<UploadResult> {
  if (!isLocalFile(imageUri)) {
    return { path: imageUri, wasUploaded: false };
  }

  const bytes = await readUploadBytes(imageUri);
  if (bytes.length === 0) {
    throw new Error('Image upload failed: empty file payload.');
  }
  const extension = imageUri.split('?')[0]?.split('.').pop()?.toLowerCase() || 'jpg';
  const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension;
  const contentType =
    normalizedExtension === 'jpg' ? 'image/jpeg' : `image/${normalizedExtension}`;
  const filePath = `${ownerId}/${Date.now()}.${normalizedExtension}`;

  const { data, error } = await supabase.storage
    .from(COMMUNITY_IMAGE_BUCKET)
    .upload(filePath, bytes, { upsert: true, contentType });

  if (error) {
    throw error;
  }

  return { path: data.path, wasUploaded: true };
}

async function toDomainWithImage(row: CommunityRow, subscribersCount?: number): Promise<Community> {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: await resolveCommunityImageUrl(row.image_url ?? null),
    ownerId: row.owner_id,
    topicId: row.topic_id ?? null,
    createdAt: row.created_at,
    subscribersCount,
    postPermission: (row.post_permission as Community['postPermission']) ?? 'anyone_follows',
  };
}

export class SupabaseCommunityRepository implements CommunityRepository {
  async getCommunities(params?: CommunitySearchParams): Promise<Community[]> {
    const normalizedSearch = params?.search?.trim() ?? '';
    const normalizedSort = params?.sort ?? 'mostFollowed';
    const normalizedTopicId = params?.topicId ?? null;
    const page = params?.page ?? 0;
    const pageSize = params?.pageSize ?? COMMUNITY_PAGE_SIZE;
    const cacheKey = CacheKey.communitiesSearch({
      search: normalizedSearch,
      sort: normalizedSort,
      topicId: normalizedTopicId,
      page,
      pageSize,
    });
    const cached = await cacheFirst<Community[]>(cacheKey, CACHE_TTL_MS.communities, async () => {
      const { data, error } = await supabase.rpc('search_communities', {
        search_text: normalizedSearch,
        topic_filter: normalizedTopicId,
        sort_order: normalizedSort,
        limit_count: pageSize,
        offset_count: page * pageSize,
      });
      if (error) {
        throw error;
      }
      
      const communities = await Promise.all(
        (data ?? []).map((row: CommunitySearchRow) => {
          const count = row.subscribers_count ?? 0;
          return toDomainWithImage(row as CommunityRow, count);
        })
      );

      return communities;
    });

    return cached ?? [];
  }

  async getCommunity(id: number): Promise<Community | null> {
    const cacheKey = CacheKey.community(id);
    const cached = await cacheFirst<Community | null>(cacheKey, CACHE_TTL_MS.communities, async () => {
      const { data, error } = await supabase
        .from(TABLES.communities)
        .select('*')
        .eq('id', id)
        .maybeSingle<CommunityRow>();

      if (error) {
        throw error;
      }
      return data ? await toDomainWithImage(data) : null;
    });

    return cached ?? null;
  }

  async getCommunitiesFromUser(userId: string): Promise<Community[]> {
    const cacheKey = CacheKey.communitiesByUser(userId);
    const cached = await cacheFirst<Community[]>(cacheKey, CACHE_TTL_MS.communities, async () => {
      const { data, error } = await supabase
        .from(TABLES.communities)
        .select('*')
        .eq('owner_id', userId);

      if (error) {
        throw error;
      }
      return Promise.all((data ?? []).map((row) => toDomainWithImage(row as CommunityRow)));
    });

    return cached ?? [];
  }

  async getSubscribedCommunities(userId: string): Promise<Community[]> {
    const cacheKey = CacheKey.communitiesBySubscriber(userId);
    const cached = await cacheFirst<Community[]>(cacheKey, CACHE_TTL_MS.communities, async () => {
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from(TABLES.subscriptions)
        .select('community_id')
        .eq('user_id', userId);

      if (subscriptionsError) {
        throw subscriptionsError;
      }

      const communityIds = (subscriptions ?? []).map((row) => row.community_id);
      if (!communityIds.length) {
        return [];
      }

      const { data, error } = await supabase
        .from(TABLES.communities)
        .select('*')
        .in('id', communityIds);

      if (error) {
        throw error;
      }

      return Promise.all((data ?? []).map((row) => toDomainWithImage(row as CommunityRow)));
    });

    return cached ?? [];
  }

  async getCommunitySubscribersCount(communityId: number): Promise<number> {
    const { count, error } = await supabase
      .from(TABLES.subscriptions)
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId);

    if (error) {
      throw error;
    }
    return count ?? 0;
  }

  async saveCommunity(community: Community, imageUri?: string | null): Promise<Community> {
    let resolvedImageUrl = community.imageUrl ?? null;
    let uploadedPath: string | null = null;
    if (imageUri) {
      try {
        const upload = await uploadCommunityImage(imageUri, community.ownerId);
        resolvedImageUrl = upload.path;
        uploadedPath = upload.wasUploaded ? upload.path : null;
      } catch (error) {
        if (!isBucketNotFoundError(error)) {
          throw error;
        }
        resolvedImageUrl = null;
        uploadedPath = null;
      }
    }

    const payload = {
      title: community.title,
      description: community.description,
      image_url: resolvedImageUrl,
      owner_id: community.ownerId,
      topic_id: community.topicId ?? null,
    };
    try {
      const { data, error } = await supabase
        .from(TABLES.communities)
        .insert(payload)
        .select('*')
        .single<CommunityRow>();

      if (error) {
        throw error;
      }
      const created = await toDomainWithImage(data);
      await setCache(CacheKey.community(created.id), created, CACHE_TTL_MS.communities);
      return created;
    } catch (error) {
      if (uploadedPath) {
        try {
          await supabase.storage.from(COMMUNITY_IMAGE_BUCKET).remove([uploadedPath]);
        } catch {
          // Ignore cleanup failures to preserve the original error context.
        }
      }
      throw error;
    }
  }

  async updateCommunitySettings(
    communityId: number,
    settings: {
      postPermission?: Community['postPermission'];
      imageUrl?: string | null;
    },
    imageUri?: string | null
  ): Promise<Community> {
    let previousImagePath: string | null = null;
    let resolvedImageUrl = settings.imageUrl;
    let uploadedPath: string | null = null;

    // Handle image upload if imageUri is provided
    if (imageUri) {
      const { data: communityRow, error: communityError } = await supabase
        .from(TABLES.communities)
        .select('owner_id, image_url')
        .eq('id', communityId)
        .single<Pick<CommunityRow, 'owner_id' | 'image_url'>>();

      if (communityError) {
        throw communityError;
      }

      if (!communityRow) {
        throw new Error('Community not found');
      }
      previousImagePath = communityRow.image_url ?? null;

      try {
        const upload = await uploadCommunityImage(imageUri, communityRow.owner_id);
        resolvedImageUrl = upload.path;
        uploadedPath = upload.wasUploaded ? upload.path : null;
      } catch (error) {
        if (!isBucketNotFoundError(error)) {
          throw error;
        }
        resolvedImageUrl = null;
        uploadedPath = null;
      }
    }

    // Build update payload with only fields that are provided
    const payload: Partial<{
      post_permission: string;
      image_url: string | null;
    }> = {};

    if (settings.postPermission !== undefined) {
      payload.post_permission = settings.postPermission;
    }

    if (resolvedImageUrl !== undefined) {
      payload.image_url = resolvedImageUrl;
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.communities)
        .update(payload)
        .eq('id', communityId)
        .select('*')
        .single<CommunityRow>();

      if (error) {
        throw error;
      }

      const updated = await toDomainWithImage(data);

      // Clear cache
      await clearCache(CacheKey.community(communityId));
      await clearCache(
        CacheKey.communitiesSearch({
          search: '',
          sort: 'mostFollowed',
          topicId: null,
          page: 0,
          pageSize: COMMUNITY_PAGE_SIZE,
        })
      );

      if (previousImagePath && resolvedImageUrl && previousImagePath !== resolvedImageUrl) {
        const { error: removeError } = await supabase.storage
          .from(COMMUNITY_IMAGE_BUCKET)
          .remove([previousImagePath]);
        if (removeError) {
          console.warn('[updateCommunitySettings] failed to delete previous image', removeError.message);
        }
      }

      return updated;
    } catch (error) {
      // Clean up uploaded image if database update fails
      if (uploadedPath) {
        try {
          await supabase.storage.from(COMMUNITY_IMAGE_BUCKET).remove([uploadedPath]);
        } catch {
          // Ignore cleanup failures
        }
      }
      throw error;
    }
  }

  async subscribe(subscription: Subscription): Promise<Subscription> {
    const { data, error } = await supabase
      .from(TABLES.subscriptions)
      .insert({
        user_id: subscription.userId,
        community_id: subscription.communityId,
      })
      .select('*')
      .single<SubscriptionRow>();

    if (error) {
      throw error;
    }
    return toSubscription(data);
  }

  async unsubscribe(subscription: Subscription): Promise<void> {
    const { error } = await supabase
      .from(TABLES.subscriptions)
      .delete()
      .eq('user_id', subscription.userId)
      .eq('community_id', subscription.communityId);

    if (error) {
      throw error;
    }
  }

  async getSubscription(userId: string, communityId: number): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from(TABLES.subscriptions)
      .select('*')
      .eq('user_id', userId)
      .eq('community_id', communityId)
      .maybeSingle<SubscriptionRow>();

    if (error) {
      throw error;
    }
    return data ? toSubscription(data) : null;
  }

  async deleteCommunity(communityId: number): Promise<void> {
    const { error } = await supabase.from(TABLES.communities).delete().eq('id', communityId);
    if (error) {
      throw error;
    }
    await clearCache(CacheKey.community(communityId));
  }
}
