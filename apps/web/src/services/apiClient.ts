import { RagStatus, LegalSource } from '../types/chat';

export interface RagApiResponse {
  status: RagStatus;
  answer: string;
  sources: LegalSource[];
  request_id: string;
  latency_seconds: number;
  conversationId?: string;
}

export interface SendQueryOptions {
  idToken?: string | null;
  conversationId?: string | null;
  history?: Array<{ role: string; content: string }>;
  signal?: AbortSignal;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function sendQueryToRag(
  question: string,
  options?: SendQueryOptions | AbortSignal
): Promise<RagApiResponse> {
  // Support both legacy signature (question, signal) and new options object
  const opts: SendQueryOptions = options instanceof AbortSignal 
    ? { signal: options } 
    : (options || {});

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (opts.idToken) {
    headers['Authorization'] = `Bearer ${opts.idToken}`;
  }

  // 1. First attempt: Express API Gateway endpoint (/api/v1/chat)
  try {
    const gatewayEndpoint = `${API_BASE_URL}/api/v1/chat`;
    const response = await fetch(gatewayEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question,
        conversationId: opts.conversationId,
        history: opts.history || [],
        top_k: 7,
      }),
      signal: opts.signal,
    });

    if (response.ok) {
      const data: RagApiResponse = await response.json();
      return data;
    }
  } catch {
    // If Gateway is not reachable, fall back to direct internal RAG proxy
  }

  // 2. Direct internal RAG fallback (/internal/rag/query)
  const ragEndpoint = `${API_BASE_URL}/internal/rag/query`;
  const response = await fetch(ragEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      top_k: 7,
      history: opts.history || [],
    }),
    signal: opts.signal,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gagal menghubungi layanan RAG (${response.status}): ${errorBody.slice(0, 100)}`);
  }

  const data: RagApiResponse = await response.json();
  return data;
}
