import { SupabaseChatRepository } from '../src/data/repositories/SupabaseChatRepository';
import { TABLES } from '../src/data/supabase/tables';

jest.mock('../src/data/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = jest.requireMock('../src/data/supabase/client');

describe('SupabaseChatRepository', () => {
  beforeEach(() => {
    supabase.from.mockReset();
  });

  it('creates a thread when none exists and inserts members', async () => {
    const select = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const insert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'thread-1',
            participant_a: 'a',
            participant_b: 'b',
            created_at: 'now',
            last_message_at: null,
            last_message_preview: null,
          },
          error: null,
        }),
      }),
    });

    const upsert = jest.fn().mockResolvedValue({ error: null });

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.chatThreads) {
        return { select, insert };
      }
      if (table === TABLES.chatMembers) {
        return { upsert };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const repo = new SupabaseChatRepository();
    const thread = await repo.getOrCreateDirectThread('a', 'b');

    expect(thread.id).toBe('thread-1');
    expect(insert).toHaveBeenCalled();
    expect(upsert).toHaveBeenCalled();
  });

  it('sends a message and updates thread/read state', async () => {
    const insertMessage = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 1,
            thread_id: 'thread-1',
            sender_id: 'user-1',
            content: 'hello',
            created_at: 'now',
          },
          error: null,
        }),
      }),
    });

    const updateThread = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    const updateMember = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.chatMessages) {
        return { insert: insertMessage };
      }
      if (table === TABLES.chatThreads) {
        return { update: updateThread };
      }
      if (table === TABLES.chatMembers) {
        return { update: updateMember };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const repo = new SupabaseChatRepository();
    const message = await repo.sendMessage('thread-1', 'user-1', 'hello');

    expect(message.content).toBe('hello');
    expect(updateThread).toHaveBeenCalled();
    expect(updateMember).toHaveBeenCalled();
  });

  it('returns messages in chronological order', async () => {
    const limit = jest.fn().mockResolvedValue({
      data: [
        {
          id: 2,
          thread_id: 'thread-1',
          sender_id: 'user-1',
          content: 'newer',
          created_at: '2024-01-02T00:00:00.000Z',
        },
        {
          id: 1,
          thread_id: 'thread-1',
          sender_id: 'user-1',
          content: 'older',
          created_at: '2024-01-01T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const order = jest.fn().mockReturnValue({ limit });
    const gte = jest.fn().mockReturnValue({ order });
    const eq = jest.fn().mockReturnValue({ gte });
    const select = jest.fn().mockReturnValue({ eq });

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.chatMessages) {
        return { select };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const repo = new SupabaseChatRepository();
    const messages = await repo.getMessages('thread-1', 2);

    expect(gte).toHaveBeenCalledWith('created_at', expect.any(String));
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(messages[0].id).toBe(1);
    expect(messages[1].id).toBe(2);
  });

  describe('Pagination', () => {
    it('loads first page without cursor (beforeTimestamp undefined)', async () => {
      const limit = jest.fn().mockResolvedValue({
        data: [
          {
            id: 3,
            thread_id: 'thread-1',
            sender_id: 'user-1',
            content: 'message 3',
            created_at: '2024-01-03T00:00:00.000Z',
          },
          {
            id: 2,
            thread_id: 'thread-1',
            sender_id: 'user-1',
            content: 'message 2',
            created_at: '2024-01-02T00:00:00.000Z',
          },
          {
            id: 1,
            thread_id: 'thread-1',
            sender_id: 'user-1',
            content: 'message 1',
            created_at: '2024-01-01T00:00:00.000Z',
          },
        ],
        error: null,
      });
      const order = jest.fn().mockReturnValue({ limit });
      const gte = jest.fn().mockReturnValue({ order });
      const eq = jest.fn().mockReturnValue({ gte });
      const select = jest.fn().mockReturnValue({ eq });

      supabase.from.mockImplementation((table: string) => {
        if (table === TABLES.chatMessages) {
          return { select };
        }
        throw new Error(`Unexpected table ${table}`);
      });

      const repo = new SupabaseChatRepository();
      const messages = await repo.getMessages('thread-1', 3);

      // Should not call lt() when no cursor provided
      expect(messages.length).toBe(3);
      expect(messages[0].id).toBe(1); // Oldest first
      expect(messages[2].id).toBe(3); // Newest last
    });

    it('loads subsequent page with cursor (beforeTimestamp provided)', async () => {
      const limit = jest.fn().mockResolvedValue({
        data: [
          {
            id: 2,
            thread_id: 'thread-1',
            sender_id: 'user-1',
            content: 'older message',
            created_at: '2024-01-02T00:00:00.000Z',
          },
        ],
        error: null,
      });
      
      // Mock the complete chain: select -> eq -> gte -> order -> lt -> limit
      const lt = jest.fn().mockReturnValue({ limit });
      const order = jest.fn().mockReturnValue({ lt });
      const gte = jest.fn().mockReturnValue({ order });
      const eq = jest.fn().mockReturnValue({ gte });
      const select = jest.fn().mockReturnValue({ eq });

      supabase.from.mockImplementation((table: string) => {
        if (table === TABLES.chatMessages) {
          return { select };
        }
        throw new Error(`Unexpected table ${table}`);
      });

      const repo = new SupabaseChatRepository();
      const cursorTimestamp = '2024-01-03T00:00:00.000Z';
      const messages = await repo.getMessages('thread-1', 30, cursorTimestamp);

      // Should call lt() with the cursor timestamp
      expect(lt).toHaveBeenCalledWith('created_at', cursorTimestamp);
      expect(messages.length).toBe(1);
    });

    it('returns fewer than limit when at end of messages', async () => {
      const limit = jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            thread_id: 'thread-1',
            sender_id: 'user-1',
            content: 'last message',
            created_at: '2024-01-01T00:00:00.000Z',
          },
        ],
        error: null,
      });
      const order = jest.fn().mockReturnValue({ limit });
      const gte = jest.fn().mockReturnValue({ order });
      const eq = jest.fn().mockReturnValue({ gte });
      const select = jest.fn().mockReturnValue({ eq });

      supabase.from.mockImplementation((table: string) => {
        if (table === TABLES.chatMessages) {
          return { select };
        }
        throw new Error(`Unexpected table ${table}`);
      });

      const repo = new SupabaseChatRepository();
      const messages = await repo.getMessages('thread-1', 30);

      // Should return 1 message even though limit is 30
      expect(messages.length).toBe(1);
      expect(messages.length).toBeLessThan(30);
    });

    it('returns empty array when no more messages exist', async () => {
      const limit = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      const order = jest.fn().mockReturnValue({ limit });
      const gte = jest.fn().mockReturnValue({ order });
      const eq = jest.fn().mockReturnValue({ gte });
      const select = jest.fn().mockReturnValue({ eq });

      supabase.from.mockImplementation((table: string) => {
        if (table === TABLES.chatMessages) {
          return { select };
        }
        throw new Error(`Unexpected table ${table}`);
      });

      const repo = new SupabaseChatRepository();
      const messages = await repo.getMessages('thread-1', 30);

      expect(messages.length).toBe(0);
    });

    it('respects 14-day retention policy in pagination', async () => {
      const limit = jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            thread_id: 'thread-1',
            sender_id: 'user-1',
            content: 'recent message',
            created_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        error: null,
      });
      const order = jest.fn().mockReturnValue({ limit });
      const gte = jest.fn().mockReturnValue({ order });
      const eq = jest.fn().mockReturnValue({ gte });
      const select = jest.fn().mockReturnValue({ eq });

      supabase.from.mockImplementation((table: string) => {
        if (table === TABLES.chatMessages) {
          return { select };
        }
        throw new Error(`Unexpected table ${table}`);
      });

      const repo = new SupabaseChatRepository();
      const messages = await repo.getMessages('thread-1', 30);

      // Verify gte was called with a date ~14 days ago
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      expect(gte).toHaveBeenCalledWith('created_at', expect.any(String));
      const calledWithDate = new Date(gte.mock.calls[0][1]);
      const timeDiff = Math.abs(calledWithDate.getTime() - fourteenDaysAgo.getTime());
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });
  });
});
