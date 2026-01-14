export type User = {
  id: string;
  name: string;
  photoUrl?: string | null;
  createdAt?: string;
  followersCount?: number;
  followingCount?: number;
  onlineVisible?: boolean;
  notificationsEnabled?: boolean;
  lastSeenAt?: string | null;
  bio?: string | null;
  location?: string | null;
};
