import { initializeApp, getApps, cert, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { config } from '../../config/env';

let app: App | null = null;
let isConfiguredWithCredentials = false;

export function initializeFirebaseAdmin(): App | null {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    return app;
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const projectId = process.env.FIREBASE_PROJECT_ID || config.firebaseProjectId;

    // 1. Service account JSON file or string
    let resolvedPath: string | null = null;
    if (serviceAccountJson) {
      const candidates = [
        serviceAccountJson,
        path.resolve(process.cwd(), serviceAccountJson),
        path.resolve(__dirname, '../../..', serviceAccountJson),
        path.resolve(__dirname, '../../..', 'serviceAccountKey.json'),
        path.resolve(__dirname, '../../..', 'serviceAccountKey.json.json'),
        path.resolve(process.cwd(), 'apps/api/serviceAccountKey.json'),
        path.resolve(process.cwd(), 'serviceAccountKey.json'),
      ];
      for (const c of candidates) {
        if (c && fs.existsSync(c)) {
          resolvedPath = c;
          break;
        }
      }
    }

    if (resolvedPath) {
      const parsedAccount: ServiceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
      app = initializeApp({
        credential: cert(parsedAccount),
        projectId: parsedAccount.projectId || projectId,
      });
      isConfiguredWithCredentials = true;
      console.log(`[FirebaseAdmin] Initialized successfully with Service Account key from: ${path.basename(resolvedPath)}`);
    } else if (serviceAccountJson && serviceAccountJson.trim().startsWith('{')) {
      const parsedAccount: ServiceAccount = JSON.parse(serviceAccountJson);
      app = initializeApp({
        credential: cert(parsedAccount),
        projectId: parsedAccount.projectId || projectId,
      });
      isConfiguredWithCredentials = true;
      console.log('[FirebaseAdmin] Initialized successfully with inline JSON Service Account key.');
    }
    // 2. Explicit clientEmail and privateKey from environment
    else if (projectId && clientEmail && privateKey) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      isConfiguredWithCredentials = true;
      console.log(`[FirebaseAdmin] Initialized successfully with client credentials for project: ${projectId}`);
    }
    // 3. Firestore emulator
    else if (process.env.FIRESTORE_EMULATOR_HOST && projectId) {
      app = initializeApp({ projectId });
      isConfiguredWithCredentials = true;
      console.log(`[FirebaseAdmin] Initialized with Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
    }
    // 4. In production cloud environment with native ADC
    else if (projectId && process.env.NODE_ENV === 'production' && !process.env.LOCAL_DEV) {
      app = initializeApp({ projectId });
      isConfiguredWithCredentials = true;
      console.log(`[FirebaseAdmin] Initialized with production ADC for project: ${projectId}`);
    } else {
      console.log(
        '[FirebaseAdmin] Project ID configured, but no Service Account credentials provided. Running Auth & Firestore in memory/fallback mode until Service Account is supplied.'
      );
    }
  } catch (error) {
    console.error('[FirebaseAdmin] Failed to initialize Firebase Admin SDK:', error);
  }

  return app;
}

// Auto-initialize on module load
initializeFirebaseAdmin();

export function isFirebaseConfigured(): boolean {
  return isConfiguredWithCredentials;
}

export function getAdminAuth(): Auth | null {
  if (!isConfiguredWithCredentials) return null;
  if (!app) {
    initializeFirebaseAdmin();
  }
  return app ? getAuth(app) : null;
}

let dbInstance: Firestore | null = null;

export function getFirestoreDb(): Firestore | null {
  if (!isConfiguredWithCredentials) return null;
  if (!app) {
    initializeFirebaseAdmin();
  }
  if (app && !dbInstance) {
    dbInstance = getFirestore(app);
    try {
      dbInstance.settings({ ignoreUndefinedProperties: true });
    } catch {
      // ignore if already set
    }
  }
  return dbInstance;
}
