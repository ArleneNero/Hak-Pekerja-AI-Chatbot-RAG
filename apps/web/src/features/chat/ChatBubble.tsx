import React from 'react';
import { User, Scale, Clock, BookOpen, RotateCw, ExternalLink } from 'lucide-react';
import { ChatMessage, LegalSource } from '@/types/chat';
import { ChatStatusBadge } from './ChatStatusBadge';

interface ChatBubbleProps {
  message: ChatMessage;
  onOpenSources: (sources?: LegalSource[]) => void;
  onRetry?: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onOpenSources, onRetry }) => {
  const isUser = message.role === 'user';

  const renderContent = (content: string) => {
    if (isUser) {
      return content;
    }

    // Ubah sitasi [Rujukan 1] menjadi badge interaktif, dan markdown link [Text](url) menjadi clickable link
    const parts = content.split(/(\[(?:Rujukan|S)\s*\d+[^\]]*\]|\[[^\]]+\]\(https?:\/\/[^\s\)]+\))/g);
    return parts.map((part, index) => {
      // 1. Cek Sitasi Rujukan Hukum Resmi
      const citationMatch = part.match(/^\[((?:Rujukan|S)\s*\d+)([^\]]*)\]$/);
      if (citationMatch) {
        const label = citationMatch[1];
        const extra = citationMatch[2];
        return (
          <button
            key={index}
            type="button"
            onClick={() => onOpenSources(message.sources)}
            title={`Lihat rujukan hukum resmi untuk ${label}`}
            className="inline-flex items-center gap-0.5 mx-1 px-1.5 py-0.5 rounded-md bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#315BF4] font-semibold text-[11px] border border-[#C7D2FE] transition-colors align-baseline shadow-xs"
          >
            <span>{label}{extra}</span>
          </button>
        );
      }

      // 2. Cek Markdown Link [Nama Layanan / Portal Resmi](URL)
      const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)$/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const linkUrl = linkMatch[2];
        return (
          <a
            key={index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Buka layanan resmi: ${linkText}`}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-md bg-blue-50/80 hover:bg-blue-100 text-[#285CF5] hover:text-[#1844C7] underline font-semibold text-[12px] border border-blue-200 transition-colors align-baseline"
          >
            <span>{linkText}</span>
            <ExternalLink size={12} className="inline shrink-0" />
          </a>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      className={`flex items-start gap-3 max-w-3xl ${
        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
      }`}
    >
      {/* Role Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isUser
            ? 'bg-figma-primary text-white shadow-sm'
            : 'bg-white border border-figma-border text-figma-primary shadow-sm'
        }`}
      >
        {isUser ? <User size={16} /> : <Scale size={16} />}
      </div>

      {/* Bubble Container */}
      <div
        className={`rounded-2xl px-5 py-4 shadow-sm text-[14px] leading-relaxed ${
          isUser
            ? 'bg-figma-primary-soft text-figma-dark font-medium rounded-tr-none'
            : 'bg-white text-figma-dark border border-figma-border rounded-tl-none'
        }`}
      >
        {/* Assistant Header Metadata */}
        {!isUser && (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
            <ChatStatusBadge status={message.status} />
            {message.latencySeconds !== undefined && (
              <span className="text-[11px] text-figma-muted flex items-center gap-1 font-mono">
                <Clock size={12} />
                {message.latencySeconds}s
              </span>
            )}
          </div>
        )}

        {/* Message Content (Pure React text rendering, safe from script injection) */}
        <div className="whitespace-pre-wrap">{renderContent(message.content)}</div>

        {/* Action: Retry if service error */}
        {!isUser && message.status === 'service_unavailable' && onRetry && (
          <div className="mt-3 pt-2 border-t border-red-100 flex items-center">
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[12px] border border-red-200 transition-colors shadow-sm"
            >
              <RotateCw size={13} />
              <span>Coba Kirim Ulang</span>
            </button>
          </div>
        )}

        {/* Assistant Legal Source Citation Button */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onOpenSources(message.sources)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-figma-primary-soft text-figma-primary font-bold text-[12px] border border-figma-border hover:border-figma-primary/30 transition-all shadow-sm"
            >
              <BookOpen size={14} />
              <span>Lihat Sumber ({message.sources.length} rujukan resmi)</span>
            </button>
            <span className="text-[11px] text-figma-muted">
              Tautan JDIH BPK/Kemnaker
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

