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
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
};
