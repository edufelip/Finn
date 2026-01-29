import type { User, UserRole } from '../../../domain/models/user';
import type { UserRepository } from '../../../domain/repositories/UserRepository';

const mockUser: User = {
  id: 'mock-user',
  name: 'Mock User',
  photoUrl: null,
  role: 'user',
  bio: null,
  location: null,
  onlineVisible: true,
  notificationsEnabled: true,
  lastSeenAt: new Date().toISOString(),
  followersCount: 0,
  followingCount: 0,
};

export class MockUserRepository implements UserRepository {
  async getUser(_id: string): Promise<User | null> {
    return mockUser;
  }

  async getUsersBatch(userIds: string[]): Promise<Map<string, User>> {
    const map = new Map<string, User>();
    userIds.forEach((id) => {
      map.set(id, { ...mockUser, id });
    });
    return map;
  }

  async createUser(user: User): Promise<User> {
    return user;
  }

  async deleteUser(_id: string): Promise<void> {
    return;
  }

  async setOnlineVisibility(_id: string, visible: boolean): Promise<void> {
    mockUser.onlineVisible = visible;
  }

  async setNotificationsEnabled(_id: string, enabled: boolean): Promise<void> {
    mockUser.notificationsEnabled = enabled;
  }

  async savePushToken(_id: string, _token: string, _platform: string, _env: 'dev' | 'prod'): Promise<void> {
    return;
  }

  async updateLastSeenAt(_id: string, timestamp: string): Promise<void> {
    mockUser.lastSeenAt = timestamp;
  }

  async updateProfilePhoto(_userId: string, imageUri: string, _previousPhotoUrl?: string | null): Promise<User> {
    mockUser.photoUrl = imageUri;
    return mockUser;
  }

  async updateProfile(
    _userId: string,
    updates: { name?: string; bio?: string | null; location?: string | null }
  ): Promise<User> {
    if (updates.name !== undefined) mockUser.name = updates.name;
    if (updates.bio !== undefined) mockUser.bio = updates.bio;
    if (updates.location !== undefined) mockUser.location = updates.location;
    return mockUser;
  }

  async updateUserRole(_userId: string, role: UserRole): Promise<User> {
    mockUser.role = role;
    return mockUser;
  }

  async acceptTerms(_userId: string, version: string): Promise<User> {
    mockUser.termsVersion = version;
    mockUser.termsAcceptedAt = new Date().toISOString();
    return mockUser;
  }

  async getNotifications(_userId: string) {
    return [];
  }

  async markNotificationRead(_notificationId: number): Promise<void> {
    return;
  }

  async markAllNotificationsRead(_userId: string): Promise<void> {
    return;
  }

  async followUser(_followerId: string, _followingId: string): Promise<void> {
    return;
  }

  async unfollowUser(_followerId: string, _followingId: string): Promise<void> {
    return;
  }

  async isFollowing(_followerId: string, _followingId: string): Promise<boolean> {
    return false;
  }

  async getFollowersCount(_userId: string): Promise<number> {
    return 0;
  }

  async getFollowingCount(_userId: string): Promise<number> {
    return 0;
  }
}
