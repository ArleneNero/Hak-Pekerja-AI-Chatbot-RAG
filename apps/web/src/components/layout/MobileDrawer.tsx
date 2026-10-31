import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, History, Scale, Plus, ShieldCheck, LogIn, UserPlus, Sparkles, LogOut } from 'lucide-react';
import { type User } from 'firebase/auth';
import { ROUTES } from '@/constants/routes';
import type { AuthMode } from '@/features/account/AuthModal';

interface MobileDrawerProps {
  user: User | null;
  onNewChat: () => void;
  onClose: () => void;
  onOpenAuth: (mode: AuthMode) => void;
  onLogout: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  user,
  onNewChat,
  onClose,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <div className="md:hidden absolute inset-0 top-14 bg-white z-40 flex flex-col p-4 animate-in fade-in duration-200">
      <button
        onClick={onNewChat}
        className="w-full h-11 px-4 mb-4 rounded-xl bg-[#285CF5] hover:bg-[#1D4ED8] text-white font-semibold text-[13.5px] flex items-center justify-center gap-2 shadow-sm transition-all"
      >
        <Plus size={18} className="stroke-[2.5]" />
        <span>Percakapan baru</span>
      </button>

      <nav className="space-y-1 flex-1">
        <NavLink
          to={ROUTES.HOME}
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold text-figma-body hover:bg-slate-50"
        >
          <Home size={18} />
          <span>Beranda</span>
        </NavLink>
        <NavLink
          to={ROUTES.CHAT}
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold text-figma-body hover:bg-slate-50"
        >
          <Scale size={18} />
          <span>Ruang Pertanyaan</span>
        </NavLink>
        <NavLink
          to={ROUTES.HISTORY}
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold text-figma-body hover:bg-slate-50"
        >
          <History size={18} />
          <span>Riwayat Percakapan</span>
        </NavLink>
      </nav>

      <div className="pt-4 border-t border-figma-border">
        {user ? (
          <div className="flex items-center justify-between p-3 mb-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-figma-dark truncate">{user.displayName || user.email}</p>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Akun Terverifikasi
              </p>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold flex items-center gap-1 transition-colors shrink-0"
            >
              <LogOut size={13} />
              <span>Keluar</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 mb-3 rounded-2xl bg-gradient-to-br from-[#F4F7FF] via-[#EEF4FF] to-[#E3EDFF] border border-[#D5E2FF] shadow-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#285CF5] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles size={13} />
              </div>
              <p className="text-[12.5px] font-bold text-[#1A2952]">Akses Riwayat Chat</p>
            </div>
            <p className="text-[11px] text-[#556987] leading-relaxed mb-3">
              Masuk atau daftar untuk menyimpan percakapan dan rujukan pasal hukum Anda.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onOpenAuth('login')}
                className="h-9 px-3 text-center text-[12px] font-bold text-[#285CF5] bg-white hover:bg-slate-50 active:bg-slate-100 border border-[#C7D7FE] rounded-xl shadow-2xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <LogIn size={13} className="stroke-[2.5]" />
                <span>Masuk</span>
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="h-9 px-3 text-center text-[12px] font-bold text-white bg-gradient-to-r from-[#285CF5] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1740B8] rounded-xl shadow-xs shadow-blue-500/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <UserPlus size={13} className="stroke-[2.5]" />
                <span>Daftar</span>
              </button>
            </div>
          </div>
        )}
        <div className="text-xs text-figma-muted">
          <p className="flex items-center gap-1.5 font-medium mb-1">
            <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
            <span className="font-semibold text-slate-700">Berbasis 11 Regulasi Hukum Resmi</span>
          </p>
          <p className="text-[11px]">UU 6/2023, PP 35/2021, PP 36/2021, UU KIA 2024</p>
        </div>
      </div>
    </div>
  );
};

