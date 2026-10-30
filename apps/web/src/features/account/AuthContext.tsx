import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/services/firebase';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function mapFirebaseError(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/user-disabled':
      return 'Akun pengguna ini telah dinonaktifkan.';
    case 'auth/user-not-found':
      return 'Akun dengan email ini tidak ditemukan. Silakan daftar terlebih dahulu.';
    case 'auth/wrong-password':
      return 'Kata sandi yang Anda masukkan salah.';
    case 'auth/invalid-credential':
      return 'Email atau kata sandi tidak cocok. Periksa kembali kredensial Anda.';
    case 'auth/email-already-in-use':
      return 'Alamat email ini sudah terdaftar. Silakan masuk.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu pendek. Gunakan minimal 6 karakter.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa menit sebelum mencoba lagi.';
    case 'auth/network-request-failed':
      return 'Koneksi gagal. Periksa sambungan internet Anda.';
    default:
      return 'Terjadi kendala autentikasi. Silakan coba kembali.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Local development fallback when Firebase environment variables are not yet configured
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (authError) => {
        console.error('[Auth] State change error:', authError);
        const fbCode = (authError as { code?: string }).code || '';
        setError(mapFirebaseError(fbCode));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      if (!isFirebaseConfigured || !auth) {
        throw new Error('Firebase Auth belum dikonfigurasi di file environment (VITE_FIREBASE_*).');
      }
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: unknown) {
      const fbError = err as { code?: string; message?: string };
      const friendlyMessage = fbError.code ? mapFirebaseError(fbError.code) : (fbError.message || 'Gagal masuk akun.');
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, name?: string): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      if (!isFirebaseConfigured || !auth) {
        throw new Error('Firebase Auth belum dikonfigurasi di file environment (VITE_FIREBASE_*).');
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        // Force refresh user object
        setUser({ ...userCredential.user, displayName: name });
      }
    } catch (err: unknown) {
      const fbError = err as { code?: string; message?: string };
      const friendlyMessage = fbError.code ? mapFirebaseError(fbError.code) : (fbError.message || 'Gagal mendaftar akun.');
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      }
      setUser(null);
    } catch (err: unknown) {
      const fbError = err as { code?: string; message?: string };
      const friendlyMessage = fbError.code ? mapFirebaseError(fbError.code) : 'Gagal keluar dari sesi.';
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      if (!isFirebaseConfigured || !auth) {
        throw new Error('Firebase Auth belum dikonfigurasi di file environment (VITE_FIREBASE_*).');
      }
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      const fbError = err as { code?: string; message?: string };
      const friendlyMessage = fbError.code ? mapFirebaseError(fbError.code) : 'Gagal mengirim email reset kata sandi.';
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (err) {
      console.error('[Auth] Failed to retrieve ID token:', err);
      return null;
    }
  };

  const clearError = () => setError(null);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isConfigured: isFirebaseConfigured,
      login,
      register,
      logout,
      resetPassword,
      getIdToken,
      clearError,
    }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
