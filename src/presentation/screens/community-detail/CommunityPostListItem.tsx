import React from 'react';

import type { Post } from '../../../domain/models/post';
import PostCard from '../../components/PostCard';
import PostSkeleton from '../../components/PostSkeleton';

type CommunityPostListItemProps = {
  item: Post | number;
  canModerate: boolean;
  onPressCommunity: (communityId: number) => void;
  onPressBody: (post: Post) => void;
  onToggleLike: (post: Post) => void;
  onToggleSave: (post: Post) => void;
  onMarkForReview: (post: Post) => void;
  onOpenComments: (post: Post) => void;
  onPressUser: (userId: string) => void;
};

export default function CommunityPostListItem({
  item,
  canModerate,
  onPressCommunity,
  onPressBody,
  onToggleLike,
  onToggleSave,
  onMarkForReview,
  onOpenComments,
  onPressUser,
}: CommunityPostListItemProps) {
  if (typeof item === 'number') {
    return <PostSkeleton />;
  }

  return (
    <PostCard
      post={item}
      onPressCommunity={() => onPressCommunity(item.communityId)}
      onPressBody={() => onPressBody(item)}
      onToggleLike={() => onToggleLike(item)}
      onToggleSave={() => onToggleSave(item)}
      onMarkForReview={() => onMarkForReview(item)}
      onOpenComments={() => onOpenComments(item)}
      onPressUser={() => onPressUser(item.userId)}
      canModerate={canModerate}
    />
  );
}
