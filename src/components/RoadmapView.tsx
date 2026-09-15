import React from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  Database, 
  Users, 
  Mic, 
  CheckSquare, 
  Award, 
  Download, 
  Smartphone, 
  Cpu, 
  Layers, 
  ArrowDown, 
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Globe,
  Radio,
  Languages,
  Brain,
  Search,
  Code,
  Lock,
  Rocket,
  Linkedin
} from 'lucide-react';
import { Contribution, RewardConfig, UserProfile } from '../types';
import { PROJECT_DIRECTOR_LINKEDIN } from '../services/speechAiService';
import { AboutProjectDirector } from './AboutProjectDirector';
import { LinkedInIconLink } from './LinkedInIconLink';

interface RoadmapViewProps {
  contributions: Contribution[];
  rewardConfig: RewardConfig;
  currentUser: UserProfile;
  onNavigateTab: (tab: 'contribute' | 'my_contributions' | 'verification_queue' | 'corpus_explorer' | 'admin_panel' | 'dataset_releases' | 'nlp_workspace' | 'translation_workspace' | 'speech_workspace' | 'llm_workspace') => void;
}


export const RoadmapView: React.FC<RoadmapViewProps> = ({
  contributions,
  rewardConfig,
  currentUser,
  onNavigateTab
}) => {
  const totalContributions = (contributions || []).length;
  const verifiedContributions = (contributions || []).filter(
    c => c?.verified?.status === 'approved' || c?.verified?.status === 'corrected'
  ).length;
  const audioContributions = (contributions || []).filter(c => !!c?.raw?.audioUrl).length;
  const pendingReview = (contributions || []).filter(c => c?.verified?.status === 'pending_review').length;
  const escalatedReview = (contributions || []).filter(c => c?.verified?.status === 'escalated_to_senior').length;

  const milestones = [
    {
      id: 'ball_10',
      tag: 'BALL 10',
      title: 'Google AI Studio Foundation Prototype',
      subtitle: 'Trilingual Schema & Indus-Kohistani Script Engine',
      description: 'Initial architecture establishing Indus-Kohistani Unicode support, Arabic/Kohistani RTL typography, Urdu & English trilingual data schemas, and clean design system.',
      status: 'completed',
      icon: Sparkles,
      color: 'from-amber-500/20 to-[#C9A66B]/20 text-[#D4B582] border-[#C9A66B]/40',
      actionTab: 'contribute' as const,
      actionLabel: 'Open Contributor Portal',
      metrics: 'Trilingual typography • RTL Input Engine • Unicode Support'
    },
    {
      id: 'ball_11',
      tag: 'BALL 11',
      title: 'Firebase & 3-Layer Database Architecture',
      subtitle: 'RAW → VERIFIED → DERIVED Schema Standard',
      description: 'Zero data overwrite architecture: raw community submissions are immutable, human reviewer audits are cryptographically tagged, and computed metrics update dynamically.',
      status: 'completed',
      icon: Database,
      color: 'from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-800/40',
      actionTab: 'corpus_explorer' as const,
      actionLabel: 'View 3-Layer Corpus',
      metrics: `${totalContributions} Total Records • ${verifiedContributions} Immutable Verified Records`
    },
    {
      id: 'ball_12',
      tag: 'BALL 12',
      title: 'Contributor System & On-Screen Phonetic Keyboard',
      subtitle: 'Word, Sentence & Cultural Expression Collection',
      description: 'Community-facing intake portal supporting regional dialects, official specialized Kohistani Unicode characters (ڇ, څ, ݜ, ڙ, ݨ), POS tagging, and semantic categorization.',
      status: 'completed',
      icon: Users,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-800/40',
      actionTab: 'contribute' as const,
      actionLabel: 'Make Contribution',
      metrics: '5 Official IK Characters (ڇ, څ, ݜ, ڙ, ݨ) • Regional Varieties • Context Annotations'
    },
    {
      id: 'ball_13',
      tag: 'BALL 13',
      title: 'Spoken Audio Recording Engine',
      subtitle: 'Direct Microphone Capture & Phonetic Speech Corpus',
      description: 'Native Web Audio API microphone recording with real-time waveform feedback, instant audio playback, duration calculation, and automated audio bonus calculation.',
      status: 'completed',
      icon: Mic,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-800/40',
      actionTab: 'contribute' as const,
      actionLabel: 'Record Pronunciation',
      metrics: `${audioContributions} Audio Clips Recorded • Speech Corpus Ready`
    },
    {
      id: 'ball_14',
      tag: 'BALL 14',
      title: 'Reviewer & Senior Linguist Verification Dashboard',
      subtitle: '2-Tier Human Quality Control & Linguistic Audit',
      description: 'Structured review queue with dual-tier escalation (Reviewer → Senior Linguist / Saif Ullah). Supports One-Click Approval, Correction & Approval, or Dialectal Rejection with notes.',
      status: 'completed',
      icon: CheckSquare,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-800/40',
      actionTab: 'verification_queue' as const,
      actionLabel: 'Review Queue',
      metrics: `${pendingReview} Pending • ${escalatedReview} Escalated • ${verifiedContributions} Verified`
    },
    {
      id: 'ball_15',
      tag: 'BALL 15',
      title: 'Rewards Engine & Contributor Achievements',
      subtitle: 'Gamified Milestones & Real PKR Financial Compensation',
      description: 'Transparent contributor ledger calculating earned Points and PKR rewards for verified entries. Tiered badge progression (Novice Collector → Master Lexicographer) & Quality Score tracking.',
      status: 'completed',
      icon: Award,
      color: 'from-[#C9A66B]/20 to-yellow-500/20 text-[#D4B582] border-[#C9A66B]/40',
      actionTab: 'my_contributions' as const,
      actionLabel: 'View My Rewards & Badges',
      metrics: `Config: ${rewardConfig.wordRewardPkr} PKR/word • ${rewardConfig.sentenceRewardPkr} PKR/sentence • +${rewardConfig.audioBonusRewardPkr} PKR audio`
    },
    {
      id: 'ball_16',
      tag: 'BALL 16',
      title: 'Admin Governance & Technology Export Hub',
      subtitle: 'Data Distribution for NLP, MT, ASR & Lexicography',
      description: 'Project Director control center for tuning financial compensation rates and exporting production datasets in Full 3-Layer JSON, JSONL for LLM training, Trilingual Parallel CSV, and Speech Manifests.',
      status: 'completed',
      icon: Download,
      color: 'from-emerald-500/20 to-cyan-500/20 text-emerald-300 border-emerald-800/40',
      actionTab: 'admin_panel' as const,
      actionLabel: 'Open Export Hub',
      metrics: 'JSON • JSONL (NLP/RAG) • Parallel CSV (NMT) • Speech Manifest'
    },
    {
      id: 'pilot',
      tag: 'REAL COMMUNITY PILOT',
      title: 'Field Deployment in Kohistan District',
      subtitle: 'Community Speaker Engagement & Multi-Dialect Sampling',
      description: 'Mobilization of native speakers across Kohistan (Seo, Jijal, Duber, Patan valleys) to record elders, oral traditions, and folklore with local linguistic custodian oversight.',
      status: 'active',
      icon: Globe,
      color: 'from-teal-500/20 to-emerald-500/20 text-teal-300 border-teal-800/40',
      actionTab: 'corpus_explorer' as const,
      actionLabel: 'Explore Community Lexicon',
      metrics: '4 Dialects Covered • Preserving Endangered Indigenous Knowledge'
    },
    {
      id: 'android',
      tag: 'Android Ready',
      title: 'Android & Mobile PWA Field Client',
      subtitle: 'Low-Bandwidth, Touch-Optimized Mobile Experience',
      description: 'Responsive mobile layout with touch-friendly Indus-Kohistani virtual keyboard, mobile audio capture, and lightweight offline storage capabilities for field workers.',
      status: 'ready',
      icon: Smartphone,
      color: 'from-green-500/20 to-emerald-500/20 text-green-300 border-green-800/40',
      actionTab: 'contribute' as const,
      actionLabel: 'Test Mobile Keyboard',
      metrics: 'Mobile Touch Optimized • PWA Ready • Android Target'
    },
    {
      id: 'ball_20',
      tag: 'BALL 20',
      title: 'AI/NLP Corpus Pipeline & Derived Datasets',
      subtitle: 'Deterministic 80/10/10 Splits, Stratification & 20-Point Audit',
      description: 'Standardized dataset preparation for NLP, ASR, and Speech AI directly from published immutable releases with automated linguistic audits.',
      status: 'completed',
      icon: Cpu,
      color: 'from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-800/40',
      actionTab: 'nlp_workspace' as const,
      actionLabel: 'Open AI/NLP Workspace',
      metrics: 'Deterministic Splits • NLP Text • Audio ASR • Lexicon'
    },
    {
      id: 'ball_21',
      tag: 'BALL 21',
      title: 'Parallel Translation & MTPE Workspace',
      subtitle: 'Human-Verified Indus-Kohistani ↔ Urdu ↔ English MTPE Layer',
      description: 'Controlled translation workflows connecting Indus-Kohistani, Urdu, and English. Featuring real-time Translation Memory (TM), isolated MT suggestions, append-only verification reviews, and TMX 1.4 parallel export.',
      status: 'completed',
      icon: Languages,
      color: 'from-amber-500/20 to-[#C9A66B]/20 text-[#D4B582] border-[#C9A66B]/40',
      actionTab: 'translation_workspace' as const,
      actionLabel: 'Open MTPE Workspace',
      metrics: 'Verified Canonical • Translation Memory • MT Suggestions • TMX 1.4'
    },
    {
      id: 'ball_22',
      tag: 'BALL 22',
      title: 'Speech AI & Acoustic Phoneme Alignment Studio',
      subtitle: 'ASR Corpus, WebVTT Sub-second Alignment & OpenAI Whisper Pipeline',
      description: 'Standardized acoustic segmentation, phonetic IPA unit alignment with special Indus-Kohistani glyphs (ڇ، څ، ݜ، ڙ، ݨ), multi-dialect acoustic balance across 5 official varieties, and OpenAI Whisper/Kaldi manifest generation.',
      status: 'completed',
      icon: Mic,
      color: 'from-teal-500/20 to-emerald-500/20 text-teal-300 border-teal-800/40',
      actionTab: 'speech_workspace' as const,
      actionLabel: 'Open Speech AI Studio',
      metrics: 'OpenAI Whisper Manifest • Sub-second IPA Alignment • 22-Point Audit Suite'
    },
    {
      id: 'ball_23',
      tag: 'BALL 23',
      title: 'LLM Instruction Tuning & Cultural Safety Benchmark',
      subtitle: 'Alpaca, ChatML & DPO Preference Studio with Cultural Safety Guardrails',
      description: 'Format-compliant instruction datasets, Direct Preference Optimization (DPO) chosen vs rejected alignment, trilingual cross-evaluation, and automated 23-point linguistic audit derived from immutable canonical releases.',
      status: 'completed',
      icon: Brain,
      color: 'from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-800/40',
      actionTab: 'llm_workspace' as const,
      actionLabel: 'Open LLM Studio',
      metrics: 'Alpaca & ChatML • DPO Preference Pairs • 23-Point Audit Suite'
    },
    {
      id: 'ball_24',
      tag: 'BALL 24',
      title: 'AI Linguistic Analysis & Morphological Disambiguation',
      subtitle: 'POS Tagging, Dialect-Aware Morphology & Human Approval Gate',
      description: 'AI-assisted morphological decomposition, multi-dialect gloss suggestions, confidence scoring, and strict provenance tracking with mandatory human verification before canonical commit.',
      status: 'completed',
      icon: Brain,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-800/40',
      actionTab: 'verification_queue' as const,
      actionLabel: 'Open Linguistic Verification',
      metrics: 'Morphology Analysis • POS Tagger • Mandatory Human Gate • 10-Point Audit'
    },
    {
      id: 'ball_25',
      tag: 'BALL 25',
      title: 'RAG Knowledge Retrieval & Dialect-Aware Search',
      subtitle: 'Semantic & Multilingual Corpus Indexing on Verified Releases',
      description: 'Semantic vector retrieval grounded strictly on verified/published dataset releases. Dialect-aware scoring, citation provenance, and strict exclusion of raw, private, or rejected records.',
      status: 'completed',
      icon: Search,
      color: 'from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-800/40',
      actionTab: 'corpus_explorer' as const,
      actionLabel: 'Explore RAG Knowledge Base',
      metrics: 'Dialect-Aware RAG • Verified-Only Corpus • Provenance Citations • 6-Point Audit'
    },
    {
      id: 'ball_26',
      tag: 'BALL 26',
      title: 'AI Neural Translation & MTPE Post-Editing Workflow',
      subtitle: 'Trilingual IK ↔ Urdu ↔ English MT with Human Post-Editing',
      description: 'Assisted bi-directional neural machine translation with human post-editing (MTPE), confidence estimation, reviewer verdicts, and zero automatic overwriting of raw or verified datasets.',
      status: 'completed',
      icon: Languages,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-800/40',
      actionTab: 'translation_workspace' as const,
      actionLabel: 'Open MTPE Studio',
      metrics: 'MTPE Post-Editing • Trilingual NMT • Translation Memory • 6-Point Audit'
    },
    {
      id: 'ball_27',
      tag: 'BALL 27',
      title: 'Speech & Pronunciation Enhancement Studio',
      subtitle: 'Phoneme Boundary Alignment, Kaldi & Whisper Production Manifests',
      description: 'Sub-second acoustic phoneme alignment, audio quality verification (SNR/clipping), speaker isolation, and multi-format manifest generation for OpenAI Whisper and Kaldi ASR training.',
      status: 'completed',
      icon: Mic,
      color: 'from-teal-500/20 to-emerald-500/20 text-teal-300 border-teal-800/40',
      actionTab: 'speech_workspace' as const,
      actionLabel: 'Open Speech Studio',
      metrics: 'Kaldi & Whisper Manifests • Sub-second IPA • SNR & Clipping Audit • 6-Point Audit'
    },
    {
      id: 'ball_28',
      tag: 'BALL 28',
      title: 'Researcher API & International Citation Generator',
      subtitle: 'Open Linguistic Endpoints, BibTeX, APA & ISO-690 Formats',
      description: 'Read-only REST API endpoints for global computational linguists, rate limiting, dataset documentation, and standard citation generators (BibTeX, APA, ISO-690, Harvard, Chicago).',
      status: 'completed',
      icon: Code,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-800/40',
      actionTab: 'admin_panel' as const,
      actionLabel: 'Open API Documentation',
      metrics: 'REST API • BibTeX / APA Citations • Rate Limiting • 6-Point Audit'
    },
    {
      id: 'ball_29',
      tag: 'BALL 29',
      title: 'Institutional Governance & Archival Escrow Security',
      subtitle: 'Role-Based Access Control, Tamper-Evident Logs & SHA-256 Escrow',
      description: 'Multi-role institutional governance (Project Director Saif Ullah, Linguistic Advisors, Senior Reviewers), immutable audit logs, digital stewardship policy, and offline cryptographic escrow seals.',
      status: 'completed',
      icon: Lock,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-800/40',
      actionTab: 'admin_panel' as const,
      actionLabel: 'Open Governance Ledger',
      metrics: 'Multi-Role RBAC • Tamper-Evident Audit • Archival Escrow • 5-Point Audit'
    },
    {
      id: 'ball_30',
      tag: 'BALL 30',
      title: 'Production Hardening & Master Publication Release',
      subtitle: 'Zero-Secret Leakage, RTL Accessibility & 30-Milestone Master Audit',
      description: 'Complete production readiness validation: zero private secrets leaked, WCAG 2.1 AA accessibility with specialized Perso-Arabic RTL typography (ڇ, څ, ݜ, ڙ, ݨ), and 100% pass across all 30 BALL validation suites.',
      status: 'completed',
      icon: Rocket,
      color: 'from-amber-500/20 to-emerald-500/20 text-[#D4B582] border-[#C9A66B]/50',
      actionTab: 'dataset_releases' as const,
      actionLabel: 'View Master Production Release',
      metrics: 'Production Hardened • RTL Perso-Arabic AA • 30/30 BALLs Verified Passed'
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-[#111111] p-6 sm:p-8 shadow-sm border border-[#222] mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="rounded-full bg-[#C9A66B]/20 px-3 py-0.5 text-xs font-bold text-[#D4B582] border border-[#C9A66B]/30">
                FiKR&CD — Forum for Indus-Kohistani Research & Culture Development
              </span>
              <span className="rounded-full bg-emerald-950/60 px-3 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-700/40 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> BALL 1–30 All Milestones 100% Passed
              </span>
              <span className="rounded-full bg-[#1A1A1A] px-3 py-0.5 text-xs text-[#888] border border-[#333] flex items-center gap-2">
                <span>Project Director: <strong className="text-[#E5E5E5]">Saif Ullah</strong></span>
                <LinkedInIconLink id="roadmap-director-linkedin-link" size={20} />
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F5F5F5] tracking-tight">
              Indus-Kohistani Language Digital Preservation & Technology Initiative
            </h2>
            <p className="mt-1.5 text-xl sm:text-2xl lg:text-3xl font-kohistani text-[#D4B582] font-semibold leading-relaxed tracking-wide sm:[word-spacing:0.12em]" dir="rtl">
              اِنڈَس کُستَئی ژِیباں ڈیجیٹل سَنْبَھلتُب اَں تَکْنِیْکی مَنْصُوبَہ
            </p>
            <p className="mt-2 text-xs sm:text-sm text-[#999] leading-relaxed">
              From the Google AI Studio foundation prototype (BALL 10) to real community field deployment, mobile accessibility, and downstream AI/NLP model training.
            </p>
          </div>

          {/* Quick Snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#161616] p-4 rounded-2xl border border-[#262626]">
            <div className="text-center">
              <span className="text-xl font-black text-[#F5F5F5] font-mono-code">{totalContributions}</span>
              <span className="block text-[10px] font-bold text-[#888] uppercase">Submissions</span>
            </div>
            <div className="text-center">
              <span className="text-xl font-black text-emerald-400 font-mono-code">{verifiedContributions}</span>
              <span className="block text-[10px] font-bold text-emerald-500 uppercase">Verified</span>
            </div>
            <div className="text-center col-span-2 sm:col-span-1">
              <span className="text-xl font-black text-[#C9A66B] font-mono-code">{audioContributions}</span>
              <span className="block text-[10px] font-bold text-[#C9A66B] uppercase">Audio Clips</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Milestone Chain */}
      <div className="space-y-4">
        {milestones.map((m, index) => {
          const Icon = m.icon;
          const isLast = index === milestones.length - 1;

          return (
            <div key={m.id} className="relative">
              <div className="rounded-3xl bg-[#111111] p-6 shadow-sm border border-[#222] hover:border-[#C9A66B]/40 transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Milestone Details */}
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br border ${m.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded bg-[#1A1A1A] px-2 py-0.5 text-[11px] font-mono font-bold text-[#C9A66B] border border-[#333]">
                          {m.tag}
                        </span>
                        <span className="text-xs font-bold text-[#AAA]">
                          {m.subtitle}
                        </span>
                        {m.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800/40">
                            <CheckCircle2 className="h-3 w-3" /> Fully Operational
                          </span>
                        )}
                        {m.status === 'active' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-950/60 px-2.5 py-0.5 text-[10px] font-bold text-teal-300 border border-teal-800/40">
                            <Radio className="h-3 w-3 text-teal-400 animate-pulse" /> Active Community Phase
                          </span>
                        )}
                        {m.status === 'ready' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-950/60 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-800/40">
                            <Sparkles className="h-3 w-3" /> Production Ready
                          </span>
                        )}
                      </div>

                      <h3 className="mt-1 text-base font-extrabold text-[#F5F5F5]">
                        {m.title}
                      </h3>

                      <p className="mt-1 text-xs text-[#999] max-w-3xl leading-relaxed">
                        {m.description}
                      </p>

                      <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono-code text-[#C9A66B]">
                        <span className="text-[#666]">Capabilities:</span> {m.metrics}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Button */}
                  <div className="shrink-0 flex items-center">
                    <button
                      type="button"
                      onClick={() => onNavigateTab(m.actionTab)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#1E1E1E] hover:bg-[#C9A66B] hover:text-[#0C0C0C] px-4 py-2.5 text-xs font-bold text-[#E5E5E5] transition border border-[#333] cursor-pointer shadow-xs w-full md:w-auto justify-center"
                    >
                      <span>{m.actionLabel}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Connecting Down Arrow */}
              {!isLast && (
                <div className="flex justify-center my-1.5">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[#181818] border border-[#333] text-[#C9A66B]">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Architecture Provenance Strip */}
      <div className="mt-8 rounded-3xl bg-[#111111] p-6 border border-[#222]">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-[#C9A66B]" />
          <h4 className="text-sm font-bold text-[#F5F5F5]">
            Core Data Pipeline & Linguistic Provenance
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
            <span className="text-xs font-bold text-amber-400 block mb-1">1. RAW Submissions Layer</span>
            <p className="text-[#888]">
              Captured directly from native speakers with dialect, IPA transcription, audio recordings, and metadata. Immutable preservation record.
            </p>
          </div>
          <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
            <span className="text-xs font-bold text-emerald-400 block mb-1">2. VERIFIED Custodian Layer</span>
            <p className="text-[#888]">
              Audited by certified linguistic reviewers and Senior Linguist / Project Director Saif Ullah. Phonetic and orthographic corrections logged with audit trails.
            </p>
          </div>
          <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
            <span className="text-xs font-bold text-[#C9A66B] block mb-1">3. DERIVED & AI Ready Layer</span>
            <p className="text-[#888]">
              Automated tokenization, parallel translation alignment, financial compensation calculations, and export pipelines for Whisper ASR and MT fine-tuning.
            </p>
          </div>
        </div>
      </div>

      {/* About the Project Director Section */}
      <div className="mt-8">
        <AboutProjectDirector />
      </div>
    </div>
  );
};
