import type { UserBan } from '../models/userBan';

export interface UserBanRepository {
  banUser(
    userId: string,
    bannedBy: string,
    reason?: string | null,
    sourcePostId?: number | null
  ): Promise<UserBan>;
  unbanUser(userId: string): Promise<void>;
  getBan(userId: string): Promise<UserBan | null>;
  isBanned(userId: string): Promise<boolean>;
}
