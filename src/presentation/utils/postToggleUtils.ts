import type { Post } from '../../domain/models/post';
import { usePostsStore } from '../../app/store/postsStore';

type UpdatePost = (postId: number, patch: Partial<Post>) => void;
type SetSavedForUser = (userId: string, postId: number, isSaved: boolean) => void;

type ApplyOptimisticLikeParams = {
  post: Post;
  updatePost: UpdatePost;
};

type ApplyOptimisticSaveParams = {
  post: Post;
  userId: string;
  updatePost: UpdatePost;
  setSavedForUser: SetSavedForUser;
  restoreSavedPosts?: (userId: string, posts: Post[]) => void;
  previousSavedPosts?: Post[];
};

export const applyOptimisticLike = ({ post, updatePost }: ApplyOptimisticLikeParams) => {
  const currentPost = usePostsStore.getState().postsById[post.id];
  const currentCount = currentPost?.likesCount ?? post.likesCount ?? 0;
  const nextLiked = !post.isLiked;

  updatePost(post.id, {
    isLiked: nextLiked,
    likesCount: Math.max(0, currentCount + (nextLiked ? 1 : -1)),
  });

  return {
    nextLiked,
    currentCount,
    rollback: () => {
      updatePost(post.id, {
        isLiked: !nextLiked,
        likesCount: currentCount,
      });
    },
  };
};

export const applyOptimisticSave = ({
  post,
  userId,
  updatePost,
  setSavedForUser,
  restoreSavedPosts,
  previousSavedPosts,
}: ApplyOptimisticSaveParams) => {
  const previousSaved = post.isSaved ?? false;
  const nextSaved = !previousSaved;

  updatePost(post.id, { isSaved: nextSaved });
  setSavedForUser(userId, post.id, nextSaved);

  return {
    nextSaved,
    rollback: () => {
      if (restoreSavedPosts && previousSavedPosts) {
        restoreSavedPosts(userId, previousSavedPosts);
      }
      updatePost(post.id, { isSaved: previousSaved });
      setSavedForUser(userId, post.id, previousSaved);
    },
  };
};
