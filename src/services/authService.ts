import {
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
  Unsubscribe
} from 'firebase/auth';
import { auth } from './firebase';

export type AuthStatus = 'AUTHENTICATING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'AUTH_ERROR';

/**
 * Sign in existing user with email and password via Firebase Auth
 */
export async function signInWithEmailAndPassword(
  email: string,
  pass: string
): Promise<UserCredential> {
  if (!email || !pass) {
    throw new Error('Please provide both email and password.');
  }
  return await fbSignInWithEmailAndPassword(auth, email.trim(), pass);
}

/**
 * Register a new user account with email and password via Firebase Auth
 * Note: Role selection is strictly disabled; profile Firestore creation is deferred.
 */
export async function createUserWithEmailAndPassword(
  email: string,
  pass: string
): Promise<UserCredential> {
  if (!email || !pass) {
    throw new Error('Please provide both email and password.');
  }
  if (pass.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  return await fbCreateUserWithEmailAndPassword(auth, email.trim(), pass);
}

/**
 * Sign out the currently authenticated Firebase user
 */
export async function signOut(): Promise<void> {
  return await fbSignOut(auth);
}

/**
 * Listen for real-time Firebase Authentication state changes safely
 */
export function onAuthStateChanged(
  callback: (user: FirebaseUser | null) => void
): Unsubscribe {
  try {
    return fbOnAuthStateChanged(
      auth,
      (user) => {
        try {
          callback(user);
        } catch (err) {
          console.error('Error in auth state callback:', err);
        }
      },
      (error) => {
        console.warn('Firebase auth state listener warning (safe fallback):', error);
        try {
          callback(null);
        } catch (err) {
          console.error('Error in auth fallback callback:', err);
        }
      }
    );
  } catch (err) {
    console.warn('Failed to attach auth state listener, defaulting to unauthenticated:', err);
    try {
      callback(null);
    } catch {}
    return () => {};
  }
}

/**
 * Returns current Firebase authenticated user or null
 */
export function getCurrentAuthUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Formats Firebase Auth errors into clear, actionable messages
 */
export function formatAuthError(error: any): string {
  if (!error) return 'An unknown authentication error occurred.';
  const code = error.code || '';
  const msg = error.message || String(error);

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'The email address format is invalid.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error occurred. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'Email/Password authentication is not enabled in Firebase Console.';
    default:
      return msg.replace('Firebase: ', '').replace(/\(auth\/[^)]+\)\.?/, '').trim() || msg;
  }
}
