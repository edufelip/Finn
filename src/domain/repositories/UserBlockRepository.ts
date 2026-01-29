import type { UserBlock } from '../models/userBlock';

export interface UserBlockRepository {
  blockUser(blockerId: string, blockedId: string, reason: string, sourcePostId?: number | null): Promise<UserBlock>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  getBlockedUserIds(blockerId: string): Promise<string[]>;
  isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
}
