import { processQueuedWrite } from '../src/data/offline/processor';

jest.mock('../src/data/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }),
    },
  },
}));

describe('processQueuedWrite', () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_APP_MODE = 'prod';
  });

  it('processes create_post', async () => {
    const postsRepo = {
      savePost: jest.fn().mockResolvedValue(undefined),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };
    const communitiesRepo = {
      saveCommunity: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    await processQueuedWrite(
      {
        id: '1',
        type: 'create_post',
        payload: { content: 'Hello', communityId: 1, userId: 'user-1' },
        createdAt: 0,
      },
      { posts: postsRepo, comments: { saveComment: jest.fn() }, communities: communitiesRepo }
    );

    expect(postsRepo.savePost).toHaveBeenCalledWith(
      {
        id: 0,
        content: 'Hello',
        communityId: 1,
        userId: 'user-1',
        moderationStatus: 'approved',
      },
      null
    );
  });

  it('processes create_post with image uri', async () => {
    const postsRepo = {
      savePost: jest.fn().mockResolvedValue(undefined),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };
    const communitiesRepo = {
      saveCommunity: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    await processQueuedWrite(
      {
        id: '1b',
        type: 'create_post',
        payload: {
          content: 'Hello',
          communityId: 1,
          userId: 'user-1',
          imageUri: 'file://post.jpg',
        },
        createdAt: 0,
      },
      { posts: postsRepo, comments: { saveComment: jest.fn() }, communities: communitiesRepo }
    );

    expect(postsRepo.savePost).toHaveBeenCalledWith(
      {
        id: 0,
        content: 'Hello',
        communityId: 1,
        userId: 'user-1',
        moderationStatus: 'approved',
      },
      'file://post.jpg'
    );
  });

  it('throws for unknown type', async () => {
    const postsRepo = {
      savePost: jest.fn(),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };
    const communitiesRepo = {
      saveCommunity: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    await expect(
      processQueuedWrite(
        { id: '2', type: 'unknown', payload: {}, createdAt: 0 },
        { posts: postsRepo, comments: { saveComment: jest.fn() }, communities: communitiesRepo }
      )
    ).rejects.toThrow('Unknown queued write');
  });

  it('processes like_post', async () => {
    const postsRepo = {
      savePost: jest.fn(),
      likePost: jest.fn().mockResolvedValue(undefined),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };
    const communitiesRepo = {
      saveCommunity: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    await processQueuedWrite(
      { id: '3', type: 'like_post', payload: { postId: 10, userId: 'user-1' }, createdAt: 0 },
      { posts: postsRepo, comments: { saveComment: jest.fn() }, communities: communitiesRepo }
    );

    expect(postsRepo.likePost).toHaveBeenCalledWith(10, 'user-1');
  });

  it('processes unlike_post', async () => {
    const postsRepo = {
      savePost: jest.fn(),
      likePost: jest.fn(),
      dislikePost: jest.fn().mockResolvedValue(undefined),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };
    const communitiesRepo = {
      saveCommunity: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    await processQueuedWrite(
      { id: '4', type: 'unlike_post', payload: { postId: 11, userId: 'user-1' }, createdAt: 0 },
      { posts: postsRepo, comments: { saveComment: jest.fn() }, communities: communitiesRepo }
    );

    expect(postsRepo.dislikePost).toHaveBeenCalledWith(11, 'user-1');
  });

  it('processes add_comment', async () => {
    const postsRepo = {
      savePost: jest.fn(),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn(),
    };
    const commentsRepo = {
      saveComment: jest.fn().mockResolvedValue(undefined),
    };
    const communitiesRepo = {
      saveCommunity: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    await processQueuedWrite(
      {
        id: '5',
        type: 'add_comment',
        payload: { postId: 12, userId: 'user-1', content: 'Yo' },
        createdAt: 0,
      },
      { posts: postsRepo, comments: commentsRepo, communities: communitiesRepo }
    );

    expect(commentsRepo.saveComment).toHaveBeenCalledWith({
      id: 0,
      postId: 12,
      userId: 'user-1',
      content: 'Yo',
    });
  });

  it('processes create_community', async () => {
    const communitiesRepo = {
      saveCommunity: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    await processQueuedWrite(
      {
        id: '6',
        type: 'create_community',
        payload: { title: 'New', description: 'Details', ownerId: 'user-1' },
        createdAt: 0,
      },
      {
        posts: {
          savePost: jest.fn(),
          likePost: jest.fn(),
          dislikePost: jest.fn(),
          bookmarkPost: jest.fn(),
          unbookmarkPost: jest.fn(),
        },
        comments: { saveComment: jest.fn() },
        communities: communitiesRepo,
      }
    );

    expect(communitiesRepo.saveCommunity).toHaveBeenCalledWith(
      {
        id: 0,
        title: 'New',
        description: 'Details',
        ownerId: 'user-1',
        imageUrl: null,
      },
      null
    );
  });

  it('processes subscribe_community', async () => {
    const communitiesRepo = {
      saveCommunity: jest.fn(),
      subscribe: jest.fn().mockResolvedValue(undefined),
      unsubscribe: jest.fn(),
    };

    await processQueuedWrite(
      {
        id: '7',
        type: 'subscribe_community',
        payload: { id: 0, userId: 'user-1', communityId: 2 },
        createdAt: 0,
      },
      {
        posts: {
          savePost: jest.fn(),
          likePost: jest.fn(),
          dislikePost: jest.fn(),
          bookmarkPost: jest.fn(),
          unbookmarkPost: jest.fn(),
        },
        comments: { saveComment: jest.fn() },
        communities: communitiesRepo,
      }
    );

    expect(communitiesRepo.subscribe).toHaveBeenCalledWith({ id: 0, userId: 'user-1', communityId: 2 });
  });

  it('processes unsubscribe_community', async () => {
    const communitiesRepo = {
      saveCommunity: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
    };

    await processQueuedWrite(
      {
        id: '8',
        type: 'unsubscribe_community',
        payload: { id: 12, userId: 'user-1', communityId: 2 },
        createdAt: 0,
      },
      {
        posts: {
          savePost: jest.fn(),
          likePost: jest.fn(),
          dislikePost: jest.fn(),
          bookmarkPost: jest.fn(),
          unbookmarkPost: jest.fn(),
        },
        comments: { saveComment: jest.fn() },
        communities: communitiesRepo,
      }
    );

    expect(communitiesRepo.unsubscribe).toHaveBeenCalledWith({ id: 12, userId: 'user-1', communityId: 2 });
  });

  it('processes save_post', async () => {
    const postsRepo = {
      savePost: jest.fn(),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn().mockResolvedValue(undefined),
      unbookmarkPost: jest.fn(),
    };

    await processQueuedWrite(
      { id: '9', type: 'save_post', payload: { postId: 13, userId: 'user-1' }, createdAt: 0 },
      { posts: postsRepo, comments: { saveComment: jest.fn() }, communities: { saveCommunity: jest.fn(), subscribe: jest.fn(), unsubscribe: jest.fn() } }
    );

    expect(postsRepo.bookmarkPost).toHaveBeenCalledWith(13, 'user-1');
  });

  it('processes unsave_post', async () => {
    const postsRepo = {
      savePost: jest.fn(),
      likePost: jest.fn(),
      dislikePost: jest.fn(),
      bookmarkPost: jest.fn(),
      unbookmarkPost: jest.fn().mockResolvedValue(undefined),
    };

    await processQueuedWrite(
      { id: '10', type: 'unsave_post', payload: { postId: 13, userId: 'user-1' }, createdAt: 0 },
      { posts: postsRepo, comments: { saveComment: jest.fn() }, communities: { saveCommunity: jest.fn(), subscribe: jest.fn(), unsubscribe: jest.fn() } }
    );

    expect(postsRepo.unbookmarkPost).toHaveBeenCalledWith(13, 'user-1');
  });
});
