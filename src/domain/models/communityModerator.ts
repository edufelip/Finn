export type CommunityModerator = {
  id: number;
  communityId: number;
  userId: string;
  userName?: string;
  userPhotoUrl?: string | null;
  assignedBy: string;
  createdAt: string;
};
