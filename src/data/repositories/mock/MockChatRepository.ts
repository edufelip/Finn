import type { ChatMessage, ChatThread } from '../../../domain/models/chat';
import type { ChatRepository, InboxFilter } from '../../../domain/repositories/ChatRepository';

const threads = new Map<string, ChatThread>();
const messagesByThread = new Map<string, ChatMessage[]>();
const follows = new Set<string>(); // Track follow relationships for mock
const memberStatus = new Map<string, string | null>(); // Track last_read_at per thread+user

const makeThreadKey = (a: string, b: string) => (a < b ? `${a}:${b}` : `${b}:${a}`);
const makeFollowKey = (follower: string, following: string) => `${follower}:${following}`;
const makeMemberKey = (threadId: string, userId: string) => `${threadId}:${userId}`;

export class MockChatRepository implements ChatRepository {
  async getOrCreateDirectThread(userId: string, peerId: string): Promise<ChatThread> {
    if (userId === peerId) {
      throw new Error('Cannot create a chat thread with self.');
    }
    const key = makeThreadKey(userId, peerId);
    const existing = threads.get(key);
    if (existing) {
      return existing;
    }
    const [participantA, participantB] = key.split(':');
    
    // Check if there's a follow relationship
    const hasFollow = 
      follows.has(makeFollowKey(userId, peerId)) ||
      follows.has(makeFollowKey(peerId, userId));
    
    const thread: ChatThread = {
      id: `thread-${key}`,
      participantA,
      participantB,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      lastMessageAt: null,
      lastMessagePreview: null,
      requestStatus: hasFollow ? 'accepted' : 'pending',
      archivedBy: [],
    };
    threads.set(key, thread);
    messagesByThread.set(thread.id, []);
    return thread;
  }

  async getMessages(threadId: string, limit = 50): Promise<ChatMessage[]> {
    const messages = messagesByThread.get(threadId) ?? [];
    return messages.slice(-limit);
  }

  async sendMessage(threadId: string, senderId: string, content: string): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: Date.now(),
      threadId,
      senderId,
      content,
      createdAt: new Date().toISOString(),
    };
    const current = messagesByThread.get(threadId) ?? [];
    messagesByThread.set(threadId, [...current, message]);
    
    // Update thread's last message
    threads.forEach((thread, key) => {
      if (thread.id === threadId) {
        thread.lastMessageAt = message.createdAt;
        thread.lastMessagePreview = content.slice(0, 120);
        threads.set(key, thread);
      }
    });
    
    return message;
  }

  async markThreadRead(threadId: string, userId: string, readAt?: string): Promise<void> {
    const timestamp = readAt ?? new Date().toISOString();
    const key = makeMemberKey(threadId, userId);
    memberStatus.set(key, timestamp);
  }

  async getMemberStatus(threadId: string, userId: string): Promise<{ lastReadAt: string | null } | null> {
    const key = makeMemberKey(threadId, userId);
    const lastReadAt = memberStatus.get(key) ?? null;
    return { lastReadAt };
  }

  async getThreadsForUser(userId: string, filter: InboxFilter): Promise<ChatThread[]> {
    const userThreads = Array.from(threads.values()).filter(
      (thread) => thread.participantA === userId || thread.participantB === userId
    );

    let filtered = userThreads;

    if (filter === 'primary') {
      // Primary: accepted threads not archived by user
      filtered = userThreads.filter(
        (thread) =>
          thread.requestStatus === 'accepted' &&
          !thread.archivedBy.includes(userId)
      );
    } else if (filter === 'requests') {
      // Requests: pending threads where user is recipient (not creator) and not archived
      filtered = userThreads.filter(
        (thread) =>
          thread.requestStatus === 'pending' &&
          thread.createdBy !== userId &&
          !thread.archivedBy.includes(userId)
      );
    } else if (filter === 'archived') {
      // Archived: threads archived by user
      filtered = userThreads.filter((thread) => thread.archivedBy.includes(userId));
    }

    // Sort by last message date
    return filtered.sort((a, b) => {
      const aTime = a.lastMessageAt || a.createdAt || '';
      const bTime = b.lastMessageAt || b.createdAt || '';
      return bTime.localeCompare(aTime);
    });
  }

  async acceptThreadRequest(threadId: string, userId: string): Promise<void> {
    const thread = Array.from(threads.values()).find((t) => t.id === threadId);
    
    if (!thread) {
      throw new Error('Thread not found');
    }

    // Validate user is a participant
    if (thread.participantA !== userId && thread.participantB !== userId) {
      throw new Error('User is not a participant in this thread');
    }

    if (thread.createdBy === userId) {
      throw new Error('Cannot accept own message request');
    }

    if (thread.requestStatus !== 'pending') {
      throw new Error('Thread is not in pending status');
    }

    thread.requestStatus = 'accepted';
    const key = makeThreadKey(thread.participantA, thread.participantB);
    threads.set(key, thread);
  }

  async refuseThreadRequest(threadId: string, userId: string): Promise<void> {
    const thread = Array.from(threads.values()).find((t) => t.id === threadId);
    
    if (!thread) {
      throw new Error('Thread not found');
    }

    // Validate user is a participant
    if (thread.participantA !== userId && thread.participantB !== userId) {
      throw new Error('User is not a participant in this thread');
    }

    if (thread.createdBy === userId) {
      throw new Error('Cannot refuse own message request');
    }

    if (thread.requestStatus !== 'pending') {
      throw new Error('Thread is not in pending status');
    }

    thread.requestStatus = 'refused';
    const key = makeThreadKey(thread.participantA, thread.participantB);
    threads.set(key, thread);
  }

  async archiveThread(threadId: string, userId: string): Promise<void> {
    const thread = Array.from(threads.values()).find((t) => t.id === threadId);
    
    if (!thread) {
      throw new Error('Thread not found');
    }

    if (!thread.archivedBy.includes(userId)) {
      thread.archivedBy.push(userId);
      const key = makeThreadKey(thread.participantA, thread.participantB);
      threads.set(key, thread);
    }
  }

  async unarchiveThread(threadId: string, userId: string): Promise<void> {
    const thread = Array.from(threads.values()).find((t) => t.id === threadId);
    
    if (!thread) {
      throw new Error('Thread not found');
    }

    thread.archivedBy = thread.archivedBy.filter((id) => id !== userId);
    const key = makeThreadKey(thread.participantA, thread.participantB);
    threads.set(key, thread);
  }

  // Helper method for testing: simulate follow relationship
  mockFollow(followerId: string, followingId: string): void {
    follows.add(makeFollowKey(followerId, followingId));
  }

  // Helper method for testing: clear all data
  clearAll(): void {
    threads.clear();
    messagesByThread.clear();
    follows.clear();
    memberStatus.clear();
  }
}
