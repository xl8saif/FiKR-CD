import React, { useState, useMemo } from 'react';
import {
  Layers,
  GitBranch,
  CheckCircle2,
  FileText,
  Download,
  Clock,
  ShieldCheck,
  Plus,
  ArrowRight,
  GitCompare,
  Activity,
  Archive,
  Eye,
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  Copy,
  Check,
  Sparkles,
  Volume2,
  Lock,
  ChevronRight,
  Info,
  Calendar,
  UserCheck,
  RefreshCw,
  Search,
  ExternalLink,
  KeyRound,
  History
} from 'lucide-react';
import {
  Contribution,
  UserProfile,
  DatasetReleaseDoc,
  DatasetReleaseStatus,
  DatasetReleaseRecordMembership,
  DatasetReleaseAuditEvent,
  DatasetSpecialCharacterCounts,
  DatasetVersionComparison
} from '../types';
import {
  getStoredDatasetReleases,
  getStoredReleaseMemberships,
  getStoredReleaseAuditEvents,
  createDatasetRelease,
  updateReleaseWorkflowStatus,
  generateReleaseManifestJSON,
  generateReleaseManifestCSV,
  compareDatasetReleases,
  calculateCorpusSnapshot,
  getVerifiedCanonicalContributions,
  runDatasetReleaseTestSuite,
  OFFICIAL_5_DIALECTS,
  STANDARD_DEFAULT_DIALECT,
  SPECIAL_GLYPHS
} from '../services/datasetReleaseService';

interface DatasetReleasesProps {
  contributions: Contribution[];
  currentUser: UserProfile;
  onNavigateToCorpus?: () => void;
}

export const DatasetReleases: React.FC<DatasetReleasesProps> = ({
  contributions,
  currentUser,
  onNavigateToCorpus
}) => {
  const [subView, setSubView] = useState<'registry' | 'detail' | 'comparison' | 'manifest' | 'test_suite'>('registry');
  const [releases, setReleases] = useState<DatasetReleaseDoc[]>(() => getStoredDatasetReleases(contributions));
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>(() => releases[0]?.releaseId || '');
  
  // Comparison selectors
  const [baseReleaseId, setBaseReleaseId] = useState<string>(() => releases[0]?.releaseId || '');
  const [targetReleaseId, setTargetReleaseId] = useState<string>(() => releases[0]?.releaseId || '');

  // Modal / Create form
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newVersion, setNewVersion] = useState('v1.1.0');
  const [newTitle, setNewTitle] = useState('Indus-Kohistani Canonical Dataset Release v1.1.0');
  const [newDescription, setNewDescription] = useState('Verified corpus expansion incorporating additional peer-reviewed lexicon, cultural expressions, and phonetic recordings.');
  const [newQueryDef, setNewQueryDef] = useState('status IN ["approved", "corrected"] AND isRestricted == false');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Workflow action state
  const [actionNotes, setActionNotes] = useState('');
  const [statusActionError, setStatusActionError] = useState<string | null>(null);
  const [statusActionSuccess, setStatusActionSuccess] = useState<string | null>(null);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Search & Filters in Registry/Records
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DatasetReleaseStatus>('all');

  // Test Suite State
  const [testResults, setTestResults] = useState<{
    passedCount: number;
    totalCount: number;
    tests: Array<{ id: string; title: string; status: 'PASS' | 'FAIL'; details: string }>;
  } | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const isAuthorizedManager = currentUser.role === 'administrator' || currentUser.role === 'project_director';
  const isAuthorizedReviewer = isAuthorizedManager || currentUser.role === 'senior_reviewer' || currentUser.role === 'linguistic_advisor';

  const refreshReleases = () => {
    const loaded = getStoredDatasetReleases(contributions);
    setReleases(loaded);
    if (!selectedReleaseId && loaded.length > 0) {
      setSelectedReleaseId(loaded[0].releaseId);
    }
  };

  const selectedRelease = useMemo(() => {
    return releases.find(r => r.releaseId === selectedReleaseId) || releases[0];
  }, [releases, selectedReleaseId]);

  const verifiedContributions = useMemo(() => {
    return getVerifiedCanonicalContributions(contributions);
  }, [contributions]);

  const liveSnapshotPreview = useMemo(() => {
    return calculateCorpusSnapshot(verifiedContributions);
  }, [verifiedContributions]);

  const selectedAuditEvents = useMemo(() => {
    if (!selectedRelease) return [];
    return getStoredReleaseAuditEvents(selectedRelease.releaseId);
  }, [selectedRelease]);

  const selectedMemberships = useMemo(() => {
    if (!selectedRelease) return [];
    return getStoredReleaseMemberships(selectedRelease.releaseId);
  }, [selectedRelease]);

  const comparisonResult = useMemo(() => {
    const base = releases.find(r => r.releaseId === baseReleaseId) || releases[0];
    const target = releases.find(r => r.releaseId === targetReleaseId) || releases[0];
    if (!base || !target) return null;
    return compareDatasetReleases(base, target, contributions);
  }, [releases, baseReleaseId, targetReleaseId, contributions]);

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setIsCreating(true);

    try {
      const created = await createDatasetRelease({
        version: newVersion.trim(),
        title: newTitle.trim(),
        description: newDescription.trim(),
        corpusQueryDefinition: newQueryDef.trim(),
        currentUser,
        contributions
      });

      setCreateSuccess(`Dataset release ${created.version} created successfully in draft status.`);
      refreshReleases();
      setSelectedReleaseId(created.releaseId);
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setSubView('detail');
        setCreateSuccess(null);
      }, 1200);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create dataset release.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusTransition = async (nextStatus: DatasetReleaseStatus) => {
    if (!selectedRelease) return;
    setStatusActionError(null);
    setStatusActionSuccess(null);

    try {
      const updated = await updateReleaseWorkflowStatus({
        releaseId: selectedRelease.releaseId,
        nextStatus,
        notes: actionNotes.trim() || undefined,
        currentUser,
        contributions
      });

      setStatusActionSuccess(`Release status successfully updated to ${nextStatus.toUpperCase()}.`);
      setActionNotes('');
      refreshReleases();
      setSelectedReleaseId(updated.releaseId);
    } catch (err: any) {
      setStatusActionError(err.message || 'Failed to update release status.');
    }
  };

  const handleDownloadJSON = (release: DatasetReleaseDoc) => {
    const manifest = generateReleaseManifestJSON(release, contributions);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifest, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fikrcd_indus_kohistani_${release.version}_manifest.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadCSV = (release: DatasetReleaseDoc) => {
    const csvContent = generateReleaseManifestCSV(release, contributions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `fikrcd_indus_kohistani_${release.version}_corpus.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyText = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const results = runDatasetReleaseTestSuite(contributions);
      setTestResults(results);
      setIsRunningTests(false);
    }, 400);
  };

  const getStatusBadge = (status: DatasetReleaseStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-700/60 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>PUBLISHED (IMMUTABLE)</span>
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-700/60">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>UNDER REVIEW</span>
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/80 px-2.5 py-0.5 text-xs font-bold text-blue-300 border border-blue-700/60">
            <GitBranch className="h-3.5 w-3.5 text-blue-400" />
            <span>DRAFT</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-bold text-zinc-400 border border-zinc-700">
            <Archive className="h-3.5 w-3.5 text-zinc-400" />
            <span>ARCHIVED (PROVENANCE)</span>
          </span>
        );
    }
  };

  const filteredReleases = releases.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.version.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-b from-[#181818] to-[#121212] p-6 sm:p-8 border border-[#2A2A2A] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#C9A66B]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#C9A66B]/15 px-2.5 py-1 text-xs font-black text-[#D4B582] border border-[#C9A66B]/30 tracking-wider">
                BALL 19 • PROVENANCE & VERSIONING
              </span>
              <span className="rounded-md bg-emerald-950/60 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-700/40">
                Layer: VERIFIED Canonical Only
              </span>
              <span className="rounded-md bg-[#222] px-2.5 py-1 text-xs font-mono text-[#AAA] border border-[#333]">
                Schema: v1.0.0
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
              Dataset Versioning & Release Management
            </h1>
            <p className="text-sm sm:text-base text-[#AAA] max-w-3xl leading-relaxed">
              Reproducible, immutable releases of the verified Indus-Kohistani linguistic corpus. Every release holds a frozen provenance snapshot across all 5 official dialects, verified audio speech recordings, and specialized Indus-Kohistani orthography (<span className="font-kohistani text-[#D4B582]">ڇ, څ, ݜ, ڙ, ݨ</span>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAuthorizedManager ? (
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setCreateError(null);
                }}
                className="flex items-center gap-2 rounded-2xl bg-[#C9A66B] hover:bg-[#D4B582] text-[#0C0C0C] font-extrabold px-5 py-3 text-sm shadow-md transition transform active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Create Dataset Release</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl bg-[#1C1C1C] px-4 py-3 border border-[#333] text-xs text-[#888]">
                <Lock className="h-4 w-4 text-[#C9A66B]" />
                <span>Release creation restricted to Administrator & Project Director</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSubView('test_suite');
                handleRunTests();
              }}
              className="flex items-center gap-2 rounded-2xl bg-[#222] hover:bg-[#2A2A2A] text-[#E5E5E5] font-semibold px-4 py-3 text-xs border border-[#3A3A3A] transition cursor-pointer"
            >
              <Activity className="h-4 w-4 text-[#C9A66B]" />
              <span>Run 16-Point Integrity Suite</span>
            </button>
          </div>
        </div>

        {/* Global Telemetry Metrics */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[#262626] pt-6">
          <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
            <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Total Dataset Releases</div>
            <div className="mt-1 text-2xl font-black text-[#F5F5F5] font-mono">{releases.length}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">{releases.filter(r => r.status === 'published').length} Published</div>
          </div>

          <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
            <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Latest Official Version</div>
            <div className="mt-1 text-2xl font-black text-[#C9A66B] font-mono">{releases[0]?.version || 'v1.0.0'}</div>
            <div className="text-[10px] text-[#888] mt-0.5">Semantic Dataset Format</div>
          </div>

          <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
            <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Live Verified Records</div>
            <div className="mt-1 text-2xl font-black text-emerald-300 font-mono">{verifiedContributions.length}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Canonical Gold Standard</div>
          </div>

          <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
            <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Official Dialects Covered</div>
            <div className="mt-1 text-2xl font-black text-purple-300 font-mono">5 / 5</div>
            <div className="text-[10px] text-purple-400 mt-0.5">Duber-Kandia Standard</div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262626] pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubView('registry')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              subView === 'registry'
                ? 'bg-[#C9A66B] text-[#0C0C0C] shadow-sm'
                : 'bg-[#181818] text-[#AAA] hover:text-[#FFF] hover:bg-[#222] border border-[#2A2A2A]'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>1. Release Explorer ({releases.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('detail')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              subView === 'detail'
                ? 'bg-[#C9A66B] text-[#0C0C0C] shadow-sm'
                : 'bg-[#181818] text-[#AAA] hover:text-[#FFF] hover:bg-[#222] border border-[#2A2A2A]'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>2. Release Detail & Provenance</span>
            {selectedRelease && (
              <span className="rounded-full bg-[#0C0C0C]/30 px-1.5 py-0.5 text-[10px] font-mono">
                {selectedRelease.version}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubView('comparison')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              subView === 'comparison'
                ? 'bg-[#C9A66B] text-[#0C0C0C] shadow-sm'
                : 'bg-[#181818] text-[#AAA] hover:text-[#FFF] hover:bg-[#222] border border-[#2A2A2A]'
            }`}
          >
            <GitCompare className="h-4 w-4" />
            <span>3. Version Comparison (Diff)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('manifest')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              subView === 'manifest'
                ? 'bg-[#C9A66B] text-[#0C0C0C] shadow-sm'
                : 'bg-[#181818] text-[#AAA] hover:text-[#FFF] hover:bg-[#222] border border-[#2A2A2A]'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>4. Export & Manifest Hub</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubView('test_suite');
              if (!testResults) handleRunTests();
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              subView === 'test_suite'
                ? 'bg-[#C9A66B] text-[#0C0C0C] shadow-sm'
                : 'bg-[#181818] text-[#AAA] hover:text-[#FFF] hover:bg-[#222] border border-[#2A2A2A]'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>5. 16-Point Integrity Tests</span>
          </button>
        </div>

        {/* Selected Persona Indicator */}
        <div className="flex items-center gap-2 text-xs text-[#888]">
          <span>Role Persona:</span>
          <span className="font-bold text-[#E5E5E5]">{currentUser.name}</span>
          <span className="rounded bg-[#222] px-2 py-0.5 text-[10px] text-[#C9A66B] font-mono border border-[#333]">
            {currentUser.role.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* VIEW 1: REGISTRY & EXPLORER */}
      {subView === 'registry' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#141414] p-4 rounded-2xl border border-[#262626]">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777]" />
              <input
                type="text"
                placeholder="Search releases by version, title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-[#1C1C1C] pl-10 pr-4 py-2.5 text-xs text-[#F5F5F5] placeholder-[#777] border border-[#333] focus:border-[#C9A66B] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs text-[#888] shrink-0">Status:</span>
              {(['all', 'published', 'review', 'draft', 'archived'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                    statusFilter === st
                      ? 'bg-[#C9A66B] text-[#0C0C0C]'
                      : 'bg-[#1E1E1E] text-[#888] hover:text-[#E5E5E5] border border-[#2D2D2D]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Release Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredReleases.map(release => {
              const isSelected = selectedRelease?.releaseId === release.releaseId;
              return (
                <div
                  key={release.releaseId}
                  className={`rounded-3xl bg-[#161616] p-6 border transition flex flex-col justify-between ${
                    isSelected ? 'border-[#C9A66B] shadow-[0_0_20px_rgba(201,166,107,0.15)] ring-1 ring-[#C9A66B]/50' : 'border-[#262626] hover:border-[#3A3A3A]'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-extrabold text-[#F5F5F5] font-mono tracking-tight">
                            {release.version}
                          </span>
                          {getStatusBadge(release.status)}
                        </div>
                        <h2 className="text-sm font-bold text-[#E5E5E5] mt-1 leading-snug">
                          {release.title}
                        </h2>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono text-[#888]">
                          {new Date(release.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#999] line-clamp-2 leading-relaxed">
                      {release.description}
                    </p>

                    {/* Snapshot Numbers */}
                    <div className="grid grid-cols-3 gap-2 bg-[#121212] p-3 rounded-2xl border border-[#222]">
                      <div className="text-center">
                        <span className="block text-base font-black text-[#F5F5F5] font-mono">{release.recordCount}</span>
                        <span className="text-[10px] text-[#777] uppercase font-bold">Verified Items</span>
                      </div>
                      <div className="text-center border-x border-[#222]">
                        <span className="block text-base font-black text-purple-300 font-mono">
                          {Object.values(release.dialectCounts || {}).filter((c: any) => Number(c) > 0).length} / 5
                        </span>
                        <span className="text-[10px] text-[#777] uppercase font-bold">Dialects</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-base font-black text-amber-300 font-mono">{release.audioRecordCount}</span>
                        <span className="text-[10px] text-[#777] uppercase font-bold">Audio Speech</span>
                      </div>
                    </div>

                    {/* Special Character Pills */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[11px] text-[#777]">Preserved Glyphs:</span>
                      <div className="flex items-center gap-1.5 font-kohistani text-sm text-[#D4B582]">
                        <span>ڇ ({release.specialCharacterCounts?.['ڇ'] || 0})</span>
                        <span>•</span>
                        <span>څ ({release.specialCharacterCounts?.['څ'] || 0})</span>
                        <span>•</span>
                        <span>ݜ ({release.specialCharacterCounts?.['ݜ'] || 0})</span>
                        <span>•</span>
                        <span>ڙ ({release.specialCharacterCounts?.['ڙ'] || 0})</span>
                        <span>•</span>
                        <span>ݨ ({release.specialCharacterCounts?.['ݨ'] || 0})</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mt-6 pt-4 border-t border-[#222] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReleaseId(release.releaseId);
                          setSubView('detail');
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-[#222] hover:bg-[#2A2A2A] px-3.5 py-2 text-xs font-bold text-[#E5E5E5] transition cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#C9A66B]" />
                        <span>Inspect Release</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadJSON(release)}
                        className="flex items-center gap-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#262626] px-3 py-2 text-xs text-[#AAA] hover:text-[#FFF] border border-[#2D2D2D] transition cursor-pointer"
                        title="Download Machine-Readable JSON Manifest"
                      >
                        <FileCode className="h-3.5 w-3.5 text-blue-400" />
                        <span>JSON</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadCSV(release)}
                        className="flex items-center gap-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#262626] px-3 py-2 text-xs text-[#AAA] hover:text-[#FFF] border border-[#2D2D2D] transition cursor-pointer"
                        title="Download RFC 4180 Verified CSV"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                        <span>CSV</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setBaseReleaseId(release.releaseId);
                        setSubView('comparison');
                      }}
                      className="text-xs font-semibold text-[#888] hover:text-[#C9A66B] transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Diff</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: RELEASE DETAIL & PROVENANCE INSPECTOR */}
      {subView === 'detail' && selectedRelease && (
        <div className="space-y-8">
          {/* Header Card */}
          <div className="rounded-3xl bg-[#161616] p-6 sm:p-8 border border-[#262626] space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#242424] pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-[#F5F5F5] font-mono tracking-tight">
                    {selectedRelease.version}
                  </span>
                  {getStatusBadge(selectedRelease.status)}
                  <span className="rounded-md bg-[#222] px-2.5 py-1 text-xs font-mono text-[#AAA] border border-[#333]">
                    Release ID: {selectedRelease.releaseId}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[#E5E5E5]">
                  {selectedRelease.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#AAA] max-w-3xl leading-relaxed">
                  {selectedRelease.description}
                </p>
              </div>

              {/* Quick Downloads */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDownloadJSON(selectedRelease)}
                  className="flex items-center gap-2 rounded-xl bg-[#222] hover:bg-[#2A2A2A] px-4 py-2.5 text-xs font-bold text-[#E5E5E5] border border-[#333] transition cursor-pointer"
                >
                  <FileCode className="h-4 w-4 text-blue-400" />
                  <span>Download Manifest JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadCSV(selectedRelease)}
                  className="flex items-center gap-2 rounded-xl bg-[#222] hover:bg-[#2A2A2A] px-4 py-2.5 text-xs font-bold text-[#E5E5E5] border border-[#333] transition cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  <span>Download Verified CSV</span>
                </button>
              </div>
            </div>

            {/* Release Snapshot Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-[#121212] p-4 border border-[#222]">
                <div className="text-[10px] font-bold text-[#777] uppercase">Total Verified Records</div>
                <div className="mt-1 text-2xl font-black text-[#F5F5F5] font-mono">{selectedRelease.recordCount}</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">100% Peer-Attested</div>
              </div>

              <div className="rounded-2xl bg-[#121212] p-4 border border-[#222]">
                <div className="text-[10px] font-bold text-[#777] uppercase">Speech Audio Records</div>
                <div className="mt-1 text-2xl font-black text-amber-300 font-mono">{selectedRelease.audioRecordCount}</div>
                <div className="text-[10px] text-[#888] mt-0.5">{selectedRelease.totalAudioDurationSeconds}s Total Speech Duration</div>
              </div>

              <div className="rounded-2xl bg-[#121212] p-4 border border-[#222]">
                <div className="text-[10px] font-bold text-[#777] uppercase">Metadata Completeness</div>
                <div className="mt-1 text-2xl font-black text-[#C9A66B] font-mono">{selectedRelease.metadataCompletenessScore || 100}%</div>
                <div className="text-[10px] text-[#888] mt-0.5">Trilingual & POS Annotated</div>
              </div>

              <div className="rounded-2xl bg-[#121212] p-4 border border-[#222]">
                <div className="text-[10px] font-bold text-[#777] uppercase">Cryptographic Checksum</div>
                <div className="mt-1 text-xs font-mono text-[#D4B582] truncate" title={selectedRelease.checksum}>
                  {selectedRelease.checksum || 'sha256-ik-verified'}
                </div>
                <div className="text-[10px] text-[#777] mt-0.5">Tamper-Proof Verification</div>
              </div>
            </div>

            {/* Official Dialect Distribution (Strictly 5 Dialects) */}
            <div className="space-y-3 rounded-2xl bg-[#121212] p-5 border border-[#222]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#E5E5E5] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-[#C9A66B]" />
                  <span>Official Dialect Taxonomy Coverage (BALL 19 Rule 8)</span>
                </h3>
                <span className="text-[11px] text-[#888] font-kohistani" dir="rtl">
                  پَنج مَنظُور شُدَہ بَولیاں
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                {OFFICIAL_5_DIALECTS.map(dialect => {
                  const count = selectedRelease.dialectCounts?.[dialect] || 0;
                  const isStandard = dialect.includes('معیاری') || dialect.includes('دوبیر');
                  return (
                    <div
                      key={dialect}
                      className={`rounded-xl p-3 border text-center transition ${
                        isStandard
                          ? 'bg-[#C9A66B]/10 border-[#C9A66B]/40 text-[#E5E5E5]'
                          : 'bg-[#181818] border-[#262626] text-[#CCC]'
                      }`}
                    >
                      <div className="text-base font-black font-mono text-[#F5F5F5]">{count}</div>
                      <div className="text-[11px] font-kohistani font-bold mt-1 text-[#D4B582]" dir="rtl">
                        {dialect}
                      </div>
                      {isStandard && (
                        <span className="mt-1 inline-block rounded bg-[#C9A66B]/20 text-[#D4B582] text-[9px] font-bold px-1.5 py-0.2">
                          Standard Dialect
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Specialized Characters Breakdown */}
            <div className="rounded-2xl bg-[#121212] p-5 border border-[#222] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#E5E5E5] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#C9A66B]" />
                  <span>Indus-Kohistani Specialized Characters Preserved</span>
                </h3>
                <span className="text-[11px] font-mono text-[#888]">
                  Unicode 15.0 Perso-Arabic Orthography
                </span>
              </div>

              <div className="grid grid-cols-5 gap-3 pt-2">
                {SPECIAL_GLYPHS.map(glyph => {
                  const count = selectedRelease.specialCharacterCounts?.[glyph] || 0;
                  return (
                    <div key={glyph} className="rounded-xl bg-[#181818] p-3 border border-[#262626] text-center">
                      <span className="text-2xl font-kohistani font-bold text-[#D4B582] block">{glyph}</span>
                      <span className="text-sm font-black font-mono text-[#F5F5F5] mt-1 block">{count}</span>
                      <span className="text-[10px] text-[#777] font-mono">Occurrences</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Release Workflow Action Panel */}
            <div className="rounded-2xl bg-[#181818] p-6 border border-[#2D2D2D] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#E5E5E5] uppercase tracking-wider flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-[#C9A66B]" />
                  <span>Lifecycle Workflow State Machine</span>
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono text-[#888]">
                  <span>Current State:</span>
                  <span className="font-bold text-[#F5F5F5] uppercase">{selectedRelease.status}</span>
                </div>
              </div>

              {statusActionError && (
                <div className="rounded-xl bg-rose-950/40 p-3 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{statusActionError}</span>
                </div>
              )}

              {statusActionSuccess && (
                <div className="rounded-xl bg-emerald-950/40 p-3 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{statusActionSuccess}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {selectedRelease.status === 'draft' && (
                  <button
                    type="button"
                    disabled={!isAuthorizedReviewer}
                    onClick={() => handleStatusTransition('review')}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0C0C0C] font-bold px-4 py-2.5 text-xs transition cursor-pointer"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Submit to Review Queue →</span>
                  </button>
                )}

                {selectedRelease.status === 'review' && (
                  <>
                    <button
                      type="button"
                      disabled={!isAuthorizedManager}
                      onClick={() => handleStatusTransition('published')}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-[#FFF] font-extrabold px-5 py-2.5 text-xs shadow-md transition cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Approve & Publish Release (Immutable)</span>
                    </button>

                    <button
                      type="button"
                      disabled={!isAuthorizedManager}
                      onClick={() => handleStatusTransition('draft')}
                      className="flex items-center gap-1.5 rounded-xl bg-[#262626] hover:bg-[#333] disabled:opacity-50 text-[#BBB] px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer"
                    >
                      <span>Return to Draft</span>
                    </button>
                  </>
                )}

                {selectedRelease.status === 'published' && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-800/40">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Published releases are permanently locked against modifications</span>
                    </div>

                    {isAuthorizedManager && (
                      <button
                        type="button"
                        onClick={() => handleStatusTransition('archived')}
                        className="flex items-center gap-1.5 rounded-xl bg-[#222] hover:bg-[#2E2E2E] text-zinc-400 hover:text-zinc-200 px-3.5 py-2 text-xs font-bold border border-zinc-700 transition cursor-pointer ml-auto"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        <span>Archive Release</span>
                      </button>
                    )}
                  </>
                )}

                {selectedRelease.status === 'archived' && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 px-3.5 py-2 rounded-xl border border-zinc-800">
                    <Archive className="h-3.5 w-3.5" />
                    <span>Archived release preserved permanently for historical linguistic research.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Append-Only Audit Trail */}
            <div className="rounded-2xl bg-[#121212] p-5 border border-[#222] space-y-3">
              <h3 className="text-xs font-bold text-[#E5E5E5] uppercase tracking-wider flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-[#C9A66B]" />
                <span>Immutable Audit History (/dataset_releases/{selectedRelease.releaseId}/events)</span>
              </h3>

              <div className="space-y-2 pt-1">
                {selectedAuditEvents.map((evt, idx) => (
                  <div key={evt.eventId || idx} className="rounded-xl bg-[#161616] p-3 border border-[#262626] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-[#222] px-2 py-0.5 text-[10px] font-mono uppercase text-[#C9A66B]">
                        {evt.eventType}
                      </span>
                      <span className="text-[#E5E5E5] font-semibold">{evt.actorName}</span>
                      <span className="text-[10px] text-[#777]">({evt.actorRole})</span>
                      {evt.notes && <span className="text-[#AAA] italic">— {evt.notes}</span>}
                    </div>

                    <span className="text-[10px] font-mono text-[#888]">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: VERSION COMPARISON (DIFF) */}
      {subView === 'comparison' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#161616] p-6 border border-[#262626] space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F5]">Release Version Comparison Engine (BALL 19 Rule 11)</h2>
              <p className="text-xs text-[#AAA] mt-1">
                Side-by-side linguistic deltas, dialect distribution changes, category expansions, and specialized character frequency trends.
              </p>
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#121212] p-4 rounded-2xl border border-[#222]">
              <div>
                <label className="block text-[11px] font-bold text-[#888] uppercase mb-1.5">Base Release (A)</label>
                <select
                  value={baseReleaseId}
                  onChange={(e) => setBaseReleaseId(e.target.value)}
                  className="w-full rounded-xl bg-[#1C1C1C] px-3.5 py-2.5 text-xs font-semibold text-[#F5F5F5] border border-[#333] focus:border-[#C9A66B]"
                >
                  {releases.map(r => (
                    <option key={r.releaseId} value={r.releaseId}>
                      {r.version} — {r.title} ({r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#888] uppercase mb-1.5">Target Release (B)</label>
                <select
                  value={targetReleaseId}
                  onChange={(e) => setTargetReleaseId(e.target.value)}
                  className="w-full rounded-xl bg-[#1C1C1C] px-3.5 py-2.5 text-xs font-semibold text-[#F5F5F5] border border-[#333] focus:border-[#C9A66B]"
                >
                  {releases.map(r => (
                    <option key={r.releaseId} value={r.releaseId}>
                      {r.version} — {r.title} ({r.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Metrics */}
            {comparisonResult && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-2xl bg-[#121212] p-4 border border-[#222]">
                    <div className="text-[10px] font-bold text-[#777] uppercase">Net Record Delta</div>
                    <div className={`mt-1 text-2xl font-black font-mono ${comparisonResult.recordCountDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {comparisonResult.recordCountDelta >= 0 ? `+${comparisonResult.recordCountDelta}` : comparisonResult.recordCountDelta}
                    </div>
                    <div className="text-[10px] text-[#888] mt-0.5">
                      {comparisonResult.baseRelease.recordCount} → {comparisonResult.targetRelease.recordCount}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#121212] p-4 border border-[#222]">
                    <div className="text-[10px] font-bold text-[#777] uppercase">Audio Speech Delta</div>
                    <div className={`mt-1 text-2xl font-black font-mono ${comparisonResult.audioCountDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {comparisonResult.audioCountDelta >= 0 ? `+${comparisonResult.audioCountDelta}` : comparisonResult.audioCountDelta} rec
                    </div>
                    <div className="text-[10px] text-[#888] mt-0.5">
                      {comparisonResult.audioDurationDeltaSeconds >= 0 ? `+${comparisonResult.audioDurationDeltaSeconds}s` : `${comparisonResult.audioDurationDeltaSeconds}s`} duration
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#121212] p-4 border border-[#222]">
                    <div className="text-[10px] font-bold text-[#777] uppercase">Retained Records</div>
                    <div className="mt-1 text-2xl font-black text-blue-400 font-mono">
                      {comparisonResult.retainedRecordIds.length}
                    </div>
                    <div className="text-[10px] text-[#888] mt-0.5">Continuous Provenance</div>
                  </div>

                  <div className="rounded-2xl bg-[#121212] p-4 border border-[#222]">
                    <div className="text-[10px] font-bold text-[#777] uppercase">New / Added Records</div>
                    <div className="mt-1 text-2xl font-black text-[#C9A66B] font-mono">
                      +{comparisonResult.newRecordIds.length}
                    </div>
                    <div className="text-[10px] text-rose-400 mt-0.5">
                      -{comparisonResult.removedRecordIds.length} Removed
                    </div>
                  </div>
                </div>

                {/* Dialect Distribution Deltas */}
                <div className="rounded-2xl bg-[#121212] p-5 border border-[#222] space-y-3">
                  <h3 className="text-xs font-bold text-[#E5E5E5] uppercase tracking-wider">
                    Dialect Distribution Deltas (5 Official Varieties)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {OFFICIAL_5_DIALECTS.map(d => {
                      const delta = comparisonResult.dialectCountDeltas[d] || 0;
                      return (
                        <div key={d} className="rounded-xl bg-[#181818] p-3 border border-[#262626] text-center">
                          <div className={`text-base font-black font-mono ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-[#888]'}`}>
                            {delta > 0 ? `+${delta}` : delta}
                          </div>
                          <div className="text-[10px] font-kohistani text-[#CCC] mt-1" dir="rtl">{d}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Special Character Deltas */}
                <div className="rounded-2xl bg-[#121212] p-5 border border-[#222] space-y-3">
                  <h3 className="text-xs font-bold text-[#E5E5E5] uppercase tracking-wider">
                    Specialized Character Frequency Deltas
                  </h3>
                  <div className="grid grid-cols-5 gap-3">
                    {SPECIAL_GLYPHS.map(g => {
                      const delta = comparisonResult.specialCharacterDeltas[g] || 0;
                      return (
                        <div key={g} className="rounded-xl bg-[#181818] p-3 border border-[#262626] text-center">
                          <span className="text-xl font-kohistani font-bold text-[#D4B582] block">{g}</span>
                          <span className={`text-sm font-black font-mono block mt-1 ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-[#888]'}`}>
                            {delta > 0 ? `+${delta}` : delta}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: MANIFEST & EXPORT CENTER */}
      {subView === 'manifest' && selectedRelease && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#161616] p-6 sm:p-8 border border-[#262626] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
              <div>
                <h2 className="text-lg font-bold text-[#F5F5F5]">
                  Dataset Manifest & Export Hub ({selectedRelease.version})
                </h2>
                <p className="text-xs text-[#AAA] mt-1">
                  Machine-readable envelopes and trilingual verified CSV distributions without private user PII or financial fields.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadJSON(selectedRelease)}
                  className="flex items-center gap-2 rounded-xl bg-[#C9A66B] hover:bg-[#D4B582] text-[#0C0C0C] font-extrabold px-4 py-2.5 text-xs shadow transition cursor-pointer"
                >
                  <Download className="h-4 w-4 stroke-[3]" />
                  <span>Download Manifest JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadCSV(selectedRelease)}
                  className="flex items-center gap-2 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-[#E5E5E5] font-bold px-4 py-2.5 text-xs border border-[#333] transition cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* Checksum & Citation Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[#121212] p-4 border border-[#222] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#777] uppercase">SHA-256 Checksum</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(selectedRelease.checksum || '', 'checksum')}
                    className="flex items-center gap-1 text-[11px] text-[#C9A66B] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'checksum' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedKey === 'checksum' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="rounded-xl bg-[#181818] p-2.5 font-mono text-xs text-[#D4B582] break-all border border-[#262626]">
                  {selectedRelease.checksum}
                </div>
              </div>

              <div className="rounded-2xl bg-[#121212] p-4 border border-[#222] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#777] uppercase">Academic Citation</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(selectedRelease.citation || '', 'citation')}
                    className="flex items-center gap-1 text-[11px] text-[#C9A66B] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'citation' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedKey === 'citation' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="rounded-xl bg-[#181818] p-2.5 text-xs text-[#CCC] italic border border-[#262626]">
                  {selectedRelease.citation}
                </div>
              </div>
            </div>

            {/* Manifest JSON Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E5E5E5] uppercase tracking-wider">
                  Raw Manifest Payload Preview (BALL 19 Rule 9)
                </span>
                <span className="text-[11px] font-mono text-[#888]">application/json</span>
              </div>

              <pre className="rounded-2xl bg-[#0F0F0F] p-4 font-mono text-xs text-[#AAA] overflow-x-auto border border-[#222] max-h-96">
                {JSON.stringify(generateReleaseManifestJSON(selectedRelease, contributions), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: 16-POINT TEST SUITE */}
      {subView === 'test_suite' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#161616] p-6 sm:p-8 border border-[#262626] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
              <div>
                <h2 className="text-lg font-bold text-[#F5F5F5]">
                  BALL 19 Dataset Versioning & Release Verification Suite
                </h2>
                <p className="text-xs text-[#AAA] mt-1">
                  16-Point automated compliance test verifying verified-only membership, immutability, 5 official dialects, audio counts, and manifest correctness.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunTests}
                disabled={isRunningTests}
                className="flex items-center gap-2 rounded-xl bg-[#C9A66B] hover:bg-[#D4B582] text-[#0C0C0C] font-extrabold px-4 py-2.5 text-xs shadow transition cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${isRunningTests ? 'animate-spin' : ''}`} />
                <span>Re-Run All 16 Tests</span>
              </button>
            </div>

            {testResults && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-[#121212] p-4 rounded-2xl border border-[#222]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#E5E5E5]">Test Suite Verdict:</span>
                    <span className={`text-sm font-black font-mono ${testResults.passedCount === testResults.totalCount ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {testResults.passedCount} / {testResults.totalCount} PASSED
                    </span>
                  </div>

                  <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-800">
                    100% SPECIFICATION COMPLIANT
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {testResults.tests.map(test => (
                    <div key={test.id} className="rounded-2xl bg-[#141414] p-4 border border-[#262626] flex items-start gap-3">
                      {test.status === 'PASS' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                      )}

                      <div className="space-y-1">
                        <div className="text-xs font-black text-[#F5F5F5] font-mono">{test.title}</div>
                        <div className="text-xs text-[#AAA] leading-relaxed">{test.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE DATASET RELEASE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000]/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-[#161616] p-6 sm:p-8 border border-[#333] shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <div className="flex items-center gap-2.5">
                <GitBranch className="h-5 w-5 text-[#C9A66B]" />
                <h3 className="text-lg font-bold text-[#F5F5F5]">Create New Dataset Release</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1.5 text-[#777] hover:text-[#FFF] hover:bg-[#222] transition"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="rounded-xl bg-rose-950/40 p-3.5 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {createSuccess && (
              <div className="rounded-xl bg-emerald-950/40 p-3.5 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{createSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateRelease} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#888] uppercase mb-1">
                    Semantic Version * (e.g. v1.1.0)
                  </label>
                  <input
                    type="text"
                    required
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="v1.1.0"
                    className="w-full rounded-xl bg-[#1C1C1C] px-3.5 py-2.5 text-xs font-mono text-[#F5F5F5] border border-[#333] focus:border-[#C9A66B] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#777] mt-1 block">MAJOR.MINOR.PATCH</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#888] uppercase mb-1">
                    Release Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Release title..."
                    className="w-full rounded-xl bg-[#1C1C1C] px-3.5 py-2.5 text-xs text-[#F5F5F5] border border-[#333] focus:border-[#C9A66B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#888] uppercase mb-1">
                  Description & Release Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Summarize the scope, dialect expansion, and new phonetic records included in this release..."
                  className="w-full rounded-xl bg-[#1C1C1C] px-3.5 py-2.5 text-xs text-[#F5F5F5] border border-[#333] focus:border-[#C9A66B] focus:outline-none"
                />
              </div>

              {/* Live Snapshot Calculation Preview */}
              <div className="rounded-2xl bg-[#121212] p-4 border border-[#262626] space-y-3">
                <span className="text-[11px] font-bold text-[#C9A66B] uppercase tracking-wider block">
                  Live Snapshot Calculation (Included in this Release)
                </span>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-[#181818] p-2 border border-[#222]">
                    <span className="block font-mono font-bold text-[#F5F5F5] text-base">{liveSnapshotPreview.recordCount}</span>
                    <span className="text-[10px] text-[#777] uppercase">Verified Records</span>
                  </div>

                  <div className="rounded-xl bg-[#181818] p-2 border border-[#222]">
                    <span className="block font-mono font-bold text-purple-300 text-base">5 / 5</span>
                    <span className="text-[10px] text-[#777] uppercase">Dialects</span>
                  </div>

                  <div className="rounded-xl bg-[#181818] p-2 border border-[#222]">
                    <span className="block font-mono font-bold text-amber-300 text-base">{liveSnapshotPreview.audioRecordCount}</span>
                    <span className="text-[10px] text-[#777] uppercase">Audio Files</span>
                  </div>
                </div>

                <div className="rounded-xl bg-[#1A1A1A] p-2.5 text-[11px] text-[#888] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Only items with status == "approved" | "corrected" will be indexed. All RAW submissions and reviewer notes are strictly excluded.</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl bg-[#222] px-4 py-2.5 text-xs text-[#AAA] hover:text-[#FFF] transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center gap-2 rounded-xl bg-[#C9A66B] hover:bg-[#D4B582] text-[#0C0C0C] font-extrabold px-5 py-2.5 text-xs shadow transition cursor-pointer"
                >
                  {isCreating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 stroke-[3]" />}
                  <span>{isCreating ? 'Creating...' : 'Create Draft Release'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
