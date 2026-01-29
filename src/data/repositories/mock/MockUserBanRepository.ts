import type { UserBan } from '../../../domain/models/userBan';
import type { UserBanRepository } from '../../../domain/repositories/UserBanRepository';

const mockBans: UserBan[] = [];

export class MockUserBanRepository implements UserBanRepository {
  async banUser(
    userId: string,
    bannedBy: string,
    reason?: string | null,
    sourcePostId?: number | null
  ): Promise<UserBan> {
    const existing = mockBans.find((ban) => ban.userId === userId);
    if (existing) {
      return existing;
    }

    const ban: UserBan = {
      id: Date.now(),
      userId,
      bannedBy,
      reason: reason ?? null,
      sourcePostId: sourcePostId ?? null,
      createdAt: new Date().toISOString(),
    };

    mockBans.push(ban);
    return ban;
  }

  async unbanUser(userId: string): Promise<void> {
    const index = mockBans.findIndex((ban) => ban.userId === userId);
    if (index >= 0) {
      mockBans.splice(index, 1);
    }
  }

  async getBan(userId: string): Promise<UserBan | null> {
    return mockBans.find((ban) => ban.userId === userId) ?? null;
  }

  async isBanned(userId: string): Promise<boolean> {
    return mockBans.some((ban) => ban.userId === userId);
  }
}
