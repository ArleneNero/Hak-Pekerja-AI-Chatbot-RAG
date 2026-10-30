export type RagStatus =
  | 'answered'
  | 'insufficient_evidence'
  | 'needs_review'
  | 'out_of_scope'
  | 'invalid_question'
  | 'service_unavailable';

export interface LegalSource {
  label?: string;
  document_id: string;
  title: string;
  official_url?: string;
  article?: string;
  page?: number;
  source_section?: string;
  score?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: RagStatus;
  sources?: LegalSource[];
  createdAt: number;
  latencySeconds?: number;
}

export interface ExampleQuestion {
  id: string;
  number: string;
  title: string;
  query: string;
  colorBg: string;
  colorText: string;
}

export interface LegalTopic {
  id: string;
  title: string;
  description: string;
  colorBg: string;
  iconName: string;
}

