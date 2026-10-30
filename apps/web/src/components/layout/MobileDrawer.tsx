import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, History, Scale, Plus, ShieldCheck } from 'lucide-react';
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
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-figma-dark">{user.displayName || user.email}</p>
              <p className="text-[11px] text-figma-muted">Akun Terverifikasi</p>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs text-red-600 bg-red-50 rounded-lg font-semibold"
            >
              Keluar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="py-2 text-center text-xs font-semibold text-[#285CF5] bg-[#ECF1FF] hover:bg-[#D9E4FF] rounded-lg transition-colors"
            >
              Masuk
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="py-2 text-center text-xs font-semibold text-white bg-[#285CF5] hover:bg-[#1D4ED8] rounded-lg shadow-sm transition-colors"
            >
              Daftar
            </button>
          </div>
        )}
        <div className="text-xs text-figma-muted">
          <p className="flex items-center gap-1.5 font-medium mb-1">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Berbasis 11 Regulasi Hukum Resmi</span>
          </p>
          <p>UU 6/2023, PP 35/2021, PP 36/2021, UU KIA 2024</p>
        </div>
      </div>
    </div>
  );
};

