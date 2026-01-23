import type { Notification } from '../../domain/models/notification';
import type { User } from '../../domain/models/user';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import { CacheKey, CACHE_TTL_MS } from '../cache/cachePolicy';
import { cacheFirst } from '../cache/cacheHelpers';
import { clearCache, getCache, setCache } from '../cache/cacheStore';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';
import { readUploadBytes } from '../supabase/storageUpload';

const USER_AVATAR_BUCKET = 'user-avatars';
const POST_IMAGE_BUCKET = 'post-images';

type UserRow = {
  id: string;
  name: string;
  photo_url?: string | null;
  created_at?: string;
  online_visible?: boolean | null;
  notifications_enabled?: boolean | null;
  last_seen_at?: string | null;
  followers_count?: number | null;
  following_count?: number | null;
  bio?: string | null;
  location?: string | null;
};

type NotificationActorRow = {
  id: string;
  name: string;
  photo_url?: string | null;
};

type NotificationPostRow = {
  id: number;
  image_url?: string | null;
  content?: string | null;
};

type NotificationRowRaw = Omit<NotificationRow, 'actor' | 'post'> & {
  actor?: NotificationActorRow | NotificationActorRow[] | null;
  post?: NotificationPostRow | NotificationPostRow[] | null;
};

type NotificationRow = {
  id: number;
  type: 'follow' | 'post_like' | 'post_comment';
  created_at: string;
  read_at?: string | null;
  metadata?: { comment_preview?: string | null } | null;
  actor?: NotificationActorRow | null;
  post?: NotificationPostRow | null;
};

function isRemoteUrl(url: string) {
  return url.startsWith('http://') || url.startsWith('https://');
}

function isLocalFile(uri: string) {
  return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');
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

function resolveUserAvatarPath(photoUrl?: string | null): string | null {
  if (!photoUrl) {
    return null;
  }
  if (!isRemoteUrl(photoUrl)) {
    return photoUrl;
  }
  const marker = `/storage/v1/object/public/${USER_AVATAR_BUCKET}/`;
  const index = photoUrl.indexOf(marker);
  if (index === -1) {
    return null;
  }
  return photoUrl.slice(index + marker.length);
}

function resolvePostImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) {
    return null;
  }
  if (isRemoteUrl(imageUrl)) {
    return imageUrl;
  }
  const { data } = supabase.storage.from(POST_IMAGE_BUCKET).getPublicUrl(imageUrl);
  return data?.publicUrl ?? null;
}

function toDomain(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    photoUrl: resolveUserPhotoUrl(row.photo_url ?? null),
    createdAt: row.created_at,
    onlineVisible: row.online_visible ?? true,
    notificationsEnabled: row.notifications_enabled ?? true,
    lastSeenAt: row.last_seen_at ?? null,
    followersCount: row.followers_count ?? undefined,
    followingCount: row.following_count ?? undefined,
    bio: row.bio ?? null,
    location: row.location ?? null,
  };
}

async function uploadUserAvatar(imageUri: string, userId: string): Promise<string> {
  console.info('[uploadUserAvatar] uri', imageUri);
  const bytes = await readUploadBytes(imageUri);
  console.info('[uploadUserAvatar] byte length', bytes.length);
  if (bytes.length === 0) {
    throw new Error('Image upload failed: empty file payload.');
  }
  const extension = imageUri.split('?')[0]?.split('.').pop()?.toLowerCase() || 'jpg';
  const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension;
  const contentType =
    normalizedExtension === 'jpg' ? 'image/jpeg' : `image/${normalizedExtension}`;
  const filePath = `${userId}/${Date.now()}.${normalizedExtension}`;
  console.info('[uploadUserAvatar] upload path', filePath, 'contentType', contentType);

  const { data, error } = await supabase.storage
    .from(USER_AVATAR_BUCKET)
    .upload(filePath, bytes, { upsert: true, contentType });

  if (error) {
    throw error;
  }

  return data.path;
}

const mergeFollowCounts = (base: User, cached?: User | null) => ({
  ...base,
  followersCount: base.followersCount ?? cached?.followersCount ?? 0,
  followingCount: base.followingCount ?? cached?.followingCount ?? 0,
});

const bumpCachedFollowCounts = async (followerId: string, followingId: string, delta: number) => {
  const followerCache = await getCache<User>(CacheKey.user(followerId), { allowExpired: true });
  if (followerCache) {
    await setCache(
      CacheKey.user(followerId),
      {
        ...followerCache,
        followingCount: Math.max(0, (followerCache.followingCount ?? 0) + delta),
      },
      CACHE_TTL_MS.profiles
    );
  }

  const followingCache = await getCache<User>(CacheKey.user(followingId), { allowExpired: true });
  if (followingCache) {
    await setCache(
      CacheKey.user(followingId),
      {
        ...followingCache,
        followersCount: Math.max(0, (followingCache.followersCount ?? 0) + delta),
      },
      CACHE_TTL_MS.profiles
    );
  }
};

export class SupabaseUserRepository implements UserRepository {
  async getUser(id: string): Promise<User | null> {
    const cacheKey = CacheKey.user(id);
    const cached = await cacheFirst<User | null>(cacheKey, CACHE_TTL_MS.profiles, async () => {
      const cachedUser = await getCache<User>(cacheKey, { allowExpired: true });
      const { data, error } = await supabase
        .from(TABLES.users)
        .select('*')
        .eq('id', id)
        .maybeSingle<UserRow>();

      if (error) {
        throw error;
      }
      if (!data) {
        return null;
      }
      const base = toDomain(data);
      return mergeFollowCounts(base, cachedUser);
    });

    return cached ?? null;
  }

  async getUsersBatch(userIds: string[]): Promise<Map<string, User>> {
    if (userIds.length === 0) {
      return new Map();
    }

    // Fetch all users in a single query
    const { data, error } = await supabase
      .from(TABLES.users)
      .select('*')
      .in('id', userIds);

    if (error) {
      throw error;
    }

    const userMap = new Map<string, User>();
    
    // Convert rows to domain objects and cache them
    const rows = (data ?? []) as UserRow[];
    await Promise.all(
      rows.map(async (row) => {
        const cacheKey = CacheKey.user(row.id);
        const cachedUser = await getCache<User>(cacheKey, { allowExpired: true });
        const base = toDomain(row);
        const user = mergeFollowCounts(base, cachedUser);
        
        // Update cache
        await setCache(cacheKey, user, CACHE_TTL_MS.profiles);
        
        userMap.set(row.id, user);
      })
    );

    return userMap;
  }

  async createUser(user: User): Promise<User> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLES.users)
      .insert({
        id: user.id,
        name: user.name,
        photo_url: user.photoUrl ?? null,
        online_visible: user.onlineVisible ?? true,
        notifications_enabled: user.notificationsEnabled ?? true,
        last_seen_at: user.lastSeenAt ?? now,
        followers_count: user.followersCount ?? 0,
        following_count: user.followingCount ?? 0,
      })
      .select('*')
      .single<UserRow>();

    if (error) {
      throw error;
    }
    const created = toDomain(data);
    const payload = mergeFollowCounts(created);
    await setCache(CacheKey.user(created.id), payload, CACHE_TTL_MS.profiles);
    return payload;
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase.from(TABLES.users).delete().eq('id', id);
    if (error) {
      throw error;
    }
    await clearCache(CacheKey.user(id));
  }

  async setOnlineVisibility(id: string, visible: boolean): Promise<void> {
    const { data, error } = await supabase
      .from(TABLES.users)
      .update({ online_visible: visible })
      .eq('id', id)
      .select('*')
      .single<UserRow>();

    if (error) {
      throw error;
    }
    const cachedUser = await getCache<User>(CacheKey.user(id), { allowExpired: true });
    await setCache(
      CacheKey.user(id),
      mergeFollowCounts(toDomain(data), cachedUser),
      CACHE_TTL_MS.profiles
    );
  }

  async setNotificationsEnabled(id: string, enabled: boolean): Promise<void> {
    const { data, error } = await supabase
      .from(TABLES.users)
      .update({ notifications_enabled: enabled })
      .eq('id', id)
      .select('*')
      .single<UserRow>();

    if (error) {
      throw error;
    }
    const cachedUser = await getCache<User>(CacheKey.user(id), { allowExpired: true });
    await setCache(
      CacheKey.user(id),
      mergeFollowCounts(toDomain(data), cachedUser),
      CACHE_TTL_MS.profiles
    );
  }

  async savePushToken(id: string, token: string, platform: string, env: 'dev' | 'prod'): Promise<void> {
    const { error } = await supabase.from(TABLES.pushTokens).upsert(
      {
        user_id: id,
        token,
        platform,
        env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' }
    );

    if (error) {
      throw error;
    }
  }

  async updateLastSeenAt(id: string, timestamp: string): Promise<void> {
    const { data, error } = await supabase
      .from(TABLES.users)
      .update({ last_seen_at: timestamp })
      .eq('id', id)
      .select('*')
      .single<UserRow>();

    if (error) {
      throw error;
    }
    const cachedUser = await getCache<User>(CacheKey.user(id), { allowExpired: true });
    await setCache(
      CacheKey.user(id),
      mergeFollowCounts(toDomain(data), cachedUser),
      CACHE_TTL_MS.profiles
    );
  }

  async updateProfilePhoto(userId: string, imageUri: string, previousPhotoUrl?: string | null): Promise<User> {
    const shouldUpload = isLocalFile(imageUri) || isRemoteUrl(imageUri);
    const previousPath = resolveUserAvatarPath(previousPhotoUrl ?? null);
    const path = shouldUpload ? await uploadUserAvatar(imageUri, userId) : imageUri;
    const { data, error } = await supabase
      .from(TABLES.users)
      .update({ photo_url: path })
      .eq('id', userId)
      .select('*')
      .single<UserRow>();

    if (error) {
      throw error;
    }
    const cachedUser = await getCache<User>(CacheKey.user(userId), { allowExpired: true });
    const payload = mergeFollowCounts(toDomain(data), cachedUser);
    await setCache(CacheKey.user(userId), payload, CACHE_TTL_MS.profiles);
    if (previousPath && previousPath !== path) {
      const { error: removeError } = await supabase.storage
        .from(USER_AVATAR_BUCKET)
        .remove([previousPath]);
      if (removeError) {
        console.warn('[updateProfilePhoto] failed to delete previous avatar', removeError.message);
      }
    }
    return payload;
  }

  async updateProfile(
    userId: string,
    updates: { name?: string; bio?: string | null; location?: string | null }
  ): Promise<User> {
    const updateData: Partial<{ name: string; bio: string | null; location: string | null }> = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.bio !== undefined) {
      updateData.bio = updates.bio;
    }
    if (updates.location !== undefined) {
      updateData.location = updates.location;
    }

    const { data, error } = await supabase
      .from(TABLES.users)
      .update(updateData)
      .eq('id', userId)
      .select('*')
      .single<UserRow>();

    if (error) {
      throw error;
    }

    const cachedUser = await getCache<User>(CacheKey.user(userId), { allowExpired: true });
    const payload = mergeFollowCounts(toDomain(data), cachedUser);
    await setCache(CacheKey.user(userId), payload, CACHE_TTL_MS.profiles);
    return payload;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from(TABLES.notifications)
      .select(
        `id,
        type,
        created_at,
        read_at,
        metadata,
        actor:profiles!notifications_actor_id_fkey ( id, name, photo_url ),
        post:posts ( id, image_url, content )`
      )
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as NotificationRowRaw[];
    const normalizedRows: NotificationRow[] = rows.map((row) => ({
      ...row,
      actor: Array.isArray(row.actor) ? row.actor[0] ?? null : row.actor ?? null,
      post: Array.isArray(row.post) ? row.post[0] ?? null : row.post ?? null,
    }));
    const followActorIds = normalizedRows
      .filter((row) => row.type === 'follow' && row.actor?.id)
      .map((row) => row.actor?.id as string);
    let followedSet = new Set<string>();

    if (followActorIds.length > 0) {
      const { data: follows, error: followError } = await supabase
        .from(TABLES.userFollows)
        .select('following_id')
        .eq('follower_id', userId)
        .in('following_id', followActorIds);

      if (followError) {
        throw followError;
      }
      followedSet = new Set((follows ?? []).map((row) => row.following_id));
    }

    return normalizedRows
      .filter((row) => row.actor?.id)
      .map((row) => ({
        id: row.id,
        type: row.type,
        createdAt: row.created_at,
        readAt: row.read_at ?? null,
        actor: {
          id: row.actor?.id ?? '',
          name: row.actor?.name ?? '',
          photoUrl: resolveUserPhotoUrl(row.actor?.photo_url ?? null),
        },
        post: row.post
          ? {
              id: row.post.id,
              imageUrl: resolvePostImageUrl(row.post.image_url ?? null),
              content: row.post.content ?? null,
            }
          : undefined,
        metadata: row.metadata
          ? {
              commentPreview: row.metadata.comment_preview ?? null,
            }
          : undefined,
        isFollowedByMe: row.type === 'follow' ? followedSet.has(row.actor?.id ?? '') : undefined,
      }));
  }

  async markNotificationRead(notificationId: number): Promise<void> {
    const { error } = await supabase
      .from(TABLES.notifications)
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      throw error;
    }
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.notifications)
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .is('read_at', null);

    if (error) {
      throw error;
    }
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase.from(TABLES.userFollows).insert({
      follower_id: followerId,
      following_id: followingId,
    });

    if (error) {
      throw error;
    }
    await bumpCachedFollowCounts(followerId, followingId, 1);
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.userFollows)
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      throw error;
    }
    await bumpCachedFollowCounts(followerId, followingId, -1);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(TABLES.userFollows)
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle<{ id: number }>();

    if (error) {
      throw error;
    }
    return Boolean(data?.id);
  }

  async getFollowersCount(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from(TABLES.users)
      .select('followers_count')
      .eq('id', userId)
      .maybeSingle<{ followers_count: number | null }>();

    if (error) {
      throw error;
    }
    if (data?.followers_count !== null && data?.followers_count !== undefined) {
      return data.followers_count;
    }

    const { count, error: countError } = await supabase
      .from(TABLES.userFollows)
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (countError) {
      throw countError;
    }
    return count ?? 0;
  }

  async getFollowingCount(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from(TABLES.users)
      .select('following_count')
      .eq('id', userId)
      .maybeSingle<{ following_count: number | null }>();

    if (error) {
      throw error;
    }
    if (data?.following_count !== null && data?.following_count !== undefined) {
      return data.following_count;
    }

    const { count, error: countError } = await supabase
      .from(TABLES.userFollows)
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (countError) {
      throw countError;
    }
    return count ?? 0;
  }
}
