import type { CommunityModerator } from '../models/communityModerator';

export interface CommunityModeratorRepository {
  getModerators(communityId: number): Promise<CommunityModerator[]>;
  addModerator(communityId: number, userId: string, assignedBy: string): Promise<CommunityModerator>;
  removeModerator(communityId: number, userId: string): Promise<void>;
  isModerator(communityId: number, userId: string): Promise<boolean>;
}
