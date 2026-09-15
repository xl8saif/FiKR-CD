import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from './firebase';

export type ContributionLicenseOption = 
  | 'FiKR&CD Research Archive Only' 
  | 'Public Cultural Preservation' 
  | 'CC BY-NC 4.0';

export interface ConsentRecord {
  consentId: string;
  userUid: string;
  agreementVersion: string;
  license: ContributionLicenseOption | string;
  acceptedAt: string;
  consentStatus: 'active' | 'revoked';
}

const CURRENT_AGREEMENT_VERSION = 'FiKR-IK-2026.1';

/**
 * Creates an immutable consent record under /users/{uid}/consents/{consentId}
 */
export async function recordContributionConsent(
  userUid: string,
  license: ContributionLicenseOption
): Promise<ConsentRecord> {
  if (!userUid) {
    throw new Error('User UID is required to record consent.');
  }

  const consentId = `consent_${userUid}_${Date.now()}`;
  const timestamp = new Date().toISOString();

  const record: ConsentRecord = {
    consentId,
    userUid,
    agreementVersion: CURRENT_AGREEMENT_VERSION,
    license,
    acceptedAt: timestamp,
    consentStatus: 'active'
  };

  try {
    const consentDocRef = doc(db, 'users', userUid, 'consents', consentId);
    await setDoc(consentDocRef, record);
  } catch (err) {
    console.warn('Firestore consent write fallback to local storage:', err);
  }

  // Cache in localStorage
  try {
    localStorage.setItem(`fikr_consent_${userUid}`, JSON.stringify(record));
  } catch (err) {
    console.error('Local consent save error:', err);
  }

  return record;
}

/**
 * Retrieves the latest consent record for a user
 */
export async function getLatestConsent(userUid: string): Promise<ConsentRecord | null> {
  if (!userUid) return null;

  try {
    const consentsRef = collection(db, 'users', userUid, 'consents');
    const q = query(consentsRef, orderBy('acceptedAt', 'desc'), limit(1));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const data = snap.docs[0].data() as ConsentRecord;
      localStorage.setItem(`fikr_consent_${userUid}`, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Could not fetch cloud consent, checking local cache:', err);
  }

  // Fallback to local cache
  try {
    const cached = localStorage.getItem(`fikr_consent_${userUid}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error('Consent cache read error:', err);
  }

  return null;
}
