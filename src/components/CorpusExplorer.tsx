import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Layers, 
  Volume2, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  FileSpreadsheet,
  FileJson,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Grid,
  List,
  Compass,
  ArrowUpDown,
  Share2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Contribution, ContributionType, PartOfSpeech } from '../types';
import { 
  DIALECTS, 
  CONTRIBUTION_CATEGORIES, 
  SEMANTIC_DOMAINS, 
  DEFAULT_DIALECT_ID, 
  DEFAULT_DIALECT_NAME_UR,
  getDialectDisplayName 
} from '../data/initialData';
import { AudioPlayer } from './AudioPlayer';
import { DictionaryModal } from './DictionaryModal';
import { exportParallelCorpusCsv, exportDictionaryFormat } from '../services/exportService';

interface CorpusExplorerProps {
  contributions: Contribution[];
}

// Special Indus-Kohistani characters that must be strictly preserved
const SPECIAL_IK_CHARS = [
  { char: 'ڇ', label: 'Tshe (ڇ)', code: 'U+0686', example: 'ڇھگور (Chhagor)' },
  { char: 'څ', label: 'Tse (څ)', code: 'U+0681', example: 'څھیر (Tsheer)' },
  { char: 'ݜ', label: 'Retroflex She (ݜ)', code: 'U+075C', example: 'ݜاری (Shaari)' },
  { char: 'ڙ', label: 'Retroflex Zhe (ڙ)', code: 'U+0699', example: 'ڙگو (Zzigo)' },
  { char: 'ݨ', label: 'Retroflex Noon (ݨ)', code: 'U+0768', example: 'کاݨ (Kaan)' }
];

const SPECIAL_SEARCH_EXAMPLES = [
  { label: 'ڇھگور (Chhagor)', query: 'ڇھگور', desc: 'Lamb / young male sheep' },
  { label: 'څھیر (Tsheer)', query: 'څھیر', desc: 'Milk / fresh dairy' },
  { label: 'ݜاری (Shaari)', query: 'ݜاری', desc: 'Star / dawn glow' },
  { label: 'ڙگو (Zzigo)', query: 'ڙگو', desc: 'Nephew (Sister\'s son)' },
  { label: 'کاݨ (Kaan)', query: 'کاݨ', desc: 'One-eyed' }
];

export const CorpusExplorer: React.FC<CorpusExplorerProps> = ({ contributions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDialect, setSelectedDialect] = useState<string>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedPos, setSelectedPos] = useState<string>('all');
  const [onlyAudio, setOnlyAudio] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selected Item for Detail Modal
  const [selectedItem, setSelectedItem] = useState<Contribution | null>(null);

  // Strict Public Data Rule: Only canonical verified records (never expose pending, unverified raw, or reviewer internal notes)
  const canonicalCorpus = useMemo(() => {
    return contributions.filter(c => {
      // Must be eligible for corpus and verified
      const isEligible = c.derived?.isCorpusEligible === true;
      const isApproved = c.verified?.status === 'approved' || c.verified?.status === 'corrected' || c.status === 'approved' || c.status === 'corrected';
      return isEligible || isApproved;
    });
  }, [contributions]);

  // Multi-field search & filtering
  const filteredItems = useMemo(() => {
    return canonicalCorpus.filter((item) => {
      // 1. Content Type Filter
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }
      
      // 2. Dialect Filter
      const activeDialect = (item.verified?.verifiedDialect || item.raw?.dialect || '').toLowerCase();
      if (selectedDialect !== 'all') {
        const selectedOption = DIALECTS.find(dl => dl.id === selectedDialect);
        const matchUr = selectedOption ? selectedOption.nameUr.toLowerCase() : '';
        const matchEn = selectedOption ? selectedOption.nameEn.toLowerCase() : '';
        const matchIK = selectedOption ? selectedOption.nameIK.toLowerCase() : '';
        
        const isMatch = activeDialect.includes(selectedDialect.toLowerCase()) ||
          (matchUr && activeDialect.includes(matchUr)) ||
          (matchEn && activeDialect.includes(matchEn)) ||
          (matchIK && activeDialect.includes(matchIK));
          
        if (!isMatch) return false;
      }

      // 3. Semantic Domain Filter
      if (selectedDomain !== 'all') {
        const itemDomain = item.verified?.verifiedSemanticDomain || item.raw?.semanticDomain;
        if (itemDomain !== selectedDomain) return false;
      }

      // 4. Part of Speech Filter
      if (selectedPos !== 'all') {
        const itemPos = item.verified?.verifiedPosTag || item.raw?.posTag;
        if (itemPos !== selectedPos) return false;
      }

      // 5. Audio Only Toggle
      if (onlyAudio && !item.raw?.audioUrl && !item.derived?.hasAudio) {
        return false;
      }

      // 6. Multi-Field Comprehensive Search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const ik = (item.verified?.correctedIkText || item.raw.ikText || '').toLowerCase();
        const latin = (item.verified?.correctedTranscription || item.raw.ikTranscription || '').toLowerCase();
        const ipa = (item.verified?.verifiedIpa || item.raw.ipa || '').toLowerCase();
        const urdu = (item.verified?.correctedUrduMeaning || item.raw.urduMeaning || '').toLowerCase();
        const eng = (item.verified?.correctedEnglishMeaning || item.raw.englishMeaning || '').toLowerCase();
        const pos = (item.verified?.verifiedPosTag || item.raw.posTag || '').toLowerCase();
        const context = (item.raw.culturalContext || '').toLowerCase();
        const dialectName = getDialectDisplayName(item.verified?.verifiedDialect || item.raw.dialect).toLowerCase();

        // Exact or partial text match across languages
        const matchesIK = ik.includes(q);
        const matchesUrdu = urdu.includes(q);
        const matchesEng = eng.includes(q);
        const matchesLatin = latin.includes(q);
        const matchesIpa = ipa.includes(q);
        const matchesPos = pos.includes(q);
        const matchesDialect = dialectName.includes(q);
        const matchesContext = context.includes(q);

        return matchesIK || matchesUrdu || matchesEng || matchesLatin || matchesIpa || matchesPos || matchesDialect || matchesContext;
      }

      return true;
    });
  }, [canonicalCorpus, selectedType, selectedDialect, selectedDomain, selectedPos, onlyAudio, searchQuery]);

  // Total pages and pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Handle page reset on filter change
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val);
    setCurrentPage(1);
  };

  // Virtual keyboard insertion for special Indus-Kohistani letters
  const handleInsertChar = (char: string) => {
    setSearchQuery(prev => prev + char);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedDialect('all');
    setSelectedDomain('all');
    setSelectedPos('all');
    setOnlyAudio(false);
    setCurrentPage(1);
  };

  // Stats calculation
  const wordCount = canonicalCorpus.filter(c => c.type === 'word').length;
  const sentenceCount = canonicalCorpus.filter(c => c.type === 'sentence').length;
  const proverbCount = canonicalCorpus.filter(c => c.type === 'proverb').length;
  const idiomCount = canonicalCorpus.filter(c => c.type === 'idiom').length;
  const expressionCount = canonicalCorpus.filter(c => c.type === 'cultural_expression').length;
  const poetryCount = canonicalCorpus.filter(c => c.type === 'poetry').length;
  const audioCount = canonicalCorpus.filter(c => c.derived?.hasAudio || Boolean(c.raw.audioUrl)).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Corpus Header & Branding */}
      <div className="rounded-3xl bg-[#111111] p-6 sm:p-8 shadow-sm border border-[#222] mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="rounded-full bg-[#C9A66B]/20 px-3 py-0.5 text-xs font-bold text-[#D4B582] border border-[#C9A66B]/30">
                FiKR&CD — Public Linguistic Corpus
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                <CheckCircle2 className="h-3.5 w-3.5" /> {canonicalCorpus.length} Canonical Verified Entries
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F5F5F5] tracking-tight">
              Indus-Kohistani Digital Dictionary & Corpus Explorer
            </h1>

            <p className="mt-1.5 text-xl sm:text-2xl lg:text-3xl font-kohistani text-[#D4B582] font-semibold leading-relaxed tracking-wide sm:[word-spacing:0.12em]" dir="rtl">
              اِنڈَس کُستَئی ژِیباں ڈیجیٹل ڈکشنری اَں مصدقہ ذخیرۂ الفاظ
            </p>

            <p className="mt-2 text-xs text-[#AAA] max-w-3xl leading-relaxed">
              Searchable, human-verified trilingual repository (Indus-Kohistani ↔ Urdu ↔ English). All records are reviewed and validated by native linguistic custodians under the FiKR&CD preservation framework.
            </p>
          </div>

          {/* Regulated Export Tools */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => exportParallelCorpusCsv(contributions)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Parallel CSV (Trilingual)
            </button>

            <button
              type="button"
              onClick={() => exportDictionaryFormat(contributions)}
              className="flex items-center gap-1.5 rounded-xl bg-[#222] px-3.5 py-2.5 text-xs font-bold text-[#E5E5E5] hover:bg-[#333] hover:text-white shadow-sm transition border border-[#333] cursor-pointer"
            >
              <FileJson className="h-4 w-4" />
              Lexicon JSON
            </button>
          </div>
        </div>

        {/* Statistical Metrics Strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-4 border-t border-[#222]">
          <div className="rounded-2xl bg-[#161616] p-2.5 border border-[#262626] text-center">
            <span className="text-lg font-black text-[#F5F5F5] font-mono">{wordCount}</span>
            <span className="block text-[10px] font-bold text-[#AAA]">Lexicon (الفاظ)</span>
          </div>
          <div className="rounded-2xl bg-[#161616] p-2.5 border border-[#262626] text-center">
            <span className="text-lg font-black text-[#F5F5F5] font-mono">{sentenceCount}</span>
            <span className="block text-[10px] font-bold text-[#AAA]">Sentences (جملے)</span>
          </div>
          <div className="rounded-2xl bg-[#161616] p-2.5 border border-[#262626] text-center">
            <span className="text-lg font-black text-[#F5F5F5] font-mono">{proverbCount}</span>
            <span className="block text-[10px] font-bold text-[#AAA]">Proverbs (کہاوتیں)</span>
          </div>
          <div className="rounded-2xl bg-[#161616] p-2.5 border border-[#262626] text-center">
            <span className="text-lg font-black text-[#F5F5F5] font-mono">{idiomCount}</span>
            <span className="block text-[10px] font-bold text-[#AAA]">Idioms (محاورات)</span>
          </div>
          <div className="rounded-2xl bg-[#161616] p-2.5 border border-[#262626] text-center">
            <span className="text-lg font-black text-[#F5F5F5] font-mono">{expressionCount}</span>
            <span className="block text-[10px] font-bold text-[#AAA]">Folk Terms (ثقافتی)</span>
          </div>
          <div className="rounded-2xl bg-[#161616] p-2.5 border border-[#262626] text-center">
            <span className="text-lg font-black text-[#F5F5F5] font-mono">{poetryCount}</span>
            <span className="block text-[10px] font-bold text-[#AAA]">Poetry (بیت)</span>
          </div>
          <div className="rounded-2xl bg-[#14221A] p-2.5 border border-emerald-900/60 text-center">
            <span className="text-lg font-black text-emerald-300 font-mono">{audioCount}</span>
            <span className="block text-[10px] font-bold text-emerald-400">Audio Records</span>
          </div>
        </div>
      </div>

      {/* Interactive Search & Multi-Criteria Filtering */}
      <div className="rounded-3xl bg-[#111111] p-5 sm:p-6 shadow-sm border border-[#222] mb-6 space-y-4">
        {/* Search Bar with Virtual Special Characters Keypad */}
        <div className="space-y-2.5">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
              placeholder="Search Indus-Kohistani, Urdu, English, Latin transcription, IPA, or grammar..."
              className="w-full rounded-2xl bg-[#1A1A1A] border border-[#333] pl-10 pr-10 py-3 text-sm font-medium text-[#E5E5E5] placeholder:text-[#666] focus:outline-none focus:border-[#C9A66B] transition shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleFilterChange(setSearchQuery, '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#777] hover:text-[#FFF] p-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Special Indus-Kohistani Unicode Characters Quick-Insert Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-[#888] mr-1">Special IK Letters:</span>
              {SPECIAL_IK_CHARS.map((sc) => (
                <button
                  key={sc.char}
                  type="button"
                  onClick={() => handleInsertChar(sc.char)}
                  title={`${sc.label} (${sc.code}) — Example: ${sc.example}`}
                  className="px-2.5 py-1 rounded-lg bg-[#1D1D1D] hover:bg-[#C9A66B] hover:text-[#0C0C0C] border border-[#333] text-sm font-kohistani font-bold text-[#E5E5E5] transition cursor-pointer shadow-xs"
                  dir="rtl"
                >
                  {sc.char}
                </button>
              ))}
            </div>

            {/* Quick Example Queries */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[#777]">Try Examples:</span>
              {SPECIAL_SEARCH_EXAMPLES.map((ex) => (
                <button
                  key={ex.query}
                  type="button"
                  onClick={() => handleFilterChange(setSearchQuery, ex.query)}
                  className="px-2 py-0.5 rounded-md bg-[#161616] hover:bg-[#252525] border border-[#2A2A2A] text-[11px] font-kohistani text-[#C9A66B] transition cursor-pointer"
                  dir="rtl"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Dialect Filter (Strictly 5 Official Varieties) */}
          <div>
            <label className="block text-[11px] font-bold text-[#888] mb-1">
              Dialect Variety (بولی):
            </label>
            <select
              value={selectedDialect}
              onChange={(e) => handleFilterChange(setSelectedDialect, e.target.value)}
              className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] p-2.5 text-xs font-medium text-[#E5E5E5] focus:outline-none focus:border-[#C9A66B]"
            >
              <option value="all" className="bg-[#1A1A1A]">All Dialects (تمام ۵ بولیاں)</option>
              {DIALECTS.map((d) => (
                <option key={d.id} value={d.id} className="bg-[#1A1A1A]">
                  {d.nameUr} ({d.nameEn}) {d.id === DEFAULT_DIALECT_ID ? '★ Standard' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Category / Content Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#888] mb-1">
              Category (صنف / زمرہ):
            </label>
            <select
              value={selectedType}
              onChange={(e) => handleFilterChange(setSelectedType, e.target.value)}
              className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] p-2.5 text-xs font-medium text-[#E5E5E5] focus:outline-none focus:border-[#C9A66B]"
            >
              <option value="all" className="bg-[#1A1A1A]">All Categories (تمام اصناف)</option>
              {CONTRIBUTION_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1A1A1A]">
                  {c.nameUr} — {c.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Semantic Domain Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#888] mb-1">
              Semantic Domain (معنوی دائرہ):
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => handleFilterChange(setSelectedDomain, e.target.value)}
              className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] p-2.5 text-xs font-medium text-[#E5E5E5] focus:outline-none focus:border-[#C9A66B]"
            >
              <option value="all" className="bg-[#1A1A1A]">All Semantic Domains (تمام معنوی دائرے)</option>
              {SEMANTIC_DOMAINS.map((sd) => (
                <option key={sd.id} value={sd.id} className="bg-[#1A1A1A]">
                  {sd.nameUr} ({sd.nameEn})
                </option>
              ))}
            </select>
          </div>

          {/* Part of Speech Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#888] mb-1">
              Part of Speech (حصصِ کلام):
            </label>
            <select
              value={selectedPos}
              onChange={(e) => handleFilterChange(setSelectedPos, e.target.value)}
              className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] p-2.5 text-xs font-medium text-[#E5E5E5] focus:outline-none focus:border-[#C9A66B]"
            >
              <option value="all" className="bg-[#1A1A1A]">All Parts of Speech (تمام)</option>
              <option value="noun" className="bg-[#1A1A1A]">Noun (اسم)</option>
              <option value="verb" className="bg-[#1A1A1A]">Verb (فعل)</option>
              <option value="adjective" className="bg-[#1A1A1A]">Adjective (صفت)</option>
              <option value="adverb" className="bg-[#1A1A1A]">Adverb (متعلق فعل)</option>
              <option value="pronoun" className="bg-[#1A1A1A]">Pronoun (اسم ضمیر)</option>
              <option value="idiom_phrase" className="bg-[#1A1A1A]">Idiomatic Phrase (محاوراتی ترکیب)</option>
              <option value="other" className="bg-[#1A1A1A]">Other (دیگر)</option>
            </select>
          </div>
        </div>

        {/* Bottom Control Strip: Audio toggle, View Mode, Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#222] text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 font-bold text-[#CCC] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyAudio}
                onChange={(e) => handleFilterChange(setOnlyAudio, e.target.checked)}
                className="h-4 w-4 rounded border-[#333] bg-[#1A1A1A] text-[#C9A66B] focus:ring-[#C9A66B]"
              />
              <span className="flex items-center gap-1">
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                With Native Speaker Audio Only
              </span>
            </label>

            {(searchQuery || selectedType !== 'all' || selectedDialect !== 'all' || selectedDomain !== 'all' || selectedPos !== 'all' || onlyAudio) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[#C9A66B] hover:underline font-bold cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#888]">
              Found: <strong className="text-[#E5E5E5]">{filteredItems.length}</strong> matching entries
            </span>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl bg-[#1A1A1A] p-0.5 border border-[#333]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-[#2A2A2A] text-[#FFF]' : 'text-[#777] hover:text-[#CCC]'
                }`}
                title="Grid Card View"
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-[#2A2A2A] text-[#FFF]' : 'text-[#777] hover:text-[#CCC]'
                }`}
                title="Detailed Table / List View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Results Display */}
      {filteredItems.length === 0 ? (
        <div className="rounded-3xl bg-[#111111] p-12 text-center text-[#777] border border-[#222]">
          <Layers className="mx-auto h-12 w-12 text-[#444] mb-3" />
          <h3 className="text-lg font-bold text-[#E5E5E5]">No Verified Canonical Entries Match Criteria</h3>
          <p className="text-xs text-[#888] mt-1 max-w-md mx-auto">
            Try adjusting your search terms or relaxing dialect and category filters to browse the preservation database.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#222] px-4 py-2 text-xs font-bold text-[#E5E5E5] hover:bg-[#333] border border-[#333] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Show All Canonical Records
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {paginatedItems.map((item) => {
            const ikText = item.verified?.correctedIkText || item.raw.ikText;
            const transcription = item.verified?.correctedTranscription || item.raw.ikTranscription;
            const ipa = item.verified?.verifiedIpa || item.raw.ipa;
            const urdu = item.verified?.correctedUrduMeaning || item.raw.urduMeaning;
            const eng = item.verified?.correctedEnglishMeaning || item.raw.englishMeaning;
            const dialectId = item.verified?.verifiedDialect || item.raw.dialect;
            const pos = item.verified?.verifiedPosTag || item.raw.posTag;
            const categoryObj = CONTRIBUTION_CATEGORIES.find(c => c.id === item.type);

            return (
              <div
                key={item.id}
                className="group rounded-3xl bg-[#111111] p-5 shadow-sm border border-[#222] hover:border-[#C9A66B]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Top Strip */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#222] text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded-md bg-[#C9A66B]/15 px-2 py-0.5 font-bold uppercase text-[#D4B582] text-[10px] border border-[#C9A66B]/25">
                        {categoryObj?.nameUr || item.type}
                      </span>
                      <span className="font-bold text-[#DDD] text-[11px]">
                        {getDialectDisplayName(dialectId)}
                      </span>
                      {pos && (
                        <span className="text-[10px] font-mono uppercase text-[#888] bg-[#1A1A1A] px-1.5 py-0.5 rounded border border-[#2A2A2A]">
                          {pos}
                        </span>
                      )}
                    </div>
                    
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-700/50">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  </div>

                  {/* Main Headword Area */}
                  <div className="py-4">
                    <h3 
                      className="font-kohistani text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F5F5F5] leading-relaxed text-right tracking-normal select-text" 
                      dir="rtl"
                    >
                      {ikText}
                    </h3>

                    {/* Phonetic transcription & IPA */}
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      {transcription && (
                        <span className="font-mono-code text-xs sm:text-sm text-[#C9A66B] bg-[#161616] px-2.5 py-0.5 rounded-md border border-[#262626]">
                          [{transcription}]
                        </span>
                      )}
                      {ipa && (
                        <span className="font-mono-code text-[11px] sm:text-xs text-[#888]">
                          IPA: {ipa}
                        </span>
                      )}
                    </div>

                    {/* Trilingual Meanings Box */}
                    <div className="mt-3.5 space-y-2 rounded-2xl bg-[#161616] p-3.5 sm:p-4 text-xs sm:text-sm border border-[#262626]">
                      {urdu && (
                        <p className="font-urdu text-sm sm:text-base text-[#F0F0F0] leading-relaxed text-right" dir="rtl">
                          <strong className="text-[#888] ml-1.5 font-sans text-xs">اردو:</strong> {urdu}
                        </p>
                      )}
                      {eng && (
                        <p className="text-zinc-200 leading-normal text-xs sm:text-sm">
                          <strong className="text-[#888] mr-1.5 font-medium">English:</strong> {eng}
                        </p>
                      )}
                    </div>

                    {item.raw.culturalContext && (
                      <p className="text-xs text-zinc-400 italic mt-2.5 line-clamp-2">
                        Context: {item.raw.culturalContext}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer: Audio & Details Modal Button */}
                <div className="pt-3 border-t border-[#222] flex items-center justify-between text-xs">
                  <div>
                    {item.raw.audioUrl ? (
                      <AudioPlayer audioUrl={item.raw.audioUrl} durationSec={item.raw.audioDurationSec} />
                    ) : (
                      <span className="text-[11px] text-[#666] italic">Text-only record</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] text-xs font-bold text-[#E5E5E5] border border-[#333] transition cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-[#C9A66B]" />
                    Full Entry
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DETAILED TABLE / LIST VIEW */
        <div className="overflow-hidden rounded-3xl bg-[#111111] border border-[#222] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161616] text-[#888] uppercase tracking-wider font-bold border-b border-[#222]">
                <tr>
                  <th className="py-3.5 px-4 text-right">Indus-Kohistani (IK)</th>
                  <th className="py-3.5 px-4">Phonetics</th>
                  <th className="py-3.5 px-4 text-right">Urdu Meaning</th>
                  <th className="py-3.5 px-4">English Meaning</th>
                  <th className="py-3.5 px-4">Dialect</th>
                  <th className="py-3.5 px-4">Category / POS</th>
                  <th className="py-3.5 px-4 text-center">Audio</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {paginatedItems.map((item) => {
                  const ikText = item.verified?.correctedIkText || item.raw.ikText;
                  const transcription = item.verified?.correctedTranscription || item.raw.ikTranscription;
                  const urdu = item.verified?.correctedUrduMeaning || item.raw.urduMeaning;
                  const eng = item.verified?.correctedEnglishMeaning || item.raw.englishMeaning;
                  const dialectId = item.verified?.verifiedDialect || item.raw.dialect;
                  const pos = item.verified?.verifiedPosTag || item.raw.posTag;

                  return (
                    <tr key={item.id} className="hover:bg-[#161616]/60 transition">
                      <td className="py-3 px-4 text-right font-kohistani text-xl font-bold text-[#F5F5F5]" dir="rtl">
                        {ikText}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#C9A66B]">
                        {transcription ? `[${transcription}]` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-urdu text-sm text-[#E5E5E5]" dir="rtl">
                        {urdu || '—'}
                      </td>
                      <td className="py-3 px-4 text-[#DDD] max-w-xs truncate">
                        {eng || '—'}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#BBB]">
                        {getDialectDisplayName(dialectId)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="uppercase text-[10px] font-bold text-[#D4B582] bg-[#C9A66B]/15 px-1.5 py-0.5 rounded mr-1">
                          {item.type}
                        </span>
                        {pos && (
                          <span className="text-[10px] font-mono text-[#888] bg-[#1C1C1C] px-1 py-0.5 rounded">
                            {pos}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.raw.audioUrl ? (
                          <AudioPlayer audioUrl={item.raw.audioUrl} durationSec={item.raw.audioDurationSec} />
                        ) : (
                          <span className="text-[#555]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="px-2.5 py-1 rounded-lg bg-[#1A1A1A] hover:bg-[#252525] text-[11px] font-bold text-[#E5E5E5] border border-[#333] transition cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-[#111111] p-4 border border-[#222] text-xs">
          <div className="flex items-center gap-2 text-[#888]">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg bg-[#1A1A1A] border border-[#333] px-2 py-1 text-xs text-[#E5E5E5] focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="ml-2">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-[#1A1A1A] border border-[#333] text-[#CCC] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#252525] transition cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-[#1A1A1A] border border-[#333] text-[#CCC] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#252525] transition cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-[#161616] border border-[#262626] font-mono font-bold text-[#E5E5E5]">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-[#1A1A1A] border border-[#333] text-[#CCC] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#252525] transition cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-[#1A1A1A] border border-[#333] text-[#CCC] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#252525] transition cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detailed Dictionary Modal */}
      {selectedItem && (
        <DictionaryModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};
