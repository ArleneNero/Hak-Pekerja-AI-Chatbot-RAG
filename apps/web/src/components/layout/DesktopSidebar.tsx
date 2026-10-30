import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  History, 
  Plus, 
  Scale, 
  User as UserIcon, 
  LogOut,
  LogIn,
  MessageSquare
} from 'lucide-react';
import { type User } from 'firebase/auth';
import { ROUTES } from '@/constants/routes';
import type { ConversationSummary } from '@/types/history';
import type { AuthMode } from '@/features/account/AuthModal';

interface DesktopSidebarProps {
  user: User | null;
  recentConversations: ConversationSummary[];
  onNewChat: () => void;
  onOpenAuth: (mode: AuthMode) => void;
  onLogout: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  user,
  recentConversations,
  onNewChat,
  onOpenAuth,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-[270px] h-full bg-white border-r border-figma-border flex-shrink-0 z-20">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-100">
        <div 
          onClick={() => navigate(ROUTES.HOME)} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          {/* Exact Figma V6 Brand Bars (#48:4) */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-6 rounded-full bg-[#285CF5] block transition-transform group-hover:scale-y-110" />
            <span className="w-1.5 h-4 rounded-full bg-[#6C92FA] block transition-transform group-hover:scale-y-110" />
          </div>
          <div>
            <span className="font-extrabold text-[15px] text-[#1A2952] tracking-tight block leading-tight">
              HakKetenagakerjaan<span className="text-[#315BF4]">.AI</span>
            </span>
            <span className="text-[10px] font-bold text-[#7D8DA8] tracking-wider uppercase block">
              Regulasi Indonesia
            </span>
          </div>
        </div>
      </div>

      {/* Action Button: Percakapan Baru */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full h-11 px-4 rounded-xl bg-[#285CF5] hover:bg-[#1D4ED8] active:scale-[0.99] text-white font-semibold text-[13.5px] flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus size={18} className="stroke-[2.5]" />
          <span>Percakapan baru</span>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
        <NavLink
          to={ROUTES.HOME}
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors ${
              isActive && location.pathname === ROUTES.HOME
                ? 'bg-[#ECF1FF] text-[#285CF5]'
                : 'text-[#42506A] hover:bg-slate-50 hover:text-[#1D2737]'
            }`
          }
        >
          <Home size={18} />
          <span>Beranda</span>
        </NavLink>

        <NavLink
          to={ROUTES.CHAT}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors ${
              isActive
                ? 'bg-[#ECF1FF] text-[#285CF5]'
                : 'text-[#42506A] hover:bg-slate-50 hover:text-[#1D2737]'
            }`
          }
        >
          <Scale size={18} />
          <span>Ruang Pertanyaan</span>
        </NavLink>

        <NavLink
          to={ROUTES.HISTORY}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors ${
              isActive
                ? 'bg-[#ECF1FF] text-[#285CF5]'
                : 'text-[#42506A] hover:bg-slate-50 hover:text-[#1D2737]'
            }`
          }
        >
          <History size={18} />
          <span>Riwayat Percakapan</span>
        </NavLink>

        {/* Recent Conversations */}
        {user && recentConversations.length > 0 && (
          <div className="pt-4 pb-2">
            <span className="px-3 text-[11px] font-bold text-figma-muted uppercase tracking-wider block mb-1.5">
              Riwayat Terkini
            </span>
            <div className="space-y-0.5">
              {recentConversations.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`${ROUTES.CHAT}?id=${item.id}`)}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-figma-body hover:bg-figma-primary-soft hover:text-figma-primary transition-colors group"
                >
                  <MessageSquare size={14} className="shrink-0 text-figma-muted group-hover:text-figma-primary" />
                  <span className="truncate">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Account Status / Footer */}
      <div className="p-3.5 border-t border-figma-border bg-slate-50/50">
        {user ? (
          <div className="p-3 rounded-xl bg-white border border-[#E8EDF4] shadow-sm">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#285CF5] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {user.displayName ? user.displayName.slice(0, 2) : (user.email ? user.email.slice(0, 2) : 'U')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-[#1D2737] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-[#7D8DA8] truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              <LogOut size={13} />
              <span>Keluar Akun</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-white border border-[#E8EDF4] shadow-sm">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#ECF1FF] text-[#285CF5] flex items-center justify-center font-bold text-xs shrink-0">
                <UserIcon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-[#1D2737] truncate">Mode Tamu (Guest)</p>
                <p className="text-[10px] text-[#7D8DA8] truncate">Chat tanpa batas akun</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <button
                onClick={() => onOpenAuth('login')}
                className="font-bold text-[#285CF5] hover:underline flex items-center gap-1"
              >
                <LogIn size={13} />
                <span>Masuk</span>
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="font-semibold text-[#7D8DA8] hover:text-[#1D2737] hover:underline"
              >
                Daftar
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

