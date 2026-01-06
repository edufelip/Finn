import type { User } from '../../../domain/models/user';
import type { UserRepository } from '../../../domain/repositories/UserRepository';

const mockUser: User = {
  id: 'mock-user',
  name: 'Mock User',
  photoUrl: null,
  onlineVisible: true,
  notificationsEnabled: true,
  lastSeenAt: new Date().toISOString(),
};

export class MockUserRepository implements UserRepository {
  async getUser(_id: string): Promise<User | null> {
    return mockUser;
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

  async savePushToken(_id: string, _token: string, _platform: string): Promise<void> {
    return;
  }

  async updateLastSeenAt(_id: string, timestamp: string): Promise<void> {
    mockUser.lastSeenAt = timestamp;
  }
}
