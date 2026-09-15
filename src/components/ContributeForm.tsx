import React, { useState, useEffect } from 'react';
import { 
  Type, 
  AlignLeft, 
  Sparkles, 
  Mic, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  MapPin,
  Quote,
  Feather,
  Scale,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  ContributionType, 
  PartOfSpeech, 
  RewardConfig, 
  UserProfile, 
  SpecializedIkCharacter
} from '../types';
import { 
  DIALECTS, 
  DEFAULT_DIALECT_ID,
  OFFICIAL_IK_SPECIAL_CHARS,
  CONTRIBUTION_CATEGORIES,
  CONTRIBUTION_SOURCES
} from '../data/initialData';
import { AudioRecorder } from './AudioRecorder';
import { getStoredSpecialChars, getStoredContributions } from '../services/storage';
import { 
  submitIKContribution, 
  syncPendingContributions,
  validateContributionInput
} from '../services/intakeService';
import { getLatestConsent, ConsentRecord } from '../services/consentService';
import {
  PROJECT_DIRECTOR_LINKEDIN,
  PROJECT_DIRECTOR_FACEBOOK,
  PROJECT_DIRECTOR_WHATSAPP
} from '../services/speechAiService';
import { LinkedInIconLink } from './LinkedInIconLink';
import { PersoArabicPhoneticKeyboard } from './PersoArabicPhoneticKeyboard';
import saifPortrait from '../assets/images/saif_ullah.jpg';

interface ContributeFormProps {
  currentUser: UserProfile;
  firebaseUser?: FirebaseUser | null;
  rewardConfig: RewardConfig;
  onContributionAdded: () => void;
  onNavigateToPortfolio: () => void;
  onNavigateToConsent?: () => void;
  onNavigateToDirector?: () => void;
}

export const ContributeForm: React.FC<ContributeFormProps> = ({
  currentUser,
  firebaseUser,
  onContributionAdded,
  onNavigateToPortfolio,
  onNavigateToConsent,
  onNavigateToDirector
}) => {
  const [selectedType, setSelectedType] = useState<ContributionType>('word');
  const [specialChars, setSpecialChars] = useState<SpecializedIkCharacter[]>(OFFICIAL_IK_SPECIAL_CHARS);

  // Active Consent on record
  const [activeConsent, setActiveConsent] = useState<ConsentRecord | null>(null);

  // Form fields
  const [ikText, setIkText] = useState('');
  const [ikTranscription, setIkTranscription] = useState('');
  const [urduMeaning, setUrduMeaning] = useState('');
  const [englishMeaning, setEnglishMeaning] = useState('');
  const [dialect, setDialect] = useState(currentUser.dialect || DEFAULT_DIALECT_ID);
  const [posTag, setPosTag] = useState<PartOfSpeech>('noun');
  const [source, setSource] = useState<string>('Native Speaker Everyday Speech');
  const [culturalContext, setCulturalContext] = useState('');
  const [contributorName, setContributorName] = useState(
    firebaseUser?.displayName || ''
  );
  const [contributorContact, setContributorContact] = useState(
    firebaseUser?.email || ''
  );
  
  // Audio state
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [audioDurationSec, setAudioDurationSec] = useState<number | undefined>(undefined);
  const [recordingId, setRecordingId] = useState<string | undefined>(undefined);

  // Status & Validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  
  // Post-submission summary
  const [successSubmission, setSuccessSubmission] = useState<{
    id: string;
    type: ContributionType;
    isCloudSynced: boolean;
    warning?: string;
  } | null>(null);

  useEffect(() => {
    setSpecialChars(getStoredSpecialChars());
  }, []);

  // Fetch active consent
  useEffect(() => {
    const fetchConsent = async () => {
      const targetUid = firebaseUser?.uid || currentUser.id;
      if (!targetUid) return;
      try {
        const consent = await getLatestConsent(targetUid);
        if (consent) {
          setActiveConsent(consent);
        } else {
          setActiveConsent({
            consentId: `consent_${targetUid}_default`,
            userUid: targetUid,
            agreementVersion: 'FiKR-IK-2026.1',
            license: 'Public Cultural Preservation',
            acceptedAt: new Date().toISOString(),
            consentStatus: 'active'
          });
        }
      } catch (err) {
        console.warn('Consent lookup notice:', err);
      }
    };

    fetchConsent();
  }, [firebaseUser, currentUser]);

  // Duplicate warning check
  useEffect(() => {
    if (!ikText.trim()) {
      setDuplicateWarning(null);
      return;
    }
    const existing = getStoredContributions();
    const isDup = existing.some(
      (c) => c.raw && c.raw.ikText && c.raw.ikText.trim() === ikText.trim()
    );
    if (isDup) {
      setDuplicateWarning('Similar entry already recorded. Your contribution will still be preserved and reviewed.');
    } else {
      setDuplicateWarning(null);
    }
  }, [ikText]);

  const insertSpecialChar = (char: string) => {
    setIkText((prev) => prev + char);
  };

  const handleSyncPending = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncPendingContributions();
      if (res.syncedCount > 0) {
        setSyncFeedback(`Successfully synchronized ${res.syncedCount} queued contribution(s) to cloud archive.`);
        onContributionAdded();
      } else if (res.failedCount > 0) {
        setSyncFeedback(`Sync pending: ${res.failedCount} item(s) stored locally.`);
      } else {
        setSyncFeedback('All contributions are synchronized.');
      }
    } catch (err: any) {
      setSyncFeedback(`Sync note: ${err.message || 'Offline queue ready.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const effectiveUid = firebaseUser?.uid || currentUser.id;
    const consentId = activeConsent?.consentId || `consent_${effectiveUid}_active`;
    const license = activeConsent?.license || 'Public Cultural Preservation';

    const inputData = {
      ikText,
      urduMeaning: urduMeaning.trim() || undefined,
      englishMeaning: englishMeaning.trim() || undefined,
      category: selectedType,
      dialect,
      source,
      culturalContext: culturalContext.trim() || undefined,
      posTag: selectedType === 'word' ? posTag : undefined,
      ikTranscription: ikTranscription.trim() || undefined,
      audioUrl,
      audioDurationSec,
      recordingId,
      contributorId: effectiveUid,
      contributorName: contributorName.trim(),
      contributorContact: contributorContact.trim() || undefined,
      consentId,
      license,
      inputMethod: 'virtual_specialized_keyboard'
    };

    const validation = validateContributionInput(inputData, getStoredContributions());
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitIKContribution(inputData);
      setSuccessSubmission({
        id: result.contribution.id,
        type: selectedType,
        isCloudSynced: result.isCloudSynced,
        warning: result.warning
      });
      onContributionAdded();

      // Reset form fields
      setIkText('');
      setIkTranscription('');
      setUrduMeaning('');
      setEnglishMeaning('');
      setCulturalContext('');
      setAudioUrl(undefined);
      setAudioDurationSec(undefined);
      setRecordingId(undefined);
      setDuplicateWarning(null);
    } catch (err: any) {
      setErrors({ form: err.message || 'Submission failed. Please check required fields.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="ik-contribution-intake-module" className="mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-6">
      
      {/* Bilingual Initiative Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex flex-col items-center justify-center max-w-3xl mx-auto px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-zinc-100 tracking-tight font-medium">
            Indus-Kohistani Language Contribution
          </h1>
          <p 
            className="text-xl sm:text-2xl md:text-3xl font-kohistani text-[#D4B582] font-semibold mt-1 sm:mt-1.5 leading-relaxed tracking-wide sm:[word-spacing:0.15em] select-text" 
            dir="rtl"
          >
            اِنڈَس کُستَئی ژِیباں ڈیجیٹل سَنْبَھلتُب اَں تَکْنِیْکی مَنْصُوبَہ
          </p>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Trilingual Preservation: Indus-Kohistani • Urdu • English. Submissions are preserved verbatim with immutable provenance.
        </p>
      </div>

      {/* Minimalist Status & Metadata Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${typeof navigator !== 'undefined' && navigator.onLine ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{typeof navigator !== 'undefined' && navigator.onLine ? 'Cloud Synced' : 'Offline Storage'}</span>
          </div>
          <span className="text-zinc-700">•</span>
          <div className="flex items-center gap-1">
            <Scale className="h-3.5 w-3.5 text-[#C9A66B]" />
            <span>License: <strong className="text-zinc-200">{activeConsent?.license || 'Cultural Preservation'}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToConsent && (
            <button
              type="button"
              onClick={onNavigateToConsent}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 transition"
            >
              Terms & License
            </button>
          )}
          <button
            id="btn-sync-offline-queue"
            type="button"
            onClick={handleSyncPending}
            disabled={isSyncing}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition text-[11px] font-medium disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Queue'}</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Post-Submission Success Banner */}
      {successSubmission && (
        <div id="contribution-success-banner" className="rounded-xl bg-emerald-950/40 p-4 border border-emerald-800/50 text-xs text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-100">Contribution Recorded Successfully</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                ID: <span className="font-mono text-emerald-300 font-bold">{successSubmission.id}</span> • Status: Pending Review
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSuccessSubmission(null)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition font-medium text-[11px]"
            >
              Add Another
            </button>
            <button
              type="button"
              onClick={onNavigateToPortfolio}
              className="px-3 py-1.5 rounded-lg bg-[#C9A66B] text-zinc-950 hover:bg-[#D4B582] transition font-semibold text-[11px] flex items-center gap-1"
            >
              View Status <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Minimalist Executive Feature: Saif Ullah (Project Director & Co-Founder) */}
      <section 
        id="homepage-about-project-manager-section" 
        className="rounded-2xl bg-zinc-900/40 p-5 sm:p-6 border border-zinc-800/80 shadow-xs relative overflow-hidden"
        aria-labelledby="manager-feature-title"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Portrait with refined gold border */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-28 sm:w-32 aspect-[3/4] rounded-xl overflow-hidden border-2 border-[#C9A66B]/60 bg-zinc-950 shadow-md">
              <img
                src={saifPortrait}
                alt="Saif Ullah - Project Director & Co-Founder, FiKR&CD"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top transition duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('/images/saif_ullah.jpg')) {
                    target.src = '/images/saif_ullah.jpg';
                  }
                }}
              />
            </div>
            <span className="mt-2 text-[10px] font-semibold text-[#D4B582] tracking-wider uppercase">
              Project Director
            </span>
          </div>

          {/* Details & Socials */}
          <div className="flex-1 space-y-2.5 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="manager-feature-title" className="text-xl font-bold text-zinc-100">
                    Saif Ullah
                  </h2>
                  <LinkedInIconLink id="home-manager-linkedin-icon-link" size={18} />
                </div>
                <p className="text-xs text-[#C9A66B] font-medium">
                  Project Director & Co-Founder, FiKR&CD • Senior Translator & Linguistic Researcher
                </p>
              </div>

              {/* Minimalist Social / Action Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <a
                  id="homepage-manager-linkedin-cta"
                  href={PROJECT_DIRECTOR_LINKEDIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Saif Ullah on LinkedIn"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-[#0A66C2] text-zinc-200 hover:text-white text-xs font-medium transition duration-200 hover:shadow-md hover:shadow-[#0A66C2]/20"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37h2.79V10.9H6.46M7.86 6.88a1.63 1.63 0 0 0-1.63 1.63c0 .9.73 1.63 1.63 1.63.9 0 1.63-.73 1.63-1.63 0-.9-.73-1.63-1.63-1.63z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
                <a
                  id="homepage-manager-facebook-cta"
                  href={PROJECT_DIRECTOR_FACEBOOK}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Saif Ullah on Facebook"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-[#1877F2] text-zinc-200 hover:text-white text-xs font-medium transition duration-200 hover:shadow-md hover:shadow-[#1877F2]/20"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </a>
                <a
                  id="homepage-manager-whatsapp-cta"
                  href={PROJECT_DIRECTOR_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contact on WhatsApp"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-[#25D366] text-zinc-200 hover:text-white text-xs font-medium transition duration-200 hover:shadow-md hover:shadow-[#25D366]/20"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.45 1.03 2.62.13.17 1.77 2.71 4.29 3.8.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.12-.22-.19-.47-.32z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>
                {onNavigateToDirector && (
                  <button
                    id="homepage-manager-read-full-profile-btn"
                    type="button"
                    onClick={onNavigateToDirector}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#C9A66B]/15 hover:bg-[#C9A66B]/25 text-[#D4B582] border border-[#C9A66B]/30 text-xs font-medium transition"
                  >
                    <span>Full Profile</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Leading the digital documentation and computational preservation of the endangered Indus-Kohistani language. Spearheading field oral literature recording, Unicode Perso-Arabic orthography standardization, trilingual lexicography, and human-verified speech AI datasets.
            </p>

            {/* Clean Domain Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                Oral Literature & Folklore
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                Trilingual Lexicon (IK • UR • EN)
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                Unicode Orthography
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                Speech AI & ASR Corpora
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Selector Pills */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2">
          Select Category (شعبہ) <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {CONTRIBUTION_CATEGORIES.map((cat) => {
            const isSelected = selectedType === cat.id;
            return (
              <button
                key={cat.id}
                id={`btn-select-category-${cat.id}`}
                type="button"
                onClick={() => setSelectedType(cat.id as ContributionType)}
                className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-center border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#C9A66B] bg-[#C9A66B] text-zinc-950 font-bold shadow-xs'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span className="text-xs font-semibold">{cat.nameEn}</span>
                <span className={`text-xs font-kohistani ${isSelected ? 'text-zinc-950' : 'text-[#D4B582]'}`}>
                  {cat.nameUr}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Minimalist Contribution Intake Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl bg-zinc-900/40 p-5 sm:p-6 border border-zinc-800/80 space-y-5">
        {errors.form && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Section 1: Indus-Kohistani Text Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="ik-text-input" className="block text-xs font-semibold text-zinc-200">
              1. Original Indus-Kohistani Text (انڈس کوہستانی متن) <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-[#D4B582] font-mono">Scheherazade New</span>
          </div>

          <textarea
            id="ik-text-input"
            rows={3}
            dir="rtl"
            value={ikText}
            onChange={(e) => setIkText(e.target.value)}
            placeholder="انڈس کوہستانی متن یہاں درج کریں (مثال: ڇھگور ، څھیر ، ݜاری ، ڙگو ، کاݨ)..."
            className={`w-full rounded-xl border p-3.5 sm:p-4 text-xl sm:text-2xl font-kohistani text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#C9A66B] transition leading-loose ${
              errors.ikText ? 'border-rose-500 bg-rose-950/20' : 'border-zinc-800 bg-zinc-950/80'
            }`}
          />
          {errors.ikText && <p className="text-xs text-rose-400">{errors.ikText}</p>}

          {duplicateWarning && (
            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* Specialized Glyphs Toolbar */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-xs text-zinc-400 font-medium">Specialized Glyphs:</span>
            <div className="flex items-center gap-1.5 sm:gap-2" dir="rtl">
              {specialChars.map((sc) => (
                <button
                  key={sc.char + sc.unicode}
                  type="button"
                  onClick={() => insertSpecialChar(sc.char)}
                  title={`${sc.name} (${sc.unicode})`}
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-zinc-800 hover:bg-[#C9A66B] hover:text-zinc-950 text-zinc-100 text-xl sm:text-2xl font-kohistani font-bold transition cursor-pointer active:scale-95"
                >
                  {sc.char}
                </button>
              ))}
            </div>
          </div>

          {/* Perso-Arabic Phonetic Keyboard with Integrated IK Glyphs */}
          <PersoArabicPhoneticKeyboard
            onInsertChar={(char) => setIkText((prev) => prev + char)}
            onBackspace={() => setIkText((prev) => prev.slice(0, -1))}
            onSpace={() => setIkText((prev) => prev + ' ')}
            onClear={() => setIkText('')}
            specialIkChars={specialChars}
          />
        </div>

        {/* Section 2: Meanings & Translations */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-zinc-200">
              2. Meanings (Urdu OR English Required) <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-zinc-500">At least one required</span>
          </div>

          {errors.meaning && (
            <div className="rounded-lg bg-rose-950/40 p-2.5 text-xs text-rose-300 border border-rose-800/40 flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
              <span>{errors.meaning}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="urdu-meaning-input" className="block text-[11px] text-zinc-400 mb-1">
                Urdu Meaning (اردو مفہوم)
              </label>
              <textarea
                id="urdu-meaning-input"
                rows={2}
                dir="rtl"
                value={urduMeaning}
                onChange={(e) => setUrduMeaning(e.target.value)}
                placeholder="اردو میں اس کا درست معنی یا مفہوم درج کریں..."
                className="w-full rounded-xl border border-zinc-800 p-2.5 text-sm font-urdu text-zinc-100 bg-zinc-950/80 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#C9A66B]"
              />
            </div>

            <div>
              <label htmlFor="english-meaning-input" className="block text-[11px] text-zinc-400 mb-1">
                English Meaning / Definition
              </label>
              <textarea
                id="english-meaning-input"
                rows={2}
                value={englishMeaning}
                onChange={(e) => setEnglishMeaning(e.target.value)}
                placeholder="Provide English definition or translation..."
                className="w-full rounded-xl border border-zinc-800 p-2.5 text-sm text-zinc-100 bg-zinc-950/80 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#C9A66B]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Dialect, Source, POS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label htmlFor="dialect-select" className="block text-[11px] text-zinc-400 mb-1">
              Dialect (بولی) <span className="text-rose-400">*</span>
            </label>
            <select
              id="dialect-select"
              value={dialect}
              onChange={(e) => setDialect(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-2 text-xs font-medium text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#C9A66B]"
            >
              {DIALECTS.map((d) => (
                <option key={d.id} value={d.id} className="bg-zinc-900 text-zinc-200">
                  {d.nameUr} {d.nameEn ? `(${d.nameEn})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="source-select" className="block text-[11px] text-zinc-400 mb-1">
              Source (ذریعہ) <span className="text-rose-400">*</span>
            </label>
            <select
              id="source-select"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-2 text-xs font-medium text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#C9A66B]"
            >
              {CONTRIBUTION_SOURCES.map((s) => (
                <option key={s.id} value={s.labelEn} className="bg-zinc-900 text-zinc-200">
                  {s.labelEn}
                </option>
              ))}
            </select>
          </div>

          {selectedType === 'word' ? (
            <div>
              <label htmlFor="pos-select" className="block text-[11px] text-zinc-400 mb-1">
                Part of Speech
              </label>
              <select
                id="pos-select"
                value={posTag}
                onChange={(e) => setPosTag(e.target.value as PartOfSpeech)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-2 text-xs font-medium text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#C9A66B]"
              >
                <option value="noun" className="bg-zinc-900">Noun (اسم)</option>
                <option value="verb" className="bg-zinc-900">Verb (فعل)</option>
                <option value="adjective" className="bg-zinc-900">Adjective (صفت)</option>
                <option value="adverb" className="bg-zinc-900">Adverb (متعلق فعل)</option>
                <option value="pronoun" className="bg-zinc-900">Pronoun (اسم ضمیر)</option>
                <option value="preposition_postposition" className="bg-zinc-900">Postposition (حرف ربط)</option>
                <option value="conjunction" className="bg-zinc-900">Conjunction (حرف عطف)</option>
                <option value="interjection" className="bg-zinc-900">Interjection (حرف فجائیہ)</option>
                <option value="idiom_phrase" className="bg-zinc-900">Idiom / Phrase (محاورہ)</option>
                <option value="other" className="bg-zinc-900">Other / Particle</option>
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="cultural-context-input" className="block text-[11px] text-zinc-400 mb-1">
                Context / Notes (Optional)
              </label>
              <input
                id="cultural-context-input"
                type="text"
                value={culturalContext}
                onChange={(e) => setCulturalContext(e.target.value)}
                placeholder="e.g. Traditional wedding, folklore..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#C9A66B]"
              />
            </div>
          )}
        </div>

        {/* Section 4: Audio Recording */}
        <div>
          <AudioRecorder
            initialAudioUrl={audioUrl}
            contributorId={firebaseUser?.uid || currentUser.id}
            onAudioRecorded={(url, dur, recId) => {
              setAudioUrl(url);
              setAudioDurationSec(dur);
              if (recId) {
                setRecordingId(recId);
              }
            }}
            onClearAudio={() => {
              setAudioUrl(undefined);
              setAudioDurationSec(undefined);
              setRecordingId(undefined);
            }}
          />
        </div>

        {/* Section 5: Contributor Information & Submit */}
        <div className="pt-3 border-t border-zinc-800/80 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="contributor-name-input" className="block text-[11px] text-zinc-400 mb-1">
                Contributor Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="contributor-name-input"
                type="text"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder="Write your name here..."
                className="w-full rounded-xl border border-zinc-800 p-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 bg-zinc-950/80 focus:outline-none focus:ring-1 focus:ring-[#C9A66B]"
              />
            </div>

            <div>
              <label htmlFor="contributor-contact-input" className="block text-[11px] text-zinc-400 mb-1">
                Contact Phone or Email (Optional)
              </label>
              <input
                id="contributor-contact-input"
                type="text"
                value={contributorContact}
                onChange={(e) => setContributorContact(e.target.value)}
                placeholder="Write your number / email here..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#C9A66B]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-zinc-500">
              Preserved in FiKR&CD RAW Layer with immutable provenance.
            </span>

            <button
              id="submit-contribution-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-[#C9A66B] px-6 py-2.5 text-xs font-bold text-zinc-950 hover:bg-[#D4B582] transition active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Recording Submission...</span>
              ) : (
                <>
                  <span>Submit Contribution</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
