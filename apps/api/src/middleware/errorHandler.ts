import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/** Pesan generik yang aman untuk ditampilkan ke user produksi */
const SAFE_USER_MESSAGES: Record<number, string> = {
  400: 'Permintaan tidak valid. Periksa kembali data yang dikirim.',
  401: 'Autentikasi diperlukan. Silakan masuk ulang.',
  403: 'Akses ditolak.',
  404: 'Endpoint tidak ditemukan.',
  429: 'Terlalu banyak permintaan. Mohon tunggu sebentar.',
  500: 'Server sedang mengalami gangguan sementara. Silakan coba lagi.',
  503: 'Layanan tidak tersedia saat ini. Silakan coba beberapa saat lagi.',
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR');
  const requestId = req.id || 'unknown';
  const isProduction = process.env.NODE_ENV === 'production';

  // Log detail teknis di server, jangan bocorkan ke client
  if (statusCode >= 500) {
    console.error(`[Error] [${requestId}] ${statusCode} - ${err.message}`);
    if (!isProduction && err.stack) {
      console.error(err.stack);
    }
  }

  // Di produksi, gunakan pesan generik yang aman; di dev, tampilkan detail
  const message = isProduction
    ? (SAFE_USER_MESSAGES[statusCode] ?? 'Terjadi kesalahan pada server.')
    : (err.message || 'Terjadi kesalahan pada server internal.');

  res.status(statusCode).json({
    error: {
      code,
      message,
      request_id: requestId,
    },
  });
};

