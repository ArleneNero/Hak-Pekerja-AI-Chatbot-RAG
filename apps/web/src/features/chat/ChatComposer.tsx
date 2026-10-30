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
    <div className="px-4 pb-4 pt-1 flex-shrink-0 bg-transparent">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-[11px] sm:text-xs text-figma-muted mb-2 select-none">
          Informasi umum, bukan nasihat hukum profesional.
        </p>

        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 bg-white border border-figma-border rounded-2xl px-4 py-2 shadow-sm focus-within:border-figma-primary focus-within:ring-4 focus-within:ring-figma-primary/10 transition-all"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Tanyakan hal seputar hak ketenagakerjaan Anda..."
            disabled={isLoading}
            className="flex-1 bg-transparent py-2 text-[14px] text-figma-dark placeholder-figma-muted focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-figma-primary hover:bg-figma-primary-dark disabled:bg-slate-300 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-sm transition-all"
            aria-label="Kirim pertanyaan"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

