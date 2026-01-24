import type { CommunityReport } from '../../../domain/models/communityReport';
import type { CommunityReportRepository } from '../../../domain/repositories/CommunityReportRepository';

let mockReports: CommunityReport[] = [];
let nextId = 1;

export class MockCommunityReportRepository implements CommunityReportRepository {
  async reportCommunity(communityId: number, userId: string, reason: string): Promise<CommunityReport> {
    const existing = mockReports.find((report) => report.communityId === communityId && report.userId === userId);
    if (existing) {
      throw new Error('You have already reported this community');
    }

    const report: CommunityReport = {
      id: nextId++,
      communityId,
      userId,
      reason,
      createdAt: new Date().toISOString(),
    };

    mockReports.push(report);
    return report;
  }
}
