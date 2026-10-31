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

  // 1. Direct call to Express API Gateway (/api/v1/chat)
  try {
    const gatewayEndpoint = `${API_BASE_URL}/api/v1/chat`;
    const response = await fetch(gatewayEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question,
        conversationId: opts.conversationId,
        history: opts.history || [],
        top_k: 10, // Batas atas pencarian; engine akan memfilter se-relevan mungkin secara dinamis
      }),
      signal: opts.signal,
    });

    if (response.ok) {
      const data: RagApiResponse = await response.json();
      return data;
    }

    const errText = await response.text();
    let cleanMessage = '';
    try {
      const parsed = JSON.parse(errText);
      if (parsed?.error?.message) {
        cleanMessage = parsed.error.message;
      }
    } catch {
      // bukan respons JSON
    }

    throw new Error(cleanMessage || `Layanan tidak merespons (Status ${response.status})`);
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(String(err));
  }
}
