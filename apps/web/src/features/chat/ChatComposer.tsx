import React from 'react';
import { Send } from 'lucide-react';

interface ChatComposerProps {
  inputText: string;
  isLoading: boolean;
  onInputChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  inputText,
  isLoading,
  onInputChange,
  onSubmit,
}) => {
  return (
    <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 sm:pt-2 flex-shrink-0 bg-white/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-slate-200/60 sm:border-0 z-20">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-[10.5px] sm:text-xs text-figma-muted mb-1 select-none">
          Informasi umum, bukan nasihat hukum profesional.
        </p>

        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 bg-white border border-[#D5DFE9] rounded-2xl px-3 sm:px-4 py-1 sm:py-1.5 shadow-xs focus-within:border-[#285CF5] focus-within:ring-3 focus-within:ring-[#285CF5]/10 transition-all"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Tanyakan hal seputar hak ketenagakerjaan Anda..."
            disabled={isLoading}
            className="flex-1 bg-transparent py-1.5 sm:py-2 text-[13.5px] sm:text-[14px] text-figma-dark placeholder-slate-400 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-[#285CF5] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1740B8] disabled:bg-none disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-xs transition-all shrink-0 active:scale-95"
            aria-label="Kirim pertanyaan"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};

