import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/authMiddleware';
import { conversationService } from './conversationService';

export const conversationRouter = Router();

// Apply requireAuth to all /conversations endpoints
conversationRouter.use('/conversations', requireAuth);

// GET /conversations - List conversations for authenticated user
conversationRouter.get('/conversations', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const conversations = await conversationService.listUserConversations(userId);

    res.json({
      conversations,
      total: conversations.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /conversations - Save or update conversation
conversationRouter.post('/conversations', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const { id, title, messages, topic } = req.body;

    const conversationId = id ? String(id) : `conv-${Date.now()}`;
    const messageList = Array.isArray(messages) ? messages : [];

    const saved = await conversationService.saveConversation(
      userId,
      conversationId,
      title,
      messageList,
      topic
    );

    res.status(200).json({
      ...saved,
      status: 'saved',
    });
  } catch (error) {
    next(error);
  }
});

// GET /conversations/:id - Get conversation detail
conversationRouter.get('/conversations/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const id = String(req.params.id);

    const detail = await conversationService.getConversationDetail(userId, id);

    if (!detail) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Sesi percakapan tidak ditemukan atau bukan milik Anda.',
          request_id: req.id || 'unknown',
        },
      });
      return;
    }

    res.json(detail);
  } catch (error) {
    next(error);
  }
});

// DELETE /conversations/:id - Delete conversation
conversationRouter.delete('/conversations/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const id = String(req.params.id);

    await conversationService.deleteConversation(userId, id);

    res.json({
      status: 'deleted',
      id,
    });
  } catch (error) {
    next(error);
  }
});
