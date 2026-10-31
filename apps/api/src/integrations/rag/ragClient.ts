import { executeRagQuery, RagResult, LegalSourceDto, RagStatus } from '../../rag/ragEngine';
import { config } from '../../config/env';

export type LegalSource = LegalSourceDto;
export type { RagStatus };
export type RagQueryResponse = RagResult;

class RagClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.ragServiceUrl;
  }

  async checkHealth(): Promise<boolean> {
    // Dengan embedded RAG, health selalu true jika config Qdrant & Chat Key tersedia
    if (config.qdrantUrl && config.chatApiKey) {
      return true;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
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
    // 1. Prioritaskan Eksekusi Embedded RAG (Pola Xiaomimi - Langsung di Node.js)
    try {
      if (config.qdrantUrl && config.chatApiKey) {
        return await executeRagQuery(question, topK, requestId, history);
      }
    } catch (embeddedErr) {
      console.warn('[RagClient] Embedded RAG query error, trying remote fallback if configured:', embeddedErr);
    }

    // 2. Fallback jika ada service terpisah di RAG_SERVICE_URL
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
