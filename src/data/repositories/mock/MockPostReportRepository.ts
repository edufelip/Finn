import type { PostReport } from '../../../domain/models/postReport';
import type { PostReportRepository } from '../../../domain/repositories/PostReportRepository';

let mockReports: PostReport[] = [];
let nextId = 1;

export class MockPostReportRepository implements PostReportRepository {
  async reportPost(postId: number, userId: string, reason: string): Promise<PostReport> {
    // Check if user already reported this post
    const existing = mockReports.find((r) => r.postId === postId && r.userId === userId);
    if (existing) {
      throw new Error('You have already reported this post');
    }

    const report: PostReport = {
      id: nextId++,
      postId,
      userId,
      reason,
      createdAt: new Date().toISOString(),
    };

    mockReports.push(report);
    return report;
  }

  async getUserReports(userId: string): Promise<PostReport[]> {
    return mockReports.filter((r) => r.userId === userId);
  }

  async getReportsForCommunity(_communityId: number): Promise<PostReport[]> {
    // For mock purposes, just return all reports
    // In real implementation, we would filter by community
    return mockReports;
  }

  async updateReportStatus(reportId: number, status: PostReport['status']): Promise<void> {
    const report = mockReports.find((r) => r.id === reportId);
    if (report) {
      report.status = status;
    }
  }

  async hasUserReportedPost(postId: number, userId: string): Promise<boolean> {
    return mockReports.some((r) => r.postId === postId && r.userId === userId);
  }
}
