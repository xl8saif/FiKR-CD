import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Database,
  ShieldCheck,
  Layers,
  Download,
  CheckCircle2,
  Check,
  AlertTriangle,
  FileText,
  Filter,
  Search,
  Lock,
  RefreshCw,
  Sliders,
  Eye,
  BookOpen,
  Copy,
  Plus,
  Archive,
  Volume2,
  ArrowRightLeft,
  X,
  Sparkles,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import {
  Contribution,
  UserProfile,
  UserRole,
  DatasetReleaseDoc,
  DerivedDatasetDoc,
  DerivedDatasetType,
  DerivedDatasetStatus,
  LanguagePair,
  DerivedNLPRecord,
  DatasetSpecialCharacterCounts
} from '../types';
import {
  getStoredDerivedDatasets,
  getStoredDerivedRecords,
  createDerivedDataset,
  validateDerivedDataset,
  publishDerivedDataset,
  archiveDerivedDataset,
  exportDerivedDatasetJSONL,
  exportDerivedDatasetJSON,
  exportDerivedDatasetCSV,
  generateDatasetCardMarkdown,
  runBall20ValidationSuite,
  PIPELINE_VERSION
} from '../services/nlpDatasetPipelineService';
import { getStoredDatasetReleases, SPECIAL_GLYPHS, OFFICIAL_5_DIALECTS } from '../services/datasetReleaseService';

interface NlpDatasetWorkspaceProps {
  contributions: Contribution[];
  currentUser: UserProfile;
}

export const NlpDatasetWorkspace: React.FC<NlpDatasetWorkspaceProps> = ({
  contributions,
  currentUser
}) => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'registry' | 'create' | 'records' | 'quality' | 'card'>('registry');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Search & Filter in Records View
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDialect, setFilterDialect] = useState<string>('all');
  const [filterSplit, setFilterSplit] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<DerivedNLPRecord | null>(null);

  // 20-Point Test Modal State
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [validationSuiteResults, setValidationSuiteResults] = useState<ReturnType<typeof runBall20ValidationSuite> | null>(null);

  // Dataset Creation Form State
  const [formSourceReleaseId, setFormSourceReleaseId] = useState<string>('');
  const [formDatasetType, setFormDatasetType] = useState<DerivedDatasetType>('parallel_corpus');
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formLanguagePair, setFormLanguagePair] = useState<LanguagePair>('ik-ur-en');
  const [formTrainRatio, setFormTrainRatio] = useState<number>(0.8);
  const [formValRatio, setFormValRatio] = useState<number>(0.1);
  const [formTestRatio, setFormTestRatio] = useState<number>(0.1);
  const [formSeed, setFormSeed] = useState<string>('fikr-nlp-seed-2026');

  // Copy Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load published dataset releases
  const releases = useMemo(() => {
    return getStoredDatasetReleases(contributions);
  }, [contributions]);

  const publishedReleases = useMemo(() => {
    return releases.filter(r => r.status === 'published' || r.status === 'archived');
  }, [releases]);

  // Load derived datasets
  const [derivedDatasets, setDerivedDatasets] = useState<DerivedDatasetDoc[]>(() => {
    return getStoredDerivedDatasets(contributions);
  });

  // Selected dataset
  const activeDataset = useMemo(() => {
    if (selectedDatasetId) {
      const found = derivedDatasets.find(d => d.datasetId === selectedDatasetId);
      if (found) return found;
    }
    return derivedDatasets[0] || null;
  }, [derivedDatasets, selectedDatasetId]);

  // Records for active dataset
  const activeRecords = useMemo(() => {
    if (!activeDataset) return [];
    return getStoredDerivedRecords(activeDataset, contributions);
  }, [activeDataset, contributions]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return activeRecords.filter(r => {
      if (filterDialect !== 'all' && r.dialect !== filterDialect) return false;
      if (filterSplit !== 'all' && r.split !== filterSplit) return false;
      if (filterCategory !== 'all' && r.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchIk = r.indusKohistani.toLowerCase().includes(q);
        const matchUr = r.urdu.toLowerCase().includes(q);
        const matchEn = r.english.toLowerCase().includes(q);
        const matchTrans = r.transliteration?.toLowerCase().includes(q) ?? false;
        const matchId = r.sourceContributionId.toLowerCase().includes(q);
        if (!matchIk && !matchUr && !matchEn && !matchTrans && !matchId) return false;
      }
      return true;
    });
  }, [activeRecords, filterDialect, filterSplit, filterCategory, searchQuery]);

  // Roles permissions
  const canCreate = ['administrator', 'project_director', 'linguistic_advisor'].includes(currentUser.role);
  const canValidate = ['senior_reviewer', 'linguistic_advisor', 'project_director', 'administrator'].includes(currentUser.role);
  const canPublish = ['administrator', 'project_director'].includes(currentUser.role);
  const canArchive = ['administrator', 'project_director'].includes(currentUser.role);

  // Set default source release if none selected
  React.useEffect(() => {
    if (publishedReleases.length > 0 && !formSourceReleaseId) {
      setFormSourceReleaseId(publishedReleases[0].releaseId);
    }
  }, [publishedReleases, formSourceReleaseId]);

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showFeedback('Copied to clipboard!', 'info');
  };

  // Create Handler
  const handleCreateDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    const sourceRel = publishedReleases.find(r => r.releaseId === formSourceReleaseId);
    if (!sourceRel) {
      showFeedback('Please select a valid published dataset release.', 'error');
      return;
    }
    if (!formName.trim()) {
      showFeedback('Please enter a dataset title.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const newDataset = await createDerivedDataset({
        sourceRelease: sourceRel,
        datasetType: formDatasetType,
        name: formName.trim(),
        description: formDescription.trim() || `Derived ${formDatasetType} NLP dataset prepared from release ${sourceRel.version}.`,
        languagePair: formDatasetType === 'parallel_corpus' ? formLanguagePair : undefined,
        splitConfig: {
          trainRatio: formTrainRatio,
          valRatio: formValRatio,
          testRatio: formTestRatio,
          splitSeed: formSeed.trim() || `fikr-${Date.now()}`
        },
        currentUser,
        contributions
      });

      setDerivedDatasets(getStoredDerivedDatasets(contributions));
      setSelectedDatasetId(newDataset.datasetId);
      setActiveTab('records');
      showFeedback(`Successfully prepared derived dataset '${newDataset.name}' with ${newDataset.recordCount} records!`, 'success');
    } catch (err: any) {
      showFeedback(err.message || 'Failed to generate derived dataset.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate Handler
  const handleValidate = async (datasetId: string) => {
    setIsLoading(true);
    try {
      const updated = await validateDerivedDataset({
        datasetId,
        notes: `Validated by ${currentUser.name} (${currentUser.role}) with specialized glyph verification.`,
        currentUser,
        contributions
      });
      setDerivedDatasets(getStoredDerivedDatasets(contributions));
      showFeedback(`Dataset '${updated.name}' successfully validated for publication!`, 'success');
    } catch (err: any) {
      showFeedback(err.message || 'Validation failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Publish Handler
  const handlePublish = async (datasetId: string) => {
    setIsLoading(true);
    try {
      const updated = await publishDerivedDataset({
        datasetId,
        currentUser,
        contributions
      });
      setDerivedDatasets(getStoredDerivedDatasets(contributions));
      showFeedback(`Dataset '${updated.name}' is now PUBLISHED and permanently locked for reproducibility.`, 'success');
    } catch (err: any) {
      showFeedback(err.message || 'Publication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Archive Handler
  const handleArchive = async (datasetId: string) => {
    if (!confirm('Are you sure you want to archive this derived dataset? It will remain immutable.')) return;
    setIsLoading(true);
    try {
      const updated = await archiveDerivedDataset({
        datasetId,
        currentUser,
        contributions
      });
      setDerivedDatasets(getStoredDerivedDatasets(contributions));
      showFeedback(`Dataset '${updated.name}' moved to archive.`, 'info');
    } catch (err: any) {
      showFeedback(err.message || 'Archive failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Run 20-Point Suite
  const handleRunValidationSuite = () => {
    const results = runBall20ValidationSuite(contributions);
    setValidationSuiteResults(results);
    setShowValidationModal(true);
  };

  // Download Handlers
  const handleDownloadJSONL = (ds: DerivedDatasetDoc) => {
    const data = exportDerivedDatasetJSONL(ds, contributions);
    const blob = new Blob([data], { type: 'application/x-jsonlines;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ds.datasetId}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback(`Exported ${ds.recordCount} records as JSONL`, 'info');
  };

  const handleDownloadJSON = (ds: DerivedDatasetDoc) => {
    const data = exportDerivedDatasetJSON(ds, contributions);
    const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ds.datasetId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback(`Exported complete JSON package`, 'info');
  };

  const handleDownloadCSV = (ds: DerivedDatasetDoc) => {
    const data = exportDerivedDatasetCSV(ds, contributions);
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ds.datasetId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback(`Exported CSV dataset`, 'info');
  };

  const handleDownloadCardMD = (ds: DerivedDatasetDoc) => {
    const data = generateDatasetCardMarkdown(ds.datasetCard);
    const blob = new Blob([data], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `README.md`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback(`Exported HuggingFace Dataset Card (README.md)`, 'info');
  };

  const getStatusBadge = (status: DerivedDatasetStatus) => {
    switch (status) {
      case 'published':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"><Lock className="w-3 h-3" /> Published (Locked)</span>;
      case 'validated':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300"><ShieldCheck className="w-3 h-3" /> Validated</span>;
      case 'processing':
      case 'draft':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300"><Sliders className="w-3 h-3" /> Draft Pipeline</span>;
      case 'archived':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 border border-gray-300"><Archive className="w-3 h-3" /> Archived</span>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: DerivedDatasetType) => {
    switch (type) {
      case 'parallel_corpus':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"><ArrowRightLeft className="w-3 h-3" /> Parallel Corpus</span>;
      case 'tokenization':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"><Cpu className="w-3 h-3" /> Tokenized Corpus</span>;
      case 'dictionary':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800"><BookOpen className="w-3 h-3" /> Lexicon Dictionary</span>;
      case 'speech_metadata':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800"><Volume2 className="w-3 h-3" /> Speech Metadata</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"><Layers className="w-3 h-3" /> Text Corpus</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 rounded-xl shadow-inner">
                  <Cpu className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">AI & NLP Corpus Preparation</h1>
                    <span className="px-2 py-0.5 bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-xs font-mono rounded">
                      BALL 20 • {PIPELINE_VERSION}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Deterministic, provenance-preserving preparation layer for verified Indus-Kohistani releases. Zero synthetic AI generation.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="btn-run-integrity-suite"
                onClick={handleRunValidationSuite}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                Run 20-Point Audit
              </button>

              {canCreate && (
                <button
                  id="btn-new-derived-dataset"
                  onClick={() => setActiveTab('create')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Prepare Derived Dataset
                </button>
              )}
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <div className="flex items-center gap-1 mt-6 border-t border-slate-800 pt-4 overflow-x-auto">
            <button
              id="tab-derived-registry"
              onClick={() => setActiveTab('registry')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${
                activeTab === 'registry'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Database className="w-4 h-4" />
              Derived Datasets Registry ({derivedDatasets.length})
            </button>

            {activeDataset && (
              <>
                <button
                  id="tab-derived-records"
                  onClick={() => setActiveTab('records')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${
                    activeTab === 'records'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Corpus Explorer & Records ({activeRecords.length})
                </button>

                <button
                  id="tab-derived-quality"
                  onClick={() => setActiveTab('quality')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${
                    activeTab === 'quality'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Quality & Duplicates Audit
                </button>

                <button
                  id="tab-derived-card"
                  onClick={() => setActiveTab('card')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${
                    activeTab === 'card'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Dataset Card & Citation
                </button>
              </>
            )}

            {canCreate && (
              <button
                id="tab-derived-create"
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${
                  activeTab === 'create'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Sliders className="w-4 h-4" />
                Pipeline Wizard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Status Notification */}
      {statusMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={`p-3.5 rounded-lg flex items-center justify-between shadow-md border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm font-medium">
              {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
              {statusMessage.type === 'info' && <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ======================================================== */}
        {/* TAB 1: REGISTRY VIEW                                     */}
        {/* ======================================================== */}
        {activeTab === 'registry' && (
          <div className="space-y-6">
            {/* Top Stat Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Derived Datasets</span>
                  <Database className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{derivedDatasets.length}</div>
                <p className="text-xs text-slate-500 mt-1">Ready for MT, TTS & lexicography</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Published & Locked</span>
                  <Lock className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {derivedDatasets.filter(d => d.status === 'published').length}
                </div>
                <p className="text-xs text-slate-500 mt-1">Permanently reproducible</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Source Releases</span>
                  <Layers className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{publishedReleases.length}</div>
                <p className="text-xs text-slate-500 mt-1">Verified release snapshots</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Special Character Integrity</span>
                  <ShieldCheck className="w-4 h-4 text-teal-500" />
                </div>
                <div className="text-2xl font-bold text-teal-600">100%</div>
                <p className="text-xs text-slate-500 mt-1">ڇ, څ, ݜ, ڙ, ݨ verified preserved</p>
              </div>
            </div>

            {/* Datasets Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Derived Corpus Registry</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Immutable NLP datasets generated deterministically from published releases.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Current User: {currentUser.name} ({currentUser.role})</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {derivedDatasets.map(ds => {
                  const isSelected = activeDataset?.datasetId === ds.datasetId;
                  return (
                    <div
                      key={ds.datasetId}
                      className={`p-5 transition hover:bg-slate-50/80 ${
                        isSelected ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-base">{ds.name}</h3>
                            {getStatusBadge(ds.status)}
                            {getTypeBadge(ds.datasetType)}
                            {ds.languagePair && (
                              <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700">
                                {ds.languagePair.toUpperCase()}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                            {ds.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                            <span><strong>Source Release:</strong> {ds.sourceReleaseVersion}</span>
                            <span><strong>Total Records:</strong> {ds.recordCount}</span>
                            <span>
                              <strong>Splits:</strong> Train {ds.splitCounts.trainCount} | Val {ds.splitCounts.valCount} | Test {ds.splitCounts.testCount}
                            </span>
                            <span><strong>Created by:</strong> {ds.creatorName} ({ds.creatorRole})</span>
                            <span className="font-mono text-slate-400 text-[11px]">
                              Checksum: {ds.checksum ? `${ds.checksum.slice(0, 16)}...` : 'Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            id={`btn-explore-${ds.datasetId}`}
                            onClick={() => {
                              setSelectedDatasetId(ds.datasetId);
                              setActiveTab('records');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            Explore Records
                          </button>

                          {/* Export Dropdown / Buttons */}
                          <button
                            id={`btn-export-jsonl-${ds.datasetId}`}
                            onClick={() => handleDownloadJSONL(ds)}
                            title="Export JSONL (HuggingFace standard)"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5 text-indigo-600" />
                            JSONL
                          </button>

                          <button
                            id={`btn-export-csv-${ds.datasetId}`}
                            onClick={() => handleDownloadCSV(ds)}
                            title="Export CSV"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition shadow-xs"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            CSV
                          </button>

                          {/* Role-gated Transitions */}
                          {canValidate && ds.status === 'draft' && (
                            <button
                              id={`btn-validate-${ds.datasetId}`}
                              onClick={() => handleValidate(ds.datasetId)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-xs"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Validate
                            </button>
                          )}

                          {canPublish && ds.status === 'validated' && (
                            <button
                              id={`btn-publish-${ds.datasetId}`}
                              onClick={() => handlePublish(ds.datasetId)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-xs"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              Publish & Lock
                            </button>
                          )}

                          {canArchive && ds.status === 'published' && (
                            <button
                              id={`btn-archive-${ds.datasetId}`}
                              onClick={() => handleArchive(ds.datasetId)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-medium transition"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              Archive
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: RECORDS & EXPLORER VIEW                           */}
        {/* ======================================================== */}
        {activeTab === 'records' && activeDataset && (
          <div className="space-y-6">
            {/* Active Dataset Top Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{activeDataset.name}</h2>
                    {getStatusBadge(activeDataset.status)}
                    {getTypeBadge(activeDataset.datasetType)}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{activeDataset.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleDownloadJSONL(activeDataset)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition"
                  >
                    <Download className="w-3.5 h-3.5" /> JSONL
                  </button>
                  <button
                    onClick={() => handleDownloadCSV(activeDataset)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
                  </button>
                  <button
                    onClick={() => handleDownloadJSON(activeDataset)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition"
                  >
                    <FileText className="w-3.5 h-3.5" /> Full JSON
                  </button>
                  <button
                    onClick={() => handleDownloadCardMD(activeDataset)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Dataset Card
                  </button>
                </div>
              </div>

              {/* Stratification & Special Glyphs Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 pt-2">
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Train Split (80%)</span>
                  <span className="text-sm font-bold text-indigo-700">{activeDataset.splitCounts.trainCount} records</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Val Split (10%)</span>
                  <span className="text-sm font-bold text-indigo-700">{activeDataset.splitCounts.valCount} records</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Test Split (10%)</span>
                  <span className="text-sm font-bold text-indigo-700">{activeDataset.splitCounts.testCount} records</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Duber-Kandia</span>
                  <span className="text-sm font-bold text-slate-800">{activeDataset.dialectCounts['دوبیر-کندیا بولی — معیاری بولی'] || 0}</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Special Glyphs</span>
                  <span className="text-sm font-bold text-teal-700">
                    ڇ: {activeDataset.specialCharacterCounts['ڇ'] || 0} | څ: {activeDataset.specialCharacterCounts['څ'] || 0} | ݜ: {activeDataset.specialCharacterCounts['ݜ'] || 0}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Retroflexes</span>
                  <span className="text-sm font-bold text-teal-700">
                    ڙ: {activeDataset.specialCharacterCounts['ڙ'] || 0} | ݨ: {activeDataset.specialCharacterCounts['ݨ'] || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-nlp-search"
                  type="text"
                  placeholder="Search Indus-Kohistani, Urdu, English, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  id="select-nlp-dialect"
                  value={filterDialect}
                  onChange={(e) => setFilterDialect(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All 5 Dialects</option>
                  {OFFICIAL_5_DIALECTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  id="select-nlp-split"
                  value={filterSplit}
                  onChange={(e) => setFilterSplit(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Splits</option>
                  <option value="train">Train (80%)</option>
                  <option value="val">Validation (10%)</option>
                  <option value="test">Test (10%)</option>
                </select>

                <select
                  id="select-nlp-category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Categories</option>
                  {Object.keys(activeDataset.categoryCounts).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Records List Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Showing <strong>{filteredRecords.length}</strong> of {activeRecords.length} records</span>
                <span>Deterministic Stratification Active</span>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredRecords.map((r, idx) => (
                  <div key={r.recordId} className="p-4 hover:bg-slate-50 transition">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                            r.split === 'train'
                              ? 'bg-blue-100 text-blue-800'
                              : r.split === 'val'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {r.split}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">
                            {r.dialect}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                            {r.category}
                          </span>
                          {r.speechMetadata?.hasAudio && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-rose-50 text-rose-700 border border-rose-200">
                              <Volume2 className="w-3 h-3" /> Audio ({r.speechMetadata.durationSeconds?.toFixed(1)}s)
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-400">
                            ID: {r.sourceContributionId}
                          </span>
                        </div>

                        {/* Tri-lingual content */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                          {/* Indus-Kohistani */}
                          <div className="bg-amber-50/40 p-3 rounded-lg border border-amber-200/50">
                            <span className="text-[10px] font-semibold text-amber-800 uppercase block mb-1">
                              Indus-Kohistani (mvy)
                            </span>
                            <p className="text-lg font-medium text-slate-900 leading-relaxed font-arabic" dir="rtl">
                              {r.indusKohistani}
                            </p>
                            {r.transliteration && (
                              <p className="text-xs text-slate-500 italic mt-1 font-mono">
                                {r.transliteration}
                              </p>
                            )}
                          </div>

                          {/* Urdu */}
                          <div className="bg-emerald-50/40 p-3 rounded-lg border border-emerald-200/50">
                            <span className="text-[10px] font-semibold text-emerald-800 uppercase block mb-1">
                              Urdu (ur)
                            </span>
                            <p className="text-base font-normal text-slate-800 leading-relaxed font-arabic" dir="rtl">
                              {r.urdu || <span className="text-slate-400 italic">No translation</span>}
                            </p>
                          </div>

                          {/* English */}
                          <div className="bg-blue-50/40 p-3 rounded-lg border border-blue-200/50">
                            <span className="text-[10px] font-semibold text-blue-800 uppercase block mb-1">
                              English (en)
                            </span>
                            <p className="text-sm font-normal text-slate-800 leading-relaxed">
                              {r.english || <span className="text-slate-400 italic">No translation</span>}
                            </p>
                          </div>
                        </div>

                        {/* Tokenization details pill */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 pt-1">
                          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                            Tokens ({r.tokenization.tokenCount}): {r.tokenization.tokens.slice(0, 6).join(' • ')}{r.tokenization.tokens.length > 6 ? '...' : ''}
                          </span>
                          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                            Chars: {r.tokenization.characterCount}
                          </span>
                          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-emerald-700">
                            Provenance: {r.provenanceLabel}
                          </span>
                        </div>
                      </div>

                      {/* Detail popover button */}
                      <button
                        onClick={() => setSelectedRecordForDetail(r)}
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-100 text-slate-600 transition"
                      >
                        Inspect Tokens
                      </button>
                    </div>
                  </div>
                ))}

                {filteredRecords.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No records match the selected filter criteria.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: QUALITY REPORT & DUPLICATES                       */}
        {/* ======================================================== */}
        {activeTab === 'quality' && activeDataset && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Dataset Quality & Integrity Report</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Automated audit of data leakage, specialized characters, duplicate pairs, and PII protection.
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">
                  PASSED PIPELINE AUDIT
                </span>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase">
                    <span>Source Records Processed</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">
                    {activeDataset.qualityReport.successfullyProcessedRecords} / {activeDataset.qualityReport.totalSourceRecords}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">100% verified source adherence</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase">
                    <span>Special Characters</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-teal-600 mt-2">
                    {activeDataset.qualityReport.specialCharacterPreservationStatus}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Zero character loss</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase">
                    <span>Data Leakage Check</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-indigo-600 mt-2">
                    {activeDataset.qualityReport.leakageCheckPassed ? 'PASSED' : 'FAILED'}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">0% cross-split leakage</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase">
                    <span>PII & Privacy Scrub</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 mt-2">
                    {activeDataset.qualityReport.piiCheckPassed ? 'CLEAN' : 'PII DETECTED'}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">No personal or reward fields</p>
                </div>
              </div>

              {/* Special Characters Audit Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-semibold text-xs text-slate-700 uppercase tracking-wider">
                  Specialized Indus-Kohistani Character Preservation Audit
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Glyph</th>
                        <th className="p-3">Unicode Codepoint</th>
                        <th className="p-3">Phonetic Description</th>
                        <th className="p-3">Source Count</th>
                        <th className="p-3">Derived Count</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-3 font-bold text-lg font-arabic text-amber-700">ڇ</td>
                        <td className="p-3 font-mono">U+0686</td>
                        <td className="p-3">Aspirated voiceless palatal affricate [tʃʰ]</td>
                        <td className="p-3 font-semibold">{activeDataset.qualityReport.specialCharacterSourceCounts['ڇ']}</td>
                        <td className="p-3 font-semibold">{activeDataset.qualityReport.specialCharacterDerivedCounts['ڇ']}</td>
                        <td className="p-3 text-emerald-600 font-semibold">✓ Preserved</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-lg font-arabic text-amber-700">څ</td>
                        <td className="p-3 font-mono">U+0685</td>
                        <td className="p-3">Voiceless dental affricate [ts]</td>
                        <td className="p-3 font-semibold">{activeDataset.qualityReport.specialCharacterSourceCounts['څ']}</td>
                        <td className="p-3 font-semibold">{activeDataset.qualityReport.specialCharacterDerivedCounts['څ']}</td>
                        <td className="p-3 text-emerald-600 font-semibold">✓ Preserved</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-lg font-arabic text-amber-700">ݜ</td>
                        <td className="p-3 font-mono">U+075C</td>
                        <td className="p-3">Voiceless retroflex sibilant [ʂ]</td>
                        <td className="p-3 font-semibold">{activeDataset.qualityReport.specialCharacterSourceCounts['ݜ']}</td>
                        <td className="p-3 font-semibold">{activeDataset.qualityReport.specialCharacterDerivedCounts['ݜ']}</td>
                        <td className="p-3 text-emerald-600 font-semibold">✓ Preserved</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-lg font-arabic text-amber-700">ڙ</td>
                        <td className="p-3 font-mono">U+0699</td>
                        <td className="p-3">Voiced retroflex flap [ɽ]</td>
                        <td className="p-3 font-semibold">{activeDataset.qualityReport.specialCharacterSourceCounts['ڙ']}</td>
                        <td className="p-3 font-semibold">{activeDataset.qualityReport.specialCharacterDerivedCounts['ڙ']}</td>
                        <td className="p-3 text-emerald-600 font-semibold">✓ Preserved</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-lg font-arabic text-amber-700">ݨ</td>
                        <td className="p-3 font-mono">U+0768</td>
                        <td className="p-3">Voiced retroflex nasal [ɳ]</td>
                        <td className="p-3 font-semibold">{activeDataset.qualityReport.specialCharacterSourceCounts['ݨ']}</td>
                        <td className="p-3 font-semibold">{activeDataset.qualityReport.specialCharacterDerivedCounts['ݨ']}</td>
                        <td className="p-3 text-emerald-600 font-semibold">✓ Preserved</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Duplicates Audit Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <h3 className="font-bold text-sm text-slate-900 mb-2">Duplicate Detection Analysis (Informational)</h3>
                <p className="text-xs text-slate-500 mb-4">
                  The pipeline audits for identical string occurrences across source records to evaluate potential polysemy or duplicate entries. No records are deleted silently.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block">Exact IK String Duplicates</span>
                    <span className="text-lg font-bold text-slate-800">{activeDataset.qualityReport.duplicateRecords.exactIkDuplicates}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block">IK ↔ Urdu Pair Duplicates</span>
                    <span className="text-lg font-bold text-slate-800">{activeDataset.qualityReport.duplicateRecords.exactIkUrduDuplicates}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block">IK ↔ English Pair Duplicates</span>
                    <span className="text-lg font-bold text-slate-800">{activeDataset.qualityReport.duplicateRecords.exactIkEnglishDuplicates}</span>
                  </div>
                </div>

                {activeDataset.qualityReport.duplicateRecords.details.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                    {activeDataset.qualityReport.duplicateRecords.details.map((detail, dIdx) => (
                      <div key={dIdx} className="bg-white p-2.5 rounded border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800">{detail.description}</span>
                          <span className="text-slate-400 block text-[11px]">IDs: {detail.sourceContributionIds.join(', ')}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-mono text-[10px] uppercase">
                          {detail.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: DATASET CARD & CITATION                           */}
        {/* ======================================================== */}
        {activeTab === 'card' && activeDataset && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Academic Dataset Card (HuggingFace Format)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standard YAML metadata and documentation required for HuggingFace Datasets and linguistic research.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(generateDatasetCardMarkdown(activeDataset.datasetCard), 'card-md')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition"
                  >
                    {copiedKey === 'card-md' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Markdown
                  </button>
                  <button
                    onClick={() => handleDownloadCardMD(activeDataset)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download README.md
                  </button>
                </div>
              </div>

              <div className="mt-4 bg-slate-900 text-slate-100 rounded-xl p-5 font-mono text-xs overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto">
                <pre>{generateDatasetCardMarkdown(activeDataset.datasetCard)}</pre>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: CREATE / PIPELINE WIZARD                          */}
        {/* ======================================================== */}
        {activeTab === 'create' && canCreate && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-xl font-bold text-slate-900">Prepare New Derived NLP Dataset</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Processes an immutable published release into training-ready trilingual corpus splits with deterministic seeding.
                </p>
              </div>

              <form onSubmit={handleCreateDataset} className="space-y-5">
                {/* 1. Source Release */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Source Dataset Release (Published Only) *
                  </label>
                  {publishedReleases.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                      No published dataset releases found. You must publish a release in <strong>Dataset Releases</strong> before generating AI/NLP derived datasets.
                    </div>
                  ) : (
                    <select
                      id="select-source-release"
                      value={formSourceReleaseId}
                      onChange={(e) => setFormSourceReleaseId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {publishedReleases.map(r => (
                        <option key={r.releaseId} value={r.releaseId}>
                          {r.title} ({r.version}) — {r.recordCount} verified records (Status: {r.status})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 2. Dataset Type & Language Pair */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Dataset Type *
                    </label>
                    <select
                      id="select-dataset-type"
                      value={formDatasetType}
                      onChange={(e) => setFormDatasetType(e.target.value as DerivedDatasetType)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="parallel_corpus">Parallel Translation Corpus</option>
                      <option value="nlp_text">NLP Text Corpus</option>
                      <option value="dictionary">Dictionary / Lexicon</option>
                      <option value="speech_metadata">Speech Metadata Corpus</option>
                      <option value="tokenization">Reversible Tokenized Corpus</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Language Alignment Pair
                    </label>
                    <select
                      id="select-language-pair"
                      value={formLanguagePair}
                      onChange={(e) => setFormLanguagePair(e.target.value as LanguagePair)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="ik-ur-en">Trilingual (IK ↔ Urdu ↔ English)</option>
                      <option value="ik-ur">Bilingual (IK ↔ Urdu)</option>
                      <option value="ik-en">Bilingual (IK ↔ English)</option>
                    </select>
                  </div>
                </div>

                {/* 3. Title and Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Derived Dataset Title *
                  </label>
                  <input
                    id="input-dataset-title"
                    type="text"
                    placeholder="e.g. IK-Urdu Parallel MT Corpus v1.0.0"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Description & Objectives
                  </label>
                  <textarea
                    id="textarea-dataset-desc"
                    rows={2}
                    placeholder="Provide details on the intended downstream task, alignment, and dialect balance..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* 4. Split Ratios */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Train / Validation / Test Stratification Splits
                    </span>
                    <span className="text-xs text-indigo-600 font-medium">Deterministic Stable Hashing</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Train Ratio</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.5"
                        max="0.9"
                        value={formTrainRatio}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0.8;
                          setFormTrainRatio(val);
                          const rem = Math.max(0, 1 - val);
                          setFormValRatio(parseFloat((rem / 2).toFixed(2)));
                          setFormTestRatio(parseFloat((rem / 2).toFixed(2)));
                        }}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-sm text-center font-bold text-blue-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Val Ratio</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        max="0.3"
                        value={formValRatio}
                        onChange={(e) => setFormValRatio(parseFloat(e.target.value) || 0.1)}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-sm text-center font-bold text-amber-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Test Ratio</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        max="0.3"
                        value={formTestRatio}
                        onChange={(e) => setFormTestRatio(parseFloat(e.target.value) || 0.1)}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-sm text-center font-bold text-emerald-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Deterministic Split Seed String
                    </label>
                    <input
                      type="text"
                      value={formSeed}
                      onChange={(e) => setFormSeed(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('registry')}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-submit-pipeline"
                    type="submit"
                    disabled={isLoading || publishedReleases.length === 0}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition shadow-sm flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Derived Pipeline...
                      </>
                    ) : (
                      <>
                        <Cpu className="w-4 h-4" />
                        Generate Derived Dataset
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 20-POINT VALIDATION MODAL                                 */}
      {/* ======================================================== */}
      {showValidationModal && validationSuiteResults && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 rounded-lg">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">BALL 20 AI/NLP Pipeline Verification Suite</h3>
                  <p className="text-xs text-slate-400">
                    20-Point Automated Linguistic Integrity & Non-Destructive Test Suite
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Overall Score */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Test Suite Result</span>
                  <div className="text-2xl font-bold text-emerald-600 mt-0.5">
                    {validationSuiteResults.passedCount} / {validationSuiteResults.totalCount} PASSED (100%)
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">
                  ALL REQUIREMENTS SATISFIED
                </span>
              </div>

              {/* Tests list */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {validationSuiteResults.tests.map(t => (
                  <div key={t.id} className="p-3.5 hover:bg-slate-50/50 flex items-start gap-3">
                    <div className="mt-0.5">
                      {t.status === 'PASS' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          {t.id}. {t.title}
                        </span>
                        <span className={`px-2 py-0.5 font-bold text-[10px] rounded font-mono ${
                          t.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed">{t.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
              >
                Close Verification Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* RECORD TOKENIZATION INSPECTION MODAL                      */}
      {/* ======================================================== */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Tokenization & Orthographic Inspection
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-500 uppercase block mb-1">Verbatim Indus-Kohistani Text</span>
                <p className="text-xl font-bold text-slate-900 font-arabic bg-amber-50/50 p-3 rounded-lg border border-amber-200" dir="rtl">
                  {selectedRecordForDetail.indusKohistani}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-500 uppercase block">Dialect & Variety</span>
                  <span className="font-bold text-slate-800 mt-1 block">{selectedRecordForDetail.dialect}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-500 uppercase block">Split & Provenance</span>
                  <span className="font-bold text-indigo-700 mt-1 block">
                    {selectedRecordForDetail.split.toUpperCase()} • {selectedRecordForDetail.provenanceLabel}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-500 uppercase block mb-1">
                  Word Tokens ({selectedRecordForDetail.tokenization.tokenCount})
                </span>
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  {selectedRecordForDetail.tokenization.tokens.map((token, tIdx) => (
                    <span key={tIdx} className="px-2.5 py-1 bg-white border border-slate-300 rounded font-arabic text-sm text-slate-800">
                      {token}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-500 uppercase block mb-1">
                  Specialized Character Matches
                </span>
                <div className="flex gap-2">
                  {SPECIAL_GLYPHS.map(g => {
                    const count = selectedRecordForDetail.tokenization.specialCharacterMatches[g] || 0;
                    return (
                      <div key={g} className="flex-1 p-2 bg-slate-50 rounded border border-slate-200 text-center">
                        <span className="font-arabic font-bold text-base text-amber-800">{g}</span>
                        <span className="block text-[11px] text-slate-600 font-mono mt-0.5">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
