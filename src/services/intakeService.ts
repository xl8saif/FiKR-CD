import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Contribution, 
  ContributionType, 
  RawContributionData, 
  PartOfSpeech 
} from '../types';
import { getStoredContributions, saveContributions } from './storage';

export const CONFIRMED_SPECIAL_GLYPHS = ['ڇ', 'څ', 'ݜ', 'ڙ', 'ݨ'] as const;
export const CONFIRMED_EXEMPLAR_WORDS = ['ڇھگور', 'څھیر', 'ݜاری', 'ڙگو', 'کاݨ'] as const;

export interface ContributionSubmissionInput {
  ikText: string;
  urduMeaning?: string;
  englishMeaning?: string;
  category: ContributionType;
  dialect: string;
  source: string;
  culturalContext?: string;
  posTag?: PartOfSpeech;
  ikTranscription?: string;
  audioUrl?: string;
  audioDurationSec?: number;
  recordingId?: string;
  contributorId: string;
  contributorName: string;
  contributorContact?: string;
  consentId: string;
  license: string;
  inputMethod?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [field: string]: string };
  warning?: string;
}

/**
 * Validates a contribution against all BALL 15.5 requirements.
 */
export function validateContributionInput(
  input: Partial<ContributionSubmissionInput>,
  existingContributions: Contribution[] = []
): ValidationResult {
  const errors: { [field: string]: string } = {};
  let warning: string | undefined;

  // 1. IK Original Text (Required, verbatim)
  if (!input.ikText || !input.ikText.trim()) {
    errors.ikText = 'Indus-Kohistani original text is required (اصل انڈس کوہستانی متن لازمی ہے).';
  }

  // 2. CORE RULE: Urdu OR English meaning is mandatory. If neither is provided, reject.
  const hasUrdu = Boolean(input.urduMeaning && input.urduMeaning.trim().length > 0);
  const hasEnglish = Boolean(input.englishMeaning && input.englishMeaning.trim().length > 0);

  if (!hasUrdu && !hasEnglish) {
    errors.meaning = 'An IK contribution MUST NOT be saved as a valid corpus record unless either Urdu meaning or English meaning is provided. (اردو یا انگریزی ترجمہ لازمی ہے)';
  }

  // 3. Category (Required)
  const validCategories: ContributionType[] = [
    'word',
    'sentence',
    'proverb',
    'idiom',
    'cultural_expression',
    'poetry'
  ];
  if (!input.category || !validCategories.includes(input.category)) {
    errors.category = 'Please select a valid linguistic category.';
  }

  // 4. Dialect (Required)
  if (!input.dialect || !input.dialect.trim()) {
    errors.dialect = 'Dialect / variety selection is required.';
  }

  // 5. Source (Required)
  if (!input.source || !input.source.trim()) {
    errors.source = 'Contribution provenance source is required.';
  }

  // 6. Valid Consent (Required)
  if (!input.consentId || !input.consentId.trim() || !input.license || !input.license.trim()) {
    errors.consent = 'Valid contribution consent and license agreement must be accepted before submitting.';
  }

  // 7. Duplicate Check: Identical IK text generates a warning but does NOT block submission
  if (input.ikText && input.ikText.trim()) {
    const trimmed = input.ikText.trim();
    const isDuplicate = existingContributions.some(
      (c) => c.raw && c.raw.ikText && c.raw.ikText.trim() === trimmed
    );
    if (isDuplicate) {
      warning = 'Similar entry already exists. Your contribution will still be preserved and reviewed.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warning
  };
}

/**
 * Submits an IK contribution to the RAW layer.
 * Offline-first: saves locally as pending_sync if offline or cloud unavailable.
 */
export async function submitIKContribution(
  input: ContributionSubmissionInput,
  options?: { isOfflineMock?: boolean }
): Promise<{
  contribution: Contribution;
  warning?: string;
  isCloudSynced: boolean;
}> {
  const existing = getStoredContributions();
  const validation = validateContributionInput(input, existing);

  if (!validation.isValid) {
    const firstErrMsg = Object.values(validation.errors)[0];
    throw new Error(firstErrMsg || 'Contribution validation failed.');
  }

  const timestamp = new Date().toISOString();
  const contributionId = `ik-contrib-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const versionId = 'v1_raw';

  // RAW linguistic content is preserved strictly VERBATIM
  const rawData: RawContributionData = {
    ikText: input.ikText, // VERBATIM: No normalization, spell-checking, or alterations
    urduMeaning: input.urduMeaning ? input.urduMeaning.trim() : undefined,
    englishMeaning: input.englishMeaning ? input.englishMeaning.trim() : undefined,
    category: input.category,
    type: input.category,
    dialect: input.dialect,
    source: input.source,
    culturalContext: input.culturalContext ? input.culturalContext.trim() : undefined,
    posTag: input.category === 'word' ? input.posTag : undefined,
    ikTranscription: input.ikTranscription ? input.ikTranscription.trim() : undefined,
    audioUrl: input.audioUrl,
    audioDurationSec: input.audioDurationSec,
    contributorId: input.contributorId,
    contributorName: input.contributorName,
    contributorContact: input.contributorContact ? input.contributorContact.trim() : undefined,
    consentId: input.consentId,
    license: input.license,
    inputMethod: input.inputMethod || 'virtual_specialized_keyboard',
    layer: 'RAW',
    status: 'submitted_raw',
    syncStatus: 'pending_sync',
    submittedAt: timestamp,
    createdAt: timestamp
  };

  let isCloudSynced = false;

  if (!options?.isOfflineMock && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const rootDoc = {
        contributionId,
        contributorId: input.contributorId,
        contributorSnapshotName: input.contributorName,
        category: input.category,
        type: input.category,
        dialect: input.dialect,
        source: input.source,
        consentId: input.consentId,
        license: input.license,
        layer: 'RAW',
        status: 'submitted_raw',
        createdAt: timestamp,
        updatedAt: timestamp,
        activePointers: {
          initialRawVersionId: versionId,
          latestRawVersionId: versionId
        }
      };

      const rawSubDoc = {
        versionId,
        contributionId,
        contributorId: input.contributorId,
        associatedRecordingId: input.recordingId || (input.audioUrl ? ('rec_' + contributionId) : null),
        verbatim: {
          ikText: input.ikText,
          urduMeaning: rawData.urduMeaning || null,
          englishMeaning: rawData.englishMeaning || null,
          culturalContext: rawData.culturalContext || null,
          posTag: rawData.posTag || null,
          dialect: rawData.dialect,
          source: rawData.source
        },
        provenance: {
          consentId: input.consentId,
          license: input.license,
          inputMethod: rawData.inputMethod,
          createdAt: timestamp
        },
        submittedAt: timestamp
      };

      const rootRef = doc(db, 'contributions', contributionId);
      const rawRef = doc(db, 'contributions', contributionId, 'raw', versionId);

      await setDoc(rootRef, rootDoc);
      await setDoc(rawRef, rawSubDoc);

      isCloudSynced = true;
      rawData.syncStatus = 'synced';
    } catch (err) {
      console.warn('Direct Firestore sync failed, saved locally as pending sync:', err);
      isCloudSynced = false;
      rawData.syncStatus = 'pending_sync';
    }
  }

  const newContribution: Contribution = {
    id: contributionId,
    isDemoData: false,
    type: input.category,
    layer: 'RAW',
    status: 'submitted_raw',
    syncStatus: rawData.syncStatus,
    raw: rawData
  };

  // Save to local storage queue
  const updatedList = [newContribution, ...existing];
  saveContributions(updatedList);

  return {
    contribution: newContribution,
    warning: validation.warning,
    isCloudSynced
  };
}

/**
 * Synchronizes pending offline contributions to Firestore.
 */
export async function syncPendingContributions(): Promise<{
  syncedCount: number;
  failedCount: number;
}> {
  const current = getStoredContributions();
  const pending = current.filter((c) => c.raw && c.raw.syncStatus === 'pending_sync');

  if (pending.length === 0) {
    return { syncedCount: 0, failedCount: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;

  const nextList = [...current];

  for (const item of pending) {
    try {
      const rootDoc = {
        contributionId: item.id,
        contributorId: item.raw.contributorId,
        contributorSnapshotName: item.raw.contributorName,
        category: item.raw.category || item.raw.type,
        type: item.raw.category || item.raw.type,
        dialect: item.raw.dialect,
        source: item.raw.source || 'community_intake',
        consentId: item.raw.consentId || 'consent_default',
        license: item.raw.license || 'Public Cultural Preservation',
        layer: 'RAW',
        status: 'submitted_raw',
        createdAt: item.raw.createdAt || item.raw.submittedAt,
        updatedAt: new Date().toISOString(),
        activePointers: {
          initialRawVersionId: 'v1_raw',
          latestRawVersionId: 'v1_raw'
        }
      };

      const rawSubDoc = {
        versionId: 'v1_raw',
        contributionId: item.id,
        contributorId: item.raw.contributorId,
        verbatim: {
          ikText: item.raw.ikText,
          urduMeaning: item.raw.urduMeaning || null,
          englishMeaning: item.raw.englishMeaning || null,
          culturalContext: item.raw.culturalContext || null,
          posTag: item.raw.posTag || null,
          dialect: item.raw.dialect,
          source: item.raw.source || null
        },
        provenance: {
          consentId: item.raw.consentId || null,
          license: item.raw.license || null,
          inputMethod: item.raw.inputMethod || 'virtual_specialized_keyboard',
          createdAt: item.raw.createdAt || item.raw.submittedAt
        },
        submittedAt: item.raw.submittedAt
      };

      const rootRef = doc(db, 'contributions', item.id);
      const rawRef = doc(db, 'contributions', item.id, 'raw', 'v1_raw');

      await setDoc(rootRef, rootDoc);
      await setDoc(rawRef, rawSubDoc);

      // Update in local list
      const idx = nextList.findIndex((c) => c.id === item.id);
      if (idx !== -1) {
        nextList[idx] = {
          ...nextList[idx],
          syncStatus: 'synced',
          raw: {
            ...nextList[idx].raw,
            syncStatus: 'synced'
          }
        };
      }
      syncedCount++;
    } catch (err) {
      console.warn(`Failed to sync item ${item.id}:`, err);
      failedCount++;
    }
  }

  if (syncedCount > 0) {
    saveContributions(nextList);
  }

  return { syncedCount, failedCount };
}
