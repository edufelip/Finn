import type { ModerationLog } from '../../../domain/models/moderationLog';
import type { ModerationLogRepository } from '../../../domain/repositories/ModerationLogRepository';

let mockLogs: ModerationLog[] = [];
let nextId = 1;

export class MockModerationLogRepository implements ModerationLogRepository {
  async getLogs(communityId: number, limit?: number): Promise<ModerationLog[]> {
    const filtered = mockLogs.filter((log) => log.communityId === communityId);
    const sorted = filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }

  async createLog(log: Omit<ModerationLog, 'id' | 'createdAt' | 'moderatorName' | 'moderatorPhotoUrl'>): Promise<ModerationLog> {
    const newLog: ModerationLog = {
      ...log,
      id: nextId++,
      moderatorName: 'Mock Moderator',
      moderatorPhotoUrl: null,
      createdAt: new Date().toISOString(),
    };
    mockLogs.push(newLog);
    return newLog;
  }
}
