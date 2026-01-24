import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import * as Network from 'expo-network';

import type { Post } from '../../../domain/models/post';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useRepositories } from '../../../app/providers/RepositoryProvider';
import { usePostsStore } from '../../../app/store/postsStore';
import { enqueueWrite } from '../../../data/offline/queueStore';
import { isMockMode } from '../../../config/appConfig';
import { communityDetailCopy } from '../../content/communityDetailCopy';
import { showGuestGateAlert } from '../../components/GuestGateAlert';

type UsePostActionsParams = {
  communityId: number;
  canModerate: boolean;
};

export const usePostActions = ({ communityId, canModerate }: UsePostActionsParams) => {
  const { session, exitGuest } = useAuth();
  const { posts: postRepository, moderationLogs: logRepository } = useRepositories();
  const updatePost = usePostsStore((state) => state.updatePost);
  const setSavedForUser = usePostsStore((state) => state.setSavedForUser);
  const likeInFlightRef = useRef<Set<number>>(new Set());

  const requireUser = useCallback(() => {
    if (!session?.user?.id) {
      showGuestGateAlert({ onSignIn: () => void exitGuest() });
      return false;
    }
    return true;
  }, [exitGuest, session?.user?.id]);

  const handleToggleLike = useCallback(
    async (post: Post) => {
      if (!requireUser()) {
        return;
      }

      if (likeInFlightRef.current.has(post.id)) {
        return;
      }
      likeInFlightRef.current.add(post.id);

      const nextLiked = !post.isLiked;
      updatePost(post.id, {
        isLiked: nextLiked,
        likesCount: Math.max(0, (post.likesCount ?? 0) + (nextLiked ? 1 : -1)),
      });

      try {
        const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
        if (!status.isConnected) {
          await enqueueWrite({
            id: `${Date.now()}`,
            type: nextLiked ? 'like_post' : 'unlike_post',
            payload: { postId: post.id, userId: session?.user?.id ?? '' },
            createdAt: Date.now(),
          });
          return;
        }

        if (nextLiked) {
          await postRepository.likePost(post.id, session?.user?.id ?? '');
        } else {
          await postRepository.dislikePost(post.id, session?.user?.id ?? '');
        }
      } catch (err) {
        updatePost(post.id, {
          isLiked: post.isLiked,
          likesCount: post.likesCount,
        });
        if (err instanceof Error) {
          Alert.alert(communityDetailCopy.alerts.likeFailed.title, err.message);
        }
      } finally {
        likeInFlightRef.current.delete(post.id);
      }
    },
    [postRepository, requireUser, session?.user?.id, updatePost]
  );

  const handleToggleSave = useCallback(
    async (post: Post) => {
      if (!requireUser()) {
        return;
      }

      const nextSaved = !post.isSaved;
      updatePost(post.id, { isSaved: nextSaved });
      if (session?.user?.id) {
        setSavedForUser(session.user.id, post.id, nextSaved);
      }

      const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
      if (!status.isConnected) {
        await enqueueWrite({
          id: `${Date.now()}`,
          type: nextSaved ? 'save_post' : 'unsave_post',
          payload: { postId: post.id, userId: session?.user?.id ?? '' },
          createdAt: Date.now(),
        });
        return;
      }

      try {
        if (nextSaved) {
          await postRepository.bookmarkPost(post.id, session?.user?.id ?? '');
        } else {
          await postRepository.unbookmarkPost(post.id, session?.user?.id ?? '');
        }
      } catch (err) {
        updatePost(post.id, { isSaved: post.isSaved });
        if (session?.user?.id) {
          setSavedForUser(session.user.id, post.id, post.isSaved ?? false);
        }
        if (err instanceof Error) {
          Alert.alert(communityDetailCopy.alerts.savedFailed.title, err.message);
        }
      }
    },
    [postRepository, requireUser, session?.user?.id, updatePost]
  );

  const handleMarkForReview = useCallback(
    async (post: Post) => {
      if (!session?.user?.id) {
        Alert.alert('Error', 'You must be logged in to mark posts for review');
        return;
      }

      if (!canModerate) {
        Alert.alert('Not Authorized', 'Only moderators and owners can mark posts for review');
        return;
      }

      Alert.alert(
        'Mark for Review',
        'Are you sure you want to mark this post for review? This will notify other moderators.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark',
            onPress: async () => {
              const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
              if (!status.isConnected) {
                Alert.alert('Offline', 'You must be online to mark posts for review');
                return;
              }

              try {
                await postRepository.markPostForReview(post.id);
                await logRepository.createLog({
                  communityId,
                  moderatorId: session.user.id,
                  action: 'mark_for_review',
                  postId: post.id,
                });
                Alert.alert('Marked', 'This post has been marked for review');
              } catch (err) {
                if (err instanceof Error) {
                  Alert.alert('Failed', err.message);
                }
              }
            },
          },
        ]
      );
    },
    [canModerate, communityId, logRepository, postRepository, session?.user?.id]
  );

  return {
    handleToggleLike,
    handleToggleSave,
    handleMarkForReview,
  };
};
