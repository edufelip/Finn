import type { Community, PostPermission } from '../models/community';
import type { Subscription } from '../models/subscription';

export type CommunitySortOrder = 'mostFollowed' | 'leastFollowed' | 'newest' | 'oldest';

export type CommunitySearchParams = {
  search?: string | null;
  sort?: CommunitySortOrder;
  topicId?: number | null;
  page?: number;
  pageSize?: number;
};

export interface CommunityRepository {
  getCommunities(params?: CommunitySearchParams): Promise<Community[]>;
  getCommunity(id: number): Promise<Community | null>;
  getCommunitiesFromUser(userId: string): Promise<Community[]>;
  getSubscribedCommunities(userId: string): Promise<Community[]>;
  getCommunitySubscribersCount(communityId: number): Promise<number>;
  saveCommunity(community: Community, imageUri?: string | null): Promise<Community>;
  updateCommunitySettings(communityId: number, settings: {
    postPermission?: PostPermission;
    imageUrl?: string | null;
  }, imageUri?: string | null): Promise<Community>;
  subscribe(subscription: Subscription): Promise<Subscription>;
  unsubscribe(subscription: Subscription): Promise<void>;
  getSubscription(userId: string, communityId: number): Promise<Subscription | null>;
  deleteCommunity(communityId: number): Promise<void>;
}
