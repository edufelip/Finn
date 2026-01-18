import type { Comment } from '../../../domain/models/comment';
import type { CommentRepository } from '../../../domain/repositories/CommentRepository';
import { mockComments, nextCommentId } from './mockData';

export class MockCommentRepository implements CommentRepository {
  async getCommentsForPost(postId: number): Promise<Comment[]> {
    return mockComments.filter((comment) => comment.postId === postId);
  }

  async saveComment(comment: Comment): Promise<Comment> {
    const created = {
      ...comment,
      id: nextCommentId(),
      userName: comment.userName ?? 'Mock User',
    };
    mockComments.push(created);
    return created;
  }
}
