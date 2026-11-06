import React from 'react';
import { Clock, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { ConversationSummary } from '@/types/history';
import { stripMarkdown } from '@/utils/formatters';

interface HistoryCardProps {
  conversation: ConversationSummary;
  isDeleting: boolean;
  onSelect: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  conversation,
  isDeleting,
  onSelect,
  onDelete,
}) => {
  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div
      onClick={() => onSelect(conversation.id)}
      className="group relative p-4 bg-white hover:bg-slate-50/70 border border-figma-border hover:border-figma-primary/40 rounded-2xl transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between gap-4"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold text-figma-dark group-hover:text-figma-primary transition-colors truncate">
            {stripMarkdown(conversation.title)}
          </h3>
          {conversation.topic && (
            <span className="px-2 py-0.5 rounded-full bg-figma-primary-soft text-figma-primary text-[10px] font-semibold shrink-0">
              {conversation.topic}
            </span>
          )}
        </div>

        {conversation.lastMessage && (
          <p className="text-xs text-figma-body line-clamp-1 mb-2">
            {stripMarkdown(conversation.lastMessage)}
          </p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-figma-muted">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            <span>{formatDate(conversation.updatedAt || conversation.createdAt)}</span>
          </span>
          <span>•</span>
          <span>{conversation.messageCount} pesan</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={(e) => onDelete(e, conversation.id)}
          disabled={isDeleting}
          className="p-2 text-figma-muted hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          title="Hapus percakapan"
          aria-label="Hapus percakapan"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
        <ArrowRight size={16} className="text-figma-muted group-hover:text-figma-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
};

