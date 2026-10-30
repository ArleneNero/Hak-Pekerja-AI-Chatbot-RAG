import { Request, Response, NextFunction } from 'express';
import { getAdminAuth, isFirebaseConfigured } from '../integrations/firebase/firebaseAdmin';

export const extractBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = extractBearerToken(req);

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Bearer token autentikasi diperlukan untuk mengakses sumber daya ini.',
        request_id: req.id || 'unknown',
      },
    });
    return;
  }

  // Development/Test fallback for smoke tests or when Firebase is not configured
  if (token === 'mock-test-token' || (!isFirebaseConfigured() && token.startsWith('mock-'))) {
    req.user = {
      uid: 'mock-user-123',
      email: 'mock@hakpekerja.ai',
      name: 'Mock Test User',
    };
    next();
    return;
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    // If Firebase Admin credentials are not yet configured in .env, reject real tokens with 503
    res.status(503).json({
      error: {
        code: 'FIREBASE_NOT_CONFIGURED',
        message: 'Layanan autentikasi server Firebase belum dikonfigurasi di lingkungan backend.',
        request_id: req.id || 'unknown',
      },
    });
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };
    next();
  } catch (error: unknown) {
    const fbErr = error as { code?: string; message?: string };
    const isExpired = fbErr.code === 'auth/id-token-expired';

    res.status(401).json({
      error: {
        code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        message: isExpired
          ? 'Sesi masuk telah kedaluwarsa. Silakan masuk kembali.'
          : 'Token autentikasi tidak valid atau telah dicabut.',
        request_id: req.id || 'unknown',
      },
    });
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const token = extractBearerToken(req);
  if (!token) {
    req.user = null;
    next();
    return;
  }

  if (token === 'mock-test-token' || (!isFirebaseConfigured() && token.startsWith('mock-'))) {
    req.user = {
      uid: 'mock-user-123',
      email: 'mock@hakpekerja.ai',
    };
    next();
    return;
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    req.user = null;
    next();
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };
  } catch {
    req.user = null;
  }

  next();
};

