export type ReportStatus = 'pending' | 'resolved_deleted' | 'resolved_safe';

export type PostReport = {
  id: number;
  postId: number;
  userId: string;
  userName?: string;
  userPhotoUrl?: string | null;
  reason: string;
  createdAt: string;
  status?: ReportStatus;
  postContent?: string;
  postImageUrl?: string | null;
  postAuthorId?: string;
  postAuthorName?: string;
};
