import { Router, Request, Response, NextFunction } from 'express';
import { ragClient } from '../../integrations/rag/ragClient';
import { optionalAuth } from '../../middleware/authMiddleware';
import { conversationService } from '../conversations/conversationService';

export const chatRouter = Router();

chatRouter.post('/chat', optionalAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { question, top_k, conversationId, topic, history } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parameter "question" wajib diisi dan bertipe string.',
          request_id: req.id || 'unknown',
        },
      });
      return;
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 2) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Pertanyaan minimal 2 karakter.',
          request_id: req.id || 'unknown',
        },
      });
      return;
    }

    if (trimmedQuestion.length > 1000) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Pertanyaan maksimal 1000 karakter.',
          request_id: req.id || 'unknown',
        },
      });
      return;
    }

    // Prepare history context if available
    let conversationHistory: Array<{ role: string; content: string }> = Array.isArray(history) ? history : [];
    if (conversationHistory.length === 0 && req.user && conversationId) {
      const existing = await conversationService.getConversationDetail(req.user.uid, conversationId);
      if (existing && Array.isArray(existing.messages)) {
        conversationHistory = existing.messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        }));
      }
    }

    const topKNumber = typeof top_k === 'number' && top_k > 0 ? top_k : 10;
    const ragResponse = await ragClient.query(trimmedQuestion, topKNumber, req.id, conversationHistory);

    // If authenticated user provided or requested conversation tracking:
    if (req.user && conversationId) {
      const now = new Date().toISOString();
      const existing = await conversationService.getConversationDetail(req.user.uid, conversationId);
      const messages = existing ? [...existing.messages] : [];

      // Append user message
      messages.push({
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmedQuestion,
        createdAt: now,
      });

      // Append assistant message
      messages.push({
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: ragResponse.answer,
        createdAt: new Date().toISOString(),
        sources: ragResponse.sources,
        latencySeconds: ragResponse.latency_seconds,
      });

      await conversationService.saveConversation(
        req.user.uid,
        conversationId,
        existing?.title || trimmedQuestion.slice(0, 45) + '...',
        messages,
        topic || existing?.topic
      );
    }

    res.json({
      status: ragResponse.status,
      answer: ragResponse.answer,
      sources: ragResponse.sources,
      request_id: req.id || ragResponse.request_id,
      latency_seconds: ragResponse.latency_seconds,
      conversationId: conversationId || undefined,
    });
  } catch (err: unknown) {
    next(err);
  }
});
