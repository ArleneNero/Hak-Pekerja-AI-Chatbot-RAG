import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/account/AuthContext';
import { AuthModal, type AuthMode } from '@/features/account/AuthModal';
import { historyService } from '@/services/historyService';
import { HistoryCard } from '@/features/history/HistoryCard';
import { GuestHistoryEmptyState, UserNoHistoryState } from '@/features/history/HistoryEmptyState';
import { ROUTES } from '@/constants/routes';
import type { ConversationSummary } from '@/types/history';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, getIdToken } = useAuth();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      if (!user) {
        setConversations([]);
        return;
      }
      setLoading(true);
      try {
        const token = await getIdToken();
        const list = await historyService.listConversations(user.uid, token);
        if (isMounted) {
          setConversations(list);
        }
      } catch (err) {
        console.error('[History] Failed to fetch:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [user, getIdToken]);

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (!user) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus sesi percakapan ini?')) return;

    setDeletingId(conversationId);
    try {
      const token = await getIdToken();
      await historyService.deleteConversation(conversationId, user.uid, token);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    } catch (err) {
      console.error('[History] Failed to delete:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(query)) ||
        (c.topic && c.topic.toLowerCase().includes(query))
    );
  }, [conversations, searchQuery]);

  const openAuth = (mode: AuthMode) => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-figma-border">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1D2737]">Riwayat Percakapan</h1>
        </div>

        <button
          onClick={() => navigate(`${ROUTES.CHAT}?new=true`)}
          className="h-10 px-4 rounded-xl bg-[#285CF5] text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#1D4ED8] shadow-sm transition-all shrink-0"
        >
          <MessageSquare size={16} />
          <span>Mulai Chat Baru</span>
        </button>
      </div>

      {/* 2. State Guest */}
      {!user && (
        <GuestHistoryEmptyState
          onContinueAsGuest={() => navigate(ROUTES.CHAT)}
          onOpenAuth={() => openAuth('login')}
        />
      )}

      {/* 3. State Authenticated User */}
      {user && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-figma-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari topik atau kata kunci percakapan..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-figma-border rounded-xl text-xs text-figma-dark placeholder-figma-muted focus:outline-none focus:ring-2 focus:ring-figma-primary/20 focus:border-figma-primary transition-all"
              />
            </div>
            <span className="text-xs font-semibold text-figma-muted">
              {filteredConversations.length} sesi tersimpan
            </span>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-figma-muted">
              <Loader2 className="w-6 h-6 animate-spin text-figma-primary mb-2" />
              <span className="text-xs">Memuat daftar riwayat...</span>
            </div>
          )}

          {!loading && conversations.length === 0 && (
            <UserNoHistoryState
              onStartNewChat={() => navigate(`${ROUTES.CHAT}?new=true`)}
            />
          )}

          {!loading && conversations.length > 0 && filteredConversations.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-figma-border text-xs text-figma-muted">
              Tidak ditemukan percakapan yang cocok dengan kata kunci &quot;{searchQuery}&quot;.
            </div>
          )}

          {!loading && filteredConversations.length > 0 && (
            <div className="grid gap-3">
              {filteredConversations.map((item) => (
                <HistoryCard
                  key={item.id}
                  conversation={item}
                  isDeleting={deletingId === item.id}
                  onSelect={(id) => navigate(`${ROUTES.CHAT}?id=${id}`)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
};
