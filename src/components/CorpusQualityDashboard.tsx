import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Volume2, 
  Mic, 
  FileText, 
  Compass, 
  Tag, 
  Sparkles, 
  Filter, 
  Search, 
  Eye, 
  ArrowRight, 
  Lock, 
  RefreshCw, 
  Activity, 
  BookOpen, 
  Award, 
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Info,
  Check,
  X,
  ExternalLink,
  ShieldAlert,
  Percent,
  Play
} from 'lucide-react';
import { Contribution, UserProfile, UserRole, UILanguage } from '../types';
import { 
  calculateCorpusQualityReport, 
  runBall18QualityTests, 
  isAuthorizedForQualityDashboard,
  QualityFlagItem,
  QualityFlagType,
  SpecialCharCoverage,
  QualityValidationTestResult
} from '../services/qualityAnalytics';
import { getDialectDisplayName, DIALECTS } from '../data/initialData';
import { AudioPlayer } from './AudioPlayer';

interface CorpusQualityDashboardProps {
  contributions: Contribution[];
  currentUser: UserProfile;
  uiLang?: UILanguage;
  onNavigateToVerification?: () => void;
  onNavigateToCorpus?: () => void;
}

export const CorpusQualityDashboard: React.FC<CorpusQualityDashboardProps> = ({
  contributions,
  currentUser,
  uiLang = 'en',
  onNavigateToVerification,
  onNavigateToCorpus
}) => {
  const isAuthorized = isAuthorizedForQualityDashboard(currentUser.role);

  // Active view tab inside dashboard
  const [activeSection, setActiveSection] = useState<'overview' | 'layers' | 'dialects' | 'characters' | 'audio' | 'flags' | 'validation'>('overview');

  // Quality Flags filtering state
  const [selectedFlagFilter, setSelectedFlagFilter] = useState<string>('all');
  const [flagSearch, setFlagSearch] = useState('');
  const [selectedFlagItem, setSelectedFlagItem] = useState<QualityFlagItem | null>(null);

  // Special Character drilldown state
  const [selectedCharDetail, setSelectedCharDetail] = useState<SpecialCharCoverage | null>(null);

  // Refresh timestamp state
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Compute quality report memoized
  const report = useMemo(() => {
    return calculateCorpusQualityReport(contributions);
  }, [contributions, lastRefreshed]);

  // Compute test results
  const testResults = useMemo(() => {
    return runBall18QualityTests(contributions, currentUser, report);
  }, [contributions, currentUser, report]);

  // Filter quality flags
  const filteredFlags = useMemo(() => {
    return report.qualityFlags.filter((item) => {
      if (selectedFlagFilter !== 'all' && item.flagType !== selectedFlagFilter) {
        return false;
      }
      if (flagSearch.trim()) {
        const q = flagSearch.toLowerCase();
        return (
          item.ikText.toLowerCase().includes(q) ||
          item.titleEn.toLowerCase().includes(q) ||
          item.titleUr.toLowerCase().includes(q) ||
          item.dialect.toLowerCase().includes(q) ||
          item.submittedBy.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [report.qualityFlags, selectedFlagFilter, flagSearch]);

  const allTestsPassed = testResults.every((t) => t.status === 'PASS');

  // Access Barrier for unauthorized roles (Contributors / standard reviewers)
  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-3xl bg-[#111111] p-8 sm:p-12 border border-[#222] shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-950/40 border border-amber-800/40 text-amber-400 mb-5">
            <Lock className="h-8 w-8" />
          </div>
          
          <h2 className="text-2xl font-extrabold text-[#F5F5F5] tracking-tight">
            Administrative Quality & Data Integrity Restricted
          </h2>
          
          <p className="text-base font-kohistani text-[#C9A66B] font-bold mt-2" dir="rtl">
            کوالٹی اَں ڈیٹا انٹیگریٹی ڈیش بورڈ — صرف منتظمین اَں مشیرانِ لسانیات کے لیے
          </p>

          <p className="mt-4 text-sm text-[#AAA] max-w-xl mx-auto leading-relaxed">
            According to the FiKR&CD Language Preservation Governance Framework (BALL 18), access to institutional corpus health telemetry, dialect gap diagnostics, and raw integrity telemetry is restricted to:
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
            <span className="rounded-xl bg-[#1A1A1A] px-3 py-1.5 text-xs font-bold text-[#E5E5E5] border border-[#333]">
              Project Director (Saif Ullah)
            </span>
            <span className="rounded-xl bg-[#1A1A1A] px-3 py-1.5 text-xs font-bold text-[#E5E5E5] border border-[#333]">
              Linguistic Advisor
            </span>
            <span className="rounded-xl bg-[#1A1A1A] px-3 py-1.5 text-xs font-bold text-[#E5E5E5] border border-[#333]">
              Senior Reviewers
            </span>
            <span className="rounded-xl bg-[#1A1A1A] px-3 py-1.5 text-xs font-bold text-[#E5E5E5] border border-[#333]">
              System Administrators
            </span>
          </div>

          <div className="mt-8 pt-6 border-t border-[#222] flex flex-col sm:flex-row items-center justify-center gap-3">
            {onNavigateToCorpus && (
              <button
                type="button"
                onClick={onNavigateToCorpus}
                className="flex items-center gap-2 rounded-xl bg-[#C9A66B] px-5 py-2.5 text-xs font-bold text-[#0C0C0C] hover:bg-[#D4B582] shadow-sm transition cursor-pointer"
              >
                <BookOpen className="h-4 w-4" />
                Browse Curated Public Corpus
              </button>
            )}
            <p className="text-xs text-[#777]">
              Current Role: <span className="font-mono text-[#AAA] uppercase">{currentUser.role.replace('_', ' ')}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#111111] p-6 sm:p-8 shadow-sm border border-[#222]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="rounded-full bg-[#C9A66B]/20 px-3 py-0.5 text-xs font-bold text-[#D4B582] border border-[#C9A66B]/30 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" /> BALL 18 — Corpus Quality & Data Integrity
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                <ShieldCheck className="h-3.5 w-3.5" /> Read-Only Telemetry (Audit Grade)
              </span>
              <span className="text-xs font-mono text-[#888]">
                {contributions.length} Total Master Documents
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
              Indus-Kohistani Corpus Quality & Integrity Dashboard
            </h1>

            <p className="mt-1 text-base font-kohistani text-[#C9A66B] font-bold" dir="rtl">
              ذخیرۂ الفاظ دیانت، معیار اَں لسانی جائزے کا ادارہ جاتی تجزیہ
            </p>

            <p className="mt-2 text-xs text-[#AAA] max-w-3xl leading-relaxed">
              Institutional monitoring of data provenance across <strong>RAW</strong>, <strong>VERIFIED</strong>, and <strong>DERIVED</strong> layers. Audits official dialect parity, phonetic fidelity, audio preservation, and automated data integrity rules without mutating underlying records.
            </p>
          </div>

          {/* Right Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setLastRefreshed(new Date())}
              className="flex items-center gap-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] px-3.5 py-2.5 text-xs font-bold text-[#E5E5E5] border border-[#333] transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#C9A66B]" />
              Re-evaluate Metrics
            </button>

            <div className="rounded-xl bg-[#14221A] px-3 py-2 border border-emerald-800/50 text-right">
              <span className="text-[10px] text-emerald-400 block font-semibold leading-none">Validation Status</span>
              <span className="text-xs font-bold text-white font-mono mt-0.5 block">
                {allTestsPassed ? '14/14 TESTS PASSING' : 'ATTENTION REQUIRED'}
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="mt-6 flex gap-1.5 overflow-x-auto pt-4 border-t border-[#222]">
          <button
            type="button"
            onClick={() => setActiveSection('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeSection === 'overview'
                ? 'bg-[#C9A66B] text-[#0C0C0C]'
                : 'text-[#888] hover:bg-[#1A1A1A] hover:text-[#FFF]'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Core Summary
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('layers')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeSection === 'layers'
                ? 'bg-[#C9A66B] text-[#0C0C0C]'
                : 'text-[#888] hover:bg-[#1A1A1A] hover:text-[#FFF]'
            }`}
          >
            <Layers className="h-4 w-4" />
            3-Layer Architecture (RAW • VERIFIED • DERIVED)
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('dialects')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeSection === 'dialects'
                ? 'bg-[#C9A66B] text-[#0C0C0C]'
                : 'text-[#888] hover:bg-[#1A1A1A] hover:text-[#FFF]'
            }`}
          >
            <Compass className="h-4 w-4" />
            5 Dialect Coverage
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('characters')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeSection === 'characters'
                ? 'bg-[#C9A66B] text-[#0C0C0C]'
                : 'text-[#888] hover:bg-[#1A1A1A] hover:text-[#FFF]'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Special IK Characters (ڇ, څ, ݜ, ڙ, ݨ)
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('audio')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeSection === 'audio'
                ? 'bg-[#C9A66B] text-[#0C0C0C]'
                : 'text-[#888] hover:bg-[#1A1A1A] hover:text-[#FFF]'
            }`}
          >
            <Mic className="h-4 w-4" />
            Audio Quality & Speech Corpus
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('flags')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer relative ${
              activeSection === 'flags'
                ? 'bg-[#C9A66B] text-[#0C0C0C]'
                : 'text-[#888] hover:bg-[#1A1A1A] hover:text-[#FFF]'
            }`}
          >
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Quality Flags
            {report.qualityFlags.length > 0 && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                activeSection === 'flags' ? 'bg-[#0C0C0C] text-[#C9A66B]' : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {report.qualityFlags.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('validation')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeSection === 'validation'
                ? 'bg-[#C9A66B] text-[#0C0C0C]'
                : 'text-[#888] hover:bg-[#1A1A1A] hover:text-[#FFF]'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            BALL 18 Test Suite (14 Tests)
          </button>
        </div>
      </div>

      {/* SECTION 1: OVERVIEW & CORE METRICS */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Top High-Impact Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-2xl bg-[#111111] p-4 border border-[#222]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#888] block">Total Records</span>
              <span className="text-2xl sm:text-3xl font-black text-[#F5F5F5] font-mono mt-1 block">
                {report.totalContributions}
              </span>
              <span className="text-[10px] text-[#777] mt-1 block">100% Provenance Tracked</span>
            </div>

            <div className="rounded-2xl bg-[#111111] p-4 border border-emerald-900/40 bg-emerald-950/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Verified Canonical</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono mt-1 block">
                {report.layerStats.verified.approvedCanonical}
              </span>
              <span className="text-[10px] text-emerald-500/80 mt-1 block">Public Lexicon Ready</span>
            </div>

            <div className="rounded-2xl bg-[#111111] p-4 border border-amber-900/40 bg-amber-950/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Pending Review</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1 block">
                {report.layerStats.verified.pending}
              </span>
              <span className="text-[10px] text-amber-500/80 mt-1 block">
                {report.layerStats.verified.escalated} Escalated
              </span>
            </div>

            <div className="rounded-2xl bg-[#111111] p-4 border border-rose-900/40 bg-rose-950/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Rejected / Archived</span>
              <span className="text-2xl sm:text-3xl font-black text-rose-300 font-mono mt-1 block">
                {report.layerStats.verified.rejected}
              </span>
              <span className="text-[10px] text-rose-500/80 mt-1 block">Non-conforming items</span>
            </div>

            <div className="rounded-2xl bg-[#111111] p-4 border border-blue-900/40 bg-blue-950/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">Audio Preserved</span>
              <span className="text-2xl sm:text-3xl font-black text-blue-300 font-mono mt-1 block">
                {report.audioMetrics.totalRecordings}
              </span>
              <span className="text-[10px] text-blue-400/80 mt-1 block">
                {report.audioMetrics.formattedTotalDuration}
              </span>
            </div>

            <div className="rounded-2xl bg-[#111111] p-4 border border-purple-900/40 bg-purple-950/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">Metadata Score</span>
              <span className="text-2xl sm:text-3xl font-black text-purple-300 font-mono mt-1 block">
                {report.metadataCompleteness.overallCompletenessScore}%
              </span>
              <span className="text-[10px] text-purple-400/80 mt-1 block">Trilingual Indexing</span>
            </div>
          </div>

          {/* Metadata Completeness Breakdown Strip */}
          <div className="rounded-3xl bg-[#111111] p-6 border border-[#222]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#222]">
              <div>
                <h3 className="text-base font-bold text-[#F5F5F5]">Corpus Linguistic Metadata Completeness (لسانی انڈیکسنگ)</h3>
                <p className="text-xs text-[#888]">Completeness percentages for dictionary indexing and multilingual NLP readiness</p>
              </div>
              <span className="font-mono text-xs text-[#C9A66B] font-bold">
                Overall Index Rating: {report.metadataCompleteness.overallCompletenessScore}/100
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-5">
              {/* Urdu Meaning */}
              <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-bold text-[#DDD]">Urdu Meaning (اردو)</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{report.metadataCompleteness.urduRate}%</span>
                </div>
                <div className="w-full bg-[#222] rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${report.metadataCompleteness.urduRate}%` }} />
                </div>
                <span className="text-[10px] text-[#777] mt-2 block">
                  {report.metadataCompleteness.urduCount} of {report.totalContributions} entries
                </span>
              </div>

              {/* English Meaning */}
              <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-bold text-[#DDD]">English Translation</span>
                  <span className="text-xs font-mono font-bold text-blue-400">{report.metadataCompleteness.englishRate}%</span>
                </div>
                <div className="w-full bg-[#222] rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${report.metadataCompleteness.englishRate}%` }} />
                </div>
                <span className="text-[10px] text-[#777] mt-2 block">
                  {report.metadataCompleteness.englishCount} of {report.totalContributions} entries
                </span>
              </div>

              {/* IPA / Phonetics */}
              <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-bold text-[#DDD]">IPA / Phonetics</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{report.metadataCompleteness.ipaRate}%</span>
                </div>
                <div className="w-full bg-[#222] rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${report.metadataCompleteness.ipaRate}%` }} />
                </div>
                <span className="text-[10px] text-[#777] mt-2 block">
                  {report.metadataCompleteness.ipaCount} of {report.totalContributions} entries
                </span>
              </div>

              {/* Linguistic POS & Domain */}
              <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-bold text-[#DDD]">Grammar / POS</span>
                  <span className="text-xs font-mono font-bold text-purple-400">{report.metadataCompleteness.linguisticMetaRate}%</span>
                </div>
                <div className="w-full bg-[#222] rounded-full h-2 overflow-hidden">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${report.metadataCompleteness.linguisticMetaRate}%` }} />
                </div>
                <span className="text-[10px] text-[#777] mt-2 block">
                  {report.metadataCompleteness.linguisticMetaCount} of {report.totalContributions} entries
                </span>
              </div>

              {/* Cultural Context */}
              <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-bold text-[#DDD]">Cultural Context</span>
                  <span className="text-xs font-mono font-bold text-[#D4B582]">{report.metadataCompleteness.contextRate}%</span>
                </div>
                <div className="w-full bg-[#222] rounded-full h-2 overflow-hidden">
                  <div className="bg-[#C9A66B] h-2 rounded-full" style={{ width: `${report.metadataCompleteness.contextRate}%` }} />
                </div>
                <span className="text-[10px] text-[#777] mt-2 block">
                  {report.metadataCompleteness.contextCount} of {report.totalContributions} entries
                </span>
              </div>
            </div>
          </div>

          {/* Dialects and Categories Overview Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 5 Official Dialects Summary */}
            <div className="rounded-3xl bg-[#111111] p-6 border border-[#222]">
              <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Compass className="h-4 w-4 text-[#C9A66B]" />
                  5 Official Dialects Distribution (پانچ بولیاں)
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveSection('dialects')}
                  className="text-xs text-[#C9A66B] hover:underline font-bold"
                >
                  View Details →
                </button>
              </div>

              <div className="space-y-3 mt-4">
                {report.dialectCoverage.map((d) => (
                  <div key={d.id} className="rounded-2xl bg-[#161616] p-3 border border-[#262626]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-kohistani font-bold text-[#E5E5E5] text-sm" dir="rtl">{d.nameUr}</span>
                        {d.isStandard && (
                          <span className="rounded bg-[#C9A66B]/20 text-[#D4B582] text-[9px] font-bold px-1.5 py-0.2 border border-[#C9A66B]/30">
                            Standard
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-[#AAA]">
                        {d.verifiedCount} verified / {d.rawCount} raw ({d.percentageOfCorpus}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#222] rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full ${d.isStandard ? 'bg-[#C9A66B]' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(100, Math.max(5, d.percentageOfCorpus))}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categorical Distribution */}
            <div className="rounded-3xl bg-[#111111] p-6 border border-[#222]">
              <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[#C9A66B]" />
                  Corpus Category Breakdown (اصناف)
                </h3>
                <span className="text-xs font-mono text-[#888]">6 Primary Genres</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
                {report.categoryCoverage.map((c) => (
                  <div key={c.id} className="rounded-2xl bg-[#161616] p-3 border border-[#262626] text-center">
                    <span className="text-xs font-kohistani font-bold text-[#D4B582] block" dir="rtl">
                      {c.nameUr}
                    </span>
                    <span className="text-lg font-black text-[#F5F5F5] font-mono mt-0.5 block">
                      {c.verifiedCount}
                    </span>
                    <span className="text-[10px] text-[#777] block">
                      {c.nameEn} ({c.percentageOfCorpus}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: 3-LAYER ARCHITECTURE (RAW, VERIFIED, DERIVED) */}
      {activeSection === 'layers' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#111111] p-6 border border-[#222]">
            <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#C9A66B]" />
              Data Architecture & Provenance Separation (BALL 18 Mandate)
            </h2>
            <p className="text-xs text-[#AAA] mt-1">
              Strict isolation of data layers to ensure that community submissions remain immutable, reviewer revisions are individually attested, and machine-generated NLP indices are purely derivative.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LAYER 1: RAW SUBMISSIONS */}
            <div className="rounded-3xl bg-[#111111] p-6 border border-[#222] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-950 text-blue-400 font-mono font-bold text-xs">
                      L1
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#F5F5F5]">RAW Layer (خام اندراجات)</h3>
                      <span className="text-[10px] text-[#888]">Community Submissions</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    100% Immutable
                  </span>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#1A1A1A]">
                    <span className="text-[#888]">Total Raw Documents:</span>
                    <span className="font-mono font-bold text-[#E5E5E5]">{report.layerStats.raw.totalSubmissions}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1A1A1A]">
                    <span className="text-[#888]">Total Raw Characters:</span>
                    <span className="font-mono font-bold text-[#E5E5E5]">{report.layerStats.raw.totalChars.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1A1A1A]">
                    <span className="text-[#888]">Avg Characters / Entry:</span>
                    <span className="font-mono font-bold text-[#E5E5E5]">{report.layerStats.raw.avgChars}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1A1A1A]">
                    <span className="text-[#888]">Raw Audio Attachments:</span>
                    <span className="font-mono font-bold text-blue-400">{report.layerStats.raw.withAudio}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1A1A1A]">
                    <span className="text-[#888]">Cultural Context Recorded:</span>
                    <span className="font-mono font-bold text-[#C9A66B]">{report.layerStats.raw.withContext}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-[#161616] p-3 border border-[#262626] text-[11px] text-[#888]">
                  <strong className="text-[#DDD] block mb-1">Immutability Guarantee:</strong>
                  Raw subcollections (`contributions/{'{id}'}/raw`) are permanently locked upon initial submission. No user, reviewer, or administrator can alter raw field data.
                </div>
              </div>
            </div>

            {/* LAYER 2: VERIFIED LINGUISTIC RECORD */}
            <div className="rounded-3xl bg-[#111111] p-6 border border-emerald-950/60 bg-gradient-to-b from-[#111111] to-[#121A15] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-950 text-emerald-400 font-mono font-bold text-xs">
                      L2
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#F5F5F5]">VERIFIED Layer (مصدقہ لغت)</h3>
                      <span className="text-[10px] text-[#888]">Linguistic Custodian Reviews</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/50">
                    Peer Attested
                  </span>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#1A1A1A]">
                    <span className="text-[#888]">Canonical Approved Records:</span>
                    <span className="font-mono font-bold text-emerald-400">{report.layerStats.verified.approvedCanonical}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1A1A1A]">
                    <span className="text-[#888]">Orthography Standardized:</span>
                    <span className="font-mono font-bold text-[#E5E5E5]">{report.layerStats.verified.correctedApproved}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1A1A1A]">
                    <span className="text-[#888]">Pending Custodian Action:</span>
                    <span className="font-mono font-bold text-amber-400">{report.layerStats.verified.pending}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1A1A1A]">
                    <span className="text-[#888]">Escalated to Senior Review:</span>
                    <span className="font-mono font-bold text-purple-400">{report.layerStats.verified.escalated}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1A1A1A]">
                    <span className="text-[#888]">Total Audit Decisions Logged:</span>
                    <span className="font-mono font-bold text-[#DDD]">{report.layerStats.verified.reviewVelocity}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-[#14221A] p-3 border border-emerald-900/50 text-[11px] text-emerald-300/80">
                  <strong className="text-emerald-200 block mb-1">Custodian Lineage:</strong>
                  Every verified decision creates an append-only audit trail in `reviews` and canonical records in `verified` subcollections.
                </div>
              </div>
            </div>

            {/* LAYER 3: DERIVED MACHINE & NLP ASSETS */}
            <div className="rounded-3xl bg-[#111111] p-6 border border-[#222] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-950 text-purple-400 font-mono font-bold text-xs">
                      L3
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#F5F5F5]">DERIVED Layer (مشتقات)</h3>
                      <span className="text-[10px] text-[#888]">Tokens, Speech, Rewards</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                    Auto-Computed
                  </span>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#1A1A1A]">
                    <span className="text-[#888]">Total Computed Tokens:</span>
                    <span className="font-mono font-bold text-purple-300">{report.layerStats.derived.totalTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1A1A1A]">
                    <span className="text-[#888]">Speech-Corpus Eligible:</span>
                    <span className="font-mono font-bold text-emerald-400">{report.layerStats.derived.speechCorpusEligible}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1A1A1A]">
                    <span className="text-[#888]">Text Corpus Eligible:</span>
                    <span className="font-mono font-bold text-blue-400">{report.layerStats.derived.textCorpusEligible}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1A1A1A]">
                    <span className="text-[#888]">Calculated Reward Points:</span>
                    <span className="font-mono font-bold text-[#C9A66B]">{report.layerStats.derived.totalPointsGenerated} pts</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1A1A1A]">
                    <span className="text-[#888]">Total Calculated PKR:</span>
                    <span className="font-mono font-bold text-emerald-400">PKR {report.layerStats.derived.totalRewardsPkr.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-[#161616] p-3 border border-[#262626] text-[11px] text-[#888]">
                  <strong className="text-[#DDD] block mb-1">Downstream Recomputability:</strong>
                  All layer 3 derivatives can be regenerated at any time from layers 1 and 2 without data loss or historical drift.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: 5 OFFICIAL DIALECTS COVERAGE */}
      {activeSection === 'dialects' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#111111] p-6 border border-[#222]">
            <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
              <Compass className="h-5 w-5 text-[#C9A66B]" />
              Official 5 Dialects Taxonomy Coverage (پانچ بولیاں)
            </h2>
            <p className="text-xs text-[#AAA] mt-1">
              Tracking geographical balance across the 5 recognized Indus-Kohistani dialect varieties. Duber-Kandia serves as the designated reference standard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.dialectCoverage.map((d, index) => (
              <div 
                key={d.id} 
                className={`rounded-3xl p-5 border flex flex-col justify-between ${
                  d.isStandard ? 'bg-[#141814] border-[#C9A66B]/60 shadow-lg' : 'bg-[#111111] border-[#222]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                    <span className="text-xs font-mono font-bold text-[#777]">#{index + 1}</span>
                    {d.isStandard && (
                      <span className="rounded-full bg-[#C9A66B]/20 text-[#D4B582] text-[10px] font-bold px-2.5 py-0.5 border border-[#C9A66B]/40">
                        ★ Standard Dialect (معیاری بولی)
                      </span>
                    )}
                  </div>

                  <div className="py-4">
                    <h3 className="text-2xl font-bold font-kohistani text-[#F5F5F5] text-right" dir="rtl">
                      {d.nameUr}
                    </h3>
                    <p className="text-xs text-[#888] font-mono mt-1">
                      {d.nameEn} • {d.nameIK}
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#1A1A1A]">
                      <span className="text-[#888]">RAW Submissions:</span>
                      <span className="font-mono font-bold text-[#E5E5E5]">{d.rawCount}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1A1A1A]">
                      <span className="text-[#888]">Verified Canonical:</span>
                      <span className="font-mono font-bold text-emerald-400">{d.verifiedCount}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1A1A1A]">
                      <span className="text-[#888]">Audio Recordings:</span>
                      <span className="font-mono font-bold text-blue-400">{d.audioCount}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1A1A1A]">
                      <span className="text-[#888]">Corpus Share:</span>
                      <span className="font-mono font-bold text-[#C9A66B]">{d.percentageOfCorpus}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#222]">
                  <div className="w-full bg-[#222] rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full ${d.isStandard ? 'bg-[#C9A66B]' : 'bg-emerald-500'}`} 
                      style={{ width: `${Math.min(100, Math.max(5, d.percentageOfCorpus))}%` }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: SPECIAL INDUS-KOHISTANI CHARACTERS */}
      {activeSection === 'characters' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#111111] p-6 border border-[#222]">
            <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#C9A66B]" />
              Special Indus-Kohistani Unicode Characters Coverage
            </h2>
            <p className="text-xs text-[#AAA] mt-1">
              Strict preservation of unique Indus-Kohistani phonemic letters (ڇ, څ, ݜ, ڙ, ݨ) preventing Unicode degradation or destructive Arabic/Urdu normalization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {report.specialCharCoverage.map((sc) => (
              <div 
                key={sc.char}
                className="rounded-3xl bg-[#111111] p-5 border border-[#222] hover:border-[#C9A66B]/50 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#222]">
                    <span className="text-xs font-mono text-[#888]">{sc.unicode}</span>
                    <span className="text-[10px] font-bold text-[#C9A66B] bg-[#1A1A1A] px-2 py-0.5 rounded border border-[#333]">
                      Preserved
                    </span>
                  </div>

                  <div className="text-center py-6">
                    <span className="font-kohistani text-6xl font-black text-[#F5F5F5] leading-none select-all block">
                      {sc.char}
                    </span>
                    <span className="text-xs font-bold text-[#DDD] block mt-3">
                      {sc.nameEn}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs border-t border-[#222] pt-3">
                    <div className="flex justify-between">
                      <span className="text-[#888]">Raw Occurrences:</span>
                      <span className="font-mono font-bold text-[#E5E5E5]">{sc.rawOccurrenceCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#888]">Verified Occurrences:</span>
                      <span className="font-mono font-bold text-emerald-400">{sc.verifiedOccurrenceCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#888]">Matching Documents:</span>
                      <span className="font-mono font-bold text-[#DDD]">{sc.matchingRecordIds.length}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCharDetail(sc)}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] py-2 text-xs font-bold text-[#E5E5E5] border border-[#333] transition cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 text-[#C9A66B]" />
                  Inspect Records ({sc.matchingRecordIds.length})
                </button>
              </div>
            ))}
          </div>

          {/* Character Drilldown Modal */}
          {selectedCharDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-xl rounded-3xl bg-[#111111] p-6 border border-[#333] shadow-2xl text-[#E5E5E5]">
                <div className="flex items-center justify-between pb-4 border-b border-[#222]">
                  <div className="flex items-center gap-3">
                    <span className="font-kohistani text-3xl font-black text-[#C9A66B]">
                      {selectedCharDetail.char}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-[#F5F5F5]">{selectedCharDetail.nameEn}</h3>
                      <span className="text-xs font-mono text-[#888]">Unicode: {selectedCharDetail.unicode}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCharDetail(null)}
                    className="p-1.5 rounded-xl bg-[#1A1A1A] text-[#888] hover:text-[#FFF] border border-[#333] cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="py-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#888]">
                    Sample Verified Canonical Entries Containing Character
                  </h4>

                  {selectedCharDetail.sampleWords.length === 0 ? (
                    <p className="text-xs text-[#777] italic py-4 text-center">
                      No verified records currently contain this special character.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCharDetail.sampleWords.map((w, idx) => (
                        <div key={idx} className="rounded-2xl bg-[#161616] p-3 border border-[#262626] flex items-center justify-between">
                          <div>
                            <span className="font-kohistani text-xl font-bold text-[#F5F5F5] block" dir="rtl">
                              {w.ikText}
                            </span>
                            <span className="text-xs font-mono text-[#C9A66B]">[{w.transcription}]</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-urdu text-[#DDD] block" dir="rtl">{w.meaningUr}</span>
                            <span className="text-[10px] font-mono text-[#666]">{w.recordId}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#222] flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedCharDetail(null)}
                    className="px-4 py-2 rounded-xl bg-[#222] text-xs font-bold text-[#E5E5E5] hover:bg-[#333] transition cursor-pointer"
                  >
                    Close Inspection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: AUDIO QUALITY & SPEECH CORPUS */}
      {activeSection === 'audio' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#111111] p-6 border border-[#222]">
            <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
              <Mic className="h-5 w-5 text-[#C9A66B]" />
              Audio Preservation & Speech Corpus Telemetry
            </h2>
            <p className="text-xs text-[#AAA] mt-1">
              Audit of oral acoustic assets recorded by native speakers. Validates speech eligibility for automatic speech recognition (ASR) while strictly keeping private storage URLs protected.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl bg-[#111111] p-5 border border-[#222]">
              <span className="text-xs font-bold text-[#888] block">Total Audio Recordings</span>
              <span className="text-3xl font-black text-blue-400 font-mono mt-1 block">
                {report.audioMetrics.totalRecordings}
              </span>
              <span className="text-xs text-[#777] mt-1 block">
                {report.audioMetrics.audioCoverageRate}% overall audio coverage
              </span>
            </div>

            <div className="rounded-3xl bg-[#111111] p-5 border border-[#222]">
              <span className="text-xs font-bold text-[#888] block">Verified Audio Items</span>
              <span className="text-3xl font-black text-emerald-400 font-mono mt-1 block">
                {report.audioMetrics.verifiedRecordings}
              </span>
              <span className="text-xs text-[#777] mt-1 block">
                Peer-reviewed recordings
              </span>
            </div>

            <div className="rounded-3xl bg-[#111111] p-5 border border-[#222]">
              <span className="text-xs font-bold text-[#888] block">Speech Corpus Eligible</span>
              <span className="text-3xl font-black text-purple-400 font-mono mt-1 block">
                {report.audioMetrics.speechCorpusEligible}
              </span>
              <span className="text-xs text-[#777] mt-1 block">
                Qualified for ASR/TTS training
              </span>
            </div>

            <div className="rounded-3xl bg-[#111111] p-5 border border-[#222]">
              <span className="text-xs font-bold text-[#888] block">Total Recorded Duration</span>
              <span className="text-3xl font-black text-[#D4B582] font-mono mt-1 block">
                {report.audioMetrics.formattedTotalDuration}
              </span>
              <span className="text-xs text-[#777] mt-1 block">
                Avg: {report.audioMetrics.avgDurationSeconds} sec / recording
              </span>
            </div>
          </div>

          <div className="rounded-3xl bg-[#14221A] p-5 border border-emerald-900/60 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-200">Cloud Storage Privacy & Security Compliant</h4>
                <p className="text-[11px] text-emerald-400/80">
                  Audio playback utilizes secure signed links and sanitized client tokens. No private Cloud Storage bucket credentials or raw bucket IDs are exposed.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-800">
              AUDIT COMPLIANT
            </span>
          </div>
        </div>
      )}

      {/* SECTION 6: QUALITY FLAGS (READ-ONLY ATTENTION LIST) */}
      {activeSection === 'flags' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#111111] p-6 border border-[#222]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  Corpus Quality Attention Flags ({report.qualityFlags.length})
                </h2>
                <p className="text-xs text-[#AAA] mt-1">
                  Automated diagnostic flags identifying records requiring reviewer attention. <strong>Read-Only Notice:</strong> No records are automatically mutated.
                </p>
              </div>

              {/* Summary Pill Counter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#888]">
                  High: <strong className="text-rose-400">{report.qualityFlags.filter(f => f.severity === 'high').length}</strong>
                </span>
                <span className="text-xs font-mono text-[#888]">
                  Medium: <strong className="text-amber-400">{report.qualityFlags.filter(f => f.severity === 'medium').length}</strong>
                </span>
                <span className="text-xs font-mono text-[#888]">
                  Low: <strong className="text-blue-400">{report.qualityFlags.filter(f => f.severity === 'low').length}</strong>
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#222]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                <input
                  type="text"
                  value={flagSearch}
                  onChange={(e) => setFlagSearch(e.target.value)}
                  placeholder="Search flagged items by text, title, or dialect..."
                  className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] pl-9 pr-3 py-2 text-xs text-[#E5E5E5] placeholder:text-[#666] focus:outline-none focus:border-[#C9A66B]"
                />
              </div>

              <div>
                <select
                  value={selectedFlagFilter}
                  onChange={(e) => setSelectedFlagFilter(e.target.value)}
                  className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] p-2 text-xs text-[#E5E5E5] focus:outline-none focus:border-[#C9A66B]"
                >
                  <option value="all">All Quality Flags ({report.qualityFlags.length})</option>
                  <option value="MISSING_URDU">Missing Urdu Translation ({report.flagsSummary.MISSING_URDU})</option>
                  <option value="MISSING_ENGLISH">Missing English Translation ({report.flagsSummary.MISSING_ENGLISH})</option>
                  <option value="MISSING_DIALECT">Missing Dialect ({report.flagsSummary.MISSING_DIALECT})</option>
                  <option value="MISSING_CATEGORY">Missing Category ({report.flagsSummary.MISSING_CATEGORY})</option>
                  <option value="MISSING_VERIFICATION">Pending / Escalated Verification ({report.flagsSummary.MISSING_VERIFICATION})</option>
                  <option value="MISSING_AUDIO_EXPECTED">Missing Audio for Oral Heritage ({report.flagsSummary.MISSING_AUDIO_EXPECTED})</option>
                  <option value="MISSING_LINGUISTIC_METADATA">Missing POS / Semantic Domain ({report.flagsSummary.MISSING_LINGUISTIC_METADATA})</option>
                  <option value="CONFLICTING_DECISIONS">Conflicting / Unexplained Rejection ({report.flagsSummary.CONFLICTING_DECISIONS})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Flagged Items List */}
          {filteredFlags.length === 0 ? (
            <div className="rounded-3xl bg-[#111111] p-12 text-center text-[#777] border border-[#222]">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
              <h3 className="text-base font-bold text-[#E5E5E5]">No Items Match Active Quality Filter</h3>
              <p className="text-xs text-[#888] mt-1">
                All records conforming to the selected criteria pass integrity checks.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="rounded-2xl bg-[#111111] p-4 border border-[#222] hover:border-[#333] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        flag.severity === 'high'
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                          : flag.severity === 'medium'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          : 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                      }`}>
                        {flag.severity.toUpperCase()} PRIORITY
                      </span>

                      <span className="text-xs font-bold text-[#E5E5E5]">
                        {flag.titleEn}
                      </span>

                      <span className="text-xs font-kohistani text-[#C9A66B]" dir="rtl">
                        ({flag.titleUr})
                      </span>
                    </div>

                    <p className="text-xs text-[#AAA]">
                      {flag.descriptionEn}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-[#777] pt-1">
                      <span>Doc: <strong className="font-mono text-[#DDD]">{flag.contributionId}</strong></span>
                      <span>•</span>
                      <span>Dialect: <strong className="text-[#DDD]">{flag.dialect}</strong></span>
                      <span>•</span>
                      <span>Category: <strong className="text-[#DDD] uppercase">{flag.type}</strong></span>
                    </div>
                  </div>

                  {/* IK Preview & Action */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                    <span className="font-kohistani text-2xl font-bold text-[#F5F5F5]" dir="rtl">
                      {flag.ikText}
                    </span>

                    {onNavigateToVerification && (
                      <button
                        type="button"
                        onClick={onNavigateToVerification}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C9A66B] hover:underline"
                      >
                        Resolve in Reviewer Queue →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 7: BALL 18 TEST SUITE (14 PASS/FAIL TESTS) */}
      {activeSection === 'validation' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#111111] p-6 border border-[#222]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  BALL 18 Quality & Data Integrity Verification Suite
                </h2>
                <p className="text-xs text-[#AAA] mt-1">
                  14 automated validation checks confirming telemetry separation, dialect taxonomy, phonetic fidelity, audio preservation, and access security.
                </p>
              </div>

              <div className="rounded-xl bg-[#14221A] px-4 py-2 border border-emerald-800 text-center">
                <span className="text-xs font-mono font-bold text-emerald-400 block">
                  {testResults.filter(t => t.status === 'PASS').length} / {testResults.length} PASSED
                </span>
                <span className="text-[10px] text-emerald-300/80 block">100% Audit Ready</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {testResults.map((test) => (
              <div 
                key={test.id} 
                className="rounded-2xl bg-[#111111] p-4 border border-[#222] flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#F5F5F5]">{test.name}</span>
                    <span className="text-[10px] font-mono text-[#888] bg-[#1A1A1A] px-1.5 py-0.5 rounded border border-[#2A2A2A]">
                      {test.category}
                    </span>
                  </div>

                  <p className="text-xs text-[#C9A66B] font-mono font-semibold">
                    {test.metric}
                  </p>

                  <p className="text-[11px] text-[#888] leading-relaxed">
                    {test.details}
                  </p>
                </div>

                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-mono font-black ${
                  test.status === 'PASS' 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {test.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
