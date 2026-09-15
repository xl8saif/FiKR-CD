import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  getFirestore,
  Firestore
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import configData from '../../firebase-applet-config.json';

// Initialize Firebase modular client safely
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(configData);
}

export const firebaseApp: FirebaseApp = getFirebaseApp();
export const firebaseProjectId = configData.projectId;
export const firestoreDatabaseId = configData.firestoreDatabaseId;

// Initialize Firestore with robust local persistent cache and fallback
function initFirestoreSafely(): Firestore {
  const dbId = configData.firestoreDatabaseId && configData.firestoreDatabaseId !== '(default)'
    ? configData.firestoreDatabaseId
    : undefined;

  try {
    return initializeFirestore(
      firebaseApp,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      },
      dbId
    );
  } catch (err) {
    console.warn('Persistent cache initialization notice, falling back to memory cache:', err);
    try {
      return initializeFirestore(
        firebaseApp,
        {
          localCache: memoryLocalCache()
        },
        dbId
      );
    } catch {
      try {
        return getFirestore(firebaseApp, dbId);
      } catch {
        return getFirestore(firebaseApp);
      }
    }
  }
}

export const db: Firestore = initFirestoreSafely();

// Initialize Firebase Authentication
export const auth: Auth = getAuth(firebaseApp);

// Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(firebaseApp);


