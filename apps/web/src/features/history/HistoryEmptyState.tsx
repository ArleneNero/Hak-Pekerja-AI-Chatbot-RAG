import React from 'react';
import { ArrowRight, LogIn, ShieldCheck, MessageSquare } from 'lucide-react';

interface GuestEmptyStateProps {
  onContinueAsGuest: () => void;
  onOpenAuth: () => void;
}

export const GuestHistoryEmptyState: React.FC<GuestEmptyStateProps> = ({
  onContinueAsGuest,
  onOpenAuth,
}) => {
  return (
    <div className="rounded-[28px] bg-white border border-figma-border p-8 md:p-12 text-center max-w-xl mx-auto shadow-sm">
      <div className="w-28 h-28 mx-auto mb-4 flex items-center justify-center">
        <img
          src="/assets/illustration-history.png"
          alt="Ilustrasi Riwayat Akun"
          className="w-full h-full object-contain select-none drop-shadow-sm"
        />
      </div>

      <h2 className="text-xl font-bold text-figma-dark mb-2">
        Riwayat Percakapan Membutuhkan Akun
      </h2>

      <p className="text-sm text-figma-body leading-relaxed mb-6">
        Saat ini Anda berada dalam <strong>Mode Tamu (Guest)</strong>. Anda tetap dapat bertanya dan memeriksa regulasi bebas tanpa batas, namun riwayat percakapan tidak dapat disimpan secara permanen tanpa akun.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onContinueAsGuest}
          className="w-full sm:w-auto h-11 px-5 rounded-xl bg-slate-50 hover:bg-figma-primary-soft text-[#285CF5] font-semibold text-xs border border-figma-border flex items-center justify-center gap-2 transition-all"
        >
          <span>Lanjut Tanya Tanpa Akun</span>
          <ArrowRight size={14} />
        </button>

        <button
          onClick={onOpenAuth}
          className="w-full sm:w-auto h-11 px-5 rounded-xl bg-[#285CF5] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <LogIn size={15} />
          <span>Masuk / Daftar Akun</span>
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-figma-muted">
        <ShieldCheck size={16} className="text-emerald-500" />
        <span>Kerahasiaan riwayat terisolasi penuh per akun terotentikasi</span>
      </div>
    </div>
  );
};

interface UserNoHistoryProps {
  onStartNewChat: () => void;
}

export const UserNoHistoryState: React.FC<UserNoHistoryProps> = ({ onStartNewChat }) => {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-[28px] border border-figma-border shadow-sm">
      <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
        <img
          src="/assets/document-hint.png"
          alt="Belum Ada Riwayat"
          className="w-full h-full object-contain select-none drop-shadow-sm"
        />
      </div>
      <h3 className="text-lg font-bold text-figma-dark mb-1">
        Belum Ada Riwayat Percakapan
      </h3>
      <p className="text-xs text-figma-muted max-w-md mx-auto mb-6 leading-relaxed">
        Pertanyaan dan rujukan hukum ketenagakerjaan yang Anda lakukan saat masuk akan otomatis disimpan di sini sehingga dapat Anda telaah kembali kapan saja.
      </p>
      <button
        onClick={onStartNewChat}
        className="h-11 px-6 rounded-xl bg-[#285CF5] text-white font-semibold text-xs inline-flex items-center gap-2 hover:bg-[#1D4ED8] shadow-sm transition-all"
      >
        <MessageSquare size={16} />
        <span>Mulai Percakapan Pertama</span>
      </button>
    </div>
  );
};
