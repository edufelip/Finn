export type UserBlock = {
  id: number;
  blockerId: string;
  blockedId: string;
  reason: string;
  sourcePostId?: number | null;
  createdAt: string;
};
