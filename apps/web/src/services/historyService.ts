import type { ConversationSummary, ConversationDetail } from '@/types/history';

const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
const API_BASE_URL = rawBase
  ? (rawBase.endsWith('/api/v1') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api/v1`)
  : '/api/v1';

/**
 * Service to manage authenticated conversation history.
 * Follows the B/E Express contract with user authorization headers.
 * Provides fallback to client-side scoped cache if backend Express API is not running.
 */
class HistoryService {
  private getStorageKey(userId: string): string {
    return `hp_history_${userId}`;
  }

  private getLocalConversations(userId: string): ConversationDetail[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(userId));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setLocalConversations(userId: string, items: ConversationDetail[]): void {
    try {
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(items));
    } catch (e) {
      console.warn('[HistoryService] Failed to cache locally:', e);
    }
  }

  async listConversations(userId: string, idToken: string | null): Promise<ConversationSummary[]> {
    if (!userId) {
      return [];
    }

    let remoteList: ConversationSummary[] = [];
    if (idToken) {
      try {
        const response = await fetch(`${API_BASE_URL}/conversations`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          remoteList = data.conversations || [];
        }
      } catch (err) {
        console.warn('[HistoryService] Failed to fetch remote conversations:', err);
      }
    }

    // Local user-scoped cache (always has instant client-side updates)
    const local = this.getLocalConversations(userId);
    const localSummaries: ConversationSummary[] = local.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c.messages.length,
      lastMessage: c.messages[c.messages.length - 1]?.content || '',
      topic: c.topic,
    }));

    // Merge remote and local by conversation ID, prioritizing newer updates
    const summaryMap = new Map<string, ConversationSummary>();
    for (const r of remoteList) {
      summaryMap.set(r.id, r);
    }
    for (const l of localSummaries) {
      const existing = summaryMap.get(l.id);
      if (!existing) {
        summaryMap.set(l.id, l);
      } else {
        const timeLocal = new Date(l.updatedAt || l.createdAt).getTime();
        const timeRemote = new Date(existing.updatedAt || existing.createdAt).getTime();
        if (timeLocal >= timeRemote) {
          summaryMap.set(l.id, l);
        }
      }
    }

    const merged = Array.from(summaryMap.values());
    merged.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });

    // Deduplicate any accidental duplicate conversations created within a short window (e.g. race conditions)
    const deduplicated: ConversationSummary[] = [];
    const seenSignatures = new Set<string>();

    for (const item of merged) {
      const timeMs = new Date(item.updatedAt || item.createdAt || 0).getTime();
      // Group by title and 60-second window
      const timeWindow = Math.floor(timeMs / 60000);
      const signature = `${(item.title || '').trim().toLowerCase()}_${timeWindow}`;
      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        deduplicated.push(item);
      }
    }

    return deduplicated;
  }

  async getConversation(
    conversationId: string,
    userId: string,
    idToken: string | null
  ): Promise<ConversationDetail | null> {
    if (!userId) return null;

    if (idToken) {
      try {
        const response = await fetch(`${API_BASE_URL}/conversations/${encodeURIComponent(conversationId)}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          return await response.json();
        }
      } catch {
        // Fallback to local user-scoped storage
      }
    }

    const local = this.getLocalConversations(userId);
    return local.find((c) => c.id === conversationId) || null;
  }

  async saveConversation(
    detail: ConversationDetail,
    userId: string,
    idToken: string | null
  ): Promise<void> {
    if (!userId) return;

    // 1. Immediately update user-scoped local persistence so UI has zero delay
    const local = this.getLocalConversations(userId);
    const index = local.findIndex((c) => c.id === detail.id);
    const updatedRecord = { ...detail, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      local[index] = updatedRecord;
    } else {
      local.unshift(updatedRecord);
    }
    this.setLocalConversations(userId, local);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hp_conversations_changed', { detail: { id: detail.id } }));
    }

    // 2. Persist to Cloud Firestore via Express API Gateway
    if (idToken) {
      try {
        const res = await fetch(`${API_BASE_URL}/conversations`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(detail),
        });
        if (!res.ok) {
          console.warn('[HistoryService] Server returned non-ok on save:', res.status);
        }
      } catch (err) {
        console.warn('[HistoryService] Failed to save conversation to server:', err);
      }
    }
  }

  async deleteConversation(
    conversationId: string,
    userId: string,
    idToken: string | null
  ): Promise<void> {
    if (!userId) return;

    if (idToken) {
      try {
        await fetch(`${API_BASE_URL}/conversations/${encodeURIComponent(conversationId)}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
      } catch {
        // Express not ready
      }
    }

    const local = this.getLocalConversations(userId);
    const filtered = local.filter((c) => c.id !== conversationId);
    this.setLocalConversations(userId, filtered);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hp_conversations_changed', { detail: { id: conversationId } }));
    }
  }
}

export const historyService = new HistoryService();

