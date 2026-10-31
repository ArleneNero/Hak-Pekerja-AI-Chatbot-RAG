import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Scale, RotateCw } from 'lucide-react';
import { ChatMessage, LegalSource } from '@/types/chat';
import { sendQueryToRag } from '@/services/apiClient';
import { LegalSourceModal } from '@/features/legal-source/LegalSourceModal';
import { useAuth } from '@/features/account/AuthContext';
import { historyService } from '@/services/historyService';
import { ChatHeader } from '@/features/chat/ChatHeader';
import { ChatBubble } from '@/features/chat/ChatBubble';
import { ChatComposer } from '@/features/chat/ChatComposer';
import { ROUTES } from '@/constants/routes';
import type { ConversationDetail } from '@/types/history';

export const ChatPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, getIdToken } = useAuth();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSources, setSelectedSources] = useState<LegalSource[]>([]);
  const [highlightedSourceLabel, setHighlightedSourceLabel] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const hasSentInitialQueryRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load existing conversation if ?id=... is present
  useEffect(() => {
    const activeId = searchParams.get('id') || searchParams.get('conversationId');
    const isNew = searchParams.get('new');

    if (isNew) {
      setConversationId(null);
      setConversationTitle('');
      setMessages([]);
      setSearchParams({});
      return;
    }

    if (activeId && activeId !== conversationId) {
      const loadSavedSession = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
          const token = await getIdToken();
          const detail = await historyService.getConversation(activeId, user.uid, token);
          if (detail) {
            setConversationId(detail.id);
            setConversationTitle(detail.title);
            setMessages(detail.messages || []);
          }
        } catch {
          // Keep current state on fetch failure
        } finally {
          setIsLoading(false);
        }
      };

      loadSavedSession();
    }
  }, [searchParams, user, getIdToken, conversationId, setSearchParams]);

  const handleSendMessage = useCallback(async (queryText: string) => {
    if (!queryText.trim() || isSendingRef.current || isLoading) return;
    isSendingRef.current = true;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryText.trim(),
      createdAt: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    const startTime = Date.now();

    try {
      const token = user ? await getIdToken() : null;
      const conversationHistory = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const response = await sendQueryToRag(queryText.trim(), {
        idToken: token,
        conversationId,
        history: conversationHistory,
      });
      const elapsed = (Date.now() - startTime) / 1000;

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        status: response.status,
        sources: response.sources,
        createdAt: Date.now(),
        latencySeconds: response.latency_seconds || Number(elapsed.toFixed(2)),
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      if (user) {
        const token = await getIdToken();
        const currentConvId = conversationId || `conv-${Date.now()}`;
        const title = conversationTitle || (queryText.length > 50 ? `${queryText.slice(0, 47)}...` : queryText);

        const detail: ConversationDetail = {
          id: currentConvId,
          title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: finalMessages,
        };

        await historyService.saveConversation(detail, user.uid, token);

        if (!conversationId) {
          setConversationId(currentConvId);
          setConversationTitle(title);
          setSearchParams({ id: currentConvId });
        }
      }
    } catch (err: unknown) {
      const elapsed = (Date.now() - startTime) / 1000;

      // Log detail teknis di console untuk debugging, tapi jangan tampilkan ke user
      console.error('[ChatPage] Query failed:', err);

      // Tentukan pesan yang ramah dan menenangkan pengguna
      let userMessage = 'Maaf, terjadi kendala saat memproses pertanyaan Anda. Silakan coba beberapa saat lagi.';
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
          userMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.';
        } else if (msg.includes('timeout') || msg.includes('timed out')) {
          userMessage = 'Permintaan membutuhkan waktu terlalu lama. Silakan coba lagi.';
        } else if (msg.includes('429') || msg.includes('rate limit')) {
          userMessage = 'Layanan sedang menerima banyak pertanyaan. Mohon tunggu beberapa saat sebelum mencoba kembali.';
        } else if (msg.includes('401') || msg.includes('403')) {
          userMessage = 'Sesi Anda telah berakhir. Silakan masuk ulang.';
        } else if (
          msg.includes('500') ||
          msg.includes('server error') ||
          msg.includes('gateway') ||
          msg.includes('cors') ||
          msg.includes('invocation') ||
          msg.includes('internal')
        ) {
          userMessage = 'Layanan sedang mengalami pemeliharaan sementara. Tim kami sedang menanganinya.';
        } else if (err.message && err.message.length < 120 && !err.message.includes('http') && !err.message.includes('{')) {
          // Pesan ramah seperti "Pertanyaan minimal 2 karakter"
          userMessage = err.message;
        }
      }

      const failureMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: userMessage,
        status: 'service_unavailable',
        sources: [],
        createdAt: Date.now(),
        latencySeconds: Number(elapsed.toFixed(2)),
      };

      setMessages((prev) => [...prev, failureMsg]);
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  }, [isLoading, messages, user, getIdToken, conversationId, conversationTitle, setSearchParams]);

  // Handle draft question from home page via ?q=... (with one-shot ref lock to prevent duplicate execution)
  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery && initialQuery.trim() && !hasSentInitialQueryRef.current) {
      hasSentInitialQueryRef.current = true;
      setSearchParams({}, { replace: true });
      handleSendMessage(initialQuery.trim());
    }
  }, [searchParams, handleSendMessage, setSearchParams]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const handleOpenSources = (sources?: LegalSource[], targetLabel?: string) => {
    if (sources && sources.length > 0) {
      setSelectedSources(sources);
      setHighlightedSourceLabel(targetLabel || null);
      setIsModalOpen(true);
    }
  };

  const handleResetSession = () => {
    setConversationId(null);
    setConversationTitle('');
    setMessages([]);
    navigate(ROUTES.CHAT);
  };

  return (
    <div className="flex flex-col h-full bg-figma-canvas relative">
      {/* 1. Header Bar */}
      <ChatHeader title={conversationTitle} onNewChat={handleResetSession} />

      {/* 2. Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-figma-muted max-w-md mx-auto">
            <div className="w-24 h-24 mb-4 flex items-center justify-center">
              <img
                src="/assets/document-hint.png"
                alt="Pertanyaan Regulasi HakKetenagakerjaan"
                className="w-full h-full object-contain select-none drop-shadow-sm"
              />
            </div>
            <h3 className="text-lg font-bold text-figma-dark mb-2">
              Apa yang ingin Anda tanyakan seputar hak ketenagakerjaan?
            </h3>
            <p className="text-xs text-figma-body leading-relaxed mb-4">
              Ketik pertanyaan tentang PKWT/PKWTT, uang lembur, pesangon PHK, perhitungan cuti atau THR di bawah.
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const prevUserMsg = msg.role !== 'user'
            ? [...messages.slice(0, index)].reverse().find((m) => m.role === 'user')
            : null;

          return (
            <ChatBubble
              key={msg.id}
              message={msg}
              onOpenSources={handleOpenSources}
              onRetry={prevUserMsg ? () => handleSendMessage(prevUserMsg.content) : undefined}
            />
          );
        })}

        {/* Real Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 max-w-3xl mr-auto animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E8EDF4] text-[#285CF5] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Scale size={16} />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none border border-[#E8EDF4] px-5 py-4 shadow-sm flex items-center gap-3 text-[13.5px] text-[#42506A]">
              <RotateCw size={17} className="animate-spin text-[#285CF5]" />
              <span className="font-medium">Sedang menyusun jawaban...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Sticky Composer Bar */}
      <ChatComposer
        inputText={inputText}
        isLoading={isLoading}
        onInputChange={setInputText}
        onSubmit={handleFormSubmit}
      />

      {/* 4. Legal Source Dialog/Sheet Modal */}
      <LegalSourceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setHighlightedSourceLabel(null);
        }}
        sources={selectedSources}
        highlightedLabel={highlightedSourceLabel}
      />
    </div>
  );
};
