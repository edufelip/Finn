import type { ChatMessage, ChatThread } from '../../../domain/models/chat';
import type { ChatRepository } from '../../../domain/repositories/ChatRepository';

const threads = new Map<string, ChatThread>();
const messagesByThread = new Map<string, ChatMessage[]>();

const makeThreadKey = (a: string, b: string) => (a < b ? `${a}:${b}` : `${b}:${a}`);

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
    const thread: ChatThread = {
      id: `thread-${key}`,
      participantA,
      participantB,
      createdAt: new Date().toISOString(),
      lastMessageAt: null,
      lastMessagePreview: null,
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
    return message;
  }

  async markThreadRead(_threadId: string, _userId: string, _readAt?: string): Promise<void> {
    return;
  }
}
