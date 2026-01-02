import type { QueuedWrite } from './queueStore';
import type { CommentRepository } from '../../domain/repositories/CommentRepository';
import type { CommunityRepository } from '../../domain/repositories/CommunityRepository';
import type { PostRepository } from '../../domain/repositories/PostRepository';
import { isMockMode } from '../../config/appConfig';
import { supabase } from '../supabase/client';

type CreatePostPayload = {
  content: string;
  communityId: number;
  userId: string;
  imageUri?: string | null;
};

type CreateCommunityPayload = {
  title: string;
  description: string;
  ownerId: string;
  imageUrl?: string | null;
  imageUri?: string | null;
};

type SubscriptionPayload = {
  id: number;
  userId: string;
  communityId: number;
};

export async function processQueuedWrite(
  item: QueuedWrite,
  repositories: { posts: PostRepository; comments: CommentRepository; communities: CommunityRepository }
) {
  if (item.type === 'create_post') {
    const payload = item.payload as CreatePostPayload;
    if (!isMockMode()) {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('No active session');
      }
    }
    await repositories.posts.savePost({
      id: 0,
      content: payload.content,
      communityId: payload.communityId,
      userId: payload.userId,
    }, payload.imageUri ?? null);
    return;
  }

  if (item.type === 'create_community') {
    const payload = item.payload as CreateCommunityPayload;
    if (!isMockMode()) {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('No active session');
      }
    }
    await repositories.communities.saveCommunity({
      id: 0,
      title: payload.title,
      description: payload.description,
      ownerId: payload.ownerId,
      imageUrl: payload.imageUrl ?? null,
    }, payload.imageUri ?? null);
    return;
  }

  if (item.type === 'like_post') {
    const payload = item.payload as { postId: number; userId: string };
    await repositories.posts.likePost(payload.postId, payload.userId);
    return;
  }

  if (item.type === 'save_post') {
    const payload = item.payload as { postId: number; userId: string };
    await repositories.posts.bookmarkPost(payload.postId, payload.userId);
    return;
  }

  if (item.type === 'unlike_post') {
    const payload = item.payload as { postId: number; userId: string };
    await repositories.posts.dislikePost(payload.postId, payload.userId);
    return;
  }

  if (item.type === 'unsave_post') {
    const payload = item.payload as { postId: number; userId: string };
    await repositories.posts.unbookmarkPost(payload.postId, payload.userId);
    return;
  }

  if (item.type === 'add_comment') {
    const payload = item.payload as { postId: number; userId: string; content: string };
    await repositories.comments.saveComment({
      id: 0,
      postId: payload.postId,
      userId: payload.userId,
      content: payload.content,
    });
    return;
  }

  if (item.type === 'subscribe_community') {
    const payload = item.payload as SubscriptionPayload;
    await repositories.communities.subscribe(payload);
    return;
  }

  if (item.type === 'unsubscribe_community') {
    const payload = item.payload as SubscriptionPayload;
    await repositories.communities.unsubscribe(payload);
    return;
  }

  throw new Error(`Unknown queued write: ${item.type}`);
}
