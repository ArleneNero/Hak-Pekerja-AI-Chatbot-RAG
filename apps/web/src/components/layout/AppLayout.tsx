import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/features/account/AuthContext';
import { AuthModal, type AuthMode } from '@/features/account/AuthModal';
import { historyService } from '@/services/historyService';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileDrawer } from './MobileDrawer';
import { ROUTES } from '@/constants/routes';
import type { ConversationSummary } from '@/types/history';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [recentConversations, setRecentConversations] = useState<ConversationSummary[]>([]);

  const { user, logout, getIdToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    const fetchRecent = async () => {
      if (user) {
        try {
          const token = await getIdToken();
          const list = await historyService.listConversations(user.uid, token);
          if (isMounted) {
            setRecentConversations(list.slice(0, 5));
          }
        } catch {
          if (isMounted) setRecentConversations([]);
        }
      } else {
        setRecentConversations([]);
      }
    };

    fetchRecent();

    const handleUpdate = () => {
      fetchRecent();
    };

    window.addEventListener('hp_conversations_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('hp_conversations_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user, getIdToken, location.pathname, location.search]);

  const handleNewChat = () => {
    navigate(`${ROUTES.CHAT}?new=true`);
    setMobileMenuOpen(false);
  };

  const openAuth = (mode: AuthMode) => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME);
  };

  return (
    <div className="flex h-screen w-full bg-figma-canvas overflow-hidden font-sans">
      {/* 1. Desktop Sidebar */}
      <DesktopSidebar
        user={user}
        recentConversations={recentConversations}
        onNewChat={handleNewChat}
        onOpenAuth={openAuth}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Mobile Topbar */}
        <header className="md:hidden h-14 bg-white border-b border-figma-border px-4 flex items-center justify-between z-30">
          <div 
            onClick={() => navigate(ROUTES.HOME)} 
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-5 rounded-full bg-[#285CF5] block" />
              <span className="w-1.5 h-3.5 rounded-full bg-[#6C92FA] block" />
            </div>
            <span className="font-extrabold text-[14px] text-[#1A2952]">
              HakKetenagakerjaan<span className="text-[#315BF4]">.AI</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!user && (
              <button
                onClick={() => openAuth('login')}
                className="px-2.5 py-1 text-xs font-semibold text-[#285CF5] bg-[#ECF1FF] hover:bg-[#D9E4FF] rounded-lg transition-colors"
              >
                Masuk
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-figma-body hover:text-figma-dark rounded-lg focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <MobileDrawer
            user={user}
            onNewChat={handleNewChat}
            onClose={() => setMobileMenuOpen(false)}
            onOpenAuth={openAuth}
            onLogout={handleLogout}
          />
        )}

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto bg-figma-canvas relative">
          {children}
        </main>
      </div>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
};
