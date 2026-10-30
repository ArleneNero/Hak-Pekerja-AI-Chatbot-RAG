import { getFirestoreDb } from '../../integrations/firebase/firebaseAdmin';
import { LegalSource } from '../../integrations/rag/ragClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  sources?: LegalSource[];
  latencySeconds?: number;
}

export interface ConversationDocument {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string;
  topic?: string;
}

export interface ConversationDetail extends ConversationDocument {
  messages: ChatMessage[];
}

// In-memory fallback storage when Firestore credentials are not yet configured in .env
const memoryStore = new Map<string, ConversationDetail>();

// Helper to sanitize payload and remove undefined fields before Firestore operations
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeForFirestore(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item !== null && typeof item === 'object' ? sanitizeForFirestore(item) : item
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

export class ConversationService {
  private getDb() {
    return getFirestoreDb();
  }

  async listUserConversations(userId: string): Promise<ConversationDocument[]> {
    const db = this.getDb();
    if (!db) {
      // In-memory fallback
      const userConvs: ConversationDocument[] = [];
      for (const conv of memoryStore.values()) {
        if (conv.userId === userId) {
          const { messages, ...summary } = conv;
          userConvs.push(summary);
        }
      }
      return userConvs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    try {
      let snapshot;
      try {
        snapshot = await db
          .collection('users')
          .doc(userId)
          .collection('chats')
          .orderBy('updatedAt', 'desc')
          .limit(50)
          .get();
      } catch (orderErr) {
        // Fallback without orderBy if index is still building or missing
        snapshot = await db
          .collection('users')
          .doc(userId)
          .collection('chats')
          .limit(50)
          .get();
      }

      const docs = snapshot.docs.map((doc: any) => doc.data() as ConversationDocument);
      return docs.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
    } catch (error) {
      console.warn('[ConversationService] Firestore list error, falling back to memory:', error);
      const userConvs: ConversationDocument[] = [];
      for (const conv of memoryStore.values()) {
        if (conv.userId === userId) {
          const { messages, ...summary } = conv;
          userConvs.push(summary);
        }
      }
      return userConvs;
    }
  }

  async getConversationDetail(userId: string, conversationId: string): Promise<ConversationDetail | null> {
    const db = this.getDb();
    if (!db) {
      const conv = memoryStore.get(`${userId}:${conversationId}`);
      return conv || null;
    }

    try {
      const convRef = db.collection('users').doc(userId).collection('chats').doc(conversationId);
      const doc = await convRef.get();
      if (!doc.exists) return null;

      const convData = doc.data() as ConversationDocument;
      const messagesSnapshot = await convRef.collection('messages').orderBy('createdAt', 'asc').get();
      const messages = messagesSnapshot.docs.map((m: any) => m.data() as ChatMessage);

      return {
        ...convData,
        messages,
      };
    } catch (error) {
      console.warn('[ConversationService] Firestore get error:', error);
      return memoryStore.get(`${userId}:${conversationId}`) || null;
    }
  }

  async saveConversation(
    userId: string,
    conversationId: string,
    title: string,
    messages: ChatMessage[],
    topic?: string
  ): Promise<ConversationDocument> {
    const now = new Date().toISOString();
    const lastMsg = messages[messages.length - 1]?.content || '';

    const summary: ConversationDocument = {
      id: conversationId,
      userId,
      title: title || (lastMsg.slice(0, 40) + '...'),
      createdAt: now,
      updatedAt: now,
      messageCount: messages.length,
      lastMessage: lastMsg,
      topic: topic || '',
    };

    const fullDetail: ConversationDetail = {
      ...summary,
      messages,
    };

    // Always keep memory cache in sync
    memoryStore.set(`${userId}:${conversationId}`, fullDetail);

    const db = this.getDb();
    if (db) {
      try {
        const convRef = db.collection('users').doc(userId).collection('chats').doc(conversationId);
        const cleanSummary = sanitizeForFirestore(summary);
        await convRef.set(cleanSummary, { merge: true });

        // Save messages in subcollection batch
        const batch = db.batch();
        const messagesCol = convRef.collection('messages');
        for (const msg of messages) {
          const msgRef = messagesCol.doc(msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`);
          const cleanMsg = sanitizeForFirestore(msg as any);
          batch.set(msgRef, cleanMsg);
        }
        await batch.commit();
      } catch (error) {
        console.warn('[ConversationService] Firestore save error:', error);
      }
    }

    return summary;
  }

  async deleteConversation(userId: string, conversationId: string): Promise<boolean> {
    memoryStore.delete(`${userId}:${conversationId}`);

    const db = this.getDb();
    if (db) {
      try {
        const convRef = db.collection('users').doc(userId).collection('chats').doc(conversationId);
        
        // Delete subcollection messages
        const msgs = await convRef.collection('messages').get();
        const batch = db.batch();
        msgs.docs.forEach((d: any) => batch.delete(d.ref));
        batch.delete(convRef);
        await batch.commit();
      } catch (error) {
        console.warn('[ConversationService] Firestore delete error:', error);
      }
    }

    return true;
  }
}

export const conversationService = new ConversationService();
