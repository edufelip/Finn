import type { UserBlock } from '../../../domain/models/userBlock';
import type { UserBlockRepository } from '../../../domain/repositories/UserBlockRepository';

let mockBlocks: UserBlock[] = [];
let nextId = 1;

export class MockUserBlockRepository implements UserBlockRepository {
  async blockUser(
    blockerId: string,
    blockedId: string,
    reason: string,
    sourcePostId?: number | null
  ): Promise<UserBlock> {
    const existing = mockBlocks.find(
      (block) => block.blockerId === blockerId && block.blockedId === blockedId
    );
    if (existing) {
      return existing;
    }

    const block: UserBlock = {
      id: nextId++,
      blockerId,
      blockedId,
      reason,
      sourcePostId: sourcePostId ?? null,
      createdAt: new Date().toISOString(),
    };
    mockBlocks.push(block);
    return block;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    mockBlocks = mockBlocks.filter(
      (block) => !(block.blockerId === blockerId && block.blockedId === blockedId)
    );
  }

  async getBlockedUserIds(blockerId: string): Promise<string[]> {
    return mockBlocks
      .filter((block) => block.blockerId === blockerId)
      .map((block) => block.blockedId);
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    return mockBlocks.some((block) => block.blockerId === blockerId && block.blockedId === blockedId);
  }
}
