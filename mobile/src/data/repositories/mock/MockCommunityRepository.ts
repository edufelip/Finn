import type { Community } from '../../../domain/models/community';
import type { Subscription } from '../../../domain/models/subscription';
import type { CommunityRepository } from '../../../domain/repositories/CommunityRepository';
import { mockCommunities, mockSubscriptions, nextCommunityId, nextSubscriptionId } from './mockData';

export class MockCommunityRepository implements CommunityRepository {
  async getCommunities(search?: string | null): Promise<Community[]> {
    if (!search) return [...mockCommunities];
    const query = search.toLowerCase();
    return mockCommunities.filter((community) => community.title.toLowerCase().includes(query));
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
