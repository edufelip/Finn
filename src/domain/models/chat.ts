export type ChatThread = {
  id: string;
  participantA: string;
  participantB: string;
  createdAt?: string;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
};

export type ChatMessage = {
  id: number;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
};
