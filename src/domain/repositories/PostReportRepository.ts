import type { PostReport } from '../models/postReport';

export interface PostReportRepository {
  reportPost(postId: number, userId: string, reason: string): Promise<PostReport>;
  getUserReports(userId: string): Promise<PostReport[]>;
  hasUserReportedPost(postId: number, userId: string): Promise<boolean>;
}
