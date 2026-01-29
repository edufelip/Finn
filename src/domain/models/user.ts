export type UserRole = 'user' | 'staff' | 'admin';

export type User = {
  id: string;
  name: string;
  photoUrl?: string | null;
  role?: UserRole;
  createdAt?: string;
  followersCount?: number;
  followingCount?: number;
  onlineVisible?: boolean;
  notificationsEnabled?: boolean;
  lastSeenAt?: string | null;
  bio?: string | null;
  location?: string | null;
  termsVersion?: string | null;
  termsAcceptedAt?: string | null;
};
