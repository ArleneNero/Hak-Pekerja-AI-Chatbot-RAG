import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Look for .env in apps/api directory, current working directory, or parent
const envCandidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), 'apps/api/.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000',
  ragServiceUrl: process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8001',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  isProduction: process.env.NODE_ENV === 'production',
};
