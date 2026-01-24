export enum ModerationStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum PostSortOrder {
  Newest = 'newest',
  Oldest = 'oldest',
  MostLiked = 'mostLiked',
  MostCommented = 'mostCommented',
}

export type Post = {
  id: number;
  content: string;
  imageUrl?: string | null;
  createdAt?: string;
  communityId: number;
  communityTitle?: string;
  communityImageUrl?: string | null;
  userId: string;
  userName?: string;
  userPhotoUrl?: string | null;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  moderationStatus?: ModerationStatus;
};
