import type { CommunityModerator } from '../../../domain/models/communityModerator';
import type { CommunityModeratorRepository } from '../../../domain/repositories/CommunityModeratorRepository';

let mockModerators: CommunityModerator[] = [];
let nextId = 1;

export class MockCommunityModeratorRepository implements CommunityModeratorRepository {
  async getModerators(communityId: number): Promise<CommunityModerator[]> {
    return mockModerators.filter((m) => m.communityId === communityId);
  }

  async addModerator(communityId: number, userId: string, assignedBy: string): Promise<CommunityModerator> {
    const moderator: CommunityModerator = {
      id: nextId++,
      communityId,
      userId,
      userName: 'Mock Moderator',
      userPhotoUrl: null,
      assignedBy,
      createdAt: new Date().toISOString(),
    };
    mockModerators.push(moderator);
    return moderator;
  }

  async removeModerator(communityId: number, userId: string): Promise<void> {
    mockModerators = mockModerators.filter(
      (m) => !(m.communityId === communityId && m.userId === userId)
    );
  }

  async isModerator(communityId: number, userId: string): Promise<boolean> {
    return mockModerators.some((m) => m.communityId === communityId && m.userId === userId);
  }
}
