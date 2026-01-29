export type CommunityBan = {
  id: number;
  communityId: number;
  userId: string;
  bannedBy: string | null;
  reason?: string | null;
  sourcePostId?: number | null;
  createdAt: string;
};
