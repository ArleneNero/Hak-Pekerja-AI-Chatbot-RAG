import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';

export type AuthMode = 'login' | 'register' | 'forgot_password';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
}) => {
  const { login, register, resetPassword, error, clearError, isConfigured } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localValidation, setLocalValidation] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      clearError();
      setLocalValidation(null);
      setResetSuccess(false);
    }
  }, [isOpen, initialMode]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalValidation(null);

    // Basic client validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setLocalValidation('Mohon masukkan alamat email yang valid.');
      return;
    }

    if (mode !== 'forgot_password') {
      if (!password || password.length < 6) {
        setLocalValidation('Kata sandi harus minimal 6 karakter.');
        return;
      }
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setLocalValidation('Konfirmasi kata sandi tidak cocok.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(trimmedEmail, password);
        onClose();
      } else if (mode === 'register') {
        await register(trimmedEmail, password, fullName.trim() || undefined);
        onClose();
      } else if (mode === 'forgot_password') {
        await resetPassword(trimmedEmail);
        setResetSuccess(true);
      }
    } catch {
      // Error handled in AuthContext and state updated
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    clearError();
    setLocalValidation(null);
    setResetSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-figma-border p-6 md:p-8 overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-figma-muted hover:text-figma-dark hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Tutup jendela autentikasi"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header without logo/icon */}
        <div className="mb-6">
          <div className="mb-2">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#ECF1FF] text-[#285CF5] text-[11px] font-bold rounded-full mb-1.5">
              HakKetenagakerjaan.AI
            </div>
            <h2 id="auth-modal-title" className="text-xl font-bold text-[#1D2737] leading-tight">
              {mode === 'login' && 'Masuk ke Akun'}
              {mode === 'register' && 'Daftar Akun Baru'}
              {mode === 'forgot_password' && 'Atur Ulang Kata Sandi'}
            </h2>
          </div>
          <p className="text-xs text-[#7D8DA8]">
            {mode === 'login' && 'Akses riwayat pertanyaan dan rujukan hukum tersimpan Anda.'}
            {mode === 'register' && 'Simpan riwayat percakapan dan rujukan hukum Anda secara permanen.'}
            {mode === 'forgot_password' && 'Masukkan email Anda untuk menerima instruksi pemulihan.'}
          </p>
        </div>

        {/* Unconfigured Warning Alert */}
        {!isConfigured && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Perhatian Pengembang:</span> Firebase Auth belum dikonfigurasi pada environment (`VITE_FIREBASE_*`). Silakan isi variabel lingkungan Firebase untuk koneksi langsung.
            </div>
          </div>
        )}

        {/* Error Alerts */}
        {(error || localValidation) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{localValidation || error}</span>
          </div>
        )}

        {/* Success Alert for Password Reset */}
        {resetSuccess && mode === 'forgot_password' ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-figma-dark mb-1">Email Telah Dikirim</h3>
            <p className="text-xs text-figma-muted mb-6">
              Silakan periksa kotak masuk atau spam email <strong>{email}</strong> untuk tautan pembaruan kata sandi.
            </p>
            <button
              onClick={() => switchMode('login')}
              className="w-full py-2.5 px-4 bg-[#285CF5] hover:bg-[#1D4ED8] text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              Kembali ke Halaman Masuk
            </button>
          </div>
        ) : (
          /* Auth Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-figma-dark mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-figma-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama Anda"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-figma-border rounded-xl text-sm text-figma-dark placeholder-figma-muted focus:outline-none focus:ring-2 focus:ring-figma-primary/20 focus:border-figma-primary transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-figma-dark mb-1.5">
                Alamat Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-figma-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-figma-border rounded-xl text-sm text-figma-dark placeholder-figma-muted focus:outline-none focus:ring-2 focus:ring-figma-primary/20 focus:border-figma-primary transition-all"
                />
              </div>
            </div>

            {mode !== 'forgot_password' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-figma-dark">
                    Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot_password')}
                      className="text-xs text-figma-primary hover:underline"
                    >
                      Lupa kata sandi?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-figma-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-figma-border rounded-xl text-sm text-figma-dark placeholder-figma-muted focus:outline-none focus:ring-2 focus:ring-figma-primary/20 focus:border-figma-primary transition-all"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-figma-dark mb-1.5">
                  Konfirmasi Kata Sandi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-figma-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-figma-border rounded-xl text-sm text-figma-dark placeholder-figma-muted focus:outline-none focus:ring-2 focus:ring-figma-primary/20 focus:border-figma-primary transition-all"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3.5 px-4 bg-[#285CF5] hover:bg-[#1D4ED8] active:bg-[#1844C7] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:bg-[#A9B7CD] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="text-white font-bold">Memproses...</span>
                </>
              ) : (
                <span className="text-white font-bold tracking-wide">
                  {mode === 'login' && 'Masuk Sekarang'}
                  {mode === 'register' && 'Daftarkan Akun'}
                  {mode === 'forgot_password' && 'Kirim Tautan Pemulihan'}
                </span>
              )}
            </button>
          </form>
        )}

        {/* Footer Mode Switchers */}
        <div className="mt-6 pt-4 border-t border-figma-border text-center text-xs text-[#42506A]">
          {mode === 'login' && (
            <p>
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="font-bold text-[#285CF5] hover:underline"
              >
                Daftar sekarang
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p>
              Sudah memiliki akun?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-bold text-[#285CF5] hover:underline"
              >
                Masuk di sini
              </button>
            </p>
          )}

          {mode === 'forgot_password' && (
            <p>
              Ingat kata sandi Anda?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-bold text-[#285CF5] hover:underline"
              >
                Kembali ke Masuk
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

