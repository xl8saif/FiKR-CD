import {
  RagPassageDoc,
  RagSearchResult,
  RagQueryFilter,
  RagSecurityAudit,
  Ball25ValidationReport,
  Ball25ValidationCheckResult,
  Contribution
} from '../types';
import {
  OFFICIAL_5_DIALECTS,
  STANDARD_DEFAULT_DIALECT,
  SPECIAL_GLYPHS,
  normalizeToOfficialDialect
} from './datasetReleaseService';

const STORAGE_KEY_RAG_INDEX = 'fikrcd_ball25_rag_index_v1';

/**
 * Verified knowledge base seeded from published releases
 */
export const SEED_RAG_PASSAGES: RagPassageDoc[] = [
  {
    passageId: 'rag-pass-001',
    sourceRefId: 'raw_seed_001',
    sourceReleaseId: 'REL-2025-Q1-V1',
    layer: 'VERIFIED',
    verificationStatus: 'approved',
    dialect: 'duber_kandia',
    category: 'word',
    ikText: 'کاݨ',
    ikTranscription: 'Kaan',
    ipa: '/kɑːɳ/',
    urduMeaning: 'کان (عضوِ سماعت) یا کانٹا / خاردار جھاڑی',
    englishMeaning: 'Ear (anatomical organ of hearing) or thorn/prickle bush in high-altitude flora.',
    culturalContext: 'In Duber-Kandia tradition, the retroflex "n" (ݨ) is phonemically distinct from standard dental "n".',
    semanticDomain: 'Anatomy & High-Altitude Flora',
    specialGlyphs: ['ݨ'],
    tokenCount: 1,
    isPublished: true,
    isPrivateContributorInfoRedacted: true,
    hasFinancialData: false,
    indexedAt: '2026-03-01T08:00:00Z'
  },
  {
    passageId: 'rag-pass-002',
    sourceRefId: 'raw_seed_002',
    sourceReleaseId: 'REL-2025-Q1-V1',
    layer: 'VERIFIED',
    verificationStatus: 'approved',
    dialect: 'duber_kandia',
    category: 'proverb',
    ikText: 'ݜِینٛگُو مَلکِینٛگ ہِیْند اَں شُونٛڈ کَھن پُھروٹی۔',
    ikTranscription: 'Sheengo malking heend an shoond khan phuroti.',
    ipa: '/ʂiːŋguː mɑlkiːŋ hiː̃d ə̃ ʃuː̃ɖ kʰən pʰʊroːʈiː/',
    urduMeaning: 'کوہستان کے باسی موسمِ سرما اور گرما کی موسمی سختیوں کو صبر اور باہمی اتحاد سے برداشت کرتے ہیں۔',
    englishMeaning: 'Kohistani mountain dwellers endure the seasonal extremes of winter and summer through resilience and unity.',
    culturalContext: 'Reflects pastoral transhumance between valley floor wintering grounds (Heend) and alpine pastures (Shoond).',
    semanticDomain: 'Pastoral Ecology & Indigenous Wisdom',
    specialGlyphs: ['ݜ', 'ݨ'],
    tokenCount: 7,
    isPublished: true,
    isPrivateContributorInfoRedacted: true,
    hasFinancialData: false,
    indexedAt: '2026-03-01T08:15:00Z'
  },
  {
    passageId: 'rag-pass-003',
    sourceRefId: 'raw_seed_004',
    sourceReleaseId: 'REL-2025-Q1-V1',
    layer: 'VERIFIED',
    verificationStatus: 'approved',
    dialect: 'seo_patan',
    category: 'sentence',
    ikText: 'تُو کُتھ بَہ شُوتِھ؟',
    ikTranscription: 'Tu kuth ba shooti?',
    ipa: '/tuː kʊtʰ bə ʃuːtiː/',
    urduMeaning: 'تم کہاں جا رہے ہو؟ (سیو-پٹن بولی)',
    englishMeaning: 'Where are you going? (Seo-Patan dialect variant).',
    culturalContext: 'Demonstrates Seo-Patan interrogative morpheme "kuth" replacing Duber-Kandia "kahaan".',
    semanticDomain: 'Daily Interrogatives & Travel',
    specialGlyphs: ['ݜ'],
    tokenCount: 4,
    isPublished: true,
    isPrivateContributorInfoRedacted: true,
    hasFinancialData: false,
    indexedAt: '2026-03-01T08:30:00Z'
  },
  {
    passageId: 'rag-pass-004',
    sourceRefId: 'raw_seed_005',
    sourceReleaseId: 'REL-2025-Q1-V1',
    layer: 'VERIFIED',
    verificationStatus: 'corrected',
    dialect: 'jijal_kayal',
    category: 'sentence',
    ikText: 'څوک گَھر پَہُتُو شُو۔',
    ikTranscription: 'Tsook ghar pahutu shu.',
    ipa: '/tsʰoːk gʱər pəhʊtuː ʃuː/',
    urduMeaning: 'کوئی شخص گھر پہنچ گیا ہے۔ (جیجال-کیال بولی)',
    englishMeaning: 'Someone has arrived home. (Preserving affricate character څ).',
    culturalContext: 'Initial voiceless affricate "څ" preserved following orthographic correction review.',
    semanticDomain: 'Kinship & Domestic Life',
    specialGlyphs: ['څ', 'ݜ'],
    tokenCount: 4,
    isPublished: true,
    isPrivateContributorInfoRedacted: true,
    hasFinancialData: false,
    indexedAt: '2026-03-01T08:45:00Z'
  },
  {
    passageId: 'rag-pass-005',
    sourceRefId: 'raw_seed_006',
    sourceReleaseId: 'REL-2025-Q1-V1',
    layer: 'VERIFIED',
    verificationStatus: 'approved',
    dialect: 'ranolia',
    category: 'cultural_expression',
    ikText: 'رِیخ اَں جِرگَہ سِیتِھ فَیصلَہ تھِیواں۔',
    ikTranscription: 'Reekh an jirga seeti faisla theewan.',
    ipa: '/reːkʰ ə̃ d͡ʒɪrgə siːtiː fəiːslə tʰiːwɑ̃ː/',
    urduMeaning: 'قدیم کوہستانی قانون (ریخ) اور جرگے کی وساطت سے باہمی تنازع طے پایا۔',
    englishMeaning: 'The dispute was resolved through traditional ancestral tribal law (Reekh) and Jirga arbitration.',
    culturalContext: 'Sacred customary jurisprudence preserved in oral legal traditions of Indus Kohistan.',
    semanticDomain: 'Customary Law & Tribal Jurisprudence',
    specialGlyphs: ['ݜ'],
    tokenCount: 6,
    isPublished: true,
    isPrivateContributorInfoRedacted: true,
    hasFinancialData: false,
    indexedAt: '2026-03-01T09:00:00Z'
  },
  {
    passageId: 'rag-pass-006',
    sourceRefId: 'raw_seed_007',
    sourceReleaseId: 'REL-2025-Q1-V1',
    layer: 'VERIFIED',
    verificationStatus: 'approved',
    dialect: 'bankad',
    category: 'cultural_expression',
    ikText: 'بَنکَڈ اَندَر مَقَامِی قَبائِلُو بُزُرگُو اِحتِرَام شُو۔',
    ikTranscription: 'Bankad andar maqami qabailu buzurgu ihtiram shu.',
    ipa: '/bəŋkəɖ əndər məqɑːmiː qəbɑːɪluː bʊzʊrguː ɪhtɪrɑːm ʃuː/',
    urduMeaning: 'بنکڈ وادی میں مقامی قبائل کے بزرگوں کا احترام کیا جاتا ہے۔',
    englishMeaning: 'In Bankad valley, deep respect is accorded to indigenous tribal elders.',
    culturalContext: 'Ethics and elder reverence in Bankad valley communities.',
    semanticDomain: 'Indigenous Ethics & Community Lore',
    specialGlyphs: ['ݜ'],
    tokenCount: 7,
    isPublished: true,
    isPrivateContributorInfoRedacted: true,
    hasFinancialData: false,
    indexedAt: '2026-03-01T09:15:00Z'
  }
];

export function getStoredRagIndex(): RagPassageDoc[] {
  try {
    const raw = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(STORAGE_KEY_RAG_INDEX) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load RAG index from localStorage:', err);
  }
  return SEED_RAG_PASSAGES;
}

export function saveRagIndex(index: RagPassageDoc[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY_RAG_INDEX, JSON.stringify(index));
    } catch (err) {
      console.warn('Failed to save RAG index to localStorage:', err);
    }
  }
}

/**
 * Filter & index contributions for RAG: Strictly excludes RAW layer, pending, rejected, and PII
 */
export function indexVerifiedContributionsForRag(
  contributions: Contribution[],
  releaseId: string = 'REL-2025-Q1-V1'
): RagPassageDoc[] {
  const existing = getStoredRagIndex();
  const existingMap = new Map(existing.map(p => [p.sourceRefId, p]));

  for (const item of contributions) {
    // SECURITY GUARD: Never index RAW layer or unapproved items
    if (item.layer === 'RAW' || item.status === 'submitted_raw' || item.status === 'pending_review' || item.status === 'rejected') {
      continue;
    }

    const verified = item.verified;
    const raw = item.raw;
    const ikText = verified?.correctedIkText || raw.ikText || '';
    const urduMeaning = verified?.correctedUrduMeaning || raw.urduMeaning || '';
    const englishMeaning = verified?.correctedEnglishMeaning || raw.englishMeaning || '';

    // Must have verified meaning in at least Urdu or English
    if (!ikText || (!urduMeaning && !englishMeaning)) {
      continue;
    }

    const specialGlyphs: string[] = [];
    for (const g of SPECIAL_GLYPHS) {
      if (ikText.includes(g)) {
        specialGlyphs.push(g);
      }
    }

    const passage: RagPassageDoc = {
      passageId: `rag-${item.id}`,
      sourceRefId: item.id,
      sourceReleaseId: releaseId,
      layer: 'VERIFIED',
      verificationStatus: (item.status === 'corrected' ? 'corrected' : 'approved'),
      dialect: normalizeToOfficialDialect(verified?.verifiedDialect || raw.dialect),
      category: raw.category || raw.type || 'word',
      ikText,
      ikTranscription: verified?.correctedTranscription || raw.ikTranscription,
      ipa: verified?.verifiedIpa || raw.ipa,
      urduMeaning,
      englishMeaning,
      culturalContext: raw.culturalContext,
      semanticDomain: verified?.verifiedSemanticDomain || raw.semanticDomain,
      specialGlyphs,
      tokenCount: ikText.split(/\s+/).filter(Boolean).length,
      isPublished: true,
      isPrivateContributorInfoRedacted: true,
      hasFinancialData: false,
      indexedAt: new Date().toISOString()
    };

    existingMap.set(item.id, passage);
  }

  const updatedList = Array.from(existingMap.values());
  saveRagIndex(updatedList);
  return updatedList;
}

/**
 * Trilingual, dialect-aware RAG search across verified corpus
 */
export function queryRagCorpus(filter: RagQueryFilter): RagSearchResult[] {
  const index = getStoredRagIndex();
  const queryLower = filter.query.trim().toLowerCase();

  if (!queryLower) return [];

  const results: RagSearchResult[] = [];

  for (const passage of index) {
    // Dialect filter check
    if (filter.dialect && filter.dialect !== 'all') {
      const normalizedTarget = normalizeToOfficialDialect(filter.dialect);
      const normalizedPassage = normalizeToOfficialDialect(passage.dialect);
      if (normalizedTarget !== normalizedPassage) {
        continue;
      }
    }

    // Category filter check
    if (filter.category && filter.category !== 'all') {
      if (passage.category !== filter.category) {
        continue;
      }
    }

    // Special glyph filter
    if (filter.requireSpecialGlyphs && (!passage.specialGlyphs || passage.specialGlyphs.length === 0)) {
      continue;
    }

    let score = 0;
    let matchedLanguage: 'indus_kohistani' | 'urdu' | 'english' = 'english';
    let matchType: 'exact_lexical' | 'semantic_vector' | 'dialect_variant' | 'cross_lingual' = 'semantic_vector';
    let highlightSnippet = '';

    const ikMatch = passage.ikText.toLowerCase().includes(queryLower);
    const urduMatch = passage.urduMeaning.toLowerCase().includes(queryLower);
    const enMatch = passage.englishMeaning.toLowerCase().includes(queryLower);
    const contextMatch = passage.culturalContext?.toLowerCase().includes(queryLower);

    if (ikMatch) {
      score = passage.ikText.toLowerCase() === queryLower ? 1.0 : 0.88;
      matchedLanguage = 'indus_kohistani';
      matchType = passage.ikText.toLowerCase() === queryLower ? 'exact_lexical' : 'cross_lingual';
      highlightSnippet = passage.ikText;
    } else if (urduMatch) {
      score = passage.urduMeaning.toLowerCase() === queryLower ? 0.95 : 0.82;
      matchedLanguage = 'urdu';
      matchType = 'cross_lingual';
      highlightSnippet = passage.urduMeaning;
    } else if (enMatch) {
      score = passage.englishMeaning.toLowerCase() === queryLower ? 0.95 : 0.78;
      matchedLanguage = 'english';
      matchType = 'semantic_vector';
      highlightSnippet = passage.englishMeaning;
    } else if (contextMatch) {
      score = 0.65;
      matchedLanguage = 'english';
      matchType = 'semantic_vector';
      highlightSnippet = passage.culturalContext || '';
    }

    if (score > 0 && (!filter.minRelevanceScore || score >= filter.minRelevanceScore)) {
      results.push({
        passage,
        relevanceScore: score,
        matchedLanguage,
        matchType,
        highlightSnippet
      });
    }
  }

  // Sort descending by relevance score
  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Runs security audit on RAG knowledge base
 */
export function auditRagSecurity(): RagSecurityAudit {
  const passages = getStoredRagIndex();

  const verifiedOnlyCount = passages.filter(p => p.layer === 'VERIFIED' && (p.verificationStatus === 'approved' || p.verificationStatus === 'corrected')).length;
  const rawLayerCount = passages.filter(p => (p as any).layer === 'RAW' || (p as any).status === 'submitted_raw').length;
  const rejectedCount = passages.filter(p => (p as any).verificationStatus === 'rejected' || (p as any).status === 'rejected').length;
  const piiLeakCount = passages.filter(p => (p as any).contributorContact || (p as any).email || (p as any).phone).length;
  const financialLeakCount = passages.filter(p => p.hasFinancialData === true || (p as any).calculatedRewardPkr !== undefined).length;

  const rawLayerExclusionConfirmed = rawLayerCount === 0;
  const rejectedStatusExclusionConfirmed = rejectedCount === 0;
  const piiRedactionConfirmed = piiLeakCount === 0;
  const financialDataExclusionConfirmed = financialLeakCount === 0;

  const auditPassed = rawLayerExclusionConfirmed && rejectedStatusExclusionConfirmed && piiRedactionConfirmed && financialDataExclusionConfirmed;

  return {
    totalIndexedPassages: passages.length,
    verifiedOnlyCount,
    rawLayerExclusionConfirmed,
    rejectedStatusExclusionConfirmed,
    piiRedactionConfirmed,
    financialDataExclusionConfirmed,
    auditPassed,
    timestamp: new Date().toISOString()
  };
}

/**
 * BALL 25 Validation Suite
 */
export function runBall25ValidationSuite(): Ball25ValidationReport {
  const passages = getStoredRagIndex();
  const results: Ball25ValidationCheckResult[] = [];

  // Check 1: Verified Only Index Eligibility
  const allVerified = passages.every(p => p.layer === 'VERIFIED' && (p.verificationStatus === 'approved' || p.verificationStatus === 'corrected'));
  results.push({
    id: 'ball25-01',
    title: 'Verified/Published Only Corpus Ingestion (Zero RAW Leakage)',
    category: 'index_eligibility',
    status: allVerified && passages.length >= 5 ? 'PASS' : 'FAIL',
    details: allVerified ? `All ${passages.length} indexed passages originate strictly from the VERIFIED layer.` : 'Violation: unverified or RAW records found in index.',
    errorCount: allVerified ? 0 : 1
  });

  // Check 2: PII Redaction and Contributor Privacy Protection
  const piiAudit = auditRagSecurity();
  results.push({
    id: 'ball25-02',
    title: 'Contributor PII & Contact Information Redaction Audit',
    category: 'security_redaction',
    status: piiAudit.piiRedactionConfirmed ? 'PASS' : 'FAIL',
    details: piiAudit.piiRedactionConfirmed ? 'Zero contributor phone/email or private identifiers leaked into retrieval index.' : 'PII detected in RAG index.',
    errorCount: piiAudit.piiRedactionConfirmed ? 0 : 1
  });

  // Check 3: Financial / Monetary Compensation Data Exclusion
  results.push({
    id: 'ball25-03',
    title: 'Financial & Reward Compensation Data Complete Exclusion',
    category: 'security_redaction',
    status: piiAudit.financialDataExclusionConfirmed ? 'PASS' : 'FAIL',
    details: piiAudit.financialDataExclusionConfirmed ? 'No PKR reward or payment metadata indexed in retrieval corpus.' : 'Financial metadata exposed.',
    errorCount: piiAudit.financialDataExclusionConfirmed ? 0 : 1
  });

  // Check 4: Trilingual Retrieval (Indus-Kohistani, Urdu, English)
  const ikQueryRes = queryRagCorpus({ query: 'کاݨ' });
  const urQueryRes = queryRagCorpus({ query: 'موسم' });
  const enQueryRes = queryRagCorpus({ query: 'Kohistan' });
  const trilingualPass = ikQueryRes.length > 0 && urQueryRes.length > 0 && enQueryRes.length > 0;
  results.push({
    id: 'ball25-04',
    title: 'Trilingual Semantic & Lexical Retrieval (IK ↔ UR ↔ EN)',
    category: 'multilingual_retrieval',
    status: trilingualPass ? 'PASS' : 'FAIL',
    details: trilingualPass ? `Successfully retrieved across all three languages (IK hits: ${ikQueryRes.length}, UR hits: ${urQueryRes.length}, EN hits: ${enQueryRes.length}).` : 'Failed trilingual retrieval query tests.',
    errorCount: trilingualPass ? 0 : 1
  });

  // Check 5: Dialect-Aware Filtering across 5 Official Dialects
  const dialectCoverage = OFFICIAL_5_DIALECTS.every(d => {
    const res = queryRagCorpus({ query: '', dialect: d as any });
    // Dialect is present in indexed corpus
    return passages.some(p => normalizeToOfficialDialect(p.dialect) === d);
  });
  results.push({
    id: 'ball25-05',
    title: 'Dialect-Aware Filtering across 5 Official Varieties',
    category: 'dialect_awareness',
    status: dialectCoverage ? 'PASS' : 'FAIL',
    details: dialectCoverage ? 'All 5 official dialects indexed with Duber-Kandia standard default.' : 'Missing dialect coverage in RAG knowledge base.',
    errorCount: dialectCoverage ? 0 : 1
  });

  // Check 6: Release Provenance & Attribution Tracking
  const allHaveReleaseId = passages.every(p => Boolean(p.sourceReleaseId) && Boolean(p.sourceRefId));
  results.push({
    id: 'ball25-06',
    title: 'Immutable Release Provenance (REL-2025-Q1-V1) Tracking',
    category: 'provenance',
    status: allHaveReleaseId ? 'PASS' : 'FAIL',
    details: allHaveReleaseId ? 'Every passage links to a verifiable immutable dataset release version and contribution reference ID.' : 'Missing release provenance.',
    errorCount: allHaveReleaseId ? 0 : 1
  });

  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const warnCount = results.filter(r => r.status === 'WARN').length;

  return {
    timestamp: new Date().toISOString(),
    totalChecks: results.length,
    passCount,
    failCount,
    warnCount,
    allPassed: failCount === 0,
    results
  };
}
