import type { Comment } from '../models/comment';

export interface CommentRepository {
  getCommentsForPost(postId: number): Promise<Comment[]>;
  getCommentsFromUser(userId: string): Promise<Comment[]>;
  saveComment(comment: Comment): Promise<Comment>;
}
