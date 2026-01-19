export type ModerationAction =
  | 'approve_post'
  | 'reject_post'
  | 'mark_for_review'
  | 'delete_post'
  | 'mark_safe'
  | 'moderator_added'
  | 'moderator_removed'
  | 'settings_changed';

export type ModerationLog = {
  id: number;
  communityId: number;
  moderatorId: string;
  moderatorName?: string;
  moderatorPhotoUrl?: string | null;
  postId: number | null;
  action: ModerationAction;
  createdAt: string;
};
