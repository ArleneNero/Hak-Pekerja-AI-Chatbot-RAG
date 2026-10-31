import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Look for .env in apps/api directory, current working directory, services/rag, or root
const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.production.local'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../.env.production.local'),
  path.resolve(__dirname, '../../services/rag/.env'),
  path.resolve(process.cwd(), 'apps/api/.env'),
];

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  ragServiceUrl: process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8001',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  isProduction: process.env.NODE_ENV === 'production',

  // Qdrant Vector Cloud
  qdrantUrl: (process.env.QDRANT_URL || '').replace(/\/+$/, ''),
  qdrantApiKey: process.env.QDRANT_API_KEY || '',
  qdrantCollection: process.env.QDRANT_COLLECTION || 'hakpekerja_legal_4b4babc70203',

  // Chat LLM (Bariska Cloud / OpenRouter)
  chatBaseUrl: (process.env.CHAT_BASE_URL || 'https://api.bariska.cloud/v1').replace(/\/+$/, ''),
  chatApiKey: process.env.CHAT_API_KEY || '',
  chatModel: process.env.CHAT_MODEL || 'deepseek-v4.1-flash',

  // Fallback Chat LLM
  chatFallbackBaseUrl: (process.env.CHAT_FALLBACK_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, ''),
  chatFallbackApiKey: process.env.CHAT_FALLBACK_API_KEY || process.env.EMBEDDING_API_KEY || '',
  chatFallbackModel: process.env.CHAT_FALLBACK_MODEL || 'meta-llama/llama-3.3-70b-instruct',

  // Embedding (OpenRouter / BAAI BGE-M3 1024-dim)
  embeddingBaseUrl: (process.env.EMBEDDING_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, ''),
  embeddingApiKey: process.env.EMBEDDING_API_KEY || '',
  embeddingModel: process.env.EMBEDDING_MODEL || 'baai/bge-m3',
  vectorDim: parseInt(process.env.VECTOR_DIM || '1024', 10),
  topK: parseInt(process.env.TOP_K || '7', 10),
};
