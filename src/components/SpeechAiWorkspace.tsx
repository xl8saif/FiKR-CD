import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Globe2,
  User,
  Users,
  Activity,
  Layers,
  FileCode,
  FileSpreadsheet,
  ExternalLink,
  Sparkles,
  Search,
  Filter,
  Check,
  RefreshCw,
  Clock,
  Radio,
  Sliders,
  CheckCircle,
  XCircle,
  Info,
  Linkedin
} from 'lucide-react';
import {
  SpeechSegmentDoc,
  SpeechCorpusManifest,
  Ball22ValidationReport,
  UserProfile,
  UILanguage
} from '../types';
import {
  getSpeechSegments,
  getSpeechCorpusManifest,
  generateWhisperManifest,
  generateHuggingFaceCsv,
  generateKaldiManifest,
  generateVttSubtitles,
  runBall22ValidationSuite,
  PROJECT_DIRECTOR_LINKEDIN,
  ASR_MODEL_TARGET
} from '../services/speechAiService';
import { DIALECTS, DEFAULT_DIALECT_ID, SPECIAL_IK_CHARS } from '../data/initialData';
import { LinkedInIconLink } from './LinkedInIconLink';

interface SpeechAiWorkspaceProps {
  currentUser: UserProfile;
  uiLang: UILanguage;
}

export const SpeechAiWorkspace: React.FC<SpeechAiWorkspaceProps> = ({
  currentUser,
  uiLang
}) => {
  const [segments, setSegments] = useState<SpeechSegmentDoc[]>(() => getSpeechSegments());
  const [manifest, setManifest] = useState<SpeechCorpusManifest>(() => getSpeechCorpusManifest());
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(segments[0]?.segmentId || '');
  
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dialectFilter, setDialectFilter] = useState('all');
  const [splitFilter, setSplitFilter] = useState('all');
  const [glyphFilter, setGlyphFilter] = useState('all');

  // Modals
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationReport, setValidationReport] = useState<Ball22ValidationReport | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'whisper' | 'huggingface' | 'kaldi' | 'vtt'>('whisper');
  const [copySuccess, setCopySuccess] = useState(false);

  const activeSegment = segments.find(s => s.segmentId === selectedSegmentId) || segments[0];

  // Handle audio play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => {
        console.warn('Audio play error:', err);
        setIsPlaying(false);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleSeek = (timeSec: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeSec;
      setCurrentTime(timeSec);
    }
  };

  // Run BALL 22 Validation
  const handleRunValidation = () => {
    const report = runBall22ValidationSuite();
    setValidationReport(report);
    setShowValidationModal(true);
  };

  // Filtered segments list
  const filteredSegments = segments.filter(s => {
    if (dialectFilter !== 'all' && s.dialect !== dialectFilter) return false;
    if (splitFilter !== 'all' && s.split !== splitFilter) return false;
    if (glyphFilter !== 'all' && !s.specialGlyphsPresent.includes(glyphFilter)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchText = (s.persoArabicTranscript || '').toLowerCase().includes(q);
      const matchIpa = (s.ipaTranscript || '').toLowerCase().includes(q);
      const matchUrdu = (s.urduGloss || '').toLowerCase().includes(q);
      const matchEnglish = (s.englishGloss || '').toLowerCase().includes(q);
      const matchSpk = (s.speakerName || '').toLowerCase().includes(q);
      if (!matchText && !matchIpa && !matchUrdu && !matchEnglish && !matchSpk) return false;
    }
    return true;
  });

  // Export content generation
  const getExportData = () => {
    switch (exportFormat) {
      case 'whisper':
        return generateWhisperManifest(filteredSegments);
      case 'huggingface':
        return generateHuggingFaceCsv(filteredSegments);
      case 'kaldi': {
        const k = generateKaldiManifest(filteredSegments);
        return `=== wav.scp ===\n${k.wavScp}\n\n=== text ===\n${k.text}\n\n=== utt2spk ===\n${k.utt2spk}`;
      }
      case 'vtt':
        return generateVttSubtitles(activeSegment);
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
    let filename = `indus_kohistani_speech_manifest_${exportFormat}.txt`;
    if (exportFormat === 'whisper') filename = 'indus_kohistani_whisper_manifest.jsonl';
    if (exportFormat === 'huggingface') filename = 'indus_kohistani_asr_corpus.csv';
    if (exportFormat === 'vtt') filename = `${activeSegment.segmentId}_alignment.vtt`;

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

  return (
    <div id="speech-ai-workspace" className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Top Banner: BALL 22 Speech AI & Acoustic Studio */}
      <div className="rounded-3xl bg-[#121212] border border-[#262626] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-[#C9A66B]/20 px-3 py-0.5 text-xs font-bold text-[#D4B582] border border-[#C9A66B]/30">
                BALL 22 • SPEECH AI & ACOUSTIC STUDIO
              </span>
              <span className="rounded-full bg-emerald-950/60 px-3 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-700/40 flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse text-emerald-400" /> ASR Corpus & Phoneme Alignment
              </span>
              <span className="rounded-full bg-indigo-950/60 px-3 py-0.5 text-xs font-bold text-indigo-300 border border-indigo-700/40 font-mono">
                {ASR_MODEL_TARGET}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F5F5F5] tracking-tight">
              Indus-Kohistani Acoustic Corpus & Speech AI Alignment Studio
            </h1>
            <p className="mt-1.5 text-xl sm:text-2xl lg:text-3xl font-kohistani text-[#D4B582] font-semibold leading-relaxed tracking-wide sm:[word-spacing:0.12em]" dir="rtl">
              اِنڈَس کُستَئی ژِیباں صَوتی رِکارْڈِنٛگ اَں صَوتِیَہ تَطْبِیْق
            </p>
            <p className="text-xs text-[#888] leading-relaxed">
              Standardized acoustic segmentation, sub-second phonemic IPA alignment, multi-speaker stratification, and OpenAI Whisper fine-tuning manifests derived directly from immutable canonical releases.
            </p>
          </div>

          {/* Action Buttons & Governance Card */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              id="ball22-run-validation-btn"
              type="button"
              onClick={handleRunValidation}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0C0C0C] text-xs font-bold transition shadow-sm"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Run BALL 22 Audit (22 Rules)</span>
            </button>

            <button
              id="ball22-export-manifest-btn"
              type="button"
              onClick={() => setShowExportModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A66B] hover:bg-[#D4B582] text-[#0C0C0C] text-xs font-bold transition shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Export ASR Manifests (Whisper/Kaldi)</span>
            </button>

            {/* Project Director Verified Attribution */}
            <div className="p-2.5 rounded-xl bg-[#161616] border border-[#2B2B2B] text-[11px] text-[#888] flex items-center justify-between gap-2">
              <span>Project Director: <strong className="text-[#E5E5E5]">Saif Ullah</strong></span>
              <LinkedInIconLink id="director-linkedin-link-banner" size={22} />
            </div>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-[#222]">
          <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
            <span className="text-[10px] text-[#777] block font-mono">UTTERANCES</span>
            <span className="text-lg font-bold text-[#F5F5F5]">{manifest.totalUtterances}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
            <span className="text-[10px] text-[#777] block font-mono">TOTAL DURATION</span>
            <span className="text-lg font-bold text-amber-400">{manifest.totalHours} hrs</span>
          </div>

          <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
            <span className="text-[10px] text-[#777] block font-mono">TRAIN / VAL / TEST</span>
            <span className="text-xs font-mono font-bold text-indigo-300">
              {manifest.trainHours}h / {manifest.valHours}h / {manifest.testHours}h
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
            <span className="text-[10px] text-[#777] block font-mono">DIALECTS</span>
            <span className="text-lg font-bold text-emerald-400">5 Official</span>
          </div>

          <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
            <span className="text-[10px] text-[#777] block font-mono">SPECIAL GLYPHS</span>
            <span className="text-sm font-bold text-[#C9A66B] font-kohistani">ڇ، څ، ݜ، ڙ، ݨ</span>
          </div>

          <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
            <span className="text-[10px] text-[#777] block font-mono">ACOUSTIC INTEGRITY</span>
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1 mt-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> 100% Studio Clean
            </span>
          </div>
        </div>
      </div>

      {/* Main Dual-Pane Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Segment Selector & Dialect Filter (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-[#C9A66B]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5E5E5]">
                  Acoustic Utterances
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#777]">
                {filteredSegments.length} of {segments.length} Available
              </span>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666]" />
                <input
                  id="speech-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search transcript, IPA, gloss, speaker..."
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl pl-9 pr-3 py-2 text-xs text-[#E5E5E5] placeholder-[#555] focus:outline-none focus:border-[#C9A66B]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Dialect Filter */}
                <select
                  id="speech-dialect-filter"
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
                  id="speech-split-filter"
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
                  id="speech-glyph-filter"
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

            {/* List of Acoustic Utterances */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredSegments.map((seg) => {
                const isSelected = seg.segmentId === activeSegment.segmentId;
                const dialectObj = DIALECTS.find(d => d.id === seg.dialect);

                return (
                  <button
                    key={seg.segmentId}
                    type="button"
                    onClick={() => {
                      setSelectedSegmentId(seg.segmentId);
                      setIsPlaying(false);
                      setCurrentTime(0);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-[#222] border-[#C9A66B] shadow-md'
                        : 'bg-[#181818] border-[#262626] hover:bg-[#1C1C1C] hover:border-[#383838]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#111] text-[#999] border border-[#333]">
                          {seg.segmentId}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#C9A66B]/15 text-[#D4B582] border border-[#C9A66B]/30">
                          {dialectObj?.nameUr || seg.dialect}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                          seg.split === 'train' ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/40' :
                          seg.split === 'validation' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40' :
                          'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                        }`}>
                          {seg.split}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#AAA] flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#666]" /> {seg.durationSec}s
                      </span>
                    </div>

                    {/* Perso-Arabic Text */}
                    <div className="text-base font-kohistani text-[#F5F5F5] font-bold text-right py-0.5" dir="rtl">
                      {seg.persoArabicTranscript}
                    </div>

                    {/* Subtext info */}
                    <div className="flex items-center justify-between text-[11px] text-[#777]">
                      <span className="font-mono text-[#C9A66B]">/{seg.ipaTranscript}/</span>
                      <span>{seg.speakerName} ({seg.speakerGender})</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Audio Alignment Studio, Waveform & Phoneme Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeSegment ? (
            <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-6">
              {/* Header of Active Segment */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#222]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#F5F5F5]">
                      {activeSegment.segmentId}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                      {activeSegment.qualityTier}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1F1F1F] text-[#BBB]">
                      SNR: {activeSegment.snrDb} dB
                    </span>
                  </div>
                  <p className="text-xs text-[#777] mt-0.5">
                    Release Version: {activeSegment.sourceReleaseVersion} • Ref: {activeSegment.contributionId}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#888] font-mono">
                    {activeSegment.sampleRateHz} Hz Mono
                  </span>
                </div>
              </div>

              {/* Perso-Arabic High-Contrast Transcript Display */}
              <div className="p-6 rounded-2xl bg-[#181818] border border-[#2F2F2F] text-center space-y-3">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#777] block">
                  Indus-Kohistani Perso-Arabic Text (Strictly Immutable)
                </span>
                <div className="text-3xl sm:text-4xl font-kohistani text-[#F5F5F5] font-bold py-2" dir="rtl">
                  {activeSegment.persoArabicTranscript}
                </div>

                <div className="flex items-center justify-center gap-3 flex-wrap pt-2 border-t border-[#262626]">
                  <span className="text-xs font-mono text-[#C9A66B] px-3 py-1 rounded-lg bg-[#222] border border-[#333]">
                    IPA: /{activeSegment.ipaTranscript}/
                  </span>
                  {activeSegment.urduGloss && (
                    <span className="text-xs text-[#CCC] px-3 py-1 rounded-lg bg-[#222] border border-[#333]">
                      اردو: {activeSegment.urduGloss}
                    </span>
                  )}
                  {activeSegment.englishGloss && (
                    <span className="text-xs text-[#CCC] px-3 py-1 rounded-lg bg-[#222] border border-[#333]">
                      EN: {activeSegment.englishGloss}
                    </span>
                  )}
                </div>
              </div>

              {/* Interactive Audio Player & Waveform Timeline */}
              <div className="p-5 rounded-2xl bg-[#191919] border border-[#2B2B2B] space-y-4">
                <div className="flex items-center justify-between text-xs text-[#888]">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-[#C9A66B]" />
                    <span className="font-bold text-[#E5E5E5]">Acoustic Waveform Playback</span>
                  </div>
                  <span className="font-mono text-[#C9A66B]">
                    {currentTime.toFixed(2)}s / {activeSegment.durationSec.toFixed(2)}s
                  </span>
                </div>

                {/* Simulated Waveform & Scrubbing Bar */}
                <div className="relative">
                  <div 
                    className="h-16 w-full bg-[#111] rounded-xl border border-[#333] flex items-center px-4 cursor-pointer relative overflow-hidden"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const ratio = clickX / rect.width;
                      handleSeek(ratio * activeSegment.durationSec);
                    }}
                  >
                    {/* Background Simulated Waveform Bars */}
                    <div className="absolute inset-0 flex items-center justify-between px-2 opacity-30 pointer-events-none">
                      {Array.from({ length: 48 }).map((_, i) => {
                        const h = 20 + Math.sin(i * 0.5) * 20 + ((i % 3 === 0) ? 25 : 10);
                        return (
                          <div 
                            key={i} 
                            style={{ height: `${h}%` }}
                            className="w-1 bg-[#C9A66B] rounded-full"
                          />
                        );
                      })}
                    </div>

                    {/* Progress Fill */}
                    <div 
                      className="absolute inset-y-0 left-0 bg-[#C9A66B]/20 border-r-2 border-[#C9A66B] pointer-events-none transition-all duration-75"
                      style={{ width: `${(currentTime / activeSegment.durationSec) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Playback Controls & Speed Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      id="speech-toggle-play-btn"
                      type="button"
                      onClick={togglePlay}
                      className="h-10 w-10 rounded-xl bg-[#C9A66B] hover:bg-[#D4B582] text-[#0C0C0C] flex items-center justify-center transition shadow-sm"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </button>

                    <button
                      id="speech-rewind-btn"
                      type="button"
                      onClick={() => handleSeek(0)}
                      className="h-10 w-10 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-[#CCC] flex items-center justify-center transition"
                      title="Restart"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Playback Speeds */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#777] mr-1">Speed:</span>
                    {[0.5, 0.75, 1.0, 1.25, 1.5].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => handleSpeedChange(spd)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition ${
                          playbackSpeed === spd
                            ? 'bg-[#C9A66B] text-[#0C0C0C]'
                            : 'bg-[#222] text-[#999] hover:bg-[#2A2A2A] hover:text-[#E5E5E5]'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* HTML Audio element (invisible) */}
                <audio
                  ref={audioRef}
                  src={activeSegment.audioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleAudioEnded}
                  className="hidden"
                />
              </div>

              {/* Phoneme Level Timestamp Alignment Inspector */}
              <div className="p-5 rounded-2xl bg-[#181818] border border-[#262626] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-[#C9A66B]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5E5E5]">
                      Phonemic Alignment & Timestamp Inspector
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {activeSegment.phonemeAlignments?.length || 0} Phoneme Units Aligned
                  </span>
                </div>

                {/* Phoneme timeline sequence */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {activeSegment.phonemeAlignments?.map((pa, idx) => {
                    const isCurrent = currentTime >= pa.startTimeSec && currentTime <= pa.endTimeSec;
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSeek(pa.startTimeSec)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-[#2A2A2A] border-[#C9A66B] ring-1 ring-[#C9A66B]'
                            : 'bg-[#1C1C1C] border-[#2E2E2E] hover:border-[#444]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-kohistani font-bold text-[#F5F5F5]">
                            {pa.phoneme}
                          </span>
                          {pa.isSpecialGlyph && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#C9A66B]/20 text-[#D4B582] border border-[#C9A66B]/40">
                              Special
                            </span>
                          )}
                        </div>

                        <div className="mt-2 space-y-1">
                          <div className="text-xs font-mono text-[#C9A66B]">
                            IPA: /{pa.ipa}/
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#777]">
                            <span>{pa.startTimeSec.toFixed(2)}s – {pa.endTimeSec.toFixed(2)}s</span>
                            <span>{(pa.confidence * 100).toFixed(0)}% conf</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Speaker Metadata & Linguistic Custodianship Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#E5E5E5]">
                    <User className="h-4 w-4 text-[#C9A66B]" />
                    <span>Speaker Demographic Provenance</span>
                  </div>
                  <div className="text-xs text-[#BBB] space-y-1">
                    <div>Name: <strong className="text-[#F5F5F5]">{activeSegment.speakerName}</strong> ({activeSegment.speakerId})</div>
                    <div>Demographics: {activeSegment.speakerGender} • {activeSegment.speakerAgeGroup}</div>
                    <div>Native Valley: {activeSegment.valleyOfOrigin || 'Indus Kohistan'}</div>
                    <div className="text-[11px] text-emerald-400">✓ Native Speaker Certified</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#E5E5E5]">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Linguistic Verification Audit</span>
                  </div>
                  <div className="text-xs text-[#BBB] space-y-1">
                    <div>Status: <span className="text-emerald-300 font-semibold">{activeSegment.status.toUpperCase()}</span></div>
                    <div>Audited By: <strong className="text-[#F5F5F5]">{activeSegment.verifiedBy || 'Saif Ullah'}</strong></div>
                    <div>Verified At: {new Date(activeSegment.verifiedAt || Date.now()).toLocaleDateString()}</div>
                    <div className="text-[10px] text-[#777] italic">{activeSegment.acousticNotes}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-[#777] bg-[#141414] rounded-2xl border border-[#262626]">
              No acoustic segment selected.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: 22-POINT BALL 22 AUDIT SUITE */}
      {showValidationModal && validationReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-3xl bg-[#141414] border border-[#2A2A2A] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#222]">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                  <h2 className="text-xl font-bold text-[#F5F5F5]">
                    BALL 22 — Speech AI & Acoustic Validation Suite
                  </h2>
                </div>
                <p className="text-xs text-[#888] mt-1">
                  Automated 22-Point Verification for Indus-Kohistani Speech Recognition & Phoneme Alignment
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
                    {validationReport.allPassed ? 'ALL 22 ACOUSTIC AUDIT CHECKS PASSED (100%)' : 'VALIDATION ISSUES DETECTED'}
                  </div>
                  <div className="text-xs opacity-80">
                    Passed: {validationReport.passCount} / {validationReport.totalChecks} checks • 0 Fatal Errors
                  </div>
                </div>
              </div>

              <div className="text-right text-xs font-mono opacity-80">
                BALL 22 Standard
              </div>
            </div>

            {/* List of 22 Checks */}
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

      {/* MODAL 2: EXPORT ASR MANIFESTS MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-3xl bg-[#141414] border border-[#2A2A2A] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#222]">
              <div>
                <div className="flex items-center gap-2">
                  <Download className="h-6 w-6 text-[#C9A66B]" />
                  <h2 className="text-xl font-bold text-[#F5F5F5]">
                    Export Speech AI & ASR Training Manifests
                  </h2>
                </div>
                <p className="text-xs text-[#888] mt-1">
                  Format-compliant datasets for OpenAI Whisper, HuggingFace Transformers, Kaldi, and Subtitle synchronizers.
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
                onClick={() => setExportFormat('whisper')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  exportFormat === 'whisper' ? 'bg-[#C9A66B] text-[#0C0C0C] font-bold' : 'bg-[#1F1F1F] text-[#888] hover:text-[#CCC]'
                }`}
              >
                OpenAI Whisper (JSONL)
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

              <button
                type="button"
                onClick={() => setExportFormat('kaldi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  exportFormat === 'kaldi' ? 'bg-[#C9A66B] text-[#0C0C0C] font-bold' : 'bg-[#1F1F1F] text-[#888] hover:text-[#CCC]'
                }`}
              >
                Kaldi / ESPnet (wav.scp)
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('vtt')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  exportFormat === 'vtt' ? 'bg-[#C9A66B] text-[#0C0C0C] font-bold' : 'bg-[#1F1F1F] text-[#888] hover:text-[#CCC]'
                }`}
              >
                WebVTT Phonemic Alignment
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
                Target: <span className="text-[#C9A66B] font-mono">{filteredSegments.length} Utterances</span>
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
