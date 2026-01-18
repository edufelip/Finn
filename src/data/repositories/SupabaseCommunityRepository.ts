import type { Community } from '../../domain/models/community';
import type { Subscription } from '../../domain/models/subscription';
import type { CommunityRepository } from '../../domain/repositories/CommunityRepository';
import { CacheKey, CACHE_TTL_MS } from '../cache/cachePolicy';
import { cacheFirst } from '../cache/cacheHelpers';
import { clearCache, setCache } from '../cache/cacheStore';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';

const COMMUNITY_IMAGE_BUCKET = 'community-images';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;

type CommunityRow = {
  id: number;
  title: string;
  description: string;
  image_url?: string | null;
  owner_id: string;
  created_at?: string;
};

type SubscriptionRow = {
  id: number;
  user_id: string;
  community_id: number;
};

function toDomain(row: CommunityRow, subscribersCount?: number): Community {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url ?? null,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    subscribersCount,
  };
}

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

  const response = await fetch(imageUri);
  const blob = await response.blob();
  const extension = imageUri.split('?')[0]?.split('.').pop()?.toLowerCase() || 'jpg';
  const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension;
  const contentType =
    blob.type || (normalizedExtension === 'jpg' ? 'image/jpeg' : `image/${normalizedExtension}`);
  const filePath = `${ownerId}/${Date.now()}.${normalizedExtension}`;

  const { data, error } = await supabase.storage
    .from(COMMUNITY_IMAGE_BUCKET)
    .upload(filePath, blob, { upsert: true, contentType });

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
    createdAt: row.created_at,
    subscribersCount,
  };
}

export class SupabaseCommunityRepository implements CommunityRepository {
  async getCommunities(search?: string | null): Promise<Community[]> {
    const cacheKey = CacheKey.communities(search);
    const cached = await cacheFirst<Community[]>(cacheKey, CACHE_TTL_MS.communities, async () => {
      let query = supabase.from(TABLES.communities).select('*');
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }
      const { data, error } = await query;
      if (error) {
        throw error;
      }
      return Promise.all((data ?? []).map((row) => toDomainWithImage(row as CommunityRow)));
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
