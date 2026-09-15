import {
  Contribution,
  RawContributionData,
  RewardConfig,
  VerificationStatus,
  UserRole,
  PartOfSpeech,
  ReviewHistoryEntry,
  SpecializedIkCharacter
} from '../types';
import { 
  INITIAL_DEMO_CONTRIBUTIONS, 
  INITIAL_REWARD_CONFIG, 
  MILESTONES,
  OFFICIAL_IK_SPECIAL_CHARS
} from '../data/initialData';
import {
  submitContributionToFirestore,
  submitReviewToFirestore,
  syncFirestoreUserProfile
} from './firebaseCorpus';
import { ref as storageRef, uploadBytes, FullMetadata } from 'firebase/storage';
import { storage } from './firebase';

const STORAGE_KEYS = {
  CONTRIBUTIONS: 'fikr_ik_contributions_v1',
  REWARD_CONFIG: 'fikr_ik_reward_config_v1',
  ACTIVE_USER: 'fikr_ik_active_user_v1',
  UI_LANG: 'fikr_ik_ui_lang_v1',
  SPECIAL_CHARS: 'fikr_ik_special_chars_v1'
};

// Calculate derived data based on current verified status and active reward config
export function computeDerived(
  raw: RawContributionData,
  verifiedStatus: VerificationStatus,
  rewardConfig: RewardConfig
) {
  const text = raw.ikText || '';
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const hasAudio = Boolean(raw.audioUrl && raw.audioUrl.length > 0);
  const hasUrdu = Boolean(raw.urduMeaning && raw.urduMeaning.trim().length > 0);
  const hasEnglish = Boolean(raw.englishMeaning && raw.englishMeaning.trim().length > 0);
  
  // Rule: Must be verified (approved or corrected) AND have either Urdu or English meaning to be corpus eligible
  const isVerified = verifiedStatus === 'approved' || verifiedStatus === 'corrected';
  const hasValidMeaning = hasUrdu || hasEnglish;
  const isCorpusEligible = isVerified && hasValidMeaning;
  const isSpeechCorpusEligible = isCorpusEligible && hasAudio;

  // Rule: Points and financial rewards are strictly calculated ONLY on verified contributions
  let calculatedPoints = 0;
  let calculatedRewardPkr = 0;

  if (isVerified) {
    if (raw.type === 'word') {
      calculatedPoints += rewardConfig.wordPoints;
      calculatedRewardPkr += rewardConfig.wordRewardPkr;
    } else if (raw.type === 'sentence') {
      calculatedPoints += rewardConfig.sentencePoints;
      calculatedRewardPkr += rewardConfig.sentenceRewardPkr;
    } else if (raw.type === 'cultural_expression') {
      calculatedPoints += rewardConfig.expressionPoints;
      calculatedRewardPkr += rewardConfig.expressionRewardPkr;
    }

    if (hasAudio) {
      calculatedPoints += rewardConfig.audioBonusPoints;
      calculatedRewardPkr += rewardConfig.audioBonusRewardPkr;
    }
  }

  return {
    tokenCount: tokens.length,
    charCount: text.length,
    hasAudio,
    hasUrdu,
    hasEnglish,
    isCorpusEligible,
    isSpeechCorpusEligible,
    calculatedPoints,
    calculatedRewardPkr,
    derivedAt: new Date().toISOString()
  };
}

export function getStoredContributions(): Contribution[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTRIBUTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(INITIAL_DEMO_CONTRIBUTIONS));
      return INITIAL_DEMO_CONTRIBUTIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(INITIAL_DEMO_CONTRIBUTIONS));
      return INITIAL_DEMO_CONTRIBUTIONS;
    }
    // Sanitize any malformed items to guarantee raw and verified structure
    return parsed.map((item: any, idx: number) => {
      if (!item || typeof item !== 'object') {
        return INITIAL_DEMO_CONTRIBUTIONS[idx % INITIAL_DEMO_CONTRIBUTIONS.length];
      }
      const verified = item.verified && typeof item.verified === 'object' ? item.verified : {
        status: item.status || 'pending_review',
        verifiedAt: null,
        verifiedBy: null,
        reviewNotes: '',
        corrections: {},
        reviewHistory: []
      };
      const rawData = item.raw && typeof item.raw === 'object' ? item.raw : {
        id: item.id || `contrib-${idx}`,
        type: 'word',
        ikText: item.ikText || '',
        urduMeaning: item.urduMeaning || '',
        englishMeaning: item.englishMeaning || '',
        dialect: 'duber_kandia',
        contributorId: 'user-005',
        submittedAt: new Date().toISOString()
      };
      const derived = item.derived && typeof item.derived === 'object' ? item.derived : computeDerived(rawData, verified.status || 'pending_review', INITIAL_REWARD_CONFIG);
      return {
        id: item.id || `contrib-${idx}`,
        raw: rawData,
        verified,
        derived
      } as Contribution;
    });
  } catch (err) {
    console.error('Error reading contributions from storage:', err);
    return INITIAL_DEMO_CONTRIBUTIONS;
  }
}

export function saveContributions(contributions: Contribution[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(contributions));
  } catch (err) {
    console.error('Error writing contributions to storage:', err);
  }
}

export function getStoredRewardConfig(): RewardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REWARD_CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.REWARD_CONFIG, JSON.stringify(INITIAL_REWARD_CONFIG));
      return INITIAL_REWARD_CONFIG;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading reward config:', err);
    return INITIAL_REWARD_CONFIG;
  }
}

export function saveRewardConfig(config: RewardConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REWARD_CONFIG, JSON.stringify(config));
    // When reward config is updated, recalculate all derived reward amounts
    const current = getStoredContributions();
    const updated = current.map(item => ({
      ...item,
      derived: computeDerived(item.raw, item?.verified?.status || 'pending_review', config)
    }));
    saveContributions(updated);
  } catch (err) {
    console.error('Error saving reward config:', err);
  }
}

export function createNewContribution(
  rawInput: Omit<RawContributionData, 'submittedAt'>,
  rewardConfig: RewardConfig
): Contribution {
  const timestamp = new Date().toISOString();
  const raw: RawContributionData = {
    ...rawInput,
    submittedAt: timestamp
  };

  const initialHistory: ReviewHistoryEntry = {
    id: 'rh-' + Math.random().toString(36).substring(2, 9),
    reviewerName: raw.contributorName,
    reviewerRole: 'contributor',
    timestamp,
    action: 'submitted',
    comments: 'Submission entered initial review queue.'
  };

  const initialDerived = computeDerived(raw, 'pending_review', rewardConfig);

  const contribution: Contribution = {
    id: 'ik-contrib-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    isDemoData: false,
    type: raw.type,
    raw,
    verified: {
      status: 'pending_review',
      reviewHistory: [initialHistory]
    },
    derived: initialDerived
  };

  const current = getStoredContributions();
  const nextList = [contribution, ...current];
  saveContributions(nextList);

  // Asynchronous cloud persistence (non-blocking, maintaining subcollection architecture)
  submitContributionToFirestore(
    rawInput,
    rewardConfig,
    { id: raw.contributorId, name: raw.contributorName, role: 'contributor' }
  ).catch(err => {
    console.warn('Background Firestore sync caught notice:', err);
  });

  return contribution;
}

export function approveContribution(
  id: string,
  reviewerName: string,
  reviewerRole: UserRole,
  reviewNotes: string = '',
  verifiedDialect?: string,
  verifiedPosTag?: PartOfSpeech,
  options?: {
    reviewerId?: string;
    specialCharactersVerified?: boolean;
    vowelDiacriticsAccurate?: boolean;
    orthographyNotes?: string;
  }
): Contribution[] {
  const current = getStoredContributions();
  const config = getStoredRewardConfig();
  const timestamp = new Date().toISOString();
  let targetItem: Contribution | undefined;

  const nextList = current.map(item => {
    if (item.id !== id) return item;
    targetItem = item;

    const historyEntry: ReviewHistoryEntry = {
      id: 'rh-' + Math.random().toString(36).substring(2, 9),
      reviewerId: options?.reviewerId || 'reviewer_' + reviewerName.toLowerCase().replace(/\s+/g, '_'),
      reviewerName,
      reviewerRole,
      timestamp,
      action: 'approved',
      verdict: 'approved',
      comments: reviewNotes || 'Approved without modifications.',
      orthographyNotes: options?.orthographyNotes || reviewNotes,
      specialCharactersVerified: options?.specialCharactersVerified ?? true,
      vowelDiacriticsAccurate: options?.vowelDiacriticsAccurate ?? true
    };

    const updatedVerified = {
      ...item.verified,
      status: 'approved' as VerificationStatus,
      verifiedAt: timestamp,
      reviewedBy: reviewerName,
      reviewerRole,
      reviewNotes,
      verifiedDialect: verifiedDialect || item.raw.dialect,
      verifiedPosTag: verifiedPosTag || item.raw.posTag,
      reviewHistory: [...(item.verified?.reviewHistory || []), historyEntry]
    };

    return {
      ...item,
      verified: updatedVerified,
      derived: computeDerived(item.raw, 'approved', config)
    };
  });

  saveContributions(nextList);

  if (targetItem) {
    submitReviewToFirestore({
      contributionId: id,
      reviewerUid: options?.reviewerId || 'reviewer_' + reviewerName.toLowerCase().replace(/\s+/g, '_'),
      reviewerName,
      reviewerRole,
      action: 'approved',
      comments: reviewNotes || 'Approved without modifications.',
      rawFallback: targetItem.raw,
      rewardConfig: config
    }).catch(err => console.warn('Background Firestore review sync notice:', err));
  }

  return nextList;
}

export function correctContribution(
  id: string,
  reviewerName: string,
  reviewerRole: UserRole,
  corrections: {
    correctedIkText?: string;
    correctedTranscription?: string;
    correctedUrduMeaning?: string;
    correctedEnglishMeaning?: string;
    verifiedDialect?: string;
    verifiedPosTag?: PartOfSpeech;
  },
  reviewNotes: string,
  options?: {
    reviewerId?: string;
    specialCharactersVerified?: boolean;
    vowelDiacriticsAccurate?: boolean;
    orthographyNotes?: string;
  }
): Contribution[] {
  const current = getStoredContributions();
  const config = getStoredRewardConfig();
  const timestamp = new Date().toISOString();
  let targetItem: Contribution | undefined;

  const nextList = current.map(item => {
    if (item.id !== id) return item;
    targetItem = item;

    const historyEntry: ReviewHistoryEntry = {
      id: 'rh-' + Math.random().toString(36).substring(2, 9),
      reviewerId: options?.reviewerId || 'reviewer_' + reviewerName.toLowerCase().replace(/\s+/g, '_'),
      reviewerName,
      reviewerRole,
      timestamp,
      action: 'corrected',
      verdict: 'corrected',
      comments: reviewNotes,
      proposedIkText: corrections.correctedIkText,
      proposedUrdu: corrections.correctedUrduMeaning,
      proposedEnglish: corrections.correctedEnglishMeaning,
      orthographyNotes: options?.orthographyNotes || reviewNotes,
      specialCharactersVerified: options?.specialCharactersVerified ?? true,
      vowelDiacriticsAccurate: options?.vowelDiacriticsAccurate ?? true,
      correctionsMade: {
        ikText: corrections.correctedIkText,
        ikTranscription: corrections.correctedTranscription,
        urduMeaning: corrections.correctedUrduMeaning,
        englishMeaning: corrections.correctedEnglishMeaning,
        dialect: corrections.verifiedDialect,
        posTag: corrections.verifiedPosTag
      }
    };

    const updatedVerified = {
      ...item.verified,
      status: 'corrected' as VerificationStatus,
      verifiedAt: timestamp,
      reviewedBy: reviewerName,
      reviewerRole,
      reviewNotes,
      correctedIkText: corrections.correctedIkText,
      correctedTranscription: corrections.correctedTranscription,
      correctedUrduMeaning: corrections.correctedUrduMeaning,
      correctedEnglishMeaning: corrections.correctedEnglishMeaning,
      verifiedDialect: corrections.verifiedDialect || item.raw.dialect,
      verifiedPosTag: corrections.verifiedPosTag || item.raw.posTag,
      reviewHistory: [...(item.verified?.reviewHistory || []), historyEntry]
    };

    return {
      ...item,
      verified: updatedVerified,
      derived: computeDerived(item.raw, 'corrected', config)
    };
  });

  saveContributions(nextList);

  if (targetItem) {
    submitReviewToFirestore({
      contributionId: id,
      reviewerUid: options?.reviewerId || 'reviewer_' + reviewerName.toLowerCase().replace(/\s+/g, '_'),
      reviewerName,
      reviewerRole,
      action: 'corrected',
      comments: reviewNotes,
      corrections,
      rawFallback: targetItem.raw,
      rewardConfig: config
    }).catch(err => console.warn('Background Firestore review sync notice:', err));
  }

  return nextList;
}

export function rejectContribution(
  id: string,
  reviewerName: string,
  reviewerRole: UserRole,
  rejectionReason: string,
  options?: {
    reviewerId?: string;
  }
): Contribution[] {
  const current = getStoredContributions();
  const config = getStoredRewardConfig();
  const timestamp = new Date().toISOString();
  let targetItem: Contribution | undefined;

  const nextList = current.map(item => {
    if (item.id !== id) return item;
    targetItem = item;

    const historyEntry: ReviewHistoryEntry = {
      id: 'rh-' + Math.random().toString(36).substring(2, 9),
      reviewerId: options?.reviewerId || 'reviewer_' + reviewerName.toLowerCase().replace(/\s+/g, '_'),
      reviewerName,
      reviewerRole,
      timestamp,
      action: 'rejected',
      verdict: 'rejected',
      comments: rejectionReason
    };

    const updatedVerified = {
      ...item.verified,
      status: 'rejected' as VerificationStatus,
      verifiedAt: timestamp,
      reviewedBy: reviewerName,
      reviewerRole,
      reviewNotes: rejectionReason,
      reviewHistory: [...(item.verified?.reviewHistory || []), historyEntry]
    };

    return {
      ...item,
      verified: updatedVerified,
      derived: computeDerived(item.raw, 'rejected', config)
    };
  });

  saveContributions(nextList);

  if (targetItem) {
    submitReviewToFirestore({
      contributionId: id,
      reviewerUid: options?.reviewerId || 'reviewer_' + reviewerName.toLowerCase().replace(/\s+/g, '_'),
      reviewerName,
      reviewerRole,
      action: 'rejected',
      comments: rejectionReason,
      rawFallback: targetItem.raw,
      rewardConfig: config
    }).catch(err => console.warn('Background Firestore review sync notice:', err));
  }

  return nextList;
}

export function escalateContribution(
  id: string,
  reviewerName: string,
  reviewerRole: UserRole,
  escalationTarget: 'senior_reviewer' | 'linguistic_advisor' | 'project_director',
  escalationReason: string,
  options?: {
    reviewerId?: string;
  }
): Contribution[] {
  const current = getStoredContributions();
  const config = getStoredRewardConfig();
  const timestamp = new Date().toISOString();
  let targetItem: Contribution | undefined;

  const nextList = current.map(item => {
    if (item.id !== id) return item;
    targetItem = item;

    const historyEntry: ReviewHistoryEntry = {
      id: 'rh-' + Math.random().toString(36).substring(2, 9),
      reviewerId: options?.reviewerId || 'reviewer_' + reviewerName.toLowerCase().replace(/\s+/g, '_'),
      reviewerName,
      reviewerRole,
      timestamp,
      action: 'escalated',
      verdict: 'clarification_requested',
      comments: `Clarification requested / Routed to ${escalationTarget.replace('_', ' ')}: ${escalationReason}`
    };

    const updatedVerified = {
      ...item.verified,
      status: 'escalated_to_senior' as VerificationStatus,
      escalationTarget,
      escalationReason,
      reviewNotes: `Pending assessment by ${escalationTarget}. ${escalationReason}`,
      reviewHistory: [...(item.verified?.reviewHistory || []), historyEntry]
    };

    return {
      ...item,
      verified: updatedVerified,
      derived: computeDerived(item.raw, 'escalated_to_senior', config)
    };
  });

  saveContributions(nextList);

  if (targetItem) {
    submitReviewToFirestore({
      contributionId: id,
      reviewerUid: options?.reviewerId || 'reviewer_' + reviewerName.toLowerCase().replace(/\s+/g, '_'),
      reviewerName,
      reviewerRole,
      action: 'escalated',
      comments: `Clarification requested / Routed to ${escalationTarget}: ${escalationReason}`,
      rawFallback: targetItem.raw,
      rewardConfig: config
    }).catch(err => console.warn('Background Firestore review sync notice:', err));
  }

  return nextList;
}


export function calculateContributorStats(contributions: Contribution[], contributorId?: string) {
  const filtered = contributorId 
    ? contributions.filter(c => c.raw.contributorId === contributorId)
    : contributions;

  const totalSubmitted = filtered.length;
  const verifiedItems = filtered.filter(c => c.verified.status === 'approved' || c.verified.status === 'corrected');
  const totalVerified = verifiedItems.length;
  const pendingCount = filtered.filter(c => c.verified.status === 'pending_review').length;
  const escalatedCount = filtered.filter(c => c.verified.status === 'escalated_to_senior').length;
  const rejectedCount = filtered.filter(c => c.verified.status === 'rejected').length;

  const totalPoints = verifiedItems.reduce((acc, c) => acc + c.derived.calculatedPoints, 0);
  const totalRewardPkr = verifiedItems.reduce((acc, c) => acc + c.derived.calculatedRewardPkr, 0);
  const totalAudioCount = filtered.filter(c => c.derived.hasAudio).length;

  // Milestones progress
  const unlockedMilestones = MILESTONES.filter(m => totalVerified >= m.threshold);
  const nextMilestone = MILESTONES.find(m => totalVerified < m.threshold) || null;

  return {
    totalSubmitted,
    totalVerified,
    pendingCount,
    escalatedCount,
    rejectedCount,
    totalPoints,
    totalRewardPkr,
    totalAudioCount,
    unlockedMilestones,
    nextMilestone,
    verifiedRate: totalSubmitted > 0 ? Math.round((totalVerified / totalSubmitted) * 100) : 0
  };
}

export function getStoredSpecialChars(): SpecializedIkCharacter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SPECIAL_CHARS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SPECIAL_CHARS, JSON.stringify(OFFICIAL_IK_SPECIAL_CHARS));
      return OFFICIAL_IK_SPECIAL_CHARS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return OFFICIAL_IK_SPECIAL_CHARS;
  } catch (err) {
    console.error('Error reading special characters from storage:', err);
    return OFFICIAL_IK_SPECIAL_CHARS;
  }
}

export function saveSpecialChars(chars: SpecializedIkCharacter[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SPECIAL_CHARS, JSON.stringify(chars));
  } catch (err) {
    console.error('Error writing special characters to storage:', err);
  }
}

export function resetSpecialChars(): SpecializedIkCharacter[] {
  localStorage.setItem(STORAGE_KEYS.SPECIAL_CHARS, JSON.stringify(OFFICIAL_IK_SPECIAL_CHARS));
  return OFFICIAL_IK_SPECIAL_CHARS;
}

// Reset data back to default demo set
export function resetToDemoData(): Contribution[] {
  localStorage.setItem(STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(INITIAL_DEMO_CONTRIBUTIONS));
  localStorage.setItem(STORAGE_KEYS.REWARD_CONFIG, JSON.stringify(INITIAL_REWARD_CONFIG));
  localStorage.setItem(STORAGE_KEYS.SPECIAL_CHARS, JSON.stringify(OFFICIAL_IK_SPECIAL_CHARS));
  return INITIAL_DEMO_CONTRIBUTIONS;
}

export interface AudioUploadResult {
  storagePath: string;
  metadata: FullMetadata;
}

/**
 * Uploads an existing audio Blob to Firebase Storage under recordings/{contributorId}/{recordingId}.webm
 *
 * @param audioBlob - The audio binary Blob to upload
 * @param recordingId - Unique recording identifier
 * @param contributorId - Contributor identifier / UID
 * @returns An object containing the Firebase Storage path and upload FullMetadata
 * @throws Error with descriptive details if the upload fails
 */
export async function uploadAudioRecording(
  audioBlob: Blob,
  recordingId: string,
  contributorId: string
): Promise<AudioUploadResult> {
  if (!audioBlob) {
    throw new Error('Audio upload failed: Audio Blob is required.');
  }
  if (!recordingId || !recordingId.trim()) {
    throw new Error('Audio upload failed: recordingId is required.');
  }
  if (!contributorId || !contributorId.trim()) {
    throw new Error('Audio upload failed: contributorId is required.');
  }

  const storagePath = `recordings/${contributorId.trim()}/${recordingId.trim()}.webm`;

  try {
    const audioFileRef = storageRef(storage, storagePath);
    const customMetadata = {
      contentType: 'audio/webm',
      customMetadata: {
        recordingId: recordingId.trim(),
        contributorId: contributorId.trim(),
        uploadedAt: new Date().toISOString()
      }
    };

    const snapshot = await uploadBytes(audioFileRef, audioBlob, customMetadata);

    return {
      storagePath: snapshot.metadata.fullPath || storagePath,
      metadata: snapshot.metadata
    };
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown Firebase Storage error';
    throw new Error(`Firebase Storage audio upload failed for path "${storagePath}": ${errorMessage}`);
  }
}


