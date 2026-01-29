import type { CommunityBan } from '../../../domain/models/communityBan';
import type { CommunityBanRepository } from '../../../domain/repositories/CommunityBanRepository';

let mockBans: CommunityBan[] = [];
let nextId = 1;

export class MockCommunityBanRepository implements CommunityBanRepository {
  async banUser(
    communityId: number,
    userId: string,
    bannedBy: string,
    reason?: string,
    sourcePostId?: number | null
  ): Promise<CommunityBan> {
    const existing = mockBans.find((ban) => ban.communityId === communityId && ban.userId === userId);
    if (existing) {
      return existing;
    }

    const ban: CommunityBan = {
      id: nextId++,
      communityId,
      userId,
      bannedBy,
      reason: reason ?? null,
      sourcePostId: sourcePostId ?? null,
      createdAt: new Date().toISOString(),
    };
    mockBans.push(ban);
    return ban;
  }

  async unbanUser(communityId: number, userId: string): Promise<void> {
    mockBans = mockBans.filter((ban) => !(ban.communityId === communityId && ban.userId === userId));
  }

  async getBansForCommunity(communityId: number): Promise<CommunityBan[]> {
    return mockBans.filter((ban) => ban.communityId === communityId);
  }
}
