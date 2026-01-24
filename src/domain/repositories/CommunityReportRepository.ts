import type { CommunityReport } from '../models/communityReport';

export interface CommunityReportRepository {
  reportCommunity(communityId: number, userId: string, reason: string): Promise<CommunityReport>;
}
