import type { ChatMessage, ChatThread } from '../models/chat';

export type InboxFilter = 'primary' | 'requests' | 'archived';

export interface ChatRepository {
  getOrCreateDirectThread(userId: string, peerId: string): Promise<ChatThread>;
  getMessages(threadId: string, limit?: number, beforeTimestamp?: string): Promise<ChatMessage[]>;
  sendMessage(threadId: string, senderId: string, content: string): Promise<ChatMessage>;
  markThreadRead(threadId: string, userId: string, readAt?: string): Promise<void>;
  
  // Get member status for unread detection
  getMemberStatus(threadId: string, userId: string): Promise<{ lastReadAt: string | null } | null>;
  
  // Inbox filtering methods
  getThreadsForUser(userId: string, filter: InboxFilter): Promise<ChatThread[]>;
  
  // Request management
  acceptThreadRequest(threadId: string, userId: string): Promise<void>;
  refuseThreadRequest(threadId: string, userId: string): Promise<void>;
  
  // Archive management
  archiveThread(threadId: string, userId: string): Promise<void>;
  unarchiveThread(threadId: string, userId: string): Promise<void>;
}
