export type User = {
  id: string;
  name: string;
  photoUrl?: string | null;
  createdAt?: string;
  followersCount?: number;
  followingCount?: number;
};
