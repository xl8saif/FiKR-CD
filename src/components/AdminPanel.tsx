import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Coins, 
  Download, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  FileJson, 
  Layers, 
  BarChart3, 
  Mic, 
  ShieldCheck,
  Building2,
  Users,
  Keyboard,
  Plus,
  Trash2,
  RotateCcw,
  Lock,
  Filter,
  Eye,
  Calendar,
  UserCheck,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  Info,
  Activity,
  GitBranch,
  Linkedin,
  ExternalLink
} from 'lucide-react';
import { Contribution, RewardConfig, UserProfile, SpecializedIkCharacter, UserRole } from '../types';
import { DIALECTS, OFFICIAL_IK_SPECIAL_CHARS, CONTRIBUTION_CATEGORIES, getDialectDisplayName } from '../data/initialData';
import { PROJECT_DIRECTOR_LINKEDIN } from '../services/speechAiService';
import { LinkedInIconLink } from './LinkedInIconLink';
import { 
  saveRewardConfig, 
  resetToDemoData, 
  getStoredSpecialChars, 
  saveSpecialChars, 
  resetSpecialChars 
} from '../services/storage';
import { 
  exportFull3LayerJson, 
  exportVerifiedOnlyJson, 
  exportParallelTrilingualCsv, 
  exportJsonlNlpRag, 
  exportSpeechCorpusManifest,
  filterContributionsForExport,
  ExportFilterCriteria
} from '../services/exportService';
import { runFirestoreDiagnostics } from '../services/firebaseCorpus';
import { firestoreDatabaseId } from '../services/firebase';

interface AdminPanelProps {
  contributions: Contribution[];
  rewardConfig: RewardConfig;
  currentUser: UserProfile;
  onConfigUpdated: (config: RewardConfig) => void;
  onDataReset: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  contributions,
  rewardConfig,
  currentUser,
  onConfigUpdated,
  onDataReset,
  onNavigateTab
}) => {
  // Access Control: Only Administrator and Project Director
  const isAuthorized = currentUser.role === 'administrator' || currentUser.role === 'project_director';

  // Export Filter State
  const [filters, setFilters] = useState<ExportFilterCriteria>({
    dialect: 'all',
    category: 'all',
    verificationStatus: 'all',
    audioAvailability: 'all',
    startDate: '',
    endDate: '',
    contributorId: 'all',
    verifiedOnly: false
  });

  const [showProvenancePreview, setShowProvenancePreview] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Configuration State
  const [cfg, setCfg] = useState<RewardConfig>(rewardConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Specialized IK Characters Management
  const [specialChars, setSpecialChars] = useState<SpecializedIkCharacter[]>([]);
  const [charSaveSuccess, setCharSaveSuccess] = useState(false);
  const [newCharInput, setNewCharInput] = useState({
    char: '',
    name: '',
    unicode: '',
    description: ''
  });
  const [showAddChar, setShowAddChar] = useState(false);

  // Firestore Diagnostics State
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagResults, setDiagResults] = useState<{
    initialized: boolean;
    databaseId: string;
    writeSuccess: boolean;
    subcollectionSuccess: boolean;
    unicodeFidelitySuccess: boolean;
    immutabilityCheckSuccess: boolean;
    details: string[];
  } | null>(null);

  useEffect(() => {
    setSpecialChars(getStoredSpecialChars());
  }, []);

  // Filtered dataset for export metrics
  const matchingExportRecords = useMemo(() => {
    return filterContributionsForExport(contributions, filters);
  }, [contributions, filters]);

  // Unique contributors list for filter
  const uniqueContributors = useMemo(() => {
    const map = new Map<string, string>();
    contributions.forEach((c) => {
      if (c.raw?.contributorId && c.raw?.contributorName) {
        map.set(c.raw.contributorId, c.raw.contributorName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [contributions]);

  const handleRunDiagnostics = async () => {
    setDiagRunning(true);
    try {
      const results = await runFirestoreDiagnostics();
      setDiagResults(results);
    } catch (err: any) {
      setDiagResults({
        initialized: false,
        databaseId: firestoreDatabaseId || '',
        writeSuccess: false,
        subcollectionSuccess: false,
        unicodeFidelitySuccess: false,
        immutabilityCheckSuccess: false,
        details: [`Diagnostics exception: ${err?.message || err}`]
      });
    } finally {
      setDiagRunning(false);
    }
  };

  const handleSaveChars = (updated: SpecializedIkCharacter[]) => {
    setSpecialChars(updated);
    saveSpecialChars(updated);
    setCharSaveSuccess(true);
    setTimeout(() => setCharSaveSuccess(false), 3000);
  };

  const handleResetChars = () => {
    const defaultChars = resetSpecialChars();
    setSpecialChars(defaultChars);
    setCharSaveSuccess(true);
    setTimeout(() => setCharSaveSuccess(false), 3000);
  };

  const handleAddChar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharInput.char.trim()) return;
    const updated = [...specialChars, {
      char: newCharInput.char.trim(),
      name: newCharInput.name.trim() || 'Custom IK Glyph',
      unicode: newCharInput.unicode.trim() || `U+${newCharInput.char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
      description: newCharInput.description.trim() || 'Administrator-defined character'
    }];
    handleSaveChars(updated);
    setNewCharInput({ char: '', name: '', unicode: '', description: '' });
    setShowAddChar(false);
  };

  const handleRemoveChar = (charToDelete: string) => {
    const updated = specialChars.filter(c => c.char !== charToDelete);
    handleSaveChars(updated);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveRewardConfig(cfg);
    onConfigUpdated(cfg);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetData = () => {
    resetToDemoData();
    onDataReset();
    setResetConfirm(false);
  };

  const triggerExportWithNotice = (exportFn: () => void, exportName: string) => {
    exportFn();
    setExportNotice(`Exported ${matchingExportRecords.length} records in ${exportName} format with verified provenance.`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Dialect Distribution Calculations (across the 5 official varieties)
  const dialectCounts = DIALECTS.map(d => {
    const total = contributions.filter(c => {
      const active = (c.verified?.verifiedDialect || c.raw?.dialect || '').toLowerCase();
      return (
        active.includes(d.id.toLowerCase()) ||
        active.includes(d.nameUr.toLowerCase()) ||
        (d.nameEn && active.includes(d.nameEn.toLowerCase()))
      );
    }).length;
    const verified = contributions.filter(c => {
      const active = (c.verified?.verifiedDialect || c.raw?.dialect || '').toLowerCase();
      const match = (
        active.includes(d.id.toLowerCase()) ||
        active.includes(d.nameUr.toLowerCase()) ||
        (d.nameEn && active.includes(d.nameEn.toLowerCase()))
      );
      return match && c.derived?.isCorpusEligible;
    }).length;
    return { ...d, total, verified };
  });

  const totalTokens = contributions
    .filter(c => c.derived?.isCorpusEligible)
    .reduce((acc, c) => acc + (c.derived?.tokenCount || 0), 0);

  const totalAudioSec = contributions
    .filter(c => c.derived?.hasAudio || c.raw?.audioUrl)
    .reduce((acc, c) => acc + (c.raw?.audioDurationSec || 3), 0);

  // -------------------------------------------------------------
  // GUARD: UNAUTHORIZED ROLE ACCESS SHIELD
  // -------------------------------------------------------------
  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-3xl bg-[#111111] p-8 md:p-12 text-center border border-amber-800/40 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-40 w-40 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-950/40 border border-amber-700/50 text-amber-400">
            <Lock className="h-10 w-10" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-amber-950/60 px-3.5 py-1 text-xs font-bold text-amber-300 border border-amber-700/40 mb-3">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
            Governance Access Restricted (انتظامی رسائی ممنوع)
          </div>

          <h2 className="text-2xl font-extrabold text-[#F5F5F5] tracking-tight sm:text-3xl">
            Administrator & Project Director Governance Only
          </h2>
          <p className="mt-2 text-sm font-kohistani text-[#C9A66B] font-bold" dir="rtl">
            صرف پراجیکٹ ڈائریکٹر اور مجاز ایڈمنسٹریٹر کی رسائی ہے
          </p>

          <div className="mx-auto mt-4 max-w-xl text-xs text-[#999] space-y-2 text-left bg-[#161616] p-4 rounded-2xl border border-[#262626]">
            <p className="font-semibold text-[#E5E5E5] flex items-center gap-1.5">
              <Info className="h-4 w-4 text-[#C9A66B]" />
              Role Permission Notice:
            </p>
            <p>
              Your active persona is currently assigned the role of <strong className="text-amber-300 capitalize">{currentUser.role.replace('_', ' ')}</strong> ({currentUser.name}).
            </p>
            <p>
              Under FiKR&CD preservation bylaws, contributor compensation rates, official orthography modification, database integrity diagnostics, and unrestricted corpus data exports are restricted strictly to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#CCC] pl-2">
              <li><strong className="text-[#F5F5F5]">Project Director</strong> (Saif Ullah)</li>
              <li><strong className="text-[#F5F5F5]">System Administrators</strong></li>
            </ul>
            <p className="text-[11px] text-[#777] pt-1">
              To test administrative controls in this environment, switch to the <em>Saif Ullah (Project Director)</em> or <em>System Administrator</em> testing persona using the persona switcher at the top right of the header.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab ? onNavigateTab('contribute') : null}
              className="flex items-center gap-2 rounded-xl bg-[#C9A66B] px-5 py-2.5 text-xs font-bold text-[#0C0C0C] hover:bg-[#D4B582] transition cursor-pointer"
            >
              Go to Contribution Portal <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab ? onNavigateTab('verification_queue') : null}
              className="flex items-center gap-2 rounded-xl bg-[#1A1A1A] px-5 py-2.5 text-xs font-semibold text-[#DDD] hover:bg-[#252525] border border-[#333] transition cursor-pointer"
            >
              Go to Reviewer Workspace
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab ? onNavigateTab('corpus_explorer') : null}
              className="flex items-center gap-2 rounded-xl bg-[#1A1A1A] px-5 py-2.5 text-xs font-semibold text-[#DDD] hover:bg-[#252525] border border-[#333] transition cursor-pointer"
            >
              Explore Public Corpus
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHORIZED VIEW: FULL GOVERNANCE & EXPORT HUB
  // -------------------------------------------------------------
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Title & Governance Banner */}
      <div className="rounded-3xl bg-[#111111] p-6 sm:p-8 shadow-sm border border-[#222] mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-[#C9A66B]/20 px-3 py-0.5 text-xs font-bold text-[#D4B582] border border-[#C9A66B]/30">
                FiKR&CD — Governance & Export Hub (BALL 16)
              </span>
              <span className="text-xs text-[#888] font-mono-code flex items-center gap-2">
                <span>Project Director: <strong className="text-[#E5E5E5]">Saif Ullah</strong></span>
                <LinkedInIconLink id="admin-director-linkedin-link" size={20} />
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-700/40">
                <ShieldCheck className="h-3 w-3" />
                Authorized: {currentUser.role.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
              Indus-Kohistani Language Digital Preservation & Technology Initiative
            </h2>
            <p className="mt-1.5 text-xl sm:text-2xl font-kohistani text-[#D4B582] font-semibold leading-relaxed tracking-wide sm:[word-spacing:0.12em]" dir="rtl">
              اِنڈَس کُستَئی ژِیباں ڈیجیٹل سَنْبَھلتُب اَں تَکْنِیْکی مَنْصُوبَہ
            </p>
            <p className="mt-1 text-xs text-[#999] max-w-3xl">
              Comprehensive administrative governance: execute filtered multi-format corpus exports (3-Layer JSON, Canonical JSON, Parallel CSV, NLP JSONL, Speech Manifest), manage orthography, audit Firestore diagnostics, and configure contributor compensation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateTab && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateTab('quality_dashboard' as any)}
                  className="flex items-center gap-1.5 rounded-2xl bg-[#1C1C1C] hover:bg-[#282828] px-3.5 py-3 text-xs font-bold text-[#E5E5E5] border border-[#333] transition cursor-pointer"
                >
                  <Activity className="h-4 w-4 text-[#C9A66B]" />
                  <span>Quality (BALL 18) →</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('dataset_releases' as any)}
                  className="flex items-center gap-1.5 rounded-2xl bg-[#C9A66B]/15 hover:bg-[#C9A66B]/25 px-3.5 py-3 text-xs font-bold text-[#D4B582] border border-[#C9A66B]/40 transition cursor-pointer"
                >
                  <GitBranch className="h-4 w-4 text-[#C9A66B]" />
                  <span>Releases (BALL 19) →</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('nlp_workspace' as any)}
                  className="flex items-center gap-1.5 rounded-2xl bg-indigo-950/40 hover:bg-indigo-900/50 px-3.5 py-3 text-xs font-bold text-indigo-300 border border-indigo-700/50 transition cursor-pointer"
                >
                  <Database className="h-4 w-4 text-indigo-400" />
                  <span>AI/NLP Pipeline (BALL 20) →</span>
                </button>
              </>
            )}

            <div className="rounded-2xl bg-[#14221A] p-3.5 border border-emerald-900/60 text-center">
              <span className="text-xl font-black text-emerald-300 font-mono-code">{contributions.length}</span>
              <span className="block text-[10px] font-bold text-emerald-400 uppercase">Total Archive Items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Feedback Toast */}
      {exportNotice && (
        <div className="mb-6 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 p-4 flex items-center justify-between text-xs text-emerald-200 shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="text-emerald-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: DEDICATED DATA EXPORT HUB WITH FILTERS & PROVENANCE (BALL 16 CORE) */}
      <div className="rounded-3xl bg-[#111111] p-6 sm:p-8 shadow-sm border border-[#222] mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222] mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[#C9A66B]" />
              <h3 className="text-base font-extrabold text-[#F5F5F5]">
                Preservation & Technology Data Export Hub
              </h3>
              <span className="rounded-full bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-700/40">
                5 Regulated Export Formats
              </span>
            </div>
            <p className="text-xs text-[#888] mt-1">
              Generate read-only, non-destructive snapshots for Machine Translation, Speech Recognition (ASR), NLP, RAG, and Lexicography. Every export includes immutable provenance metadata.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowProvenancePreview(!showProvenancePreview)}
              className="flex items-center gap-1.5 rounded-xl bg-[#1C1C1C] px-3.5 py-2 text-xs font-semibold text-[#DDD] hover:bg-[#252525] border border-[#333] transition cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-[#C9A66B]" />
              {showProvenancePreview ? 'Hide Provenance Envelope' : 'Inspect Provenance Envelope'}
            </button>
          </div>
        </div>

        {/* PROVENANCE METADATA PREVIEW MODAL/DRAWER */}
        {showProvenancePreview && (
          <div className="mb-6 rounded-2xl bg-[#0F0F0F] p-4 border border-[#333] text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#222]">
              <span className="font-bold text-[#E5E5E5] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Standard FiKR&CD Provenance Envelope (Included with all exports):
              </span>
              <span className="text-[10px] font-mono text-[#888]">ISO 8601 Compliance</span>
            </div>
            <pre className="text-[11px] font-mono text-[#AAA] bg-[#161616] p-3 rounded-xl border border-[#262626] overflow-x-auto max-h-48">
{JSON.stringify({
  exportMetadata: {
    exportTimestamp: new Date().toISOString(),
    datasetType: 'full_3layer_json | verified_only_json | parallel_trilingual_csv | jsonl_nlp_rag | speech_corpus_manifest',
    projectVersion: 'FiKR&CD Indus-Kohistani Digital Preservation Platform v1.6.0',
    totalRecords: matchingExportRecords.length,
    filterCriteria: filters,
    exportingAdministrator: {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role
    },
    sourceLayer: 'RAW + VERIFIED + DERIVED | VERIFIED_CANONICAL | PARALLEL_TEXT | SPEECH_MANIFEST',
    organization: 'FiKR&CD — Forum for Indus-Kohistani Research & Culture Development',
    projectDirector: 'Saif Ullah',
    license: 'CC-BY-NC-4.0 (Creative Commons Non-Commercial International)',
    safetyNotice: 'Linguistic corpus export only. Contributor private credentials and financial reward data are strictly excluded.',
    computationalDerivedNotice: 'DERIVED section contains computational structural metadata only.'
  }
}, null, 2)}
            </pre>
          </div>
        )}

        {/* INTERACTIVE EXPORT FILTER CONTROLS */}
        <div className="rounded-2xl bg-[#161616] p-4 sm:p-5 border border-[#262626] mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#C9A66B]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#E5E5E5]">
                Export Filter Criteria (فلٹر کے اختیارات)
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1F1F1F] px-3 py-1 text-xs font-mono font-bold text-[#D4B582] border border-[#333]">
                <span>Matching Records:</span>
                <strong className="text-white">{matchingExportRecords.length}</strong> / {contributions.length}
              </span>
              {(filters.dialect !== 'all' || filters.category !== 'all' || filters.verificationStatus !== 'all' || filters.audioAvailability !== 'all' || filters.contributorId !== 'all' || filters.startDate || filters.endDate || filters.verifiedOnly) && (
                <button
                  type="button"
                  onClick={() => setFilters({
                    dialect: 'all',
                    category: 'all',
                    verificationStatus: 'all',
                    audioAvailability: 'all',
                    startDate: '',
                    endDate: '',
                    contributorId: 'all',
                    verifiedOnly: false
                  })}
                  className="text-[11px] text-[#888] hover:text-[#CCC] underline cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filter 1: Dialect */}
            <div>
              <label className="text-[11px] font-semibold text-[#888] block mb-1">
                Dialect Variety (بولی)
              </label>
              <select
                value={filters.dialect}
                onChange={(e) => setFilters({ ...filters, dialect: e.target.value })}
                className="w-full rounded-xl border border-[#333] p-2 text-xs font-medium text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
              >
                <option value="all">All 5 Dialects (تمام بولیاں)</option>
                {DIALECTS.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nameUr} {d.nameEn ? `(${d.nameEn})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: Category */}
            <div>
              <label className="text-[11px] font-semibold text-[#888] block mb-1">
                Category / Type (قسم)
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full rounded-xl border border-[#333] p-2 text-xs font-medium text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
              >
                <option value="all">All Categories (تمام اصناف)</option>
                {CONTRIBUTION_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nameUr} ({c.nameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Verification Status */}
            <div>
              <label className="text-[11px] font-semibold text-[#888] block mb-1">
                Verification Status (حیثیت)
              </label>
              <select
                value={filters.verificationStatus}
                onChange={(e) => setFilters({ ...filters, verificationStatus: e.target.value })}
                className="w-full rounded-xl border border-[#333] p-2 text-xs font-medium text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
              >
                <option value="all">All Statuses (تمام درجات)</option>
                <option value="approved">Approved Canonical (منظور شدہ)</option>
                <option value="corrected">Corrected by Reviewer (تصحیح شدہ)</option>
                <option value="pending_review">Pending Review (زیرِ جائزہ)</option>
                <option value="escalated_to_senior">Escalated to Senior (سینیئر کو بھیجا گیا)</option>
                <option value="rejected">Rejected (مسترد)</option>
              </select>
            </div>

            {/* Filter 4: Audio Availability */}
            <div>
              <label className="text-[11px] font-semibold text-[#888] block mb-1">
                Audio Recording (صوتی ریکارڈنگ)
              </label>
              <select
                value={filters.audioAvailability}
                onChange={(e) => setFilters({ ...filters, audioAvailability: e.target.value as any })}
                className="w-full rounded-xl border border-[#333] p-2 text-xs font-medium text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
              >
                <option value="all">All Items (تمام ریکارڈز)</option>
                <option value="audio_only">With Audio Only (صوتی ریکارڈنگ والے)</option>
                <option value="text_only">Text Only / No Audio (صرف تحریری)</option>
              </select>
            </div>

            {/* Filter 5: Contributor */}
            <div>
              <label className="text-[11px] font-semibold text-[#888] block mb-1">
                Contributor (معاون)
              </label>
              <select
                value={filters.contributorId}
                onChange={(e) => setFilters({ ...filters, contributorId: e.target.value })}
                className="w-full rounded-xl border border-[#333] p-2 text-xs font-medium text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
              >
                <option value="all">All Contributors (تمام معاونین)</option>
                {uniqueContributors.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Filter 6: Date Range From */}
            <div>
              <label className="text-[11px] font-semibold text-[#888] block mb-1">
                From Date (تاریخ سے)
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full rounded-xl border border-[#333] p-2 text-xs font-medium text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
              />
            </div>

            {/* Filter 7: Date Range To */}
            <div>
              <label className="text-[11px] font-semibold text-[#888] block mb-1">
                To Date (تاریخ تک)
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full rounded-xl border border-[#333] p-2 text-xs font-medium text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
              />
            </div>

            {/* Filter 8: Verified Only Toggle */}
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 rounded-xl bg-[#1A1A1A] p-2.5 border border-[#333] text-xs font-bold text-[#E5E5E5] cursor-pointer select-none w-full">
                <input
                  type="checkbox"
                  checked={Boolean(filters.verifiedOnly)}
                  onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                  className="h-4 w-4 rounded border-[#333] bg-[#111] text-[#C9A66B] focus:ring-[#C9A66B]"
                />
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Verified Canonical Only
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 5 REGULATED EXPORT CARDS (BALL 16 MANDATES) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Format 1: FULL 3-LAYER JSON */}
          <div className="rounded-2xl bg-[#161616] p-5 border border-[#262626] flex flex-col justify-between hover:border-[#383838] transition">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="rounded bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-700/40">
                  Full Layer Architecture
                </span>
                <span className="text-[10px] font-mono text-[#777]">.JSON</span>
              </div>
              <div className="flex items-center gap-2 text-[#E5E5E5] font-bold text-sm">
                <FileJson className="h-4 w-4 text-emerald-400" />
                1. Full 3-Layer JSON
              </div>
              <p className="text-xs text-[#888] mt-1.5">
                Complete preservation structure with verbatim RAW submissions, VERIFIED human reviews, and non-hallucinatory DERIVED computational metrics.
              </p>
              <div className="mt-3 text-[11px] text-[#AAA] font-mono bg-[#111] p-2 rounded-lg border border-[#222]">
                Includes: RAW + VERIFIED + DERIVED + Provenance Envelope
              </div>
            </div>
            <button
              type="button"
              disabled={matchingExportRecords.length === 0}
              onClick={() => triggerExportWithNotice(() => exportFull3LayerJson(contributions, filters, currentUser), 'Full 3-Layer JSON')}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-[#222] px-3.5 py-2.5 text-xs font-bold text-[#E5E5E5] hover:bg-[#333] hover:text-white transition border border-[#333] cursor-pointer disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5 text-[#C9A66B]" /> Download Full 3-Layer JSON ({matchingExportRecords.length})
            </button>
          </div>

          {/* Format 2: VERIFIED-ONLY CANONICAL JSON */}
          <div className="rounded-2xl bg-[#161616] p-5 border border-[#262626] flex flex-col justify-between hover:border-[#383838] transition">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="rounded bg-[#C9A66B]/20 px-2 py-0.5 text-[10px] font-bold text-[#D4B582] border border-[#C9A66B]/30">
                  Canonical Lexicon
                </span>
                <span className="text-[10px] font-mono text-[#777]">.JSON</span>
              </div>
              <div className="flex items-center gap-2 text-[#E5E5E5] font-bold text-sm">
                <FileJson className="h-4 w-4 text-[#C9A66B]" />
                2. Verified-Only Canonical JSON
              </div>
              <p className="text-xs text-[#888] mt-1.5">
                Strictly linguistically approved and custodian-certified entries. Clean lexicon ready for academic publication, dictionaries, and research.
              </p>
              <div className="mt-3 text-[11px] text-[#AAA] font-mono bg-[#111] p-2 rounded-lg border border-[#222]">
                Includes: Headwords, Phonetics, Definitions, POS, Reviewers
              </div>
            </div>
            <button
              type="button"
              disabled={matchingExportRecords.length === 0}
              onClick={() => triggerExportWithNotice(() => exportVerifiedOnlyJson(contributions, filters, currentUser), 'Verified-Only JSON')}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-[#C9A66B] px-3.5 py-2.5 text-xs font-bold text-[#0C0C0C] hover:bg-[#D4B582] transition cursor-pointer disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" /> Download Verified JSON ({matchingExportRecords.filter(c => c.verified?.status === 'approved' || c.verified?.status === 'corrected').length})
            </button>
          </div>

          {/* Format 3: PARALLEL TRILINGUAL CSV */}
          <div className="rounded-2xl bg-[#161616] p-5 border border-[#262626] flex flex-col justify-between hover:border-[#383838] transition">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="rounded bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-700/40">
                  Machine Translation
                </span>
                <span className="text-[10px] font-mono text-[#777]">.CSV</span>
              </div>
              <div className="flex items-center gap-2 text-[#E5E5E5] font-bold text-sm">
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                3. Parallel Trilingual CSV
              </div>
              <p className="text-xs text-[#888] mt-1.5">
                Standardized 8-column parallel corpus with confidence scoring for translation models, linguistics tables, and spreadsheets.
              </p>
              <div className="mt-3 text-[10px] text-[#AAA] font-mono bg-[#111] p-2 rounded-lg border border-[#222] overflow-x-auto">
                Cols: contributionId, IK, Urdu, English, category, dialect, status, confidence
              </div>
            </div>
            <button
              type="button"
              disabled={matchingExportRecords.length === 0}
              onClick={() => triggerExportWithNotice(() => exportParallelTrilingualCsv(contributions, filters, currentUser), 'Parallel Trilingual CSV')}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-900/80 px-3.5 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-800 transition border border-emerald-700/50 cursor-pointer disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" /> Download Parallel CSV ({matchingExportRecords.length})
            </button>
          </div>

          {/* Format 4: JSONL FOR NLP / RAG / LLM */}
          <div className="rounded-2xl bg-[#161616] p-5 border border-[#262626] flex flex-col justify-between hover:border-[#383838] transition">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="rounded bg-indigo-950/60 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-700/40">
                  AI Fine-Tuning & RAG
                </span>
                <span className="text-[10px] font-mono text-[#777]">.JSONL</span>
              </div>
              <div className="flex items-center gap-2 text-[#E5E5E5] font-bold text-sm">
                <Layers className="h-4 w-4 text-indigo-400" />
                4. JSONL (NLP / RAG / LLM)
              </div>
              <p className="text-xs text-[#888] mt-1.5">
                One JSON object per line. Designed for fine-tuning Large Language Models, RAG vector ingestion, embeddings, and tokenizer training.
              </p>
              <div className="mt-3 text-[11px] text-[#AAA] font-mono bg-[#111] p-2 rounded-lg border border-[#222]">
                Format: prompt, completion, ik_text, translations, dialect_name
              </div>
            </div>
            <button
              type="button"
              disabled={matchingExportRecords.length === 0}
              onClick={() => triggerExportWithNotice(() => exportJsonlNlpRag(contributions, filters, currentUser), 'JSONL')}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-900/80 px-3.5 py-2.5 text-xs font-bold text-indigo-200 hover:bg-indigo-800 transition border border-indigo-700/50 cursor-pointer disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" /> Download JSONL ({matchingExportRecords.length})
            </button>
          </div>

          {/* Format 5: SPEECH CORPUS MANIFEST */}
          <div className="rounded-2xl bg-[#161616] p-5 border border-[#262626] flex flex-col justify-between hover:border-[#383838] transition md:col-span-2 lg:col-span-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="rounded bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-700/40">
                  Speech Recognition & ASR
                </span>
                <span className="text-[10px] font-mono text-[#777]">.JSON Manifest</span>
              </div>
              <div className="flex items-center gap-2 text-[#E5E5E5] font-bold text-sm">
                <Mic className="h-4 w-4 text-amber-400" />
                5. Speech Corpus Manifest JSON
              </div>
              <p className="text-xs text-[#888] mt-1.5">
                Comprehensive audio recording index mapping recordings to linguistic transcripts for speech recognition, acoustic modeling, and oral preservation.
              </p>
              <div className="mt-3 text-[10px] text-[#AAA] font-mono bg-[#111] p-2 rounded-lg border border-[#222]">
                Fields: recordingId, contributionId, storagePath, duration, dialect, ikTranscription, verificationStatus
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-[#888]">
                Audio files with recordings: <strong className="text-amber-300 font-mono-code">{contributions.filter(c => c.derived?.hasAudio || c.raw?.audioUrl).length} samples</strong>
              </span>
              <button
                type="button"
                onClick={() => triggerExportWithNotice(() => exportSpeechCorpusManifest(contributions, filters, currentUser), 'Speech Manifest')}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-900/80 px-4 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-800 transition border border-amber-700/50 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> Download Speech Manifest JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: ADMINISTRATIVE CONFIGURATION & ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: 1. Configurable Reward Rates & 2. Official Orthography */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. Configurable Rewards System */}
          <div className="rounded-3xl bg-[#111111] p-6 sm:p-8 shadow-sm border border-[#222]">
            <div className="flex items-center justify-between pb-4 border-b border-[#222] mb-6">
              <div>
                <h3 className="text-base font-extrabold text-[#F5F5F5] flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#C9A66B]" />
                  Configurable Contributor Rewards Engine
                </h3>
                <p className="text-xs text-[#888]">
                  Admins can dynamically tune point and PKR payment rates. Rewards apply <strong className="text-[#CCC]">only to verified contributions</strong>.
                </p>
              </div>
              {saveSuccess && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-700/50">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Settings Saved & Recomputed!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Word Rate */}
                <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
                  <span className="text-xs font-bold text-[#E5E5E5] uppercase tracking-wider block mb-2">
                    1. Word Contribution (لَفْظ)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-[#888] block mb-1">
                        Points (pts)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={cfg.wordPoints}
                        onChange={(e) => setCfg({ ...cfg, wordPoints: Number(e.target.value) })}
                        className="w-full rounded-xl border border-[#333] p-2 text-xs font-bold font-mono-code text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#888] block mb-1">
                        Reward (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={cfg.wordRewardPkr}
                        onChange={(e) => setCfg({ ...cfg, wordRewardPkr: Number(e.target.value) })}
                        className="w-full rounded-xl border border-[#333] p-2 text-xs font-bold font-mono-code text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
                      />
                    </div>
                  </div>
                </div>

                {/* Sentence Rate */}
                <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
                  <span className="text-xs font-bold text-[#E5E5E5] uppercase tracking-wider block mb-2">
                    2. Sentence Contribution (جُمْلَہ)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-[#888] block mb-1">
                        Points (pts)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={cfg.sentencePoints}
                        onChange={(e) => setCfg({ ...cfg, sentencePoints: Number(e.target.value) })}
                        className="w-full rounded-xl border border-[#333] p-2 text-xs font-bold font-mono-code text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#888] block mb-1">
                        Reward (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={cfg.sentenceRewardPkr}
                        onChange={(e) => setCfg({ ...cfg, sentenceRewardPkr: Number(e.target.value) })}
                        className="w-full rounded-xl border border-[#333] p-2 text-xs font-bold font-mono-code text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
                      />
                    </div>
                  </div>
                </div>

                {/* Cultural Expression Rate */}
                <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
                  <span className="text-xs font-bold text-[#E5E5E5] uppercase tracking-wider block mb-2">
                    3. Cultural Expression (محاورہ / کہاوت)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-[#888] block mb-1">
                        Points (pts)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={cfg.expressionPoints}
                        onChange={(e) => setCfg({ ...cfg, expressionPoints: Number(e.target.value) })}
                        className="w-full rounded-xl border border-[#333] p-2 text-xs font-bold font-mono-code text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#888] block mb-1">
                        Reward (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={cfg.expressionRewardPkr}
                        onChange={(e) => setCfg({ ...cfg, expressionRewardPkr: Number(e.target.value) })}
                        className="w-full rounded-xl border border-[#333] p-2 text-xs font-bold font-mono-code text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
                      />
                    </div>
                  </div>
                </div>

                {/* Audio Recording Bonus */}
                <div className="rounded-2xl bg-[#14221A] p-4 border border-emerald-900/60">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block mb-2 flex items-center gap-1">
                    <Mic className="h-3.5 w-3.5 text-emerald-400" />
                    4. Spoken Audio Bonus
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-[#888] block mb-1">
                        Bonus Pts
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={cfg.audioBonusPoints}
                        onChange={(e) => setCfg({ ...cfg, audioBonusPoints: Number(e.target.value) })}
                        className="w-full rounded-xl border border-[#333] p-2 text-xs font-bold font-mono-code text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#888] block mb-1">
                        Bonus PKR
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={cfg.audioBonusRewardPkr}
                        onChange={(e) => setCfg({ ...cfg, audioBonusRewardPkr: Number(e.target.value) })}
                        className="w-full rounded-xl border border-[#333] p-2 text-xs font-bold font-mono-code text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <span className="text-xs text-[#888]">
                  Updating reward rates automatically recalculates financial tallies across all verified entries.
                </span>
                <button
                  type="submit"
                  className="rounded-xl bg-[#C9A66B] px-6 py-2.5 text-xs font-bold text-[#0C0C0C] hover:bg-[#D4B582] transition shadow-xs cursor-pointer"
                >
                  Save Reward Rates
                </button>
              </div>
            </form>
          </div>

          {/* 2. Official Indus-Kohistani Orthography & Keyboard Configuration */}
          <div className="rounded-3xl bg-[#111111] p-6 sm:p-8 shadow-sm border border-[#222]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222] mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#F5F5F5] flex items-center gap-2">
                    <Keyboard className="h-5 w-5 text-[#C9A66B]" />
                    Official IK Orthography & Virtual Keyboard Configuration
                  </h3>
                  <span className="rounded-full bg-[#C9A66B]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#D4B582] border border-[#C9A66B]/30 font-mono">
                    V1 Confirmed: 5 Glyphs
                  </span>
                </div>
                <p className="text-xs text-[#888] mt-1">
                  Confirmed specialized Indus-Kohistani Unicode characters (<strong className="text-[#E5E5E5] font-kohistani">ڇ څ ݜ ڙ ݨ</strong>). Administrators can adjust keyboard order or add/remove characters.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {charSaveSuccess && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-700/50">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Keyboard Updated!
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetChars}
                  className="flex items-center gap-1.5 rounded-xl bg-[#1C1C1C] px-3 py-1.5 text-xs font-semibold text-[#BBB] hover:text-white hover:bg-[#252525] border border-[#333] transition cursor-pointer"
                  title="Reset to confirmed official V1 characters (ڇ, څ, ݜ, ڙ, ݨ)"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to Official V1 Set
                </button>
              </div>
            </div>

            {/* List of Configured Characters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {specialChars.map((sc) => (
                <div key={sc.char + sc.unicode} className="rounded-2xl bg-[#161616] p-4 border border-[#262626] flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1F1F1F] border border-[#333] text-2xl font-bold font-kohistani text-[#C9A66B]">
                      {sc.char}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#F5F5F5]">{sc.name}</span>
                        <span className="text-[10px] font-mono text-[#888] bg-[#0F0F0F] px-1.5 py-0.5 rounded border border-[#262626]">
                          {sc.unicode}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#777] mt-0.5 line-clamp-2">
                        {sc.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveChar(sc.char)}
                    className="text-[#666] hover:text-rose-400 p-1 transition cursor-pointer"
                    title={`Remove ${sc.name} from keyboard`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Character Section */}
            {!showAddChar ? (
              <button
                type="button"
                onClick={() => setShowAddChar(true)}
                className="flex items-center gap-2 rounded-xl bg-[#1A1A1A] px-4 py-2 text-xs font-semibold text-[#D4B582] hover:bg-[#222] border border-[#333] transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Official IK Character
              </button>
            ) : (
              <form onSubmit={handleAddChar} className="rounded-2xl bg-[#161616] p-4 border border-[#2E2E2E] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                  <span className="text-xs font-bold text-[#E5E5E5]">
                    Configure New Indus-Kohistani Character
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddChar(false)}
                    className="text-xs text-[#888] hover:text-[#CCC]"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#888] block mb-1">
                      Unicode Glyph (حرف)
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={newCharInput.char}
                      onChange={(e) => setNewCharInput({ ...newCharInput, char: e.target.value })}
                      placeholder="e.g. ڇ"
                      className="w-full rounded-xl border border-[#333] p-2 text-base font-bold font-kohistani text-center text-[#F5F5F5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#888] block mb-1">
                      Character Name (نام)
                    </label>
                    <input
                      type="text"
                      value={newCharInput.name}
                      onChange={(e) => setNewCharInput({ ...newCharInput, name: e.target.value })}
                      placeholder="e.g. Tcheh"
                      className="w-full rounded-xl border border-[#333] p-2 text-xs font-semibold text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#888] block mb-1">
                      Unicode Point
                    </label>
                    <input
                      type="text"
                      value={newCharInput.unicode}
                      onChange={(e) => setNewCharInput({ ...newCharInput, unicode: e.target.value })}
                      placeholder="e.g. U+0686"
                      className="w-full rounded-xl border border-[#333] p-2 text-xs font-mono text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#888] block mb-1">
                      Linguistic Description
                    </label>
                    <input
                      type="text"
                      value={newCharInput.description}
                      onChange={(e) => setNewCharInput({ ...newCharInput, description: e.target.value })}
                      placeholder="e.g. Voiceless affricate"
                      className="w-full rounded-xl border border-[#333] p-2 text-xs font-medium text-[#E5E5E5] bg-[#1A1A1A] focus:outline-none focus:border-[#C9A66B]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-[#C9A66B] px-4 py-1.5 text-xs font-bold text-[#0C0C0C] hover:bg-[#D4B582] transition cursor-pointer"
                  >
                    Save Character to Virtual Keyboard
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Analytics & Cloud Architecture */}
        <div className="space-y-8">
          {/* Preservation & Dialect Analytics */}
          <div className="rounded-3xl bg-[#111111] p-6 shadow-sm border border-[#222]">
            <h3 className="text-base font-extrabold text-[#F5F5F5] mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              Dialect & Corpus Representation
            </h3>

            {/* Micro Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-[#161616] p-3 border border-[#262626]">
                <span className="text-[10px] text-[#888] uppercase font-semibold">Corpus Tokens</span>
                <p className="text-lg font-black text-[#F5F5F5] font-mono-code">{totalTokens}</p>
              </div>
              <div className="rounded-xl bg-[#161616] p-3 border border-[#262626]">
                <span className="text-[10px] text-[#888] uppercase font-semibold">Speech Audio</span>
                <p className="text-lg font-black text-emerald-400 font-mono-code">{totalAudioSec}s</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-[#CCC] uppercase tracking-wider block">
                Dialectal Variety Coverage (5 Varieties):
              </span>
              {dialectCounts.map(d => (
                <div key={d.id} className="text-xs">
                  <div className="flex justify-between font-medium text-[#AAA] mb-1">
                    <span>{d.nameUr} {d.nameEn ? `(${d.nameEn})` : ''}</span>
                    <span className="font-mono-code text-[#888]">{d.verified} verified / {d.total} total</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#222] overflow-hidden">
                    <div
                      className="h-full bg-[#C9A66B] rounded-full transition-all"
                      style={{ width: `${d.total > 0 ? (d.verified / contributions.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cloud Firestore Architecture & Diagnostics */}
          <div className="rounded-3xl bg-[#111111] p-6 border border-[#222] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#E5E5E5] flex items-center gap-1.5">
                <Database className="h-4 w-4 text-emerald-400" />
                Cloud Firestore Architecture
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            </div>

            <div className="rounded-xl bg-[#161616] p-3 border border-[#262626] mb-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#888]">
                <span>Project:</span>
                <span className="font-mono-code text-[#E5E5E5] text-[11px]">fikrcd-ik-digital-preservation</span>
              </div>
              <div className="flex justify-between text-[#888]">
                <span>Database:</span>
                <span className="font-mono-code text-emerald-400 text-[10px] truncate max-w-[180px]" title={firestoreDatabaseId}>
                  {firestoreDatabaseId || '(default)'}
                </span>
              </div>
              <div className="flex justify-between text-[#888]">
                <span>Region:</span>
                <span className="font-mono-code text-[#AAA] text-[11px]">asia-southeast1</span>
              </div>
              <div className="flex justify-between text-[#888]">
                <span>Subcollections:</span>
                <span className="font-mono-code text-[#AAA] text-[11px]">/raw, /reviews, /verified, /derived</span>
              </div>
            </div>

            <p className="text-[11px] text-[#888] mb-3">
              Runs an automated non-destructive integrity diagnostic verifying read/write, subcollection containment, immutable RAW separation, and exact Unicode fidelity (ڇ, څ, ݜ, ڙ, ݨ).
            </p>

            <button
              type="button"
              onClick={handleRunDiagnostics}
              disabled={diagRunning}
              className="w-full rounded-xl bg-emerald-900/80 px-4 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-800 transition border border-emerald-700/50 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              {diagRunning ? 'Running Cloud Diagnostics...' : 'Run Firestore Diagnostics'}
            </button>

            {diagResults && (
              <div className="mt-4 rounded-xl bg-[#161616] p-3 border border-[#262626] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#E5E5E5]">Diagnostic Report:</span>
                  <span className={diagResults.writeSuccess && diagResults.unicodeFidelitySuccess ? 'text-emerald-400' : 'text-amber-400'}>
                    {diagResults.writeSuccess && diagResults.unicodeFidelitySuccess ? 'All Checks Passed' : 'Notice'}
                  </span>
                </div>
                <div className="space-y-1 font-mono-code text-[10px] text-[#888] bg-[#0F0F0F] p-2 rounded-lg border border-[#222]">
                  {diagResults.details.map((line, idx) => (
                    <div key={idx} className={line.startsWith('✓') ? 'text-emerald-400' : line.startsWith('!') ? 'text-amber-400' : 'text-[#888]'}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test & Prototype Data Reset */}
          <div className="rounded-3xl bg-[#111111] p-6 border border-[#222]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E5E5E5] mb-2 flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4 text-[#888]" />
              Prototype Demo Controls
            </h4>
            <p className="text-xs text-[#888] mb-4">
              Reset localStorage back to initial seeded demo data across the 5 Indus-Kohistani dialect varieties.
            </p>

            {!resetConfirm ? (
              <button
                type="button"
                onClick={() => setResetConfirm(true)}
                className="w-full rounded-xl bg-[#222] px-4 py-2 text-xs font-bold text-[#E5E5E5] hover:bg-[#333] hover:text-white transition border border-[#333] cursor-pointer"
              >
                Reset to Initial Demo State
              </button>
            ) : (
              <div className="space-y-2 rounded-xl bg-amber-950/40 p-3 border border-amber-700/50">
                <p className="text-xs font-bold text-amber-200">Confirm reset to initial demo data?</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 cursor-pointer"
                  >
                    Yes, Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetConfirm(false)}
                    className="rounded-lg bg-[#222] px-3 py-1.5 text-xs font-bold text-[#AAA] hover:bg-[#333] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
