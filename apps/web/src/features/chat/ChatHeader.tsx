import React from 'react';
import { Scale, Plus, Menu } from 'lucide-react';

interface ChatHeaderProps {
  title?: string;
  onNewChat: () => void;
  onToggleSidebar?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ title, onNewChat, onToggleSidebar }) => {
  const handleToggle = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      window.dispatchEvent(new CustomEvent('hp_toggle_mobile_drawer'));
    }
  };

  return (
    <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-white border-b border-figma-border flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        {/* Tombol Sidebar di Ruang Pertanyaan Regulasi untuk Mobile UI */}
        <button
          type="button"
          onClick={handleToggle}
          className="md:hidden p-1.5 -ml-1 text-[#42506A] hover:text-[#1D2737] active:bg-slate-100 rounded-lg transition-colors flex items-center justify-center shrink-0"
          aria-label="Buka Menu Sidebar"
          title="Buka Menu Sidebar"
        >
          <Menu size={20} className="stroke-[2.2]" />
        </button>

        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#ECF1FF] text-[#285CF5] flex items-center justify-center shrink-0">
          <Scale size={16} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[14px] sm:text-[15px] font-bold text-[#1D2737] leading-tight truncate">
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


