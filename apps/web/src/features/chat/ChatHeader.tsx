import React from 'react';
import { Scale, Plus } from 'lucide-react';

interface ChatHeaderProps {
  title?: string;
  onNewChat: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ title, onNewChat }) => {
  return (
    <div className="px-5 py-3 bg-white border-b border-figma-border flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#ECF1FF] text-[#285CF5] flex items-center justify-center shrink-0">
          <Scale size={18} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-[#1D2737] leading-tight truncate">
            {title || 'Ruang Pertanyaan Regulasi'}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onNewChat}
          className="text-[12px] font-semibold text-figma-muted hover:text-figma-dark px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Percakapan Baru</span>
        </button>
      </div>
    </div>
  );
};

