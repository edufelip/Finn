import type { CommunityBan } from '../models/communityBan';

export interface CommunityBanRepository {
  banUser(
    communityId: number,
    userId: string,
    bannedBy: string,
    reason?: string,
    sourcePostId?: number | null
  ): Promise<CommunityBan>;
  unbanUser(communityId: number, userId: string): Promise<void>;
  getBansForCommunity(communityId: number): Promise<CommunityBan[]>;
}
