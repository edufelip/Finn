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
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });

    supabase.from.mockImplementation((table: string) => {
      if (table === TABLES.chatMessages) {
        return { select };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const repo = new SupabaseChatRepository();
    const messages = await repo.getMessages('thread-1', 2);

    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(messages[0].id).toBe(1);
    expect(messages[1].id).toBe(2);
  });
});
