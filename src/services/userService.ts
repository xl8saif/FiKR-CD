import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from './firebase';
import { UserRole } from '../types';
import { DEFAULT_DIALECT_ID } from '../data/initialData';

export interface ContributorProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'Contributor' | 'contributor' | UserRole;
  institution: string;
  nativeDialect: string;
  isNativeSpeaker: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EditableProfileFields = Pick<
  ContributorProfile,
  'displayName' | 'institution' | 'nativeDialect' | 'isNativeSpeaker'
>;

/**
 * Retrieves an existing user profile from /users/{uid} or initializes a new one
 * with default role: "Contributor" and email verified from Firebase Auth.
 */
export async function getOrCreateUserProfile(
  user: FirebaseUser
): Promise<ContributorProfile> {
  if (!user || !user.uid) {
    throw new Error('Valid Firebase authenticated user required.');
  }

  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);

  if (snap.exists()) {
    const existingData = snap.data() as Partial<ContributorProfile>;
    const profile: ContributorProfile = {
      uid: user.uid,
      displayName: existingData.displayName || user.displayName || user.email?.split('@')[0] || 'Indus-Kohistani Contributor',
      email: user.email || existingData.email || '',
      role: (existingData.role as UserRole) || 'Contributor',
      institution: existingData.institution || '',
      nativeDialect: existingData.nativeDialect || DEFAULT_DIALECT_ID,
      isNativeSpeaker: existingData.isNativeSpeaker ?? true,
      createdAt: existingData.createdAt || new Date().toISOString(),
      updatedAt: existingData.updatedAt || new Date().toISOString()
    };
    return profile;
  }

  // Create new profile for authenticated user
  const newProfile: ContributorProfile = {
    uid: user.uid,
    displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Indus-Kohistani Contributor'),
    email: user.email || '', // Strictly sourced from Firebase Auth
    role: 'Contributor',     // Strictly default Contributor, no client override
    institution: '',
    nativeDialect: DEFAULT_DIALECT_ID,
    isNativeSpeaker: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(userDocRef, newProfile);
  return newProfile;
}

/**
 * Updates permitted contributor profile fields only:
 * Allowed: displayName, institution, nativeDialect, isNativeSpeaker
 * Strictly blocked: uid, email, role, createdAt
 */
export async function updateContributorProfile(
  uid: string,
  updates: Partial<EditableProfileFields>
): Promise<void> {
  if (!uid) {
    throw new Error('User UID is required for profile update.');
  }

  const userDocRef = doc(db, 'users', uid);

  // Sanitize updates to ONLY allow permitted fields
  const sanitizedUpdate: Record<string, any> = {
    updatedAt: new Date().toISOString()
  };

  if (updates.displayName !== undefined) {
    sanitizedUpdate.displayName = updates.displayName.trim();
  }
  if (updates.institution !== undefined) {
    sanitizedUpdate.institution = updates.institution.trim();
  }
  if (updates.nativeDialect !== undefined) {
    sanitizedUpdate.nativeDialect = updates.nativeDialect.trim();
  }
  if (updates.isNativeSpeaker !== undefined) {
    sanitizedUpdate.isNativeSpeaker = Boolean(updates.isNativeSpeaker);
  }

  await updateDoc(userDocRef, sanitizedUpdate);
}
