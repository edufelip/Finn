import type { Community } from '../../../domain/models/community';
import type { Subscription } from '../../../domain/models/subscription';
import type {
  CommunityRepository,
  CommunitySearchParams,
  CommunitySortOrder,
} from '../../../domain/repositories/CommunityRepository';
import { mockCommunities, mockSubscriptions, nextCommunityId, nextSubscriptionId } from './mockData';

export class MockCommunityRepository implements CommunityRepository {
  async getCommunities(params?: CommunitySearchParams): Promise<Community[]> {
    let results = [...mockCommunities];
    const normalizedSearch = params?.search?.trim().toLowerCase() ?? '';
    const normalizedSort = params?.sort ?? 'mostFollowed';
    const normalizedTopicId = params?.topicId ?? null;
    const page = params?.page ?? 0;
    const pageSize = params?.pageSize ?? 20;
    const start = page * pageSize;
    const end = start + pageSize;
    
    // Apply search filter
    if (normalizedSearch) {
      results = results.filter((community) => community.title.toLowerCase().includes(normalizedSearch));
    }
    
    // Apply topic filter
    if (normalizedTopicId) {
      results = results.filter((community) => community.topicId === normalizedTopicId);
    }

    // Apply sorting
    switch (normalizedSort) {
      case 'mostFollowed':
        results.sort((a, b) => (b.subscribersCount ?? 0) - (a.subscribersCount ?? 0));
        break;
      case 'leastFollowed':
        results.sort((a, b) => (a.subscribersCount ?? 0) - (b.subscribersCount ?? 0));
        break;
      case 'newest':
        results.sort((a, b) => {
          const dateA = new Date(a.createdAt ?? 0).getTime();
          const dateB = new Date(b.createdAt ?? 0).getTime();
          return dateB - dateA;
        });
        break;
      case 'oldest':
        results.sort((a, b) => {
          const dateA = new Date(a.createdAt ?? 0).getTime();
          const dateB = new Date(b.createdAt ?? 0).getTime();
          return dateA - dateB;
        });
        break;
      default:
        // Default to most followed
        results.sort((a, b) => (b.subscribersCount ?? 0) - (a.subscribersCount ?? 0));
        break;
    }

    return results.slice(start, end);
  }

  async getCommunity(id: number): Promise<Community | null> {
    return mockCommunities.find((community) => community.id === id) ?? null;
  }

  async getCommunitiesFromUser(userId: string): Promise<Community[]> {
    return mockCommunities.filter((community) => community.ownerId === userId);
  }

  async getSubscribedCommunities(userId: string): Promise<Community[]> {
    const communityIds = new Set(
      mockSubscriptions
        .filter((subscription) => subscription.userId === userId)
        .map((subscription) => subscription.communityId)
    );
    return mockCommunities.filter((community) => communityIds.has(community.id));
  }

  async getCommunitySubscribersCount(_communityId: number): Promise<number> {
    return mockSubscriptions.filter((subscription) => subscription.communityId === _communityId).length;
  }

  async saveCommunity(community: Community, imageUri?: string | null): Promise<Community> {
    const created: Community = {
      ...community,
      id: community.id > 0 ? community.id : nextCommunityId(),
      imageUrl: imageUri ?? community.imageUrl ?? null,
    };
    mockCommunities.push(created);
    return created;
  }

  async updateCommunitySettings(
    communityId: number,
    settings: {
      postPermission?: Community['postPermission'];
      imageUrl?: string | null;
    },
    imageUri?: string | null
  ): Promise<Community> {
    const community = mockCommunities.find((c) => c.id === communityId);
    if (!community) {
      throw new Error('Community not found');
    }

    if (settings.postPermission !== undefined) {
      community.postPermission = settings.postPermission;
    }

    if (imageUri) {
      community.imageUrl = imageUri;
    } else if (settings.imageUrl !== undefined) {
      community.imageUrl = settings.imageUrl;
    }

    return community;
  }

  async subscribe(subscription: Subscription): Promise<Subscription> {
    const existing = mockSubscriptions.find(
      (item) => item.userId === subscription.userId && item.communityId === subscription.communityId
    );
    if (existing) return existing;
    const created: Subscription = {
      ...subscription,
      id: subscription.id > 0 ? subscription.id : nextSubscriptionId(),
    };
    mockSubscriptions.push(created);
    return created;
  }

  async unsubscribe(subscription: Subscription): Promise<void> {
    const index = mockSubscriptions.findIndex(
      (item) => item.userId === subscription.userId && item.communityId === subscription.communityId
    );
    if (index >= 0) {
      mockSubscriptions.splice(index, 1);
    }
  }

  async getSubscription(userId: string, communityId: number): Promise<Subscription | null> {
    return (
      mockSubscriptions.find(
        (subscription) => subscription.userId === userId && subscription.communityId === communityId
      ) ?? null
    );
  }

  async deleteCommunity(communityId: number): Promise<void> {
    const index = mockCommunities.findIndex((community) => community.id === communityId);
    if (index >= 0) {
      mockCommunities.splice(index, 1);
    }
    for (let i = mockSubscriptions.length - 1; i >= 0; i -= 1) {
      if (mockSubscriptions[i].communityId === communityId) {
        mockSubscriptions.splice(i, 1);
      }
    }
  }
}
