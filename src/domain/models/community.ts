export type Community = {
  id: number;
  title: string;
  description: string;
  imageUrl?: string | null;
  ownerId: string;
  createdAt?: string;
  subscribersCount?: number;
};
