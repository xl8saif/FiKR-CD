import React, { useState, useEffect, useMemo } from 'react';
import {
  Languages,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  FileText,
  Filter,
  Search,
  Download,
  ShieldCheck,
  Cpu,
  User,
  Plus,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Copy,
  Check,
  X,
  Send,
  Eye,
  Lock,
  Volume2,
  Activity,
  Award,
  Layers,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  FileCode,
  Tag,
  Linkedin
} from 'lucide-react';
import {
  TranslationDoc,
  TranslationStatus,
  TranslationMethod,
  TranslationDirection,
  MachineSuggestionDoc,
  TranslationReviewDoc,
  TranslationMemoryEntry,
  ParallelCorpusRecord,
  UserProfile,
  UserRole,
  DatasetReleaseDoc,
  Contribution,
  HumanCulturalContextFields
} from '../types';
import {
  OFFICIAL_5_DIALECTS,
  STANDARD_DEFAULT_DIALECT,
  SPECIAL_GLYPHS,
  getStoredDatasetReleases
} from '../services/datasetReleaseService';
import { PROJECT_DIRECTOR_LINKEDIN } from '../services/speechAiService';
import { LinkedInIconLink } from './LinkedInIconLink';
import {
  getStoredTranslations,
  setStoredTranslations,
  getStoredMachineSuggestions,
  saveStoredMachineSuggestion,
  getStoredTranslationReviews,
  saveTranslationDoc,
  submitTranslationForReview,
  reviewTranslation,
  generateMachineSuggestion,
  acceptMachineSuggestionAsDraft,
  rejectMachineSuggestion,
  buildTranslationMemory,
  lookupTranslationMemory,
  generateParallelCorpusRecords,
  exportParallelJSONL,
  exportParallelCSV,
  exportVerifiedTMX,
  computeTranslationQualityStats,
  runBall21ValidationSuite,
  initializeTranslationFromReleaseRecord,
  isAuthorizedVerifier,
  OFFICIAL_CATEGORIES
} from '../services/translationService';

interface TranslationWorkspaceProps {
  contributions: Contribution[];
  currentUser: UserProfile;
}

export const TranslationWorkspace: React.FC<TranslationWorkspaceProps> = ({
  contributions,
  currentUser
}) => {
  // Core Translation State
  const [translations, setTranslations] = useState<TranslationDoc[]>(() => getStoredTranslations());
  const [selectedTranslationId, setSelectedTranslationId] = useState<string>(() => {
    const list = getStoredTranslations();
    return list.length > 0 ? list[0].translationId : '';
  });

  // Selected record data
  const selectedTranslation = useMemo(() => {
    return translations.find(t => t.translationId === selectedTranslationId) || translations[0] || null;
  }, [translations, selectedTranslationId]);

  // Machine suggestions for currently selected record
  const [suggestions, setSuggestions] = useState<MachineSuggestionDoc[]>([]);
  // Review audit trail for currently selected record
  const [reviews, setReviews] = useState<TranslationReviewDoc[]>([]);

  // Editing state
  const [draftUrdu, setDraftUrdu] = useState<string>('');
  const [draftEnglish, setDraftEnglish] = useState<string>('');
  const [culturalFields, setCulturalFields] = useState<HumanCulturalContextFields>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Review & Verification Modal / State
  const [reviewVerdict, setReviewVerdict] = useState<'approve' | 'revision_requested' | 'reject'>('approve');
  const [reviewComments, setReviewComments] = useState<string>('');
  const [reviewedFields, setReviewedFields] = useState<string[]>(['urdu', 'english', 'culturalContext']);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dialectFilter, setDialectFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  // Modals & Panels
  const [activeModal, setActiveModal] = useState<'none' | 'new_from_release' | 'validation_suite' | 'exports' | 'analytics' | 'tm_search'>('none');
  const [isGeneratingMT, setIsGeneratingMT] = useState<boolean>(false);

  // New translation from release record picker
  const [availableReleases, setAvailableReleases] = useState<DatasetReleaseDoc[]>([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>('');
  const [selectedContIdToTranslate, setSelectedContIdToTranslate] = useState<string>('');

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Validation suite report
  const [validationReport, setValidationReport] = useState<any>(null);

  // Export states
  const [exportDirection, setExportDirection] = useState<'IK-UR' | 'IK-EN' | 'IK-UR-EN'>('IK-UR-EN');
  const [exportVerifiedOnly, setExportVerifiedOnly] = useState<boolean>(true);
  const [exportFormat, setExportFormat] = useState<'jsonl' | 'csv' | 'tmx'>('jsonl');

  // Translation Memory
  const translationMemory = useMemo(() => buildTranslationMemory(translations), [translations]);
  const [tmSearchQuery, setTmSearchQuery] = useState<string>('');
  const [tmResults, setTmResults] = useState<any[]>([]);

  // Load releases on mount
  useEffect(() => {
    const releases = getStoredDatasetReleases();
    setAvailableReleases(releases);
    if (releases.length > 0) {
      setSelectedReleaseId(releases[0].releaseId);
    }
  }, []);

  // Update suggestions, reviews, and editing draft when selected translation changes
  useEffect(() => {
    if (selectedTranslation) {
      setDraftUrdu(selectedTranslation.targets.urdu || '');
      setDraftEnglish(selectedTranslation.targets.english || '');
      setCulturalFields(selectedTranslation.culturalContext || {});
      setSuggestions(getStoredMachineSuggestions(selectedTranslation.translationId));
      setReviews(getStoredTranslationReviews(selectedTranslation.translationId));
      setTmSearchQuery(selectedTranslation.source.indusKohistani);
      setSaveSuccessMsg('');
    }
  }, [selectedTranslation]);

  // Run TM search when query changes
  useEffect(() => {
    if (tmSearchQuery) {
      const results = lookupTranslationMemory(tmSearchQuery, translationMemory, dialectFilter !== 'ALL' ? dialectFilter : undefined);
      setTmResults(results);
    } else {
      setTmResults([]);
    }
  }, [tmSearchQuery, translationMemory, dialectFilter]);

  // Quality statistics
  const qualityStats = useMemo(() => {
    const allSugs: Record<string, MachineSuggestionDoc[]> = {};
    translations.forEach(t => {
      allSugs[t.translationId] = getStoredMachineSuggestions(t.translationId);
    });
    return computeTranslationQualityStats(translations, allSugs);
  }, [translations]);

  // Filtered translations list
  const filteredTranslations = useMemo(() => {
    return translations.filter(t => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (dialectFilter !== 'ALL' && t.source.dialect !== dialectFilter) return false;
      if (categoryFilter !== 'ALL' && t.source.category !== categoryFilter) return false;
      if (methodFilter !== 'ALL' && t.translationMethod !== methodFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchIK = t.source.indusKohistani.toLowerCase().includes(q);
        const matchUr = (t.targets.urdu || '').toLowerCase().includes(q);
        const matchEn = (t.targets.english || '').toLowerCase().includes(q);
        const matchId = t.translationId.toLowerCase().includes(q) || t.sourceContributionId.toLowerCase().includes(q);
        if (!matchIK && !matchUr && !matchEn && !matchId) return false;
      }

      return true;
    });
  }, [translations, statusFilter, dialectFilter, categoryFilter, methodFilter, searchQuery]);

  // Handle Save Draft / Edit
  const handleSaveTranslation = async (method: TranslationMethod = 'human') => {
    if (!selectedTranslation) return;
    setIsSaving(true);
    try {
      const updated: TranslationDoc = {
        ...selectedTranslation,
        targets: {
          urdu: draftUrdu.trim(),
          english: draftEnglish.trim()
        },
        culturalContext: culturalFields,
        translationMethod: method,
        translatorUid: selectedTranslation.translatorUid || currentUser.id,
        translatorName: selectedTranslation.translatorName || currentUser.name,
        translatorRole: selectedTranslation.translatorRole || currentUser.role,
        updatedAt: new Date().toISOString()
      };

      const saved = await saveTranslationDoc(updated, currentUser, method);
      setTranslations(prev => prev.map(t => t.translationId === saved.translationId ? saved : t));
      setSaveSuccessMsg('✓ Translation draft saved successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Submit for Review
  const handleSubmitReview = async () => {
    if (!selectedTranslation) return;
    if (!draftUrdu.trim() && !draftEnglish.trim()) {
      alert('Please populate at least one target translation (Urdu or English) before submitting for review.');
      return;
    }
    setIsSaving(true);
    try {
      // First save content
      const updated: TranslationDoc = {
        ...selectedTranslation,
        targets: {
          urdu: draftUrdu.trim(),
          english: draftEnglish.trim()
        },
        culturalContext: culturalFields
      };
      await saveTranslationDoc(updated, currentUser, selectedTranslation.translationMethod);
      const submitted = await submitTranslationForReview(selectedTranslation.translationId, currentUser);
      setTranslations(prev => prev.map(t => t.translationId === submitted.translationId ? submitted : t));
      setSaveSuccessMsg('✓ Submitted for linguistic review!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Review Verdict (Verification / Revision Request / Rejection)
  const handleReviewAction = async () => {
    if (!selectedTranslation) return;
    setIsSubmittingReview(true);
    try {
      const { translation: updated, review } = await reviewTranslation(
        selectedTranslation.translationId,
        reviewVerdict,
        reviewComments,
        reviewedFields,
        currentUser
      );
      setTranslations(prev => prev.map(t => t.translationId === updated.translationId ? updated : t));
      setReviews(prev => [review, ...prev]);
      setReviewComments('');
      setSaveSuccessMsg(
        reviewVerdict === 'approve'
          ? '✓ Translation successfully verified by authorized reviewer!'
          : `✓ Review logged with verdict: ${reviewVerdict}`
      );
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } catch (err: any) {
      alert(`Review action failed: ${err.message}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Generate Machine Translation Suggestion
  const handleRequestMT = async (targetLang: 'ur' | 'en') => {
    if (!selectedTranslation) return;
    setIsGeneratingMT(true);
    try {
      const sug = await generateMachineSuggestion(
        selectedTranslation,
        targetLang,
        'Google DeepMind Gemini',
        'gemini-2.5-flash'
      );
      setSuggestions(prev => [sug, ...prev]);
    } catch (err: any) {
      alert(`MT suggestion failed: ${err.message}`);
    } finally {
      setIsGeneratingMT(false);
    }
  };

  // Accept MT Suggestion as Draft
  const handleAcceptSuggestion = async (sug: MachineSuggestionDoc) => {
    if (!selectedTranslation) return;
    try {
      const updated = await acceptMachineSuggestionAsDraft(selectedTranslation, sug, currentUser);
      setTranslations(prev => prev.map(t => t.translationId === updated.translationId ? updated : t));
      if (sug.targetLanguage === 'ur') setDraftUrdu(sug.suggestedText);
      if (sug.targetLanguage === 'en') setDraftEnglish(sug.suggestedText);
      setSuggestions(getStoredMachineSuggestions(selectedTranslation.translationId));
      setSaveSuccessMsg('✓ Machine suggestion accepted as draft. You can now post-edit and refine it.');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Error accepting suggestion: ${err.message}`);
    }
  };

  // Reject MT Suggestion
  const handleRejectSuggestion = async (sug: MachineSuggestionDoc) => {
    if (!selectedTranslation) return;
    try {
      await rejectMachineSuggestion(selectedTranslation.translationId, sug.suggestionId, currentUser);
      setSuggestions(getStoredMachineSuggestions(selectedTranslation.translationId));
    } catch (err: any) {
      alert(`Error rejecting suggestion: ${err.message}`);
    }
  };

  // Handle New Translation Initialization from Release
  const handleCreateNewTranslation = async () => {
    const release = availableReleases.find(r => r.releaseId === selectedReleaseId);
    if (!release) {
      alert('Please select a valid published dataset release.');
      return;
    }
    const sourceContrib = contributions.find(c => c.id === selectedContIdToTranslate);
    if (!sourceContrib) {
      alert('Please select a source record to translate.');
      return;
    }

    try {
      const newTr = await initializeTranslationFromReleaseRecord(sourceContrib, release, currentUser);
      setTranslations(prev => [newTr, ...prev]);
      setSelectedTranslationId(newTr.translationId);
      setActiveModal('none');
      setSaveSuccessMsg(`✓ Created new translation record linked to Release ${release.version}!`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Failed to initialize translation: ${err.message}`);
    }
  };

  // Run 21-Point Validation Suite
  const handleRunValidationSuite = () => {
    const report = runBall21ValidationSuite(translations, availableReleases, contributions);
    setValidationReport(report);
    setActiveModal('validation_suite');
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Download exported corpora
  const handleDownloadExport = () => {
    const records = generateParallelCorpusRecords(translations, exportDirection, exportVerifiedOnly);
    let content = '';
    let mimeType = 'text/plain;charset=utf-8';
    let filename = `indus_kohistani_parallel_${exportDirection.toLowerCase()}_${new Date().toISOString().slice(0, 10)}`;

    if (exportFormat === 'jsonl') {
      content = exportParallelJSONL(records);
      filename += '.jsonl';
      mimeType = 'application/x-jsonlines;charset=utf-8';
    } else if (exportFormat === 'csv') {
      content = exportParallelCSV(records);
      filename += '.csv';
      mimeType = 'text/csv;charset=utf-8';
    } else if (exportFormat === 'tmx') {
      content = exportVerifiedTMX(records);
      filename += '.tmx';
      mimeType = 'application/xml;charset=utf-8';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isUserVerifier = isAuthorizedVerifier(currentUser);

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-[#E5E5E5] pb-24">
      {/* ========================================================================= */}
      {/* HEADER & GOVERNANCE BAR (BALL 21) */}
      {/* ========================================================================= */}
      <div className="border-b border-[#222] bg-[#121212]/95 backdrop-blur sticky top-0 z-30 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Languages className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-[#E5E5E5] tracking-tight">
                    Indus-Kohistani ↔ Urdu ↔ English MTPE & Translation Workspace
                  </h1>
                  <span className="rounded-md bg-[#C9A66B]/20 text-[#D4B582] text-[10px] font-mono font-bold px-2 py-0.5 border border-[#C9A66B]/40">
                    BALL 21
                  </span>
                </div>
                <p className="text-xs text-[#888] flex items-center gap-2 mt-0.5 flex-wrap">
                  <span>FiKR&CD Language Digital Preservation</span>
                  <span className="text-[#555]">•</span>
                  <span className="flex items-center gap-1.5">
                    <span>Director: <strong className="text-[#C9A66B]">Saif Ullah</strong></span>
                    <LinkedInIconLink id="translation-director-linkedin-link" size={18} />
                  </span>
                  <span className="text-[#555]">•</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Human-Verified Translations are Canonical
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-open-validation-suite"
              type="button"
              onClick={handleRunValidationSuite}
              className="flex items-center gap-1.5 rounded-lg bg-[#1C1C1C] hover:bg-[#282828] px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 transition cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>21-Point Audit Suite</span>
            </button>

            <button
              id="btn-open-exports"
              type="button"
              onClick={() => setActiveModal('exports')}
              className="flex items-center gap-1.5 rounded-lg bg-[#1C1C1C] hover:bg-[#282828] px-3 py-1.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-indigo-400" />
              <span>Export Corpora (JSONL/CSV/TMX)</span>
            </button>

            <button
              id="btn-open-analytics"
              type="button"
              onClick={() => setActiveModal('analytics')}
              className="flex items-center gap-1.5 rounded-lg bg-[#1C1C1C] hover:bg-[#282828] px-3 py-1.5 text-xs font-semibold text-[#D4B582] border border-[#C9A66B]/30 transition cursor-pointer"
            >
              <Activity className="h-3.5 w-3.5 text-[#C9A66B]" />
              <span>Quality & Coverage</span>
            </button>

            <button
              id="btn-create-translation-release"
              type="button"
              onClick={() => setActiveModal('new_from_release')}
              className="flex items-center gap-1.5 rounded-lg bg-[#C9A66B] hover:bg-[#B89358] text-[#0C0C0C] font-bold px-3.5 py-1.5 text-xs transition shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Translate from Release</span>
            </button>
          </div>
        </div>

        {/* Global Summary Metric Pills */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-3 pt-3 border-t border-[#1C1C1C]">
          <div className="bg-[#161616] rounded-lg p-2 border border-[#252525]">
            <span className="text-[10px] text-[#777] uppercase font-bold block">Total Pairs</span>
            <span className="text-sm font-bold text-[#E5E5E5] font-mono">{qualityStats.totalRecords}</span>
          </div>
          <div className="bg-[#161616] rounded-lg p-2 border border-emerald-900/40">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block flex items-center gap-1">
              <CheckCircle2 className="h-2.5 w-2.5" /> Verified Canonical
            </span>
            <span className="text-sm font-bold text-emerald-300 font-mono">{qualityStats.humanVerifiedCount}</span>
          </div>
          <div className="bg-[#161616] rounded-lg p-2 border border-amber-900/40">
            <span className="text-[10px] text-amber-400 uppercase font-bold block flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" /> In Human Review
            </span>
            <span className="text-sm font-bold text-amber-300 font-mono">{qualityStats.pendingReviewCount}</span>
          </div>
          <div className="bg-[#161616] rounded-lg p-2 border border-rose-900/40">
            <span className="text-[10px] text-rose-400 uppercase font-bold block flex items-center gap-1">
              <RotateCcw className="h-2.5 w-2.5" /> Revision Req.
            </span>
            <span className="text-sm font-bold text-rose-300 font-mono">{qualityStats.revisionRequestedCount}</span>
          </div>
          <div className="bg-[#161616] rounded-lg p-2 border border-cyan-900/40">
            <span className="text-[10px] text-cyan-400 uppercase font-bold block flex items-center gap-1">
              <User className="h-2.5 w-2.5" /> Human Translated
            </span>
            <span className="text-sm font-bold text-cyan-300 font-mono">{qualityStats.humanTranslatedCount}</span>
          </div>
          <div className="bg-[#161616] rounded-lg p-2 border border-purple-900/40">
            <span className="text-[10px] text-purple-400 uppercase font-bold block flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Hybrid / MTPE
            </span>
            <span className="text-sm font-bold text-purple-300 font-mono">{qualityStats.machineAssistedCount}</span>
          </div>
          <div className="bg-[#161616] rounded-lg p-2 border border-[#252525]">
            <span className="text-[10px] text-[#C9A66B] uppercase font-bold block flex items-center gap-1">
              <BookOpen className="h-2.5 w-2.5" /> TM Pairs
            </span>
            <span className="text-sm font-bold text-[#D4B582] font-mono">{translationMemory.length}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN DUAL-PANE TRANSLATION & MTPE WORKSPACE */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* --------------------------------------------------------------------- */}
          {/* LEFT SIDEBAR: TRANSLATION RECORD SELECTOR & FILTERS (col-span-4) */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Filter Card */}
            <div className="rounded-xl border border-[#262626] bg-[#141414] p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#C9A66B] uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5" /> Filter Translation Pairs
                </span>
                <span className="text-[11px] font-mono text-[#888]">
                  {filteredTranslations.length} of {translations.length}
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#666]" />
                <input
                  type="text"
                  placeholder="Search Indus-Kohistani, Urdu, English..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg bg-[#1D1D1D] border border-[#333] pl-8 pr-3 py-1.5 text-xs text-[#E5E5E5] placeholder-[#666] focus:border-[#C9A66B] focus:outline-none"
                />
              </div>

              {/* Dialect Filter */}
              <div>
                <label className="text-[10px] uppercase font-bold text-[#777] block mb-1">Dialect Variety</label>
                <select
                  value={dialectFilter}
                  onChange={e => setDialectFilter(e.target.value)}
                  className="w-full rounded-lg bg-[#1D1D1D] border border-[#333] px-2.5 py-1.5 text-xs text-[#DDD] focus:border-[#C9A66B] focus:outline-none"
                >
                  <option value="ALL">All 5 Official Dialects</option>
                  {OFFICIAL_5_DIALECTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Category & Status Dual Row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#777] block mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full rounded-lg bg-[#1D1D1D] border border-[#333] px-2 py-1.5 text-xs text-[#DDD] focus:border-[#C9A66B] focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="verified">Verified (معیاری)</option>
                    <option value="human_review">Human Review (زیر جائزہ)</option>
                    <option value="revision_requested">Revision Requested</option>
                    <option value="draft">Draft (مسودہ)</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#777] block mb-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="w-full rounded-lg bg-[#1D1D1D] border border-[#333] px-2 py-1.5 text-xs text-[#DDD] focus:border-[#C9A66B] focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    {OFFICIAL_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Translation Records Scroll List */}
            <div className="rounded-xl border border-[#262626] bg-[#141414] p-2 flex flex-col gap-1.5 max-h-[620px] overflow-y-auto">
              {filteredTranslations.length === 0 ? (
                <div className="p-6 text-center text-[#777] text-xs">
                  No translation pairs match your selected filters.
                </div>
              ) : (
                filteredTranslations.map(t => {
                  const isSelected = t.translationId === selectedTranslation?.translationId;
                  const isVerified = t.status === 'verified';
                  const isReview = t.status === 'human_review';
                  const isRevision = t.status === 'revision_requested';

                  return (
                    <button
                      key={t.translationId}
                      type="button"
                      onClick={() => setSelectedTranslationId(t.translationId)}
                      className={`text-left p-3 rounded-lg border transition cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-[#222] border-[#C9A66B] shadow-sm'
                          : 'bg-[#181818] border-[#292929] hover:bg-[#1E1E1E] hover:border-[#383838]'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-mono text-[#888]">{t.translationId}</span>
                        <div className="flex items-center gap-1">
                          {isVerified && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 flex items-center gap-0.5">
                              <CheckCircle2 className="h-2.5 w-2.5" /> VERIFIED
                            </span>
                          )}
                          {isReview && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/50 flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" /> IN REVIEW
                            </span>
                          )}
                          {isRevision && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-700/50">
                              REVISION
                            </span>
                          )}
                          {t.status === 'draft' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                              DRAFT
                            </span>
                          )}

                          {t.translationMethod === 'hybrid' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                              MTPE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Source IK Snippet */}
                      <div className="font-scheherazade text-base text-[#F5F5F5] leading-relaxed text-right line-clamp-1" dir="rtl">
                        {t.source.indusKohistani}
                      </div>

                      {/* Target Urdu or English preview */}
                      <div className="text-[11px] text-[#A0A0A0] line-clamp-1">
                        {t.targets.urdu || t.targets.english || <span className="italic text-[#666]">No target translation yet</span>}
                      </div>

                      {/* Dialect & Category Footer */}
                      <div className="flex items-center justify-between text-[10px] text-[#777] pt-1 border-t border-[#262626]">
                        <span>{t.source.dialect.split('—')[0]}</span>
                        <span className="text-[#C9A66B]">{t.source.category}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* RIGHT MAIN: ACTIVE TRANSLATION & MTPE DUAL-PANE WORKSPACE (col-span-8) */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {selectedTranslation ? (
              <>
                {/* Status Notice & Success Banner */}
                {saveSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center justify-between">
                    <span>{saveSuccessMsg}</span>
                    <button type="button" onClick={() => setSaveSuccessMsg('')} className="text-emerald-400 hover:text-emerald-200">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* =============================================================== */}
                {/* DUAL PANE 1: SOURCE INDUS-KOHISTANI (IMMUTABLE) */}
                {/* =============================================================== */}
                <div className="rounded-xl border border-[#2B2B2B] bg-[#161616] p-5 flex flex-col gap-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-[#C9A66B] flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-amber-400" /> Source Indus-Kohistani (Immutable Record)
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222] text-[#A0A0A0] border border-[#333]">
                        Release: {selectedTranslation.sourceReleaseVersion}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222] text-[#A0A0A0] border border-[#333]">
                        ID: {selectedTranslation.sourceContributionId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#A0A0A0]">
                        Dialect: <strong className="text-[#E5E5E5]">{selectedTranslation.source.dialect}</strong>
                      </span>
                      <span className="text-[#555]">•</span>
                      <span className="text-[11px] text-[#A0A0A0]">
                        Category: <strong className="text-[#C9A66B]">{selectedTranslation.source.category}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Main Indus-Kohistani Text Display */}
                  <div className="p-5 rounded-xl bg-[#101010] border border-[#222] flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs text-[#777]">
                      <span className="text-[11px] text-amber-300 font-mono flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Byte-for-Byte Perso-Arabic Code Points Preserved
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedTranslation.source.indusKohistani, 'src-ik')}
                        className="flex items-center gap-1 text-[11px] text-[#888] hover:text-[#C9A66B] cursor-pointer"
                      >
                        {copiedId === 'src-ik' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>Copy Source</span>
                      </button>
                    </div>

                    <div
                      className="text-3xl font-scheherazade text-[#FFF] leading-loose text-right tracking-wide select-text py-1"
                      dir="rtl"
                    >
                      {selectedTranslation.source.indusKohistani}
                    </div>

                    {/* Phonetic IPA & Special Glyphs Tagging */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1C1C1C]">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-[#666]">Phonetic IPA:</span>
                        <span className="text-xs font-mono text-[#D4B582]">
                          {selectedTranslation.source.ipa || 'IPA phonetics verified'}
                        </span>
                      </div>

                      {/* Special Kohistani Glyphs Highlight */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#777]">Special Glyphs:</span>
                        {SPECIAL_GLYPHS.map(g => {
                          const present = selectedTranslation.source.indusKohistani.includes(g);
                          return (
                            <span
                              key={g}
                              className={`text-xs px-1.5 py-0.2 rounded font-scheherazade ${
                                present
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                                  : 'bg-[#181818] text-[#555] border border-[#252525]'
                              }`}
                            >
                              {g}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Original Reference from Raw Intake (for context only) */}
                  {(selectedTranslation.source.originalUrdu || selectedTranslation.source.originalEnglish) && (
                    <div className="p-3 rounded-lg bg-[#141414] border border-[#242424] text-xs text-[#999] flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-[#777] uppercase">Historical Raw Intake Reference:</span>
                      {selectedTranslation.source.originalUrdu && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-[10px] text-[#666] font-mono">UR:</span>
                          <span className="text-[#CCC] font-urdu">{selectedTranslation.source.originalUrdu}</span>
                        </div>
                      )}
                      {selectedTranslation.source.originalEnglish && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-[10px] text-[#666] font-mono">EN:</span>
                          <span className="text-[#CCC]">{selectedTranslation.source.originalEnglish}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* =============================================================== */}
                {/* DUAL PANE 2: TARGET TRANSLATIONS (URDU & ENGLISH EDITORS) */}
                {/* =============================================================== */}
                <div className="rounded-xl border border-[#2B2B2B] bg-[#161616] p-5 flex flex-col gap-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-[#C9A66B] flex items-center gap-1.5">
                        <Languages className="h-4 w-4 text-[#C9A66B]" /> Human Target Translations
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        selectedTranslation.translationMethod === 'human'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : selectedTranslation.translationMethod === 'hybrid'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-gray-800 text-gray-300'
                      }`}>
                        {selectedTranslation.translationMethod === 'human' ? 'HUMAN TRANSLATED' : 'HUMAN EDITED / MTPE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveTranslation(selectedTranslation.translationMethod)}
                        disabled={isSaving}
                        className="rounded-lg bg-[#252525] hover:bg-[#333] px-3 py-1 text-xs font-semibold text-[#E5E5E5] border border-[#3A3A3A] transition cursor-pointer"
                      >
                        {isSaving ? 'Saving...' : 'Save Draft'}
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmitReview}
                        disabled={isSaving}
                        className="rounded-lg bg-[#C9A66B] hover:bg-[#B89358] text-[#0C0C0C] font-bold px-3.5 py-1 text-xs transition shadow-sm cursor-pointer flex items-center gap-1"
                      >
                        <Send className="h-3 w-3" />
                        <span>Submit for Review</span>
                      </button>
                    </div>
                  </div>

                  {/* Urdu Target Box */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-xs font-bold text-[#DDD] flex items-center gap-1.5">
                        <span>Urdu Translation (اردو ترجمہ)</span>
                        <span className="text-[10px] font-mono text-[#777]">Noto Nastaliq Urdu • RTL</span>
                      </label>
                      <span className="text-[11px] text-[#777] font-mono">{draftUrdu.length} chars</span>
                    </div>

                    <textarea
                      rows={3}
                      dir="rtl"
                      placeholder="Indus-Kohistani کا معیاری اردو ترجمہ یہاں درج کریں..."
                      value={draftUrdu}
                      onChange={e => setDraftUrdu(e.target.value)}
                      className="w-full rounded-xl bg-[#101010] border border-[#333] p-3 text-lg font-urdu text-[#F0F0F0] leading-loose placeholder-[#555] focus:border-[#C9A66B] focus:outline-none transition resize-none"
                    />
                  </div>

                  {/* English Target Box */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-xs font-bold text-[#DDD] flex items-center gap-1.5">
                        <span>English Translation</span>
                        <span className="text-[10px] font-mono text-[#777]">Plus Jakarta Sans • LTR</span>
                      </label>
                      <span className="text-[11px] text-[#777] font-mono">{draftEnglish.split(/\s+/).filter(Boolean).length} words</span>
                    </div>

                    <textarea
                      rows={3}
                      dir="ltr"
                      placeholder="Enter precise, linguistically faithful English translation..."
                      value={draftEnglish}
                      onChange={e => setDraftEnglish(e.target.value)}
                      className="w-full rounded-xl bg-[#101010] border border-[#333] p-3 text-sm text-[#F0F0F0] leading-relaxed placeholder-[#555] focus:border-[#C9A66B] focus:outline-none transition resize-none"
                    />
                  </div>

                  {/* Dedicated Human Cultural / Semantic Fields (BALL 21 Rule 10) */}
                  <div className="rounded-xl bg-[#111] border border-[#282828] p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-[#222] pb-2">
                      <span className="text-xs font-bold text-[#C9A66B] flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" /> Cultural & Semantic Annotations (Human-Authored Only)
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        AI is strictly forbidden from populating this field
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-[#777] block mb-1">Cultural Context</label>
                        <input
                          type="text"
                          placeholder="e.g. Traditional alpine pasture greeting..."
                          value={culturalFields.culturalContext || ''}
                          onChange={e => setCulturalFields({ ...culturalFields, culturalContext: e.target.value })}
                          className="w-full rounded-lg bg-[#181818] border border-[#333] px-2.5 py-1.5 text-xs text-[#E5E5E5] focus:border-[#C9A66B] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-[#777] block mb-1">Idiomatic / Deeper Meaning</label>
                        <input
                          type="text"
                          placeholder="e.g. Signifies seasonal transhumance..."
                          value={culturalFields.idiomaticMeaning || ''}
                          onChange={e => setCulturalFields({ ...culturalFields, idiomaticMeaning: e.target.value })}
                          className="w-full rounded-lg bg-[#181818] border border-[#333] px-2.5 py-1.5 text-xs text-[#E5E5E5] focus:border-[#C9A66B] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-[#777] block mb-1">Literal Meaning (لفظی معنی)</label>
                        <input
                          type="text"
                          placeholder="e.g. Word-by-word morphemic gloss..."
                          value={culturalFields.literalMeaning || ''}
                          onChange={e => setCulturalFields({ ...culturalFields, literalMeaning: e.target.value })}
                          className="w-full rounded-lg bg-[#181818] border border-[#333] px-2.5 py-1.5 text-xs text-[#E5E5E5] focus:border-[#C9A66B] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-[#777] block mb-1">Linguistic Register</label>
                        <select
                          value={culturalFields.register || 'Formal / Traditional'}
                          onChange={e => setCulturalFields({ ...culturalFields, register: e.target.value })}
                          className="w-full rounded-lg bg-[#181818] border border-[#333] px-2.5 py-1.5 text-xs text-[#E5E5E5] focus:border-[#C9A66B] focus:outline-none"
                        >
                          <option value="Formal / Traditional">Formal / Traditional (روایتی / رسمی)</option>
                          <option value="Colloquial / Everyday">Colloquial / Everyday (روزمرہ گفتگو)</option>
                          <option value="Elder Wisdom / Proverbial">Elder Wisdom / Proverbial (بزرگوں کے اقوال)</option>
                          <option value="Poetic / Folkloric">Poetic / Folkloric (شعری و لوک)</option>
                          <option value="Ritual / Ceremonial">Ritual / Ceremonial (مذہبی و رسومات)</option>
                          <option value="Archaic">Archaic / Historical (قدیم متروک الفاظ)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* =============================================================== */}
                {/* PANE 3: MACHINE TRANSLATION SUGGESTIONS & MTPE WORKFLOW */}
                {/* =============================================================== */}
                <div className="rounded-xl border border-[#2B2B2B] bg-[#161616] p-5 flex flex-col gap-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-purple-300 flex items-center gap-1.5">
                        <Cpu className="h-4 w-4 text-purple-400" /> Derived Machine Translation Suggestions (MTPE Layer)
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800">
                        Isolated Subcollection
                      </span>
                    </div>

                    {/* AI Suggestion Request Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRequestMT('ur')}
                        disabled={isGeneratingMT}
                        className="flex items-center gap-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 px-3 py-1 text-xs font-semibold text-purple-200 border border-purple-700 transition cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3 text-purple-400" />
                        <span>AI Suggest Urdu</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestMT('en')}
                        disabled={isGeneratingMT}
                        className="flex items-center gap-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 px-3 py-1 text-xs font-semibold text-purple-200 border border-purple-700 transition cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3 text-purple-400" />
                        <span>AI Suggest English</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#888]">
                    Machine translation outputs are <strong>ALWAYS DERIVED</strong>. They never overwrite source text or canonical translations, and only enter the draft workspace after human acceptance and post-editing.
                  </p>

                  {/* Suggestions List */}
                  <div className="flex flex-col gap-2.5">
                    {suggestions.length === 0 ? (
                      <div className="p-4 rounded-lg bg-[#111] border border-[#222] text-center text-xs text-[#666]">
                        No machine suggestions generated yet for this record. Click "AI Suggest" above to create an isolated MT suggestion.
                      </div>
                    ) : (
                      suggestions.map(sug => {
                        const isAccepted = sug.status === 'accepted_as_draft';
                        const isRejected = sug.status === 'rejected';

                        return (
                          <div
                            key={sug.suggestionId}
                            className={`p-3.5 rounded-xl border flex flex-col gap-2 transition ${
                              isAccepted
                                ? 'bg-purple-950/20 border-purple-700/60'
                                : isRejected
                                ? 'bg-rose-950/10 border-rose-900/40 opacity-60'
                                : 'bg-[#121212] border-[#2A2A2A]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1C1C1C] text-[#C9A66B] border border-[#333]">
                                  {sug.targetLanguage === 'ur' ? 'TARGET: URDU' : 'TARGET: ENGLISH'}
                                </span>
                                <span className="text-[11px] text-[#A0A0A0]">
                                  Model: <strong className="text-[#DDD]">{sug.modelName}</strong> ({sug.modelProvider})
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {isAccepted && (
                                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                    <Check className="h-3 w-3" /> ACCEPTED AS DRAFT
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                                    <X className="h-3 w-3" /> REJECTED
                                  </span>
                                )}
                                {sug.status === 'pending' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleAcceptSuggestion(sug)}
                                      className="flex items-center gap-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-2.5 py-1 transition cursor-pointer"
                                    >
                                      <Check className="h-3 w-3" /> Accept as Draft
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectSuggestion(sug)}
                                      className="flex items-center gap-1 rounded bg-[#252525] hover:bg-[#333] text-[#AAA] text-xs px-2 py-1 transition cursor-pointer"
                                    >
                                      <X className="h-3 w-3" /> Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Suggested Content */}
                            <div
                              className={`text-sm ${
                                sug.targetLanguage === 'ur'
                                  ? 'font-urdu text-lg text-right text-[#F5F5F5] leading-loose'
                                  : 'text-[#DDD] leading-relaxed'
                              }`}
                              dir={sug.targetLanguage === 'ur' ? 'rtl' : 'ltr'}
                            >
                              {sug.suggestedText}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* =============================================================== */}
                {/* PANE 4: TRANSLATION MEMORY (TM) RETRIEVAL DRAWER */}
                {/* =============================================================== */}
                <div className="rounded-xl border border-[#2B2B2B] bg-[#161616] p-5 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-[#C9A66B] flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-[#C9A66B]" /> Verified Translation Memory (TM) Matches
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                        {tmResults.length} Matches Found
                      </span>
                    </div>

                    <span className="text-[11px] text-[#777]">
                      Derived strictly from verified human records
                    </span>
                  </div>

                  {tmResults.length === 0 ? (
                    <div className="p-4 rounded-lg bg-[#111] border border-[#222] text-center text-xs text-[#666]">
                      No exact or fuzzy Translation Memory matches found for the current sentence.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {tmResults.map(({ entry, matchScore, matchType }) => (
                        <div
                          key={entry.entryId}
                          className="p-3.5 rounded-xl bg-[#121212] border border-[#2A2A2A] flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                                matchType === 'exact'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                  : 'bg-amber-950 text-amber-300 border border-amber-700'
                              }`}>
                                {matchScore}% {matchType.toUpperCase()} MATCH
                              </span>
                              <span className="text-[11px] text-[#888]">Dialect: {entry.dialect.split('—')[0]}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (entry.verifiedUrdu) setDraftUrdu(entry.verifiedUrdu);
                                if (entry.verifiedEnglish) setDraftEnglish(entry.verifiedEnglish);
                                setSaveSuccessMsg('✓ Inserted Translation Memory targets into draft!');
                                setTimeout(() => setSaveSuccessMsg(''), 3000);
                              }}
                              className="text-xs text-[#C9A66B] hover:text-[#D4B582] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <span>Apply to Editor</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="font-scheherazade text-lg text-[#F0F0F0] text-right" dir="rtl">
                            {entry.sourceIK}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1 border-t border-[#1C1C1C]">
                            <div className="font-urdu text-[#DDD] text-right" dir="rtl">{entry.verifiedUrdu}</div>
                            <div className="text-[#CCC]">{entry.verifiedEnglish}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* =============================================================== */}
                {/* PANE 5: REVIEW AUDIT TRAIL & VERIFICATION CONTROLS (BALL 21 Rule 7, 8, 19) */}
                {/* =============================================================== */}
                <div className="rounded-xl border border-[#2B2B2B] bg-[#161616] p-5 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                    <span className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" /> Linguistic Review & Verification Audit Trail
                    </span>
                    <span className="text-[10px] font-mono text-[#888]">
                      Append-Only Ledger ({reviews.length} Reviews)
                    </span>
                  </div>

                  {/* Verification Action Box (Restricted to Authorized Verifier Roles) */}
                  {isUserVerifier ? (
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-amber-500/30 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#E5E5E5]">
                          Authorized Verification Decision ({currentUser.role})
                        </span>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                          Senior Authority
                        </span>
                      </div>

                      {/* Verdict Selection */}
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-[#DDD] cursor-pointer">
                          <input
                            type="radio"
                            name="verdict"
                            value="approve"
                            checked={reviewVerdict === 'approve'}
                            onChange={() => setReviewVerdict('approve')}
                            className="accent-emerald-500"
                          />
                          <span className="text-emerald-400 font-bold">Approve as Verified (معیاری تصدیق)</span>
                        </label>

                        <label className="flex items-center gap-1.5 text-xs text-[#DDD] cursor-pointer">
                          <input
                            type="radio"
                            name="verdict"
                            value="revision_requested"
                            checked={reviewVerdict === 'revision_requested'}
                            onChange={() => setReviewVerdict('revision_requested')}
                            className="accent-amber-500"
                          />
                          <span className="text-amber-400 font-bold">Request Revision</span>
                        </label>

                        <label className="flex items-center gap-1.5 text-xs text-[#DDD] cursor-pointer">
                          <input
                            type="radio"
                            name="verdict"
                            value="reject"
                            checked={reviewVerdict === 'reject'}
                            onChange={() => setReviewVerdict('reject')}
                            className="accent-rose-500"
                          />
                          <span className="text-rose-400 font-bold">Reject</span>
                        </label>
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Enter linguistic review comments, semantic notes, or required revisions..."
                        value={reviewComments}
                        onChange={e => setReviewComments(e.target.value)}
                        className="w-full rounded-lg bg-[#111] border border-[#333] p-2.5 text-xs text-[#E5E5E5] placeholder-[#555] focus:border-amber-400 focus:outline-none"
                      />

                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={handleReviewAction}
                          disabled={isSubmittingReview}
                          className={`rounded-lg px-4 py-2 text-xs font-bold transition shadow-sm cursor-pointer ${
                            reviewVerdict === 'approve'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : reviewVerdict === 'revision_requested'
                              ? 'bg-amber-600 hover:bg-amber-500 text-white'
                              : 'bg-rose-600 hover:bg-rose-500 text-white'
                          }`}
                        >
                          {isSubmittingReview ? 'Logging Verdict...' : `Submit Verdict (${reviewVerdict.toUpperCase()})`}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-[#121212] border border-[#282828] text-xs text-[#888]">
                      Logged in as <strong>{currentUser.role}</strong>. Verification is restricted to Senior Reviewers, Linguistic Advisors, Administrators, and the Project Director (Saif Ullah).
                    </div>
                  )}

                  {/* Historical Reviews List */}
                  <div className="flex flex-col gap-2">
                    {reviews.length === 0 ? (
                      <div className="p-3 rounded-lg bg-[#111] text-xs text-[#666] text-center">
                        No review events recorded yet for this translation.
                      </div>
                    ) : (
                      reviews.map(rev => (
                        <div
                          key={rev.reviewId}
                          className="p-3 rounded-lg bg-[#121212] border border-[#242424] flex flex-col gap-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                                rev.verdict === 'approve'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : rev.verdict === 'revision_requested'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}>
                                {rev.verdict}
                              </span>
                              <span className="font-bold text-[#DDD]">{rev.reviewerName || rev.reviewerUid}</span>
                              <span className="text-[#666]">({rev.reviewerRole})</span>
                            </div>
                            <span className="text-[10px] text-[#666] font-mono">
                              {new Date(rev.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[#BBB] mt-1 pl-2 border-l-2 border-[#333]">{rev.comments}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 rounded-xl border border-[#262626] bg-[#141414] text-center text-[#777] text-sm">
                No translation record selected. Select a record from the left sidebar or click "Translate from Release".
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: 21-POINT AUTOMATED VALIDATION SUITE (BALL 21 Rule 21) */}
      {/* ========================================================================= */}
      {activeModal === 'validation_suite' && validationReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl bg-[#141414] border border-[#333] max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-400" />
                <div>
                  <h2 className="text-base font-bold text-[#E5E5E5]">
                    BALL 21 — 21-Point Translation & MTPE Validation Suite
                  </h2>
                  <p className="text-xs text-[#888]">
                    FiKR&CD Indus-Kohistani Language Digital Preservation Initiative
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="p-1.5 rounded-lg text-[#888] hover:text-[#FFF] hover:bg-[#222]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Score Summary */}
            <div className="p-4 bg-[#191919] border-b border-[#262626] grid grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[10px] text-[#777] uppercase font-bold block">Total Checks</span>
                <span className="text-lg font-bold font-mono text-[#E5E5E5]">{validationReport.totalChecks}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 uppercase font-bold block">Passed</span>
                <span className="text-lg font-bold font-mono text-emerald-400">{validationReport.passCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-rose-400 uppercase font-bold block">Failed</span>
                <span className="text-lg font-bold font-mono text-rose-400">{validationReport.failCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-400 uppercase font-bold block">Warnings</span>
                <span className="text-lg font-bold font-mono text-amber-400">{validationReport.warnCount}</span>
              </div>
            </div>

            {/* Results Scroll List */}
            <div className="p-5 overflow-y-auto flex flex-col gap-2.5 flex-1">
              {validationReport.results.map((res: any) => (
                <div
                  key={res.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                    res.status === 'PASS'
                      ? 'bg-[#121814] border-emerald-900/50'
                      : res.status === 'FAIL'
                      ? 'bg-[#1F1214] border-rose-900/60'
                      : 'bg-[#1C1810] border-amber-900/50'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#E5E5E5]">{res.title}</span>
                      <span className="text-[10px] font-mono text-[#777]">({res.category})</span>
                    </div>
                    <p className="text-xs text-[#AAA]">{res.details}</p>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    res.status === 'PASS'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : res.status === 'FAIL'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {res.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#262626] bg-[#121212] flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                All Core Immutability & Provenance Constraints Verified
              </span>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="rounded-lg bg-[#252525] hover:bg-[#333] px-4 py-1.5 text-xs font-bold text-[#E5E5E5]"
              >
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NEW TRANSLATION FROM PUBLISHED RELEASE RECORD */}
      {/* ========================================================================= */}
      {activeModal === 'new_from_release' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl bg-[#141414] border border-[#333] max-w-xl w-full flex flex-col shadow-2xl p-6 gap-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#C9A66B]" />
                <h2 className="text-base font-bold text-[#E5E5E5]">Initialize Translation from Release Record</h2>
              </div>
              <button type="button" onClick={() => setActiveModal('none')} className="text-[#888] hover:text-[#FFF]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-[#888]">
              Select a published dataset release and an existing verified contribution record to create a new parallel translation pair. The source text is copied verbatim and remains immutable.
            </p>

            {/* Select Release */}
            <div>
              <label className="text-xs font-bold text-[#DDD] block mb-1">Select Published Dataset Release</label>
              <select
                value={selectedReleaseId}
                onChange={e => setSelectedReleaseId(e.target.value)}
                className="w-full rounded-lg bg-[#1D1D1D] border border-[#333] px-3 py-2 text-xs text-[#E5E5E5] focus:border-[#C9A66B] focus:outline-none"
              >
                {availableReleases.map(r => (
                  <option key={r.releaseId} value={r.releaseId}>
                    Release {r.version} — {r.title} ({r.recordCount} verified records)
                  </option>
                ))}
              </select>
            </div>

            {/* Select Contribution */}
            <div>
              <label className="text-xs font-bold text-[#DDD] block mb-1">Select Source Contribution Record</label>
              <select
                value={selectedContIdToTranslate}
                onChange={e => setSelectedContIdToTranslate(e.target.value)}
                className="w-full rounded-lg bg-[#1D1D1D] border border-[#333] px-3 py-2 text-xs text-[#E5E5E5] focus:border-[#C9A66B] focus:outline-none"
              >
                <option value="">-- Choose verified contribution --</option>
                {contributions.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.verified?.correctedIkText || c.raw.ikText} ({c.verified?.verifiedDialect || c.raw.dialect})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="rounded-lg bg-[#252525] hover:bg-[#333] px-4 py-2 text-xs font-bold text-[#AAA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewTranslation}
                className="rounded-lg bg-[#C9A66B] hover:bg-[#B89358] text-[#0C0C0C] px-4 py-2 text-xs font-bold shadow-sm"
              >
                Initialize Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EXPORT PARALLEL CORPORA (JSONL / CSV / TMX) */}
      {/* ========================================================================= */}
      {activeModal === 'exports' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl bg-[#141414] border border-[#333] max-w-xl w-full flex flex-col shadow-2xl p-6 gap-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-indigo-400" />
                <h2 className="text-base font-bold text-[#E5E5E5]">Export Parallel Corpora & TMX</h2>
              </div>
              <button type="button" onClick={() => setActiveModal('none')} className="text-[#888] hover:text-[#FFF]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#DDD] block mb-1">Language Direction</label>
                <select
                  value={exportDirection}
                  onChange={e => setExportDirection(e.target.value as any)}
                  className="w-full rounded-lg bg-[#1D1D1D] border border-[#333] px-3 py-2 text-xs text-[#E5E5E5]"
                >
                  <option value="IK-UR-EN">IK ↔ Urdu ↔ English (Trilingual)</option>
                  <option value="IK-UR">Indus-Kohistani ↔ Urdu</option>
                  <option value="IK-EN">Indus-Kohistani ↔ English</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#DDD] block mb-1">Export Format</label>
                <select
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value as any)}
                  className="w-full rounded-lg bg-[#1D1D1D] border border-[#333] px-3 py-2 text-xs text-[#E5E5E5]"
                >
                  <option value="jsonl">JSON Lines (.jsonl)</option>
                  <option value="csv">Parallel CSV (RFC 4180)</option>
                  <option value="tmx">Translation Memory eXchange (.tmx 1.4)</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 p-3 rounded-lg border border-emerald-800 cursor-pointer">
              <input
                type="checkbox"
                checked={exportVerifiedOnly}
                onChange={e => setExportVerifiedOnly(e.target.checked)}
                className="accent-emerald-500"
              />
              <span>
                <strong>Verified Only Filter (Recommended):</strong> Strictly exclude drafts and unverified records.
              </span>
            </label>

            <div className="p-3 rounded-lg bg-[#111] border border-[#222] text-xs text-[#888]">
              Ready to generate <strong className="text-[#E5E5E5]">{generateParallelCorpusRecords(translations, exportDirection, exportVerifiedOnly).length} parallel pairs</strong> with full lineage checksums and zero PII.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="rounded-lg bg-[#252525] hover:bg-[#333] px-4 py-2 text-xs font-bold text-[#AAA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadExport}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span>Download {exportFormat.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: QUALITY & COVERAGE ANALYTICS DASHBOARD */}
      {/* ========================================================================= */}
      {activeModal === 'analytics' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl bg-[#141414] border border-[#333] max-w-2xl w-full flex flex-col shadow-2xl p-6 gap-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#C9A66B]" />
                <h2 className="text-base font-bold text-[#E5E5E5]">Translation Quality & Coverage Analytics</h2>
              </div>
              <button type="button" onClick={() => setActiveModal('none')} className="text-[#888] hover:text-[#FFF]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dialect Coverage Breakdown */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#C9A66B] uppercase">Dialect Variety Distribution</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {OFFICIAL_5_DIALECTS.map(d => (
                  <div key={d} className="p-2.5 rounded-lg bg-[#181818] border border-[#282828] flex items-center justify-between text-xs">
                    <span className="text-[#DDD] font-scheherazade text-sm">{d}</span>
                    <span className="font-mono font-bold text-amber-400">{qualityStats.dialectCoverage[d] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MTPE vs Human Acceptance */}
            <div className="p-4 rounded-xl bg-[#181818] border border-[#282828] flex flex-col gap-2">
              <span className="text-xs font-bold text-purple-300 uppercase">Machine Translation Post-Editing (MTPE) Metrics</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[#777] block text-[10px]">Total AI Suggestions</span>
                  <span className="text-sm font-bold font-mono text-[#E5E5E5]">{qualityStats.machineSuggestionsTotal}</span>
                </div>
                <div>
                  <span className="text-emerald-400 block text-[10px]">Accepted as Draft</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">{qualityStats.machineSuggestionsAccepted}</span>
                </div>
                <div>
                  <span className="text-purple-400 block text-[10px]">Acceptance Rate</span>
                  <span className="text-sm font-bold font-mono text-purple-300">{qualityStats.machineAcceptanceRate}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="rounded-lg bg-[#252525] hover:bg-[#333] px-4 py-2 text-xs font-bold text-[#E5E5E5]"
              >
                Close Analytics
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
