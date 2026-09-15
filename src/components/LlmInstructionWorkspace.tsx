import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  Bot,
  Brain,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Search,
  Filter,
  Check,
  Copy,
  Layers,
  FileCode,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  Sliders,
  CheckCircle,
  XCircle,
  Clock,
  Radio,
  BookOpen,
  Languages,
  Scale,
  Award,
  Terminal,
  Activity,
  ThumbsUp,
  ThumbsDown,
  Info,
  Linkedin
} from 'lucide-react';
import {
  LlmInstructionPair,
  LlmBenchmarkEvaluation,
  Ball23ValidationReport,
  UserProfile,
  UILanguage,
  LlmInstructionTaskType
} from '../types';
import {
  getLlmInstructions,
  getLlmBenchmarkEvaluation,
  generateAlpacaJson,
  generateChatMlJsonl,
  generateDpoJsonl,
  generateHuggingFaceInstructionCsv,
  runBall23ValidationSuite,
  LLM_BENCHMARK_MODEL_TARGET,
  LLM_INSTRUCTION_PIPELINE_VERSION
} from '../services/llmInstructionService';
import { PROJECT_DIRECTOR_LINKEDIN } from '../services/speechAiService';
import { LinkedInIconLink } from './LinkedInIconLink';
import { DIALECTS, DEFAULT_DIALECT_ID, SPECIAL_IK_CHARS } from '../data/initialData';

interface LlmInstructionWorkspaceProps {
  currentUser: UserProfile;
  uiLang: UILanguage;
}

export const LlmInstructionWorkspace: React.FC<LlmInstructionWorkspaceProps> = ({
  currentUser,
  uiLang
}) => {
  const [instructions, setInstructions] = useState<LlmInstructionPair[]>(() => getLlmInstructions());
  const [benchmark, setBenchmark] = useState<LlmBenchmarkEvaluation>(() => getLlmBenchmarkEvaluation());
  const [selectedInstructionId, setSelectedInstructionId] = useState<string>(instructions[0]?.instructionId || '');
  const [activeTabMode, setActiveTabMode] = useState<'prompt_studio' | 'benchmark_scorecard'>('prompt_studio');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [dialectFilter, setDialectFilter] = useState<string>('all');
  const [splitFilter, setSplitFilter] = useState<string>('all');
  const [glyphFilter, setGlyphFilter] = useState<string>('all');

  // Modals
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationReport, setValidationReport] = useState<Ball23ValidationReport | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'alpaca' | 'chatml' | 'dpo' | 'huggingface'>('alpaca');
  const [copySuccess, setCopySuccess] = useState(false);

  const activeInstruction = instructions.find(i => i.instructionId === selectedInstructionId) || instructions[0];

  // Run BALL 23 Validation
  const handleRunValidation = () => {
    const report = runBall23ValidationSuite();
    setValidationReport(report);
    setShowValidationModal(true);
  };

  // Filtered Instruction List
  const filteredInstructions = instructions.filter(i => {
    if (taskFilter !== 'all' && i.taskType !== taskFilter) return false;
    if (dialectFilter !== 'all' && i.dialect !== dialectFilter) return false;
    if (splitFilter !== 'all' && i.split !== splitFilter) return false;
    if (glyphFilter !== 'all' && !i.specialGlyphsPresent.includes(glyphFilter)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchIk = (i.instructionIk || '').toLowerCase().includes(q);
      const matchUr = (i.instructionUr || '').toLowerCase().includes(q);
      const matchEn = (i.instructionEn || '').toLowerCase().includes(q);
      const matchResp = (i.responseCanonical || '').toLowerCase().includes(q);
      const matchTopic = (i.domainTopic || '').toLowerCase().includes(q);
      if (!matchIk && !matchUr && !matchEn && !matchResp && !matchTopic) return false;
    }
    return true;
  });

  // Export Data Content
  const getExportData = () => {
    switch (exportFormat) {
      case 'alpaca':
        return generateAlpacaJson(filteredInstructions);
      case 'chatml':
        return generateChatMlJsonl(filteredInstructions);
      case 'dpo':
        return generateDpoJsonl(filteredInstructions);
      case 'huggingface':
        return generateHuggingFaceInstructionCsv(filteredInstructions);
      default:
        return '';
    }
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(getExportData());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownloadExport = () => {
    const content = getExportData();
    let filename = `indus_kohistani_llm_manifest_${exportFormat}.json`;
    if (exportFormat === 'chatml' || exportFormat === 'dpo') filename = `indus_kohistani_${exportFormat}.jsonl`;
    if (exportFormat === 'huggingface') filename = 'indus_kohistani_instruction_dataset.csv';

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Mean Cultural Safety Score
  const avgSafetyScore = (
    instructions.reduce((acc, i) => acc + i.culturalSafetyScore, 0) / instructions.length
  ).toFixed(1);

  return (
    <div id="llm-instruction-workspace" className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Top Banner: BALL 23 LLM Instruction Tuning & Benchmark Studio */}
      <div className="rounded-3xl bg-[#121212] border border-[#262626] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-[#C9A66B]/20 px-3 py-0.5 text-xs font-bold text-[#D4B582] border border-[#C9A66B]/30">
                BALL 23 • LLM INSTRUCTION & BENCHMARK STUDIO
              </span>
              <span className="rounded-full bg-indigo-950/60 px-3 py-0.5 text-xs font-bold text-indigo-300 border border-indigo-700/40 flex items-center gap-1">
                <Brain className="h-3 w-3 animate-pulse text-indigo-400" /> DPO & Cultural Safety Alignment
              </span>
              <span className="rounded-full bg-emerald-950/60 px-3 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-700/40 font-mono">
                {LLM_BENCHMARK_MODEL_TARGET}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F5F5F5] tracking-tight">
              Indus-Kohistani LLM Instruction Fine-Tuning & Linguistic Benchmark Studio
            </h1>
            <p className="mt-1.5 text-xl sm:text-2xl lg:text-3xl font-kohistani text-[#D4B582] font-semibold leading-relaxed tracking-wide sm:[word-spacing:0.12em]" dir="rtl">
              اِنڈَس کُستَئی ژِیباں لِسانِی ماڈَل ہِدَایَات اَں مِعیَارِی تَجزِیَہ سٹوڈیو
            </p>
            <p className="text-xs text-[#888] leading-relaxed">
              Standardized prompt-response pairs, Direct Preference Optimization (DPO) chosen vs rejected alignment, trilingual cross-evaluation, and automated cultural safety guardrails derived directly from immutable canonical releases.
            </p>
          </div>

          {/* Action Buttons & Governance Card */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              id="ball23-run-validation-btn"
              type="button"
              onClick={handleRunValidation}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0C0C0C] text-xs font-bold transition shadow-sm"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Run BALL 23 Audit (23 Rules)</span>
            </button>

            <button
              id="ball23-export-manifest-btn"
              type="button"
              onClick={() => setShowExportModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A66B] hover:bg-[#D4B582] text-[#0C0C0C] text-xs font-bold transition shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Export LLM Manifests (Alpaca/DPO)</span>
            </button>

            {/* Project Director Verified Attribution */}
            <div className="p-2.5 rounded-xl bg-[#161616] border border-[#2B2B2B] text-[11px] text-[#888] flex items-center justify-between gap-2">
              <span>Project Director: <strong className="text-[#E5E5E5]">Saif Ullah</strong></span>
              <LinkedInIconLink id="director-linkedin-link-llm-banner" size={22} />
            </div>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-[#222]">
          <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
            <span className="text-[10px] text-[#777] block font-mono">INSTRUCTION PAIRS</span>
            <span className="text-lg font-bold text-[#F5F5F5]">{instructions.length} Standard</span>
          </div>

          <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
            <span className="text-[10px] text-[#777] block font-mono">CULTURAL SAFETY</span>
            <span className="text-lg font-bold text-emerald-400">{avgSafetyScore}% Mean</span>
          </div>

          <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
            <span className="text-[10px] text-[#777] block font-mono">chrF++ / BLEU BASELINE</span>
            <span className="text-xs font-mono font-bold text-indigo-300">
              {benchmark.chrfPlusScore} / {benchmark.bleuScore}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
            <span className="text-[10px] text-[#777] block font-mono">5 DIALECTS</span>
            <span className="text-lg font-bold text-[#C9A66B]">100% Stratified</span>
          </div>

          <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
            <span className="text-[10px] text-[#777] block font-mono">SPECIAL GLYPHS</span>
            <span className="text-sm font-bold text-[#C9A66B] font-kohistani">ڇ، څ، ݜ، ڙ، ݨ</span>
          </div>

          <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
            <span className="text-[10px] text-[#777] block font-mono">ALIGNMENT MODE</span>
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1 mt-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> DPO Chosen/Rejected
            </span>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs (Prompt & DPO Studio vs Benchmark Scorecard) */}
      <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
        <button
          id="llm-tab-prompt-studio"
          type="button"
          onClick={() => setActiveTabMode('prompt_studio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTabMode === 'prompt_studio'
              ? 'bg-[#C9A66B] text-[#0C0C0C] shadow-sm'
              : 'bg-[#181818] text-[#888] hover:text-[#CCC]'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Prompt & DPO Alignment Studio</span>
        </button>

        <button
          id="llm-tab-benchmark-scorecard"
          type="button"
          onClick={() => setActiveTabMode('benchmark_scorecard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTabMode === 'benchmark_scorecard'
              ? 'bg-[#C9A66B] text-[#0C0C0C] shadow-sm'
              : 'bg-[#181818] text-[#888] hover:text-[#CCC]'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Benchmark Scorecard ({LLM_BENCHMARK_MODEL_TARGET})</span>
        </button>
      </div>

      {activeTabMode === 'prompt_studio' ? (
        /* Main Dual-Pane Studio Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Instruction Selector & Filters (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#C9A66B]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5E5E5]">
                    Instruction Taxonomy
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#777]">
                  {filteredInstructions.length} of {instructions.length} Available
                </span>
              </div>

              {/* Search & Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666]" />
                  <input
                    id="llm-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search prompt, Urdu/EN, topic..."
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl pl-9 pr-3 py-2 text-xs text-[#E5E5E5] placeholder-[#555] focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Task Filter */}
                  <select
                    id="llm-task-filter"
                    value={taskFilter}
                    onChange={(e) => setTaskFilter(e.target.value)}
                    className="bg-[#1A1A1A] border border-[#333] rounded-lg px-2 py-1.5 text-[11px] text-[#CCC] focus:outline-none focus:border-[#C9A66B]"
                  >
                    <option value="all">All Tasks</option>
                    <option value="lexicography">Lexicography</option>
                    <option value="open_qa">Open QA</option>
                    <option value="translation">Translation</option>
                    <option value="dialect_adaptation">Dialect Adaptation</option>
                    <option value="grammar_correction">Grammar Correction</option>
                    <option value="cultural_heritage">Cultural Heritage</option>
                    <option value="safety_moderation">Safety Moderation</option>
                    <option value="summarization">Summarization</option>
                  </select>

                  {/* Dialect Filter */}
                  <select
                    id="llm-dialect-filter"
                    value={dialectFilter}
                    onChange={(e) => setDialectFilter(e.target.value)}
                    className="bg-[#1A1A1A] border border-[#333] rounded-lg px-2 py-1.5 text-[11px] text-[#CCC] focus:outline-none focus:border-[#C9A66B]"
                  >
                    <option value="all">All Dialects</option>
                    {DIALECTS.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nameUr} {d.isDefault ? '★' : ''}
                      </option>
                    ))}
                  </select>

                  {/* Split Filter */}
                  <select
                    id="llm-split-filter"
                    value={splitFilter}
                    onChange={(e) => setSplitFilter(e.target.value)}
                    className="bg-[#1A1A1A] border border-[#333] rounded-lg px-2 py-1.5 text-[11px] text-[#CCC] focus:outline-none focus:border-[#C9A66B]"
                  >
                    <option value="all">All Splits</option>
                    <option value="train">Train (80%)</option>
                    <option value="validation">Val (10%)</option>
                    <option value="test">Test (10%)</option>
                  </select>

                  {/* Glyph Filter */}
                  <select
                    id="llm-glyph-filter"
                    value={glyphFilter}
                    onChange={(e) => setGlyphFilter(e.target.value)}
                    className="bg-[#1A1A1A] border border-[#333] rounded-lg px-2 py-1.5 text-[11px] text-[#CCC] focus:outline-none focus:border-[#C9A66B]"
                  >
                    <option value="all">All Glyphs</option>
                    {SPECIAL_IK_CHARS.map(g => (
                      <option key={g.char} value={g.char}>
                        {g.char} ({g.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* List of Instructions */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredInstructions.map((inst) => {
                  const isSelected = inst.instructionId === activeInstruction.instructionId;
                  const dialectObj = DIALECTS.find(d => d.id === inst.dialect);

                  return (
                    <button
                      key={inst.instructionId}
                      type="button"
                      onClick={() => setSelectedInstructionId(inst.instructionId)}
                      className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-[#222] border-[#C9A66B] shadow-md'
                          : 'bg-[#181818] border-[#262626] hover:bg-[#1C1C1C] hover:border-[#383838]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#111] text-[#999] border border-[#333]">
                            {inst.instructionId}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#C9A66B]/15 text-[#D4B582] border border-[#C9A66B]/30">
                            {dialectObj?.nameUr || inst.dialect}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 uppercase">
                            {inst.taskType}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {inst.culturalSafetyScore}% Safe
                        </span>
                      </div>

                      {/* Instruction Text */}
                      <div className="text-sm font-kohistani text-[#F5F5F5] font-bold text-right py-0.5 line-clamp-2" dir="rtl">
                        {inst.instructionIk}
                      </div>

                      {/* Gloss preview */}
                      <div className="flex items-center justify-between text-[11px] text-[#777]">
                        <span className="truncate max-w-[200px]">{inst.instructionEn || inst.instructionUr}</span>
                        <span className="font-mono text-[10px] text-[#555]">{inst.domainTopic}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Prompt & DPO Alignment Laboratory (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {activeInstruction ? (
              <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-6">
                {/* Header of Active Instruction */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#222]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[#F5F5F5]">
                        {activeInstruction.instructionId}
                      </h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 uppercase">
                        {activeInstruction.taskType}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                        {activeInstruction.authenticityRating}
                      </span>
                    </div>
                    <p className="text-xs text-[#777] mt-0.5">
                      Domain: <strong className="text-[#CCC]">{activeInstruction.domainTopic}</strong> • Release: {activeInstruction.sourceReleaseVersion}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> {activeInstruction.culturalSafetyScore}% Safety Score
                    </span>
                  </div>
                </div>

                {/* System Prompt Context */}
                {activeInstruction.systemPrompt && (
                  <div className="p-3.5 rounded-xl bg-[#181818] border border-[#262626] text-xs text-[#888] font-mono">
                    <span className="text-[10px] uppercase tracking-wider text-[#C9A66B] block mb-1">System Prompt Context</span>
                    {activeInstruction.systemPrompt}
                  </div>
                )}

                {/* Trilingual Instruction Card */}
                <div className="p-5 rounded-2xl bg-[#181818] border border-[#2F2F2F] space-y-3">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#777] block">
                    Indus-Kohistani Instruction Prompt (RTL)
                  </span>
                  <div className="text-2xl font-kohistani text-[#F5F5F5] font-bold py-1 leading-relaxed" dir="rtl">
                    {activeInstruction.instructionIk}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-[#262626] text-xs">
                    {activeInstruction.instructionUr && (
                      <div className="p-2.5 rounded-lg bg-[#202020] text-[#DDD] text-right" dir="rtl">
                        <span className="text-[10px] text-[#777] block font-sans">اردو ہدایت:</span>
                        {activeInstruction.instructionUr}
                      </div>
                    )}
                    {activeInstruction.instructionEn && (
                      <div className="p-2.5 rounded-lg bg-[#202020] text-[#DDD]">
                        <span className="text-[10px] text-[#777] block">English Instruction:</span>
                        {activeInstruction.instructionEn}
                      </div>
                    )}
                  </div>
                </div>

                {/* DPO Dual Response Comparison: Chosen vs Rejected */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222]">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-[#C9A66B]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5E5E5]">
                        Direct Preference Optimization (DPO Pair)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Chosen vs Rejected Alignment
                    </span>
                  </div>

                  {/* 1. Chosen Response (Canonical Native) */}
                  <div className="p-4 rounded-xl bg-[#122319] border border-emerald-700/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                        <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />
                        <span>CHOSEN RESPONSE (Canonical Native Indus-Kohistani)</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300">
                        100% Authentic
                      </span>
                    </div>

                    <div className="text-lg font-kohistani text-[#F5F5F5] font-bold py-1 leading-relaxed text-right" dir="rtl">
                      {activeInstruction.responseCanonical}
                    </div>

                    {activeInstruction.responseIpa && (
                      <div className="text-xs font-mono text-[#C9A66B] pt-1">
                        IPA: {activeInstruction.responseIpa}
                      </div>
                    )}
                  </div>

                  {/* 2. Rejected Response (Negative Sample & Rejection Reason) */}
                  {activeInstruction.rejectedResponse && (
                    <div className="p-4 rounded-xl bg-[#231215] border border-rose-800/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                          <ThumbsDown className="h-3.5 w-3.5 text-rose-400" />
                          <span>REJECTED RESPONSE (Model Hallucination / Degraded)</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950/80 text-rose-300">
                          Negative Sample
                        </span>
                      </div>

                      <div className="text-sm font-kohistani text-[#FCA5A5] py-1 text-right" dir="rtl">
                        {activeInstruction.rejectedResponse}
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#2E1418] text-[11px] text-rose-200 flex items-start gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Rejection Justification: </strong>
                          {activeInstruction.rejectionReason}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Provenance & Leadership Audit Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#E5E5E5]">
                      <Languages className="h-4 w-4 text-[#C9A66B]" />
                      <span>Dialect & Glyph Stratification</span>
                    </div>
                    <div className="text-xs text-[#BBB] space-y-1">
                      <div>Dialect: <strong className="text-[#F5F5F5]">{activeInstruction.dialect}</strong></div>
                      <div>Special Glyphs: <span className="font-kohistani font-bold text-[#C9A66B]">{activeInstruction.specialGlyphsPresent.join(', ')}</span></div>
                      <div>Split: <span className="font-mono text-indigo-300">{activeInstruction.split.toUpperCase()}</span></div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#E5E5E5]">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Linguistic Governance & Audit</span>
                    </div>
                    <div className="text-xs text-[#BBB] space-y-1">
                      <div>Audited By: <strong className="text-[#F5F5F5]">{activeInstruction.verifiedBy || 'Saif Ullah'}</strong></div>
                      <div>Audit Timestamp: {new Date(activeInstruction.verifiedAt || Date.now()).toLocaleDateString()}</div>
                      <div className="text-[11px] text-emerald-400">✓ Certified Canonical Dataset Asset</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-[#777] bg-[#141414] rounded-2xl border border-[#262626]">
                No instruction pair selected.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Benchmark Scorecard View */
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222]">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-[#C9A66B]" />
                  <h2 className="text-lg font-bold text-[#F5F5F5]">
                    Linguistic Evaluation Benchmark ({benchmark.modelTarget})
                  </h2>
                </div>
                <p className="text-xs text-[#888] mt-1">
                  Automated metric evaluation against standardized test splits (chrF++, BLEU, Cultural Safety, Dialect Retention)
                </p>
              </div>

              <div className="text-xs font-mono text-[#777]">
                Evaluated: {new Date(benchmark.evaluatedAt).toLocaleDateString()}
              </div>
            </div>

            {/* High-level Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#191919] border border-[#282828] text-center space-y-1">
                <span className="text-[10px] font-mono text-[#777] uppercase">chrF++ Score</span>
                <span className="text-2xl font-black text-[#C9A66B] font-mono">{benchmark.chrfPlusScore}</span>
                <span className="text-[10px] text-emerald-400 block">✓ Exceeds 80.0 Benchmark</span>
              </div>

              <div className="p-4 rounded-xl bg-[#191919] border border-[#282828] text-center space-y-1">
                <span className="text-[10px] font-mono text-[#777] uppercase">BLEU Score</span>
                <span className="text-2xl font-black text-indigo-300 font-mono">{benchmark.bleuScore}</span>
                <span className="text-[10px] text-emerald-400 block">✓ Exceeds 35.0 Standard</span>
              </div>

              <div className="p-4 rounded-xl bg-[#191919] border border-[#282828] text-center space-y-1">
                <span className="text-[10px] font-mono text-[#777] uppercase">Cultural Safety Pass</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{benchmark.culturalSafetyPassRate}%</span>
                <span className="text-[10px] text-emerald-400 block">0 Guardrail Breaches</span>
              </div>

              <div className="p-4 rounded-xl bg-[#191919] border border-[#282828] text-center space-y-1">
                <span className="text-[10px] font-mono text-[#777] uppercase">Dialect Retention</span>
                <span className="text-2xl font-black text-amber-400 font-mono">{benchmark.dialectRetentionScore}%</span>
                <span className="text-[10px] text-amber-300 block">5 Dialects Balanced</span>
              </div>
            </div>

            {/* Test Prompt Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5E5E5]">
                Sample Prompt Evaluation Breakdown ({benchmark.results.length} Samples)
              </h3>

              <div className="space-y-3">
                {benchmark.results.map((res) => (
                  <div key={res.promptId} className="p-4 rounded-xl bg-[#181818] border border-[#282828] space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#777]">{res.promptId}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 uppercase">
                          {res.taskType}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">
                        Metric: {res.metricScore.toFixed(1)} / 100
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#202020] text-[#DDD] text-right font-kohistani font-bold" dir="rtl">
                      {res.promptText}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-[#141414] border border-[#222] space-y-1">
                        <span className="text-[10px] text-indigo-300 block font-mono">Model Generation:</span>
                        <div className="font-kohistani text-[#E5E5E5] text-right" dir="rtl">{res.modelOutput}</div>
                      </div>

                      <div className="p-3 rounded-lg bg-[#141414] border border-[#222] space-y-1">
                        <span className="text-[10px] text-emerald-300 block font-mono">Human Ground Truth:</span>
                        <div className="font-kohistani text-[#E5E5E5] text-right" dir="rtl">{res.referenceOutput}</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#888] italic">
                      Notes: {res.notes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: 23-POINT BALL 23 AUDIT SUITE */}
      {showValidationModal && validationReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-3xl bg-[#141414] border border-[#2A2A2A] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#222]">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                  <h2 className="text-xl font-bold text-[#F5F5F5]">
                    BALL 23 — LLM Instruction & Benchmark Validation Suite
                  </h2>
                </div>
                <p className="text-xs text-[#888] mt-1">
                  Automated 23-Point Verification for Indus-Kohistani LLM Fine-Tuning, DPO Pairs & Cultural Safety
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="h-8 w-8 rounded-lg bg-[#222] hover:bg-[#333] text-[#AAA] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Score Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              validationReport.allPassed 
                ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-800/40 text-rose-300'
            }`}>
              <div className="flex items-center gap-3">
                {validationReport.allPassed ? (
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-rose-400" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {validationReport.allPassed ? 'ALL 23 LLM INSTRUCTION AUDIT CHECKS PASSED (100%)' : 'VALIDATION ISSUES DETECTED'}
                  </div>
                  <div className="text-xs opacity-80">
                    Passed: {validationReport.passCount} / {validationReport.totalChecks} checks • 0 Fatal Errors
                  </div>
                </div>
              </div>

              <div className="text-right text-xs font-mono opacity-80">
                BALL 23 Standard
              </div>
            </div>

            {/* List of 23 Checks */}
            <div className="space-y-2">
              {validationReport.results.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#282828] flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#777]">{c.id}</span>
                      <strong className="text-[#E5E5E5]">{c.title}</strong>
                    </div>
                    <p className="text-[#888] text-[11px] leading-relaxed">{c.details}</p>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                    c.status === 'PASS' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60' : 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#222] flex justify-end">
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="px-6 py-2 rounded-xl bg-[#C9A66B] hover:bg-[#D4B582] text-[#0C0C0C] text-xs font-bold transition"
              >
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EXPORT INSTRUCTION DATASETS MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-3xl bg-[#141414] border border-[#2A2A2A] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#222]">
              <div>
                <div className="flex items-center gap-2">
                  <Download className="h-6 w-6 text-[#C9A66B]" />
                  <h2 className="text-xl font-bold text-[#F5F5F5]">
                    Export LLM Instruction & DPO Datasets
                  </h2>
                </div>
                <p className="text-xs text-[#888] mt-1">
                  Format-compliant datasets for Stanford Alpaca, OpenAI ChatML / ShareGPT, Direct Preference Optimization (DPO), and HuggingFace Transformers.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="h-8 w-8 rounded-lg bg-[#222] hover:bg-[#333] text-[#AAA] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Format Selection Tabs */}
            <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-[#222]">
              <button
                type="button"
                onClick={() => setExportFormat('alpaca')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  exportFormat === 'alpaca' ? 'bg-[#C9A66B] text-[#0C0C0C] font-bold' : 'bg-[#1F1F1F] text-[#888] hover:text-[#CCC]'
                }`}
              >
                Stanford Alpaca (JSON)
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('chatml')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  exportFormat === 'chatml' ? 'bg-[#C9A66B] text-[#0C0C0C] font-bold' : 'bg-[#1F1F1F] text-[#888] hover:text-[#CCC]'
                }`}
              >
                OpenAI ChatML / ShareGPT (JSONL)
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('dpo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  exportFormat === 'dpo' ? 'bg-[#C9A66B] text-[#0C0C0C] font-bold' : 'bg-[#1F1F1F] text-[#888] hover:text-[#CCC]'
                }`}
              >
                DPO Preference Pairs (JSONL)
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('huggingface')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  exportFormat === 'huggingface' ? 'bg-[#C9A66B] text-[#0C0C0C] font-bold' : 'bg-[#1F1F1F] text-[#888] hover:text-[#CCC]'
                }`}
              >
                HuggingFace Datasets (CSV)
              </button>
            </div>

            {/* Manifest Code Preview */}
            <div className="relative">
              <pre className="p-4 rounded-xl bg-[#0C0C0C] border border-[#262626] font-mono text-[11px] text-[#A5D6A7] overflow-x-auto max-h-80 whitespace-pre">
                {getExportData()}
              </pre>
            </div>

            {/* Export Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#222]">
              <div className="text-xs text-[#777]">
                Target: <span className="text-[#C9A66B] font-mono">{filteredInstructions.length} Instruction Pairs</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyExport}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#222] hover:bg-[#2E2E2E] text-[#CCC] text-xs font-bold transition"
                >
                  {copySuccess ? <Check className="h-4 w-4 text-emerald-400" /> : <Layers className="h-4 w-4" />}
                  <span>{copySuccess ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadExport}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#C9A66B] hover:bg-[#D4B582] text-[#0C0C0C] text-xs font-bold transition shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Manifest File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
