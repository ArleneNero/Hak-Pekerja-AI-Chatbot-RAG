import type { ChatMessage } from './chat';

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: string;
  topic?: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  topic?: string;
}

export interface HistoryListResponse {
  conversations: ConversationSummary[];
  total: number;
}

