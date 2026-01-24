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
import { commonCopy } from '../../content/commonCopy';
import { showGuestGateAlert } from '../../components/GuestGateAlert';
import { applyOptimisticLike, applyOptimisticSave } from '../../utils/postToggleUtils';

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

      const { nextLiked, rollback } = applyOptimisticLike({ post, updatePost });

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
        rollback();
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

      const userId = session?.user?.id;
      if (!userId) {
        return;
      }
      const { nextSaved, rollback } = applyOptimisticSave({
        post,
        userId,
        updatePost,
        setSavedForUser,
      });

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
        rollback();
        if (err instanceof Error) {
          Alert.alert(communityDetailCopy.alerts.savedFailed.title, err.message);
        }
      }
    },
    [postRepository, requireUser, session?.user?.id, setSavedForUser, updatePost]
  );

  const handleMarkForReview = useCallback(
    async (post: Post) => {
      if (!session?.user?.id) {
        Alert.alert(commonCopy.error, communityDetailCopy.markForReview.signInRequired);
        return;
      }

      if (!canModerate) {
        Alert.alert(
          communityDetailCopy.markForReview.notAuthorized.title,
          communityDetailCopy.markForReview.notAuthorized.message
        );
        return;
      }

      Alert.alert(
        communityDetailCopy.markForReview.confirm.title,
        communityDetailCopy.markForReview.confirm.message,
        [
          { text: commonCopy.cancel, style: 'cancel' },
          {
            text: communityDetailCopy.markForReview.confirm.mark,
            onPress: async () => {
              const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
              if (!status.isConnected) {
                Alert.alert(
                  communityDetailCopy.alerts.offline.title,
                  communityDetailCopy.markForReview.offline
                );
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
                Alert.alert(
                  communityDetailCopy.markForReview.success.title,
                  communityDetailCopy.markForReview.success.message
                );
              } catch (err) {
                if (err instanceof Error) {
                  Alert.alert(communityDetailCopy.markForReview.failed, err.message);
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
