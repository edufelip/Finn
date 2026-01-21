export type ChatThreadStatus = 'pending' | 'accepted' | 'refused';

export type ChatThread = {
  id: string;
  participantA: string;
  participantB: string;
  createdBy?: string;
  createdAt?: string;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  requestStatus: ChatThreadStatus;
  archivedBy: string[];
};

export type ChatMessage = {
  id: number;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
};
