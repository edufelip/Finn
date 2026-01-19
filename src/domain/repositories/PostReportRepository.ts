import type { PostReport, ReportStatus } from '../models/postReport';

export interface PostReportRepository {
  reportPost(postId: number, userId: string, reason: string): Promise<PostReport>;
  getUserReports(userId: string): Promise<PostReport[]>;
  getReportsForCommunity(communityId: number): Promise<PostReport[]>;
  updateReportStatus(reportId: number, status: ReportStatus): Promise<void>;
  hasUserReportedPost(postId: number, userId: string): Promise<boolean>;
}
