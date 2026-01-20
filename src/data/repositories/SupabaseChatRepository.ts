import type { ChatMessage, ChatThread } from '../../domain/models/chat';
import type { ChatRepository } from '../../domain/repositories/ChatRepository';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';

type ChatThreadRow = {
  id: string;
  participant_a: string;
  participant_b: string;
  created_at?: string;
  last_message_at?: string | null;
  last_message_preview?: string | null;
};

type ChatMessageRow = {
  id: number;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

const THREAD_FIELDS = 'id, participant_a, participant_b, created_at, last_message_at, last_message_preview';

const toThread = (row: ChatThreadRow): ChatThread => ({
  id: row.id,
  participantA: row.participant_a,
  participantB: row.participant_b,
  createdAt: row.created_at,
  lastMessageAt: row.last_message_at ?? null,
  lastMessagePreview: row.last_message_preview ?? null,
});

const toMessage = (row: ChatMessageRow): ChatMessage => ({
  id: row.id,
  threadId: row.thread_id,
  senderId: row.sender_id,
  content: row.content,
  createdAt: row.created_at,
});

const sortPair = (a: string, b: string) => (a < b ? [a, b] : [b, a]);

export class SupabaseChatRepository implements ChatRepository {
  async getOrCreateDirectThread(userId: string, peerId: string): Promise<ChatThread> {
    if (userId === peerId) {
      throw new Error('Cannot create a chat thread with self.');
    }
    const [participantA, participantB] = sortPair(userId, peerId);

    const { data, error } = await supabase
      .from(TABLES.chatThreads)
      .select(THREAD_FIELDS)
      .eq('participant_a', participantA)
      .eq('participant_b', participantB)
      .maybeSingle<ChatThreadRow>();

    if (error) {
      throw error;
    }
    if (data) {
      return toThread(data);
    }

    const { data: created, error: insertError } = await supabase
      .from(TABLES.chatThreads)
      .insert({
        participant_a: participantA,
        participant_b: participantB,
        created_by: userId,
      })
      .select(THREAD_FIELDS)
      .single<ChatThreadRow>();

    if (insertError) {
      // A concurrent insert might have created the thread; retry lookup.
      const { data: retry, error: retryError } = await supabase
        .from(TABLES.chatThreads)
        .select(THREAD_FIELDS)
        .eq('participant_a', participantA)
        .eq('participant_b', participantB)
        .maybeSingle<ChatThreadRow>();
      if (retryError) {
        throw retryError;
      }
      if (!retry) {
        throw insertError;
      }
      return toThread(retry);
    }

    const { error: memberError } = await supabase.from(TABLES.chatMembers).upsert(
      [
        { thread_id: created.id, user_id: participantA },
        { thread_id: created.id, user_id: participantB },
      ],
      { onConflict: 'thread_id,user_id' }
    );

    if (memberError) {
      throw memberError;
    }

    return toThread(created);
  }

  async getMessages(threadId: string, limit = 50): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from(TABLES.chatMessages)
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => toMessage(row as ChatMessageRow));
  }

  async sendMessage(threadId: string, senderId: string, content: string): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from(TABLES.chatMessages)
      .insert({
        thread_id: threadId,
        sender_id: senderId,
        content,
      })
      .select('*')
      .single<ChatMessageRow>();

    if (error) {
      throw error;
    }

    await supabase
      .from(TABLES.chatThreads)
      .update({
        last_message_at: data.created_at,
        last_message_preview: content.slice(0, 120),
      })
      .eq('id', threadId);

    await this.markThreadRead(threadId, senderId, data.created_at);

    return toMessage(data);
  }

  async markThreadRead(threadId: string, userId: string, readAt?: string): Promise<void> {
    const timestamp = readAt ?? new Date().toISOString();
    const { error } = await supabase
      .from(TABLES.chatMembers)
      .update({ last_read_at: timestamp })
      .eq('thread_id', threadId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }
}
