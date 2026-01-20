import type { ChatMessage, ChatThread } from '../models/chat';

export interface ChatRepository {
  getOrCreateDirectThread(userId: string, peerId: string): Promise<ChatThread>;
  getMessages(threadId: string, limit?: number): Promise<ChatMessage[]>;
  sendMessage(threadId: string, senderId: string, content: string): Promise<ChatMessage>;
  markThreadRead(threadId: string, userId: string, readAt?: string): Promise<void>;
}
