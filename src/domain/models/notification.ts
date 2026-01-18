export type NotificationType = 'follow' | 'post_like' | 'post_comment';

export type NotificationActor = {
  id: string;
  name: string;
  photoUrl?: string | null;
};

export type NotificationPost = {
  id: number;
  imageUrl?: string | null;
  content?: string | null;
};

export type NotificationMetadata = {
  commentPreview?: string | null;
};

export type Notification = {
  id: number;
  type: NotificationType;
  createdAt: string;
  readAt?: string | null;
  actor: NotificationActor;
  post?: NotificationPost;
  metadata?: NotificationMetadata;
  isFollowedByMe?: boolean;
};
