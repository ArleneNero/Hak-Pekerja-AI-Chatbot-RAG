import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, History, Scale, Plus, LogIn, UserPlus, Sparkles, LogOut } from 'lucide-react';
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
  const getUserInitials = (currentUser: User): string => {
    if (currentUser.displayName) {
      const parts = currentUser.displayName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return currentUser.displayName.slice(0, 2).toUpperCase();
    }
    if (currentUser.email) {
      const namePart = currentUser.email.split('@')[0];
      return namePart.slice(0, 2).toUpperCase();
    }
    return 'NE';
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
      isActive
        ? 'bg-[#ECF1FF] text-[#285CF5]'
        : 'text-[#42506A] hover:bg-slate-50 hover:text-[#1D2737]'
    }`;

  return (
    <div className="md:hidden fixed top-14 inset-x-0 bottom-0 h-[calc(100dvh-3.5rem)] bg-white z-50 flex flex-col justify-between p-4 overflow-hidden animate-in fade-in duration-200">
      {/* Bagian Atas: Tombol Chat Baru & Navigasi Halaman */}
      <div className="flex flex-col min-h-0">
        <button
          onClick={onNewChat}
          className="w-full h-11 px-4 mb-3 rounded-xl bg-[#285CF5] hover:bg-[#1D4ED8] active:scale-[0.99] text-white font-semibold text-[13.5px] flex items-center justify-center gap-2 shadow-xs transition-all shrink-0"
        >
          <Plus size={18} className="stroke-[2.5]" />
          <span>Percakapan baru</span>
        </button>

        <nav className="space-y-1">
          <NavLink
            to={ROUTES.HOME}
            end
            onClick={onClose}
            className={getNavLinkClass}
          >
            <Home size={18} />
            <span>Beranda</span>
          </NavLink>
          <NavLink
            to={ROUTES.CHAT}
            onClick={onClose}
            className={getNavLinkClass}
          >
            <Scale size={18} />
            <span>Ruang Pertanyaan</span>
          </NavLink>
          <NavLink
            to={ROUTES.HISTORY}
            onClick={onClose}
            className={getNavLinkClass}
          >
            <History size={18} />
            <span>Riwayat Percakapan</span>
          </NavLink>
        </nav>
      </div>

      {/* Bagian Bawah: Card Akun Terverifikasi / Card Tamu (Selalu terlihat tanpa perlu scroll) */}
      <div className="shrink-0 pt-3 border-t border-slate-100 mt-auto">
        {user ? (
          <div className="p-3.5 rounded-2xl bg-white border border-[#E8EDF4] shadow-xs">
            <div className="flex items-center gap-3">
              {/* Inisial Avatar Kotak Biru Persis SS */}
              <div className="w-10 h-10 rounded-xl bg-[#285CF5] text-white flex items-center justify-center font-bold text-[13.5px] tracking-wide shrink-0 shadow-2xs">
                {getUserInitials(user)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-[#1D2737] truncate leading-tight">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <p className="text-[12px] text-[#7D8DA8] truncate leading-tight mt-1">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Garis Pembatas */}
            <div className="border-t border-[#EEF2F6] my-2.5" />

            {/* Tombol Keluar Akun Merah Ditengah */}
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 text-[12.5px] font-semibold text-[#D92D20] hover:text-red-700 active:scale-95 transition-all py-0.5"
            >
              <LogOut size={14} className="stroke-[2.2]" />
              <span>Keluar Akun</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#F4F7FF] via-[#EEF4FF] to-[#E3EDFF] border border-[#D5E2FF] shadow-xs">
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
      </div>
    </div>
  );
};


