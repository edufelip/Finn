export type Comment = {
  id: number;
  postId: number;
  userId: string;
  userName?: string;
  userImageUrl?: string | null;
  content: string;
  createdAt?: string;
};
