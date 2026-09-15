import { Contribution, UserProfile, UserRole } from '../types';
import { DIALECTS, getDialectDisplayName } from '../data/initialData';

export interface ExportFilterCriteria {
  dialect?: string;
  category?: string;
  verificationStatus?: string;
  audioAvailability?: 'all' | 'audio_only' | 'text_only';
  startDate?: string;
  endDate?: string;
  contributorId?: string;
  verifiedOnly?: boolean;
}

export interface ExportProvenanceEnvelope<T = unknown> {
  exportMetadata: {
    exportTimestamp: string;
    datasetType: 'full_3layer_json' | 'verified_only_json' | 'parallel_trilingual_csv' | 'jsonl_nlp_rag' | 'speech_corpus_manifest';
    projectVersion: string;
    totalRecords: number;
    filterCriteria: ExportFilterCriteria;
    exportingAdministrator: {
      id: string;
      name: string;
      role: UserRole;
    };
    sourceLayer: string;
    organization: string;
    projectDirector: string;
    license: string;
    safetyNotice: string;
    computationalDerivedNotice: string;
  };
  data: T;
}

const PROJECT_METADATA = {
  projectVersion: 'FiKR&CD Indus-Kohistani Digital Preservation Platform v1.6.0',
  organization: 'FiKR&CD — Forum for Indus-Kohistani Research & Culture Development',
  projectDirector: 'Saif Ullah',
  license: 'CC-BY-NC-4.0 (Creative Commons Non-Commercial International)',
  safetyNotice: 'Linguistic corpus export only. Contributor private credentials and financial reward data are strictly excluded.',
  computationalDerivedNotice: 'DERIVED section contains computational structural metadata (tokenization, character counts, audio availability). No synthetic or AI-generated linguistic hallucinations are present.'
};

/**
 * Filter contributions safely according to administrative criteria
 */
export function filterContributionsForExport(
  contributions: Contribution[],
  filters: ExportFilterCriteria = {}
): Contribution[] {
  return contributions.filter((item) => {
    // 1. Verified-Only filter
    if (filters.verifiedOnly) {
      const status = item.verified?.status || item.status;
      if (status !== 'approved' && status !== 'corrected') {
        return false;
      }
    }

    // 2. Dialect filter
    if (filters.dialect && filters.dialect !== 'all') {
      const activeDialect = (item.verified?.verifiedDialect || item.raw?.dialect || '').toLowerCase();
      const selectedOption = DIALECTS.find((dl) => dl.id === filters.dialect);
      const matchUr = selectedOption ? selectedOption.nameUr.toLowerCase() : '';
      const matchEn = selectedOption ? selectedOption.nameEn.toLowerCase() : '';
      
      const dialectMatches =
        activeDialect.includes(filters.dialect.toLowerCase()) ||
        (matchUr && activeDialect.includes(matchUr)) ||
        (matchEn && activeDialect.includes(matchEn));

      if (!dialectMatches) return false;
    }

    // 3. Category filter
    if (filters.category && filters.category !== 'all') {
      const cat = item.type || item.raw?.category;
      if (cat !== filters.category) return false;
    }

    // 4. Verification Status filter
    if (filters.verificationStatus && filters.verificationStatus !== 'all') {
      const status = item.verified?.status || item.status;
      if (status !== filters.verificationStatus) return false;
    }

    // 5. Audio availability filter
    if (filters.audioAvailability && filters.audioAvailability !== 'all') {
      const hasAudio = Boolean(item.derived?.hasAudio || item.raw?.audioUrl);
      if (filters.audioAvailability === 'audio_only' && !hasAudio) return false;
      if (filters.audioAvailability === 'text_only' && hasAudio) return false;
    }

    // 6. Contributor filter
    if (filters.contributorId && filters.contributorId !== 'all') {
      const contributorId = item.raw?.contributorId;
      const contributorName = item.raw?.contributorName;
      if (contributorId !== filters.contributorId && contributorName !== filters.contributorId) {
        return false;
      }
    }

    // 7. Date Range filter
    const submissionDateStr = item.raw?.submittedAt || item.raw?.createdAt;
    if (submissionDateStr) {
      const itemDate = new Date(submissionDateStr);
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
    }

    return true;
  });
}

/**
 * 1. FULL 3-LAYER JSON EXPORT (RAW / VERIFIED / DERIVED + PROVENANCE)
 * Never exposes private phone/token credentials; excludes financial reward data from linguistic layers.
 */
export function exportFull3LayerJson(
  contributions: Contribution[],
  filters: ExportFilterCriteria = {},
  adminUser?: UserProfile
) {
  const filtered = filterContributionsForExport(contributions, filters);

  const cleanRecords = filtered.map((c) => {
    // Sanitized RAW Layer (Immutable linguistic verbatim, removing private contacts/credentials)
    const rawLayer = {
      layer: 'RAW' as const,
      ikTextVerbatim: c.raw?.ikText || '',
      ikTranscription: c.raw?.ikTranscription || null,
      urduMeaning: c.raw?.urduMeaning || null,
      englishMeaning: c.raw?.englishMeaning || null,
      category: c.type || c.raw?.category,
      dialectRecorded: c.raw?.dialect || 'duber_kandia',
      sourceType: c.raw?.source || 'Native Speaker Oral Transmission',
      culturalContext: c.raw?.culturalContext || null,
      posTag: c.raw?.posTag || null,
      hasAudioRecording: Boolean(c.raw?.audioUrl),
      audioDurationSec: c.raw?.audioDurationSec || (c.raw?.audioUrl ? 3.0 : 0),
      submittedAt: c.raw?.submittedAt || null,
      contributorPublicName: c.raw?.contributorName || 'FiKR&CD Contributor',
      contributorIdMasked: c.raw?.contributorId ? `contributor_${c.raw.contributorId.slice(-6)}` : 'anon',
      license: c.raw?.license || PROJECT_METADATA.license
    };

    // VERIFIED Layer (Human reviewer and linguistic custodian certification)
    const verifiedLayer = c.verified ? {
      layer: 'VERIFIED' as const,
      status: c.verified.status,
      certifiedIkText: c.verified.correctedIkText || c.raw?.ikText || '',
      certifiedTranscription: c.verified.correctedTranscription || c.raw?.ikTranscription || '',
      certifiedUrduMeaning: c.verified.correctedUrduMeaning || c.raw?.urduMeaning || '',
      certifiedEnglishMeaning: c.verified.correctedEnglishMeaning || c.raw?.englishMeaning || '',
      verifiedDialect: c.verified.verifiedDialect || c.raw?.dialect || 'duber_kandia',
      verifiedDialectFormatted: getDialectDisplayName(c.verified.verifiedDialect || c.raw?.dialect || 'duber_kandia'),
      verifiedPosTag: c.verified.verifiedPosTag || c.raw?.posTag || 'other',
      reviewedBy: c.verified.reviewedBy || 'FiKR&CD Reviewer',
      reviewerRole: c.verified.reviewerRole || 'reviewer',
      verifiedAt: c.verified.verifiedAt || null,
      reviewNotes: c.verified.reviewNotes || null,
      reviewCount: c.verified.reviewHistory?.length || 0
    } : null;

    // DERIVED Layer (Non-hallucinatory computational metrics only)
    const derivedLayer = {
      layer: 'DERIVED' as const,
      isSynthetic: false,
      derivedType: 'computational_structural_metadata',
      tokenCount: c.derived?.tokenCount || (c.raw?.ikText ? c.raw.ikText.split(/\s+/).length : 0),
      charCount: c.derived?.charCount || (c.raw?.ikText ? c.raw.ikText.length : 0),
      hasAudio: Boolean(c.derived?.hasAudio || c.raw?.audioUrl),
      hasUrdu: Boolean(c.derived?.hasUrdu || c.raw?.urduMeaning),
      hasEnglish: Boolean(c.derived?.hasEnglish || c.raw?.englishMeaning),
      isCorpusEligible: Boolean(c.derived?.isCorpusEligible),
      isSpeechCorpusEligible: Boolean(c.derived?.isSpeechCorpusEligible),
      derivedAt: c.derived?.derivedAt || new Date().toISOString()
    };

    return {
      contributionId: c.id,
      datasetType: 'Indus-Kohistani-3-Layer-Record',
      isCorpusEligible: Boolean(c.derived?.isCorpusEligible),
      raw: rawLayer,
      verified: verifiedLayer,
      derived: derivedLayer
    };
  });

  const payload: ExportProvenanceEnvelope<typeof cleanRecords> = {
    exportMetadata: {
      exportTimestamp: new Date().toISOString(),
      datasetType: 'full_3layer_json',
      projectVersion: PROJECT_METADATA.projectVersion,
      totalRecords: cleanRecords.length,
      filterCriteria: filters,
      exportingAdministrator: {
        id: adminUser?.id || 'admin_director',
        name: adminUser?.name || 'Saif Ullah',
        role: adminUser?.role || 'project_director'
      },
      sourceLayer: 'RAW + VERIFIED + DERIVED (3-Tier Architecture)',
      organization: PROJECT_METADATA.organization,
      projectDirector: PROJECT_METADATA.projectDirector,
      license: PROJECT_METADATA.license,
      safetyNotice: PROJECT_METADATA.safetyNotice,
      computationalDerivedNotice: PROJECT_METADATA.computationalDerivedNotice
    },
    data: cleanRecords
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `fikrcd_ik_corpus_full_3layer_${formatDate(new Date())}.json`);
}

/**
 * 2. VERIFIED-ONLY JSON EXPORT
 * Only linguistically approved canonical records.
 */
export function exportVerifiedOnlyJson(
  contributions: Contribution[],
  filters: ExportFilterCriteria = {},
  adminUser?: UserProfile
) {
  const verifiedFilters: ExportFilterCriteria = {
    ...filters,
    verifiedOnly: true
  };

  const filtered = filterContributionsForExport(contributions, verifiedFilters);

  const canonicalRecords = filtered.map((c) => {
    const ikText = c.verified?.correctedIkText || c.raw?.ikText || '';
    const transcription = c.verified?.correctedTranscription || c.raw?.ikTranscription || '';
    const urdu = c.verified?.correctedUrduMeaning || c.raw?.urduMeaning || '';
    const english = c.verified?.correctedEnglishMeaning || c.raw?.englishMeaning || '';
    const dialect = c.verified?.verifiedDialect || c.raw?.dialect || 'duber_kandia';
    const pos = c.verified?.verifiedPosTag || c.raw?.posTag || 'other';

    return {
      entryId: c.id,
      category: c.type || c.raw?.category || 'word',
      headword_ik: ikText,
      transcription_phonetic: transcription,
      translations: {
        urdu: urdu || null,
        english: english || null
      },
      partOfSpeech: pos,
      dialectVariety: dialect,
      dialectNameFormatted: getDialectDisplayName(dialect),
      culturalContext: c.raw?.culturalContext || null,
      audioAvailable: Boolean(c.derived?.hasAudio || c.raw?.audioUrl),
      verification: {
        status: c.verified?.status || 'approved',
        verifiedBy: c.verified?.reviewedBy || 'FiKR&CD Linguistic Custodian',
        reviewerRole: c.verified?.reviewerRole || 'reviewer',
        certifiedAt: c.verified?.verifiedAt || c.raw?.submittedAt
      }
    };
  });

  const payload: ExportProvenanceEnvelope<typeof canonicalRecords> = {
    exportMetadata: {
      exportTimestamp: new Date().toISOString(),
      datasetType: 'verified_only_json',
      projectVersion: PROJECT_METADATA.projectVersion,
      totalRecords: canonicalRecords.length,
      filterCriteria: verifiedFilters,
      exportingAdministrator: {
        id: adminUser?.id || 'admin_director',
        name: adminUser?.name || 'Saif Ullah',
        role: adminUser?.role || 'project_director'
      },
      sourceLayer: 'VERIFIED_CANONICAL_ONLY',
      organization: PROJECT_METADATA.organization,
      projectDirector: PROJECT_METADATA.projectDirector,
      license: PROJECT_METADATA.license,
      safetyNotice: PROJECT_METADATA.safetyNotice,
      computationalDerivedNotice: PROJECT_METADATA.computationalDerivedNotice
    },
    data: canonicalRecords
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `fikrcd_ik_canonical_verified_corpus_${formatDate(new Date())}.json`);
}

/**
 * 3. PARALLEL TRILINGUAL CSV EXPORT
 * Required Columns:
 * contributionId, IK, Urdu, English, category, dialect, verificationStatus, confidence
 */
export function exportParallelTrilingualCsv(
  contributions: Contribution[],
  filters: ExportFilterCriteria = {},
  adminUser?: UserProfile
) {
  const filtered = filterContributionsForExport(contributions, filters);

  const headers = [
    'contributionId',
    'IK',
    'Urdu',
    'English',
    'category',
    'dialect',
    'verificationStatus',
    'confidence'
  ];

  const rows = filtered.map((c) => {
    const ikText = c.verified?.correctedIkText || c.raw?.ikText || '';
    const urdu = c.verified?.correctedUrduMeaning || c.raw?.urduMeaning || '';
    const english = c.verified?.correctedEnglishMeaning || c.raw?.englishMeaning || '';
    const category = c.type || c.raw?.category || 'word';
    const dialect = c.verified?.verifiedDialect || c.raw?.dialect || 'duber_kandia';
    const status = c.verified?.status || c.status || 'pending_review';

    // Confidence index computation based on verification grade
    let confidence = '0.70';
    if (status === 'approved') {
      confidence = c.verified?.reviewerRole === 'project_director' || c.verified?.reviewerRole === 'senior_reviewer'
        ? '1.00'
        : '0.95';
    } else if (status === 'corrected') {
      confidence = '0.90';
    } else if (status === 'escalated_to_senior') {
      confidence = '0.60';
    } else if (status === 'pending_review' || status === 'submitted_raw') {
      confidence = '0.50';
    } else if (status === 'rejected') {
      confidence = '0.00';
    }

    return [
      c.id,
      `"${escapeCsv(ikText)}"`,
      `"${escapeCsv(urdu)}"`,
      `"${escapeCsv(english)}"`,
      `"${escapeCsv(category)}"`,
      `"${escapeCsv(dialect)}"`,
      `"${escapeCsv(status)}"`,
      confidence
    ].join(',');
  });

  // Attach metadata comments at the top of the CSV
  const provenanceHeader = [
    `# Project: ${PROJECT_METADATA.organization}`,
    `# Dataset: Parallel Trilingual Indus-Kohistani / Urdu / English Corpus`,
    `# Export Timestamp: ${new Date().toISOString()}`,
    `# Exported By: ${adminUser?.name || 'Saif Ullah'} (${adminUser?.role || 'project_director'})`,
    `# Total Records: ${rows.length}`,
    `# License: ${PROJECT_METADATA.license}`
  ].join('\n');

  const csvContent = '\uFEFF' + provenanceHeader + '\n' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `fikrcd_ik_parallel_trilingual_${formatDate(new Date())}.csv`);
}

/**
 * 4. JSONL EXPORT (NLP / RAG / LLM Fine-tuning)
 * One JSON object per line with clean prompt/response and linguistic taxonomy.
 */
export function exportJsonlNlpRag(
  contributions: Contribution[],
  filters: ExportFilterCriteria = {},
  adminUser?: UserProfile
) {
  const filtered = filterContributionsForExport(contributions, filters);

  const jsonlLines = filtered.map((c) => {
    const ikText = c.verified?.correctedIkText || c.raw?.ikText || '';
    const transcription = c.verified?.correctedTranscription || c.raw?.ikTranscription || '';
    const urdu = c.verified?.correctedUrduMeaning || c.raw?.urduMeaning || '';
    const english = c.verified?.correctedEnglishMeaning || c.raw?.englishMeaning || '';
    const dialect = c.verified?.verifiedDialect || c.raw?.dialect || 'duber_kandia';
    const category = c.type || c.raw?.category || 'word';
    const status = c.verified?.status || c.status || 'pending_review';

    // Structure suitable for LLM fine-tuning and RAG retrieval
    const record = {
      id: c.id,
      prompt: `Translate Indus-Kohistani (${getDialectDisplayName(dialect)}): "${ikText}"`,
      completion: `Urdu: "${urdu}" | English: "${english}" (Phonetic: /${transcription}/)`,
      ik_text: ikText,
      ik_transcription: transcription,
      translation_urdu: urdu,
      translation_english: english,
      category,
      dialect,
      dialect_name: getDialectDisplayName(dialect),
      part_of_speech: c.verified?.verifiedPosTag || c.raw?.posTag || 'other',
      cultural_context: c.raw?.culturalContext || '',
      verification_status: status,
      is_corpus_eligible: Boolean(c.derived?.isCorpusEligible),
      has_audio: Boolean(c.derived?.hasAudio || c.raw?.audioUrl),
      provenance: {
        exported_by: adminUser?.name || 'Saif Ullah',
        export_date: new Date().toISOString().split('T')[0],
        project: 'FiKR&CD Indus-Kohistani Digital Preservation'
      }
    };

    return JSON.stringify(record);
  }).join('\n');

  const blob = new Blob([jsonlLines], { type: 'application/x-ndjson;charset=utf-8;' });
  downloadBlob(blob, `fikrcd_ik_corpus_nlp_rag_${formatDate(new Date())}.jsonl`);
}

/**
 * 5. SPEECH CORPUS MANIFEST EXPORT
 * Required Fields:
 * - recordingId
 * - contributionId
 * - storagePath
 * - duration
 * - dialect
 * - IK transcription
 * - verification status
 */
export function exportSpeechCorpusManifest(
  contributions: Contribution[],
  filters: ExportFilterCriteria = {},
  adminUser?: UserProfile
) {
  // Speech manifest filters for items that have audio
  const audioFilters: ExportFilterCriteria = {
    ...filters,
    audioAvailability: 'audio_only'
  };

  const filtered = filterContributionsForExport(contributions, audioFilters);

  const manifestSamples = filtered.map((s, index) => {
    const ikText = s.verified?.correctedIkText || s.raw?.ikText || '';
    const transcription = s.verified?.correctedTranscription || s.raw?.ikTranscription || '';
    const dialect = s.verified?.verifiedDialect || s.raw?.dialect || 'duber_kandia';
    const status = s.verified?.status || s.status || 'pending_review';
    const duration = s.raw?.audioDurationSec || 3.2;

    const recordingId = `rec_ik_${s.id.replace(/[^a-zA-Z0-9_]/g, '_')}_${(index + 1).toString().padStart(3, '0')}`;
    const storagePath = `audio/speech_corpus/${dialect}/${recordingId}.wav`;

    return {
      recordingId,
      contributionId: s.id,
      storagePath,
      duration,
      dialect,
      dialectDisplayName: getDialectDisplayName(dialect),
      ikTranscription: transcription,
      verificationStatus: status,
      ikText,
      urduTranslation: s.verified?.correctedUrduMeaning || s.raw?.urduMeaning || '',
      englishTranslation: s.verified?.correctedEnglishMeaning || s.raw?.englishMeaning || '',
      speakerAnonymizedId: s.raw?.contributorId ? `spk_${s.raw.contributorId.slice(-6)}` : 'spk_anon',
      sampleRateHz: 44100,
      audioFormat: 'audio/wav',
      audioDataUrlPresent: Boolean(s.raw?.audioUrl)
    };
  });

  const payload: ExportProvenanceEnvelope<typeof manifestSamples> = {
    exportMetadata: {
      exportTimestamp: new Date().toISOString(),
      datasetType: 'speech_corpus_manifest',
      projectVersion: PROJECT_METADATA.projectVersion,
      totalRecords: manifestSamples.length,
      filterCriteria: audioFilters,
      exportingAdministrator: {
        id: adminUser?.id || 'admin_director',
        name: adminUser?.name || 'Saif Ullah',
        role: adminUser?.role || 'project_director'
      },
      sourceLayer: 'SPEECH_CORPUS_AUDIO_MANIFEST',
      organization: PROJECT_METADATA.organization,
      projectDirector: PROJECT_METADATA.projectDirector,
      license: PROJECT_METADATA.license,
      safetyNotice: PROJECT_METADATA.safetyNotice,
      computationalDerivedNotice: PROJECT_METADATA.computationalDerivedNotice
    },
    data: manifestSamples
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `fikrcd_ik_speech_corpus_manifest_${formatDate(new Date())}.json`);
}

/**
 * Backward-compatible wrapper for dictionary export
 */
export function exportDictionaryFormat(contributions: Contribution[]) {
  exportVerifiedOnlyJson(contributions);
}

/**
 * Backward-compatible wrapper for full JSON
 */
export function exportFullJson(contributions: Contribution[]) {
  exportFull3LayerJson(contributions);
}

/**
 * Backward-compatible wrapper for JSONL
 */
export function exportJsonl(contributions: Contribution[]) {
  exportJsonlNlpRag(contributions);
}

/**
 * Backward-compatible wrapper for Parallel CSV
 */
export function exportParallelCorpusCsv(contributions: Contribution[]) {
  exportParallelTrilingualCsv(contributions);
}

function escapeCsv(val: string): string {
  if (!val) return '';
  return val.replace(/"/g, '""');
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function downloadFile(dataUrl: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.setAttribute('href', dataUrl);
  anchor.setAttribute('download', filename);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  downloadFile(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
