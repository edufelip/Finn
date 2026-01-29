export type UserBan = {
  id: number;
  userId: string;
  bannedBy: string | null;
  reason?: string | null;
  sourcePostId?: number | null;
  createdAt: string;
};
