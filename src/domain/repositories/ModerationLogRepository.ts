import type { ModerationLog } from '../models/moderationLog';

export interface ModerationLogRepository {
  getLogs(communityId: number, limit?: number): Promise<ModerationLog[]>;
  createLog(log: Omit<ModerationLog, 'id' | 'createdAt' | 'moderatorName' | 'moderatorPhotoUrl'>): Promise<ModerationLog>;
}
