import type { Community } from '../models/community';
import type { Subscription } from '../models/subscription';

export interface CommunityRepository {
  getCommunities(search?: string | null): Promise<Community[]>;
  getCommunity(id: number): Promise<Community | null>;
  getCommunitiesFromUser(userId: string): Promise<Community[]>;
  getCommunitySubscribersCount(communityId: number): Promise<number>;
  saveCommunity(community: Community, imageUri?: string | null): Promise<Community>;
  subscribe(subscription: Subscription): Promise<Subscription>;
  unsubscribe(subscription: Subscription): Promise<void>;
  getSubscription(userId: string, communityId: number): Promise<Subscription | null>;
  deleteCommunity(communityId: number): Promise<void>;
}
