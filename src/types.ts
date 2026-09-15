export type ContributionType = 
  | 'word' 
  | 'sentence' 
  | 'proverb' 
  | 'idiom' 
  | 'cultural_expression' 
  | 'poetry';

export type VerificationStatus = 
  | 'submitted_raw'
  | 'pending_review' 
  | 'approved' 
  | 'corrected' 
  | 'rejected' 
  | 'escalated_to_senior';

export type UserRole = 
  | 'contributor' 
  | 'reviewer' 
  | 'senior_reviewer' 
  | 'linguistic_advisor' 
  | 'administrator' 
  | 'project_director';

export type PartOfSpeech = 
  | 'noun' 
  | 'verb' 
  | 'adjective' 
  | 'adverb' 
  | 'pronoun' 
  | 'preposition_postposition' 
  | 'conjunction' 
  | 'interjection' 
  | 'idiom_phrase' 
  | 'other';

export type DialectId =
  | 'duber_kandia'
  | 'seo_patan'
  | 'jijal_kayal'
  | 'ranolia'
  | 'bankad';

export interface DialectOption {
  id: DialectId | string;
  nameUr: string;
  nameEn: string;
  nameIK: string;
  isDefault?: boolean;
  isStandard?: boolean;
}

export interface RawContributionData {
  ikText: string;              // Indus-Kohistani text (Arabic/Perso-Arabic script) - VERBATIM
  ikTranscription?: string;    // Latin phonetic/orthographic transcription
  urduMeaning?: string;        // Urdu translation (Optional if English is provided)
  englishMeaning?: string;     // English translation (Optional if Urdu is provided)
  category?: ContributionType; // Lexicon / Word, Sentence, Proverb, Idiom, Folk / Cultural Expression, Poetry
  type: ContributionType;      // Backward compatible alias
  dialect: string;             // e.g. Patan, Jalkot, Palas, Seo, Jijal, Duber, Manikhel, Rajkoti
  source?: string;             // Required provenance source (e.g. Elder interview, Oral tradition, Native speaker)
  culturalContext?: string;    // Notes on usage, history, region, speaker gender
  posTag?: PartOfSpeech;
  semanticDomain?: string;     // Semantic domain (e.g. Flora/Fauna, Kinship, Geography, Traditional Craft, Daily Life, Agriculture)
  ipa?: string;                // International Phonetic Alphabet representation
  variantForms?: string[];     // Dialectal or grammatical variant forms
  relatedTerms?: string[];     // Synonyms, antonyms, compound words
  
  // Provenance metadata (BALL 15.5)
  contributorId: string;
  contributorName: string;
  contributorContact?: string;
  consentId?: string;          // Associated immutable FiKR&CD consent agreement
  license?: string;            // Associated contribution license
  inputMethod?: string;        // e.g. virtual_specialized_keyboard
  layer?: 'RAW';               // Strictly RAW layer
  status?: 'submitted_raw' | 'pending_review';
  syncStatus?: 'synced' | 'pending_sync';
  
  audioUrl?: string;           // Recorded audio data URL or link (Optional)
  audioDurationSec?: number;
  submittedAt: string;         // ISO timestamp
  createdAt?: string;          // ISO timestamp
}

export interface ReviewHistoryEntry {
  id: string;
  reviewerId?: string;
  reviewerName: string;
  reviewerRole: UserRole;
  timestamp: string;
  action: 'approved' | 'corrected' | 'rejected' | 'escalated' | 'submitted';
  verdict?: string;
  comments?: string;
  proposedIkText?: string;
  proposedUrdu?: string;
  proposedEnglish?: string;
  orthographyNotes?: string;
  specialCharactersVerified?: boolean;
  vowelDiacriticsAccurate?: boolean;
  correctionsMade?: {
    ikText?: string;
    ikTranscription?: string;
    urduMeaning?: string;
    englishMeaning?: string;
    posTag?: PartOfSpeech;
    dialect?: string;
  };
}

export interface VerifiedContributionData {
  status: VerificationStatus;
  verifiedAt?: string;
  reviewedBy?: string;
  reviewerRole?: UserRole;
  reviewNotes?: string;
  correctedIkText?: string;
  correctedTranscription?: string;
  correctedUrduMeaning?: string;
  correctedEnglishMeaning?: string;
  verifiedDialect?: string;
  verifiedPosTag?: PartOfSpeech;
  verifiedSemanticDomain?: string;
  verifiedIpa?: string;
  verifiedVariantForms?: string[];
  verifiedRelatedTerms?: string[];
  escalationTarget?: 'senior_reviewer' | 'linguistic_advisor' | 'project_director';
  escalationReason?: string;
  reviewHistory: ReviewHistoryEntry[];
}

export interface DerivedContributionData {
  tokenCount: number;
  charCount: number;
  hasAudio: boolean;
  hasUrdu: boolean;
  hasEnglish: boolean;
  isCorpusEligible: boolean;   // true only if verified (approved or corrected) and has Urdu or English meaning
  isSpeechCorpusEligible: boolean; // verified + has audio
  calculatedPoints: number;    // Calculated based on verified status and admin rules
  calculatedRewardPkr: number; // Calculated based on verified status and admin rules
  derivedAt: string;
}

export interface Contribution {
  id: string;
  isDemoData: boolean;         // Clearly tagged for testing
  type: ContributionType;
  layer?: 'RAW' | 'VERIFIED';
  status?: VerificationStatus;
  syncStatus?: 'synced' | 'pending_sync';
  
  // Layer 1: RAW (Immutable original contributor submission)
  raw: RawContributionData;

  // Layer 2: VERIFIED (Human reviewer layer)
  verified?: VerifiedContributionData;

  // Layer 3: DERIVED (Computed for NLP, Corpus, Rewards)
  derived?: DerivedContributionData;
}

export interface RewardConfig {
  wordPoints: number;
  wordRewardPkr: number;
  sentencePoints: number;
  sentenceRewardPkr: number;
  expressionPoints: number;
  expressionRewardPkr: number;
  audioBonusPoints: number;
  audioBonusRewardPkr: number;
}

export interface Milestone {
  id: string;
  nameEn: string;
  nameUrdu: string;
  threshold: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'guardian';
  badgeIcon: string;
  descriptionEn: string;
  descriptionUrdu: string;
}

export interface UserProfile {
  id: string;
  uid?: string;
  name: string;
  role: UserRole;
  dialect: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
}

export interface SpecializedIkCharacter {
  char: string;
  name: string;
  unicode: string;
  description: string;
  ipa?: string;
  exemplarWord?: string;
}

export type UILanguage = 'en' | 'ur' | 'ik';

// ==========================================
// FIRESTORE CLOUD ARCHITECTURE SCHEMAS
// ==========================================

export interface FirestoreUserDoc {
  uid: string;
  email?: string;
  displayName: string;
  role: UserRole;
  institution: string;
  location?: string;
  nativeDialect: string;
  isNativeSpeaker: boolean;
  contributionsCount: number;
  verifiedCount: number;
  reputationScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreContributionDoc {
  contributionId: string;
  contributorId: string;
  contributorSnapshotName: string;
  type: ContributionType;
  dialect: string;
  sourceType: string;
  isDemoData: boolean;
  isRestricted: boolean;
  licenseType: string;
  status: VerificationStatus;
  activePointers: {
    initialRawVersionId: string;
    latestRawVersionId: string;
    latestReviewId?: string;
    canonicalVerifiedVersionId?: string;
    derivedIds: string[];
  };
  canonicalSnapshot?: {
    ikText: string;
    urduTranslation?: string;
    englishTranslation?: string;
    ipaTransliteration?: string;
    hasAudio: boolean;
    recordingId?: string;
    verifiedAt: string;
    verifiedBy: string;
    reviewerRole: UserRole;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreRawSubDoc {
  versionId: string;
  contributionId: string;
  contributorId: string;
  verbatim: {
    ikText: string;
    urduMeaning?: string;
    englishMeaning?: string;
    ikTranscription?: string;
    culturalContext?: string;
    posTag?: PartOfSpeech;
    dialect: string;
  };
  inputMetadata: {
    inputMethod: string;
    detectedSpecialGlyphs: string[];
    userAgent?: string;
  };
  associatedRecordingId?: string;
  submittedAt: string;
}

export interface FirestoreReviewSubDoc {
  reviewId: string;
  contributionId: string;
  reviewerUid: string;
  reviewerName: string;
  reviewerRole: UserRole;
  action: 'approved' | 'corrected' | 'rejected' | 'escalated';
  correctionsMade?: {
    ikText?: string;
    ikTranscription?: string;
    urduMeaning?: string;
    englishMeaning?: string;
    posTag?: PartOfSpeech;
    dialect?: string;
  };
  linguisticEvaluation: {
    orthographyAccurate: boolean;
    phoneticDiacriticsValid: boolean;
    specialCharactersVerified: boolean;
    notes: string;
  };
  resultingVerifiedVersionId?: string;
  timestamp: string;
}

export interface FirestoreVerifiedSubDoc {
  versionId: string;
  contributionId: string;
  basedOnRawVersionId: string;
  basedOnReviewId: string;
  canonical: {
    ikTextStandard: string;
    urduStandard?: string;
    englishStandard?: string;
    ipaTransliteration?: string;
    posTag?: PartOfSpeech;
    dialectStandard: string;
  };
  audioLink?: {
    isAudioVerified: boolean;
    recordingId?: string;
  };
  certification: {
    approvedByUid: string;
    approvedByName: string;
    approvedByRole: UserRole;
    certifiedAt: string;
  };
  isCurrentCanonical: boolean;
  createdAt: string;
}

export interface FirestoreDerivedSubDoc {
  derivedId: string;
  contributionId: string;
  sourceVerifiedVersionId?: string;
  pipelineTarget: 'corpus_lexicon' | 'speech_corpus' | 'parallel_mt' | 'nlp_tokenizer' | 'reward_calc';
  computedPayload: {
    tokenCount: number;
    charCount: number;
    hasAudio: boolean;
    hasUrdu: boolean;
    hasEnglish: boolean;
    isCorpusEligible: boolean;
    isSpeechCorpusEligible: boolean;
    calculatedPoints: number;
    calculatedRewardPkr: number;
  };
  provenance: {
    generatedBy: string;
    isSynthetic: boolean;
    generatedAt: string;
  };
}

export interface FirestoreRecordingDoc {
  recordingId: string;
  contributionId?: string;
  storageReference: {
    bucket: string;
    storagePath: string;
    downloadUrl?: string;
    fileSizeBytes?: number;
    mimeType: string;
    durationSec?: number;
    sampleRateHz?: number;
  };
  speakerMetadata: {
    speakerUid?: string;
    speakerName: string;
    dialect: string;
    isNativeSpeaker: boolean;
  };
  status: 'raw_uploaded' | 'verified_clean' | 'archived_canonical';
  createdAt: string;
}

export interface FirestoreRewardDoc {
  rewardId: string;
  recipientUid: string;
  recipientName: string;
  type: 'contribution_reward' | 'review_stipend' | 'advisory_honorarium' | 'milestone_award';
  amountPkr: number;
  points: number;
  status: 'accrued' | 'pending_approval' | 'disbursed' | 'cancelled';
  triggeringContributions: string[];
  approvedByUid?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface FirestoreSettingsDoc {
  configKey: 'taxonomies' | 'orthography' | 'rewards';
  data: Record<string, unknown>;
  updatedAt: string;
  updatedBy?: string;
}

// ==========================================
// BALL 19: DATASET VERSIONING & RELEASE TYPES
// ==========================================

export type DatasetReleaseStatus = 'draft' | 'review' | 'published' | 'archived';

export interface DatasetSpecialCharacterCounts {
  'ڇ': number;
  'څ': number;
  'ݜ': number;
  'ڙ': number;
  'ݨ': number;
}

export interface DatasetReleaseDoc {
  releaseId: string;
  version: string;             // Semantic version: e.g. "v1.0.0", "v1.1.0"
  title: string;
  description: string;
  sourceLayer: 'VERIFIED';
  status: DatasetReleaseStatus;
  recordCount: number;
  dialectCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  audioRecordCount: number;
  totalAudioDurationSeconds: number;
  specialCharacterCounts: DatasetSpecialCharacterCounts;
  createdBy: string;           // UID or Creator identifier
  createdByName?: string;
  createdByRole?: UserRole;
  createdAt: string;           // ISO 8601 Timestamp
  publishedAt?: string;
  archivedAt?: string;
  corpusQueryDefinition: string;
  schemaVersion: string;       // e.g. "1.0.0"
  checksum?: string;           // Cryptographic hash/fingerprint of the release payload
  metadataCompletenessScore?: number; // 0-100%
  license?: string;            // Default "CC-BY-NC-4.0"
  citation?: string;
}

export interface DatasetReleaseRecordMembership {
  contributionId: string;
  includedAt: string;
  recordVersion?: string;
  dialect?: string;
  category?: string;
  ikText?: string;
  urduStandard?: string;
  englishStandard?: string;
  hasAudio?: boolean;
}

export type DatasetAuditEventType = 
  | 'created'
  | 'submitted_for_review'
  | 'approved'
  | 'published'
  | 'archived';

export interface DatasetReleaseAuditEvent {
  eventId: string;
  releaseId: string;
  eventType: DatasetAuditEventType;
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  timestamp: string;
  previousStatus?: DatasetReleaseStatus;
  newStatus?: DatasetReleaseStatus;
  notes?: string;
}

export interface DatasetReleaseManifest {
  manifestVersion: string;
  releaseId: string;
  version: string;
  title: string;
  description: string;
  sourceLayer: 'VERIFIED';
  status: DatasetReleaseStatus;
  schemaVersion: string;
  corpusQueryDefinition: string;
  createdAt: string;
  publishedAt?: string;
  recordCount: number;
  dialectCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  audioRecordCount: number;
  totalAudioDurationSeconds: number;
  specialCharacterCounts: DatasetSpecialCharacterCounts;
  checksum: string;
  license: string;
  citation: string;
  institution: string;
  projectDirector: string;
  records: Array<{
    id: string;
    ikText: string;
    urduTranslation?: string;
    englishTranslation?: string;
    dialect: string;
    category: string;
    posTag?: string;
    hasAudio: boolean;
    audioUrl?: string;
    verifiedAt?: string;
  }>;
}

export interface DatasetVersionComparison {
  baseRelease: DatasetReleaseDoc;
  targetRelease: DatasetReleaseDoc;
  recordCountDelta: number;
  newRecordIds: string[];
  removedRecordIds: string[];
  retainedRecordIds: string[];
  dialectCountDeltas: Record<string, number>;
  categoryCountDeltas: Record<string, number>;
  audioCountDelta: number;
  audioDurationDeltaSeconds: number;
  specialCharacterDeltas: DatasetSpecialCharacterCounts;
}

// ==========================================
// BALL 20: AI/NLP CORPUS PREPARATION TYPES
// ==========================================

export type DerivedDatasetType =
  | 'nlp_text'
  | 'dictionary'
  | 'parallel_corpus'
  | 'speech_metadata'
  | 'tokenization';

export type DerivedDatasetStatus =
  | 'draft'
  | 'processing'
  | 'validated'
  | 'published'
  | 'archived';

export type LanguagePair = 'ik-ur' | 'ik-en' | 'ik-ur-en';

export interface DerivedNLPRecordTokenization {
  tokens: string[];
  tokenCount: number;
  characterCount: number;
  sentenceCount: number;
  specialCharacterMatches: Record<string, number>;
}

export interface DerivedNLPSpeechMetadata {
  recordingId?: string;
  hasAudio: boolean;
  durationSeconds?: number;
  dialect: string;
  transcriptAvailable: boolean;
}

export interface DerivedNLPRecord {
  recordId: string;
  datasetId: string;
  sourceContributionId: string;
  indusKohistani: string; // Exact verified text copied, NO Unicode normalization
  urdu: string;
  english: string;
  transliteration?: string;
  ipa?: string;
  dialect: string; // One of the 5 official dialects
  category: string;
  sourceReleaseId: string;
  sourceReleaseVersion: string;
  provenancePreserved: true;
  split: 'train' | 'val' | 'test';
  tokenization: DerivedNLPRecordTokenization;
  speechMetadata?: DerivedNLPSpeechMetadata;
  provenanceLabel: 'HUMAN_VERIFIED_DERIVED';
  createdAt: string;
}

export interface DuplicateRecordDetail {
  type: 'exact_ik' | 'ik_urdu_pair' | 'ik_english_pair' | 'duplicate_transliteration' | 'duplicate_source_id';
  description: string;
  value: string;
  sourceContributionIds: string[];
}

export interface DerivedDatasetQualityReport {
  totalSourceRecords: number;
  successfullyProcessedRecords: number;
  failedRecords: number;
  duplicateRecords: {
    exactIkDuplicates: number;
    exactIkUrduDuplicates: number;
    exactIkEnglishDuplicates: number;
    duplicateTransliterations: number;
    duplicateSourceContributionIds: number;
    details: DuplicateRecordDetail[];
  };
  missingUrduCount: number;
  missingEnglishCount: number;
  missingDialectCount: number;
  missingCategoryCount: number;
  specialCharacterPreservationStatus: 'VERIFIED_PRESERVED' | 'MISMATCH_FAILED';
  specialCharacterSourceCounts: DatasetSpecialCharacterCounts;
  specialCharacterDerivedCounts: DatasetSpecialCharacterCounts;
  unicodeMismatchCount: number;
  trainCount: number;
  valCount: number;
  testCount: number;
  leakageCheckPassed: boolean;
  piiCheckPassed: boolean;
  immutableSourceVerified: boolean;
  validationPassed: boolean;
  validationTimestamp: string;
  validatedByUid?: string;
  validatedByName?: string;
  validatedByRole?: UserRole;
  validationNotes?: string;
}

export interface DerivedDatasetCard {
  datasetName: string;
  version: string;
  sourceRelease: string;
  sourceReleaseId: string;
  sourceReleaseVersion: string;
  languages: string[];
  dialects: string[];
  categories: string[];
  numberRecords: number;
  splits: { train: number; val: number; test: number };
  collectionMethodology: string;
  verificationMethodology: string;
  licensing: string;
  knownLimitations: string[];
  intendedUses: string[];
  prohibitedUses: string[];
  processingPipeline: string;
  unicodePolicy: string;
  audioPolicy: string;
  citationInformation: string;
  aiSafetyDeclaration: string;
  checksum: string;
}

export interface DerivedDatasetSplitConfig {
  trainRatio: number; // default 0.8
  valRatio: number;   // default 0.1
  testRatio: number;  // default 0.1
  splitSeed: string;  // deterministic seed
  splitStrategy: 'deterministic_hash_by_source_id_with_family_anti_leakage';
}

export interface DerivedDatasetDoc {
  datasetId: string;
  name: string;
  description: string;
  sourceReleaseId: string;
  sourceReleaseVersion: string;
  datasetType: DerivedDatasetType;
  status: DerivedDatasetStatus;
  recordCount: number;
  schemaVersion: string;
  languagePair?: LanguagePair;
  createdBy: string;
  creatorName?: string;
  creatorRole?: UserRole;
  createdAt: string;
  publishedAt?: string;
  archivedAt?: string;
  processingPipelineVersion: string;
  checksum?: string;
  splitConfig: DerivedDatasetSplitConfig;
  splitCounts: {
    trainCount: number;
    valCount: number;
    testCount: number;
  };
  dialectCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  specialCharacterCounts: DatasetSpecialCharacterCounts;
  qualityReport: DerivedDatasetQualityReport;
  datasetCard: DerivedDatasetCard;
  processingNotes?: string;
}

// ============================================================================
// BALL 21: INDUS-KOHISTANI ↔ URDU ↔ ENGLISH TRANSLATION & MTPE WORKSPACE
// ============================================================================

export type TranslationStatus =
  | 'draft'
  | 'machine_suggested'
  | 'human_review'
  | 'revision_requested'
  | 'verified'
  | 'rejected';

export type TranslationMethod =
  | 'human'
  | 'machine'
  | 'hybrid';

export type TranslationDirection =
  | 'ik_to_ur'
  | 'ik_to_en'
  | 'ik_to_ur_en';

export interface TranslationSourceMeta {
  indusKohistani: string; // byte-for-byte identical to published release record (IMMUTABLE)
  dialect: string;       // One of the 5 official varieties
  category: string;      // Lexicon / Word, Sentence, Proverb, Idiom, Folk / Cultural Expression, Poetry
  audioUrl?: string;
  ipa?: string;
  originalUrdu?: string;
  originalEnglish?: string;
}

export interface TranslationTargetTexts {
  urdu?: string;
  english?: string;
}

export interface HumanCulturalContextFields {
  culturalContext?: string;
  idiomaticMeaning?: string;
  literalMeaning?: string;
  usageNotes?: string;
  register?: string; // formal, colloquial, ritual, poetic, honorific, intimate, archaic
  dialectSpecificMeaning?: string;
  ambiguityNotes?: string;
}

export type MachineSuggestionStatus =
  | 'pending'
  | 'accepted_as_draft'
  | 'rejected'
  | 'superseded';

export interface MachineSuggestionDoc {
  suggestionId: string;
  modelProvider: string; // e.g. "Google DeepMind Gemini", "FiKR Rule-Based NLP", "DeepMind MTPE Engine"
  modelName: string;     // e.g. "gemini-2.5-flash", "fikr-kohistani-mt-v1"
  modelVersion?: string;
  targetLanguage: 'ur' | 'en';
  suggestedText: string;
  promptVersion?: string;
  createdAt: string;
  status: MachineSuggestionStatus;
  appliedByUid?: string;
  appliedAt?: string;
  confidenceScore?: number;
  sourceReleaseVersion?: string;
}

export type ReviewVerdict = 'approve' | 'revision_requested' | 'reject';

export interface TranslationReviewDoc {
  reviewId: string;
  reviewerUid: string;
  reviewerName?: string;
  reviewerRole: string;
  verdict: ReviewVerdict;
  comments: string;
  reviewedFields: string[]; // ['urdu', 'english', 'culturalContext', 'register', 'dialectSpecificMeaning']
  timestamp: string;
}

export interface TranslationDoc {
  translationId: string;
  sourceContributionId: string;
  sourceReleaseId: string;
  sourceReleaseVersion: string;

  source: TranslationSourceMeta;
  targets: TranslationTargetTexts;

  status: TranslationStatus;
  translationMethod: TranslationMethod;
  direction?: TranslationDirection;

  translatorUid?: string;
  translatorName?: string;
  translatorRole?: UserRole;

  reviewerUid?: string;
  reviewerName?: string;
  reviewerRole?: UserRole;
  verifiedAt?: string;

  culturalContext?: HumanCulturalContextFields;

  machineAssistanceUsed?: boolean;
  machineSuggestionsCount?: number;
  activeMachineSuggestionIds?: string[];

  createdAt: string;
  updatedAt: string;
}

export interface TranslationMemoryEntry {
  entryId: string;
  translationId: string;
  sourceContributionId: string;
  sourceReleaseVersion: string;
  sourceIK: string;
  verifiedUrdu: string;
  verifiedEnglish: string;
  dialect: string;
  category: string;
  verifiedByUid: string;
  verifiedByName?: string;
  verifiedAt: string;
  culturalContextSnippet?: string;
}

export interface ParallelCorpusRecord {
  sourceContributionId: string;
  sourceReleaseId: string;
  sourceReleaseVersion: string;
  dialect: string;
  category: string;
  indusKohistani: string;
  urdu: string;
  english: string;
  translationStatus: 'verified';
  translationMethod: TranslationMethod;
  translatorUid?: string;
  reviewerUid?: string;
  verifiedAt?: string;
  culturalContext?: string;
  checksum?: string;
}

export interface TranslationQualityStats {
  totalRecords: number;
  humanTranslatedCount: number;
  machineAssistedCount: number;
  humanVerifiedCount: number;
  pendingReviewCount: number;
  revisionRequestedCount: number;
  rejectedCount: number;
  draftCount: number;
  machineSuggestedOnlyCount: number;
  
  urCoverageCount: number;
  enCoverageCount: number;
  bothCoverageCount: number;
  
  dialectCoverage: Record<string, number>;
  categoryCoverage: Record<string, number>;
  
  machineSuggestionsTotal: number;
  machineSuggestionsAccepted: number;
  machineSuggestionsRejected: number;
  machineAcceptanceRate: number; // percentage
  
  averageTurnaroundHours: number;
}

export interface TranslationValidationCheckResult {
  id: string;
  title: string;
  category: 'source' | 'unicode' | 'workflow' | 'provenance' | 'export' | 'security';
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  errorCount: number;
  sampleItems?: Array<{ id: string; name: string; issue?: string }>;
}

export interface TranslationValidationSuiteReport {
  timestamp: string;
  totalChecks: number;
  passCount: number;
  failCount: number;
  warnCount: number;
  allPassed: boolean;
  results: TranslationValidationCheckResult[];
}

// ============================================================================
// BALL 22: SPEECH AI, ACOUSTIC CORPUS & ALIGNMENT STUDIO TYPES
// ============================================================================

export type AcousticQualityTier = 'canonical_asr' | 'intermediate' | 'flagged' | 'gold_studio' | 'clean_field';

export interface PhonemeAlignmentEntry {
  phoneme: string;
  ipa: string;
  startTimeSec: number;
  endTimeSec: number;
  confidence: number;
  isSpecialGlyph?: boolean;
}

export interface SpeechSegmentDoc {
  segmentId: string;
  contributionId: string;
  sourceReleaseVersion: string;
  audioUrl: string;
  audioFormat: 'wav' | 'mp3' | 'webm' | 'ogg';
  durationSec: number;
  sampleRateHz: number;
  channels: number;
  
  // Transcripts & Orthography
  persoArabicTranscript: string;
  ipaTranscript: string;
  latinTranscription?: string;
  urduGloss?: string;
  englishGloss?: string;
  
  // Dialect & Taxonomy
  dialect: string;
  category: string;
  specialGlyphsPresent: string[];
  
  // Speaker Demographic & Acoustic Provenance
  speakerId: string;
  speakerName: string;
  speakerGender: 'male' | 'female' | 'other' | 'unspecified';
  speakerAgeGroup: 'elder' | 'adult' | 'youth';
  isNativeSpeaker: boolean;
  valleyOfOrigin?: string;
  
  // Acoustic Quality Telemetry
  qualityTier: AcousticQualityTier;
  snrDb: number;
  clippingDetected: boolean;
  silenceRatio: number;
  
  // Phoneme Level Alignment
  phonemeAlignments: PhonemeAlignmentEntry[];
  
  // Partition Split & Workflow
  split: 'train' | 'validation' | 'test';
  status: 'aligned' | 'in_review' | 'verified';
  verifiedBy?: string;
  verifiedAt?: string;
  acousticNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpeechCorpusManifest {
  manifestId: string;
  version: string;
  sourceReleaseId: string;
  generatedAt: string;
  totalHours: number;
  totalUtterances: number;
  trainHours: number;
  valHours: number;
  testHours: number;
  dialectDistribution: Record<string, { utterances: number; hours: number }>;
  genderDistribution: Record<string, { utterances: number; hours: number }>;
  qualityDistribution: Record<AcousticQualityTier, number>;
  segments: SpeechSegmentDoc[];
}

export interface WhisperManifestEntry {
  audio_filepath: string;
  duration: number;
  text: string;
  language: 'indus_kohistani';
  ipa: string;
  urdu_gloss?: string;
  english_gloss?: string;
  dialect: string;
  speaker_id: string;
  split: 'train' | 'validation' | 'test';
}

export interface Ball22ValidationCheckResult {
  id: string;
  title: string;
  category: 'acoustic' | 'transcript' | 'unicode' | 'speaker_diversity' | 'manifest' | 'provenance';
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  errorCount: number;
  sampleItems?: Array<{ id: string; name: string; issue?: string }>;
}

export interface Ball22ValidationReport {
  timestamp: string;
  totalChecks: number;
  passCount: number;
  failCount: number;
  warnCount: number;
  allPassed: boolean;
  results: Ball22ValidationCheckResult[];
}

// ==========================================
// BALL 23: LLM INSTRUCTION TUNING & BENCHMARK
// ==========================================

export type LlmInstructionTaskType = 
  | 'open_qa'
  | 'translation'
  | 'grammar_correction'
  | 'lexicography'
  | 'cultural_heritage'
  | 'dialect_adaptation'
  | 'summarization'
  | 'safety_moderation';

export type LlmInstructionFormat = 'alpaca' | 'chatml' | 'dpo' | 'anthropic_claude';

export interface LlmInstructionPair {
  instructionId: string;
  sourceReleaseVersion: string;
  contributionRefId: string;
  taskType: LlmInstructionTaskType;
  dialect: string;
  
  // Trilingual Instruction & Context
  systemPrompt?: string;
  instructionIk: string;
  instructionUr?: string;
  instructionEn?: string;
  inputContext?: string;
  
  // Reference Responses (Chosen vs Rejected for DPO/RLHF)
  responseCanonical: string;
  responseIpa?: string;
  responseUr?: string;
  responseEn?: string;
  rejectedResponse?: string;
  rejectionReason?: string;
  
  // Linguistic & Cultural Authenticity Metadata
  specialGlyphsPresent: string[];
  culturalSafetyScore: number; // 0 to 100
  authenticityRating: 'flawless_native' | 'acceptable' | 'needs_expert_review';
  domainTopic: string;
  split: 'train' | 'validation' | 'test';
  
  // Provenance & Audit
  verifiedBy: string;
  verifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LlmBenchmarkEvaluation {
  benchmarkId: string;
  evaluatedAt: string;
  modelTarget: string;
  chrfPlusScore: number;
  bleuScore: number;
  culturalSafetyPassRate: number;
  specialGlyphPreservationRate: number;
  dialectRetentionScore: number;
  totalPromptsEvaluated: number;
  results: Array<{
    promptId: string;
    taskType: LlmInstructionTaskType;
    promptText: string;
    modelOutput: string;
    referenceOutput: string;
    metricScore: number;
    safetyStatus: 'safe' | 'flagged';
    notes: string;
  }>;
}

export interface Ball23ValidationCheckResult {
  id: string;
  title: string;
  category: 'instruction_schema' | 'unicode_orthography' | 'dialect_balance' | 'dpo_quality' | 'cultural_safety' | 'benchmark' | 'provenance';
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  errorCount: number;
  sampleItems?: Array<{ id: string; name: string; issue?: string }>;
}

export interface Ball23ValidationReport {
  timestamp: string;
  totalChecks: number;
  passCount: number;
  failCount: number;
  warnCount: number;
  allPassed: boolean;
  results: Ball23ValidationCheckResult[];
}

// ==========================================
// BALL 24: AI LINGUISTIC ANALYSIS
// ==========================================

export type MorphologicalAffixType = 'prefix' | 'root' | 'suffix' | 'infix' | 'clitic' | 'compound_stem';

export interface MorphologySegment {
  segment: string;
  type: MorphologicalAffixType;
  gloss: string;
  ipa?: string;
}

export interface MorphologicalAnalysis {
  word: string;
  root: string;
  pattern?: string;
  segments: MorphologySegment[];
  inflectionalFeatures: {
    number?: 'singular' | 'plural';
    gender?: 'masculine' | 'feminine';
    case?: 'direct' | 'oblique' | 'ergative' | 'genitive' | 'locative' | 'ablative';
    tense?: 'past' | 'present' | 'future' | 'habitual' | 'subjunctive';
    aspect?: 'perfective' | 'imperfective' | 'progressive' | 'habitual';
    person?: '1st' | '2nd' | '3rd';
  };
}

export interface PosTagSuggestion {
  token: string;
  suggestedPos: PartOfSpeech;
  confidence: number; // 0.00 to 1.00
  alternativeTags?: Array<{ pos: PartOfSpeech; confidence: number }>;
  grammaticalNotes?: string;
}

export interface OrthographySuggestion {
  originalText: string;
  suggestedCorrection: string;
  issueType: 'missing_special_glyph' | 'vowel_diacritic_error' | 'dialect_phoneme_mismatch' | 'loanword_orthography';
  affectedGlyphs: string[];
  explanationUr: string;
  explanationEn: string;
  confidence: number;
}

export interface AiLinguisticProvenance {
  modelName: string;
  modelFamily: string;
  promptVersion: string;
  confidenceScore: number;
  requiresHumanReview: true;
  analyzedAt: string;
  reviewedBy?: string;
  reviewerRole?: UserRole;
  reviewedAt?: string;
  approvalStatus: 'pending_human_review' | 'approved_by_linguist' | 'rejected_by_linguist' | 'modified_by_linguist';
  humanFeedbackNotes?: string;
}

export interface LinguisticAnalysisDoc {
  analysisId: string;
  sourceType: 'raw_contribution' | 'verified_contribution' | 'arbitrary_text';
  sourceRefId: string;
  sourceReleaseVersion?: string;
  dialect: DialectId | string;
  inputIkText: string;
  
  // AI Derived Analysis Components
  morphology: MorphologicalAnalysis[];
  posTags: PosTagSuggestion[];
  orthographySuggestions: OrthographySuggestion[];
  specialGlyphsPreserved: string[];
  
  // Provenance & Human Gate
  provenance: AiLinguisticProvenance;
  
  createdAt: string;
  updatedAt: string;
}

export interface Ball24ValidationCheckResult {
  id: string;
  title: string;
  category: 'morphology' | 'pos_tagging' | 'glyph_fidelity' | 'confidence_calibration' | 'human_approval_gate' | 'provenance' | 'immutability';
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  errorCount: number;
  sampleItems?: Array<{ id: string; name: string; issue?: string }>;
}

export interface Ball24ValidationReport {
  timestamp: string;
  totalChecks: number;
  passCount: number;
  failCount: number;
  warnCount: number;
  allPassed: boolean;
  results: Ball24ValidationCheckResult[];
}

// ==========================================
// BALL 25: RAG / KNOWLEDGE RETRIEVAL
// ==========================================

export interface RagPassageDoc {
  passageId: string;
  sourceRefId: string;
  sourceReleaseId: string; // e.g. 'REL-2025-Q1-V1'
  layer: 'VERIFIED'; // Strictly verified only
  verificationStatus: 'approved' | 'corrected';
  dialect: DialectId | string;
  category: ContributionType;
  
  // Multilingual Text Content
  ikText: string;
  ikTranscription?: string;
  ipa?: string;
  urduMeaning: string;
  englishMeaning: string;
  culturalContext?: string;
  semanticDomain?: string;
  
  // Retrieval Metadata & Security
  specialGlyphs: string[];
  tokenCount: number;
  embeddingVectorPlaceholder?: number[];
  isPublished: boolean;
  isPrivateContributorInfoRedacted: boolean;
  hasFinancialData: boolean;
  
  indexedAt: string;
}

export interface RagSearchResult {
  passage: RagPassageDoc;
  relevanceScore: number; // 0.00 to 1.00
  matchedLanguage: 'indus_kohistani' | 'urdu' | 'english';
  matchType: 'exact_lexical' | 'semantic_vector' | 'dialect_variant' | 'cross_lingual';
  highlightSnippet: string;
}

export interface RagQueryFilter {
  query: string;
  dialect?: DialectId | 'all';
  category?: ContributionType | 'all';
  semanticDomain?: string;
  minRelevanceScore?: number;
  targetReleaseVersion?: string;
  requireSpecialGlyphs?: boolean;
}

export interface RagSecurityAudit {
  totalIndexedPassages: number;
  verifiedOnlyCount: number;
  rawLayerExclusionConfirmed: boolean;
  rejectedStatusExclusionConfirmed: boolean;
  piiRedactionConfirmed: boolean;
  financialDataExclusionConfirmed: boolean;
  auditPassed: boolean;
  timestamp: string;
}

export interface Ball25ValidationCheckResult {
  id: string;
  title: string;
  category: 'index_eligibility' | 'security_redaction' | 'multilingual_retrieval' | 'dialect_awareness' | 'provenance' | 'zero_raw_leakage';
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  errorCount: number;
  sampleItems?: Array<{ id: string; name: string; issue?: string }>;
}

export interface Ball25ValidationReport {
  timestamp: string;
  totalChecks: number;
  passCount: number;
  failCount: number;
  warnCount: number;
  allPassed: boolean;
  results: Ball25ValidationCheckResult[];
}

// ==========================================
// BALL 26: AI TRANSLATION / MTPE WORKFLOW
// ==========================================

export type MtpeTranslationDirection = 
  | 'ik_to_ur' 
  | 'ik_to_en' 
  | 'ur_to_ik' 
  | 'en_to_ik';

export interface MtpeJobDoc {
  jobId: string;
  direction: MtpeTranslationDirection;
  sourceReleaseVersion: string;
  sourceContributionRefId: string;
  dialect: DialectId | string;
  category: ContributionType;
  
  // Source Segment
  sourceText: string;
  sourceIpa?: string;
  culturalContext?: string;
  
  // Machine Translation Draft
  mtEngine: string; // e.g. 'FiKR-NMT-Transformer-v1' or 'Gemini-Flash-IK-Assist'
  rawMtDraft: string;
  mtConfidence: number; // 0.00 to 1.00
  specialGlyphsInDraft: string[];
  
  // Human Post-Editing (MTPE)
  postEditedText?: string;
  postEditorUid?: string;
  postEditorName?: string;
  postEditorRole?: UserRole;
  postEditedAt?: string;
  
  // Evaluation & Review
  status: 'draft_generated' | 'in_post_editing' | 'post_edited' | 'verified_by_senior' | 'rejected';
  estimatedChrfScore: number;
  estimatedBleuScore: number;
  translationEditRateTer: number; // 0.00 (no edits) to 1.00+
  humanApprovalNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  
  // Immutability Protection
  neverOverwritesCanonical: true;
  createdAt: string;
  updatedAt: string;
}

export interface Ball26ValidationCheckResult {
  id: string;
  title: string;
  category: 'mt_generation' | 'glyph_fidelity' | 'human_post_editing' | 'quality_metrics' | 'non_destructive_guard' | 'provenance';
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  errorCount: number;
  sampleItems?: Array<{ id: string; name: string; issue?: string }>;
}

export interface Ball26ValidationReport {
  timestamp: string;
  totalChecks: number;
  passCount: number;
  failCount: number;
  warnCount: number;
  allPassed: boolean;
  results: Ball26ValidationCheckResult[];
}

// ==========================================
// BALL 27: SPEECH & PRONUNCIATION ENHANCEMENT
// ==========================================

export interface PhonemeSegment {
  phonemeIpa: string;
  startTimeSec: number;
  endTimeSec: number;
  confidence: number;
  isSpecialIndusKohistaniPhoneme: boolean; // e.g. retroflex nasal /ɳ/, affricate /t͡sʰ/, fricative /ʂ/
}

export interface PhonemeWordAlignment {
  wordOrthography: string;
  wordIpa: string;
  startTimeSec: number;
  endTimeSec: number;
  phonemes: PhonemeSegment[];
}

export interface PronunciationAnalysisDoc {
  speechRefId: string;
  utteranceId: string;
  audioDurationSec: number;
  sampleRateHz: number; // 16000 or 22050
  snrDb: number; // Signal to Noise Ratio
  acousticTier: AcousticQualityTier;
  dialect: DialectId | string;
  
  // Alignment & Pronunciation
  targetOrthography: string;
  targetIpa: string;
  wordAlignments: PhonemeWordAlignment[];
  pronunciationClarityScore: number; // 0 to 100
  vowelLengthFidelity: number; // 0 to 100
  retroflexConsonantAccuracy: number; // 0 to 100
  
  // Formats
  whisperManifestExport: WhisperManifestEntry;
  kaldiSegmentExport: {
    wavScp: string;
    text: string;
    segments: string;
    utt2spk: string;
  };
  
  verifiedBy: string;
  verifiedAt: string;
}

export interface Ball27ValidationCheckResult {
  id: string;
  title: string;
  category: 'phoneme_alignment' | 'snr_acoustic' | 'ipa_fidelity' | 'whisper_kaldi_export' | 'dialect_coverage' | 'provenance';
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  errorCount: number;
  sampleItems?: Array<{ id: string; name: string; issue?: string }>;
}

export interface Ball27ValidationReport {
  timestamp: string;
  totalChecks: number;
  passCount: number;
  failCount: number;
  warnCount: number;
  allPassed: boolean;
  results: Ball27ValidationCheckResult[];
}

// ==========================================
// BALL 28: RESEARCHER / API LAYER
// ==========================================

export interface ResearcherApiEndpoint {
  path: string;
  method: 'GET'; // Strictly GET (read-only)
  description: string;
  parameters: Array<{ name: string; type: string; required: boolean; description: string }>;
  responseSchema: string;
  supportedFormats: Array<'json' | 'csv' | 'tsv' | 'conllu' | 'bibtex'>;
  authRequired: boolean;
  rateLimitPerMinute: number;
}

export interface CitationMetadata {
  title: string;
  author: string; // 'Saif Ullah (Project Director)'
  organization: string; // 'FiKR&CD — Forum for Indus-Kohistani Research & Culture Development'
  year: number;
  version: string;
  doiPlaceholder: string;
  license: string; // 'ODC-By 1.0 / CC-BY-SA 4.0'
  bibtex: string;
  apa: string;
  iso690: string;
  linkedInAttribution: string;
}

export interface ResearcherDatasetExportDoc {
  exportId: string;
  releaseVersion: string;
  format: 'json' | 'csv' | 'tsv' | 'conllu' | 'whisper_jsonl' | 'kaldi_archive';
  totalRecords: number;
  byteSize: number;
  sha256Checksum: string;
  generatedAt: string;
  citation: CitationMetadata;
  accessTier: 'public_open' | 'academic_research';
}

export interface Ball28ValidationCheckResult {
  id: string;
  title: string;
  category: 'api_schema' | 'read_only_enforcement' | 'version_access' | 'research_formats' | 'citation_integrity' | 'director_attribution';
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  errorCount: number;
  sampleItems?: Array<{ id: string; name: string; issue?: string }>;
}

export interface Ball28ValidationReport {
  timestamp: string;
  totalChecks: number;
  passCount: number;
  failCount: number;
  warnCount: number;
  allPassed: boolean;
  results: Ball28ValidationCheckResult[];
}

// ==========================================
// BALL 29: INSTITUTIONAL GOVERNANCE
// ==========================================

export interface GovernanceAuditEntry {
  auditId: string;
  timestamp: string;
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  eventType: 
    | 'contribution_verified' 
    | 'contribution_corrected' 
    | 'contribution_rejected' 
    | 'escalation_resolved' 
    | 'dataset_release_sealed' 
    | 'role_permission_changed' 
    | 'stewardship_review' 
    | 'security_audit_run';
  targetResource: string;
  actionSummary: string;
  cryptographicSignature: string; // HMAC-SHA256 simulation
  ipHash?: string;
  status: 'success' | 'flagged' | 'denied';
}

export interface StewardshipPolicyDoc {
  policyId: string;
  title: string;
  summary: string;
  indigenousElderReverence: true;
  prohibitionOfDerogatoryDistortion: true;
  sacredTraditionConsentMandate: true;
  dialectalEqualityDeclaration: true;
  effectiveDate: string;
  authorizedSignatory: string;
}

export interface ArchivalEscrowPackage {
  packageId: string;
  releaseVersion: string;
  sealedAt: string;
  sealedBy: string;
  totalFiles: number;
  totalBytes: number;
  rootManifestChecksumSha256: string;
  recordsChecksumSha256: string;
  storageUri: string;
  immutabilityLocked: true;
}

export interface Ball29ValidationCheckResult {
  id: string;
  title: string;
  category: 'audit_immutability' | 'approval_hierarchy' | 'stewardship_policies' | 'archival_escrow' | 'rbac_enforcement' | 'security_sealing';
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  errorCount: number;
  sampleItems?: Array<{ id: string; name: string; issue?: string }>;
}

export interface Ball29ValidationReport {
  timestamp: string;
  totalChecks: number;
  passCount: number;
  failCount: number;
  warnCount: number;
  allPassed: boolean;
  results: Ball29ValidationCheckResult[];
}

// ==========================================
// BALL 30: PRODUCTION & PUBLICATION
// ==========================================

export interface ProductionHardeningReport {
  timestamp: string;
  overallReadiness: 'PRODUCTION_READY' | 'CONDITIONAL' | 'BLOCKED';
  readinessScore: number; // 0 to 100
  securityAudit: {
    status: 'PASS' | 'FAIL';
    noClientSecretsLeaked: boolean;
    firestoreSecurityRulesStrict: boolean;
    xssSanitizationActive: boolean;
    rateLimitingEnabled: boolean;
  };
  performanceMetrics: {
    status: 'PASS' | 'FAIL';
    averageIndexLookupMs: number;
    bundleEfficiencyScore: number;
    offlineCacheResilienceScore: number;
  };
  accessibilityAndRtl: {
    status: 'PASS' | 'FAIL';
    wcagContrastAaPassed: boolean;
    touchTargetMin44pxPassed: boolean;
    arabicPersoArabicRtlPassed: boolean;
    specialGlyphsRenderingScore: number;
  };
  disasterRecovery: {
    status: 'PASS' | 'FAIL';
    automatedSnapshotSchemaValid: boolean;
    restoreSimulationPassed: boolean;
    sha256EscrowVerified: boolean;
  };
  milestoneCoverageBall1To30: {
    totalMilestones: 30;
    passedMilestones: number;
    allPassed: boolean;
  };
}

export interface Ball30ValidationCheckResult {
  id: string;
  title: string;
  category: 'production_hardening' | 'security_review' | 'performance_latency' | 'accessibility_rtl' | 'backup_recovery' | 'master_milestones';
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  errorCount: number;
  sampleItems?: Array<{ id: string; name: string; issue?: string }>;
}

export interface Ball30ValidationReport {
  timestamp: string;
  totalChecks: number;
  passCount: number;
  failCount: number;
  warnCount: number;
  allPassed: boolean;
  results: Ball30ValidationCheckResult[];
}






