import { config } from '../../config/env';

export interface LegalSource {
  id: string;
  title: string;
  label?: string;
  article?: string;
  page?: number;
  official_url?: string;
  source_section?: string;
}

export type RagStatus =
  | 'answered'
  | 'insufficient_evidence'
  | 'needs_review'
  | 'out_of_scope'
  | 'invalid_question'
  | 'service_unavailable';

export interface RagQueryResponse {
  status: RagStatus;
  answer: string;
  sources: LegalSource[];
  request_id: string;
  latency_seconds: number;
}

class RagClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.ragServiceUrl;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.baseUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }

  async query(
    question: string,
    topK: number = 7,
    requestId?: string,
    history?: Array<{ role: string; content: string }>
  ): Promise<RagQueryResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const res = await fetch(`${this.baseUrl}/internal/rag/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': requestId || '',
        },
        body: JSON.stringify({
          question,
          top_k: topK,
          history: history || [],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`RAG service responded with status ${res.status}: ${errText.slice(0, 100)}`);
      }

      return (await res.json()) as RagQueryResponse;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('RAG service timeout exceeded (90s).');
      }
      throw err;
    }
  }
}

export const ragClient = new RagClient();

