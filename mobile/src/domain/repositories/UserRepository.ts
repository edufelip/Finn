import type { User } from '../models/user';

export interface UserRepository {
  getUser(id: string): Promise<User | null>;
  createUser(user: User): Promise<User>;
  deleteUser(id: string): Promise<void>;
  setOnlineVisibility(id: string, visible: boolean): Promise<void>;
  setNotificationsEnabled(id: string, enabled: boolean): Promise<void>;
  savePushToken(id: string, token: string, platform: string): Promise<void>;
  updateLastSeenAt(id: string, timestamp: string): Promise<void>;
}
