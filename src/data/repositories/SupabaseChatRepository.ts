import type { ChatMessage, ChatThread } from '../../domain/models/chat';
import type { ChatRepository, InboxFilter } from '../../domain/repositories/ChatRepository';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';

// Message retention policy: messages older than this many days are automatically deleted
const MESSAGE_RETENTION_DAYS = 14;

type ChatThreadRow = {
  id: string;
  participant_a: string;
  participant_b: string;
  created_by?: string;
  created_at?: string;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  request_status: string;
  archived_by: string[];
};

type ChatMessageRow = {
  id: number;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

const THREAD_FIELDS = 'id, participant_a, participant_b, created_by, created_at, last_message_at, last_message_preview, request_status, archived_by';

const toThread = (row: ChatThreadRow): ChatThread => ({
  id: row.id,
  participantA: row.participant_a,
  participantB: row.participant_b,
  createdBy: row.created_by,
  createdAt: row.created_at,
  lastMessageAt: row.last_message_at ?? null,
  lastMessagePreview: row.last_message_preview ?? null,
  requestStatus: (row.request_status || 'accepted') as 'pending' | 'accepted' | 'refused',
  archivedBy: row.archived_by || [],
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

  async getMessages(threadId: string, limit = 50, beforeTimestamp?: string): Promise<ChatMessage[]> {
    // Calculate the cutoff date based on retention policy
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MESSAGE_RETENTION_DAYS);
    const cutoffISO = cutoffDate.toISOString();

    let query = supabase
      .from(TABLES.chatMessages)
      .select('*')
      .eq('thread_id', threadId)
      .gte('created_at', cutoffISO)
      .order('created_at', { ascending: false });

    // Add cursor-based pagination if beforeTimestamp is provided
    if (beforeTimestamp) {
      query = query.lt('created_at', beforeTimestamp);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as ChatMessageRow[];
    return rows.reverse().map((row) => toMessage(row));
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

    const { error: threadError } = await supabase
      .from(TABLES.chatThreads)
      .update({
        last_message_at: data.created_at,
        last_message_preview: content.slice(0, 120),
      })
      .eq('id', threadId);

    if (threadError) {
      throw threadError;
    }

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

  async getMemberStatus(threadId: string, userId: string): Promise<{ lastReadAt: string | null } | null> {
    const { data, error } = await supabase
      .from(TABLES.chatMembers)
      .select('last_read_at')
      .eq('thread_id', threadId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? { lastReadAt: data.last_read_at } : null;
  }

  async getThreadsForUser(userId: string, filter: InboxFilter): Promise<ChatThread[]> {
    let query = supabase
      .from(TABLES.chatThreads)
      .select(THREAD_FIELDS)
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (filter === 'primary') {
      // Primary: accepted threads that are not archived by this user
      query = query
        .eq('request_status', 'accepted')
        .not('archived_by', 'cs', `{${userId}}`);
    } else if (filter === 'requests') {
      // Requests: pending threads where user is recipient (not creator) and not archived
      query = query
        .eq('request_status', 'pending')
        .neq('created_by', userId)
        .not('archived_by', 'cs', `{${userId}}`);
    } else if (filter === 'archived') {
      // Archived: threads archived by this user
      query = query.contains('archived_by', [userId]);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as ChatThreadRow[];
    return rows.map((row) => toThread(row));
  }

  async acceptThreadRequest(threadId: string, userId: string): Promise<void> {
    // Only the recipient (non-creator) can accept a request
    const { data: thread, error: fetchError } = await supabase
      .from(TABLES.chatThreads)
      .select('participant_a, participant_b, created_by, request_status')
      .eq('id', threadId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!thread) {
      throw new Error('Thread not found');
    }

    // Validate user is a participant
    if (thread.participant_a !== userId && thread.participant_b !== userId) {
      throw new Error('User is not a participant in this thread');
    }

    if (thread.created_by === userId) {
      throw new Error('Cannot accept own message request');
    }

    if (thread.request_status !== 'pending') {
      throw new Error('Thread is not in pending status');
    }

    const { error } = await supabase
      .from(TABLES.chatThreads)
      .update({ request_status: 'accepted' })
      .eq('id', threadId);

    if (error) {
      throw error;
    }
  }

  async refuseThreadRequest(threadId: string, userId: string): Promise<void> {
    // Only the recipient (non-creator) can refuse a request
    const { data: thread, error: fetchError } = await supabase
      .from(TABLES.chatThreads)
      .select('participant_a, participant_b, created_by, request_status')
      .eq('id', threadId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!thread) {
      throw new Error('Thread not found');
    }

    // Validate user is a participant
    if (thread.participant_a !== userId && thread.participant_b !== userId) {
      throw new Error('User is not a participant in this thread');
    }

    if (thread.created_by === userId) {
      throw new Error('Cannot refuse own message request');
    }

    if (thread.request_status !== 'pending') {
      throw new Error('Thread is not in pending status');
    }

    const { error } = await supabase
      .from(TABLES.chatThreads)
      .update({ request_status: 'refused' })
      .eq('id', threadId);

    if (error) {
      throw error;
    }
  }

  async archiveThread(threadId: string, userId: string): Promise<void> {
    // Use atomic RPC function to prevent race conditions
    const { error } = await supabase.rpc('append_to_archived_by', {
      thread_id_param: threadId,
      user_id_param: userId,
    });

    if (error) {
      throw error;
    }
  }

  async unarchiveThread(threadId: string, userId: string): Promise<void> {
    // Use atomic RPC function to prevent race conditions
    const { error } = await supabase.rpc('remove_from_archived_by', {
      thread_id_param: threadId,
      user_id_param: userId,
    });

    if (error) {
      throw error;
    }
  }
}
