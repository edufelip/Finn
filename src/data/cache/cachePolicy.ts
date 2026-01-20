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
  communities: (search?: string | null) =>
    search ? `communities:search:${search.toLowerCase()}` : 'communities:all',
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
