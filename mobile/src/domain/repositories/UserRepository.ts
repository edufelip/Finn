import type { User } from '../models/user';
import type { Notification } from '../models/notification';

export interface UserRepository {
  getUser(id: string): Promise<User | null>;
  createUser(user: User): Promise<User>;
  deleteUser(id: string): Promise<void>;
  setOnlineVisibility(id: string, visible: boolean): Promise<void>;
  setNotificationsEnabled(id: string, enabled: boolean): Promise<void>;
  savePushToken(id: string, token: string, platform: string, env: 'dev' | 'prod'): Promise<void>;
  updateLastSeenAt(id: string, timestamp: string): Promise<void>;
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(notificationId: number): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  updateProfilePhoto(userId: string, imageUri: string): Promise<User>;
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowersCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
}
