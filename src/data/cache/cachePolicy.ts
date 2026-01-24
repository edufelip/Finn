export const CACHE_TTL_MS = {
  default: 5 * 60 * 1000,
  feed: 2 * 60 * 1000,
  comments: 2 * 60 * 1000,
  communities: 10 * 60 * 1000,
  profiles: 10 * 60 * 1000,
  savedPosts: 2 * 60 * 1000,
  topics: 30 * 60 * 1000,
} as const;

export const CacheKey = {
  user: (id: string) => `user:${id}`,
  communitiesSearch: (params?: {
    search?: string | null;
    sort?: string | null;
    topicId?: number | null;
    page?: number;
    pageSize?: number;
  }) => {
    const normalizedSearch = params?.search?.toLowerCase() ?? '';
    const normalizedSort = params?.sort ?? 'mostFollowed';
    const normalizedTopic = params?.topicId ?? 'all';
    const normalizedPage = params?.page ?? 0;
    const normalizedPageSize = params?.pageSize ?? 20;
    return `communities:search:${normalizedSearch}:topic:${normalizedTopic}:sort:${normalizedSort}:page:${normalizedPage}:size:${normalizedPageSize}`;
  },
  community: (id: number) => `community:${id}`,
  communitiesByUser: (userId: string) => `communities:user:${userId}`,
  communitiesBySubscriber: (userId: string) => `communities:subscriber:${userId}`,
  feedByUser: (userId: string, page: number) => `feed:user:${userId}:page:${page}`,
  feedByFollowing: (userId: string, page: number) => `feed:following:${userId}:page:${page}`,
  postsByCommunity: (communityId: number, page: number) => `posts:community:${communityId}:page:${page}`,
  postsByUser: (userId: string, page: number) => `posts:user:${userId}:page:${page}`,
  commentsByPost: (postId: number) => `comments:post:${postId}`,
  savedPostsByUser: (userId: string, page: number) => `saved_posts:user:${userId}:page:${page}`,
  topics: () => 'topics:all',
  topic: (id: number) => `topic:${id}`,
  popularTopics: (limit: number) => `topics:popular:${limit}`,
} as const;
