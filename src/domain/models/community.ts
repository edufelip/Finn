export type Community = {
  id: number;
  title: string;
  description: string;
  imageUrl?: string | null;
  ownerId: string;
  topicId?: number | null;
  createdAt?: string;
  subscribersCount?: number;
};
