import React, { useState, useMemo } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  ChevronRight, 
  Volume2, 
  Layers, 
  Shield, 
  Sparkles,
  User,
  History,
  FileCheck,
  Mic,
  Calendar,
  Tag,
  Globe2,
  BookOpen,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import confetti from 'canvas-confetti';
import { Contribution, UserProfile, VerificationStatus, Milestone } from '../types';
import { MILESTONES, getDialectDisplayName } from '../data/initialData';
import { AudioPlayer } from './AudioPlayer';

interface MyContributionsProps {
  contributions: Contribution[];
  currentUser: UserProfile;
  firebaseUser?: FirebaseUser | null;
  onNavigateToContribute: () => void;
}

export const MyContributions: React.FC<MyContributionsProps> = ({
  contributions,
  currentUser,
  firebaseUser,
  onNavigateToContribute
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);

  // Authenticated Contributor Identity (strict isolation of own contributions)
  const effectiveContributorId = firebaseUser?.uid || currentUser.id;
  const contributorDisplayName = firebaseUser?.displayName || currentUser.name;
  const contributorEmail = firebaseUser?.email || currentUser.email;

  // Filter to authenticated contributor's own submissions only
  const ownContributions = useMemo(() => {
    return contributions.filter((c) => {
      if (firebaseUser) {
        return c.raw?.contributorId === firebaseUser.uid || c.raw?.contributorId === currentUser.id;
      }
      return c.raw?.contributorId === currentUser.id || c.raw?.contributorName === currentUser.name;
    });
  }, [contributions, firebaseUser, currentUser]);

  // Metric 1: Total contributions
  const totalCount = ownContributions.length;

  // Metric 2: Verified contributions
  const verifiedItems = useMemo(() => {
    return ownContributions.filter((c) => {
      const st = c.verified?.status || c.status;
      return st === 'approved' || st === 'corrected';
    });
  }, [ownContributions]);
  const verifiedCount = verifiedItems.length;

  // Metric 3: Audio recordings submitted
  const audioCount = useMemo(() => {
    return ownContributions.filter((c) => {
      return Boolean(c.raw?.audioUrl || c.derived?.hasAudio || (c.raw as any)?.associatedRecordingId);
    }).length;
  }, [ownContributions]);

  // Metric 4: Contributions pending review
  const pendingCount = useMemo(() => {
    return ownContributions.filter((c) => {
      const st = c.verified?.status || c.raw?.status || c.status;
      return st === 'pending_review' || st === 'submitted_raw' || !st;
    }).length;
  }, [ownContributions]);

  // Under Review & Revision Requested / Rejected counts
  const underReviewCount = useMemo(() => {
    return ownContributions.filter(c => c.verified?.status === 'escalated_to_senior').length;
  }, [ownContributions]);

  const rejectedCount = useMemo(() => {
    return ownContributions.filter(c => c.verified?.status === 'rejected').length;
  }, [ownContributions]);

  // Metric 5: Current points (from existing derived data model only)
  const totalPoints = useMemo(() => {
    return verifiedItems.reduce((acc, c) => acc + (c.derived?.calculatedPoints || 0), 0);
  }, [verifiedItems]);

  // Metric 6: Current achievement / badge progress
  const unlockedMilestones = useMemo(() => {
    return MILESTONES.filter(m => verifiedCount >= m.threshold);
  }, [verifiedCount]);

  const nextMilestone = useMemo(() => {
    return MILESTONES.find(m => verifiedCount < m.threshold) || null;
  }, [verifiedCount]);

  // Filtered History list
  const filteredHistory = useMemo(() => {
    if (filterStatus === 'all') return ownContributions;
    if (filterStatus === 'verified') {
      return ownContributions.filter(c => c.verified?.status === 'approved' || c.verified?.status === 'corrected');
    }
    if (filterStatus === 'pending') {
      return ownContributions.filter(c => c.verified?.status === 'pending_review' || c.verified?.status === 'submitted_raw' || !c.verified?.status);
    }
    if (filterStatus === 'under_review') {
      return ownContributions.filter(c => c.verified?.status === 'escalated_to_senior');
    }
    if (filterStatus === 'revision_requested') {
      return ownContributions.filter(c => (c.verified?.status as any) === 'revision_requested' || (c.verified?.status as any) === 'changes_requested');
    }
    if (filterStatus === 'rejected') {
      return ownContributions.filter(c => c.verified?.status === 'rejected');
    }
    return ownContributions;
  }, [ownContributions, filterStatus]);

  // Clear Status Label Badge Generator
  const renderStatusBadge = (status?: VerificationStatus | string) => {
    switch (status) {
      case 'approved':
      case 'corrected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/70 px-2.5 py-1 text-xs font-semibold text-emerald-300 border border-emerald-700/60 whitespace-nowrap">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            Verified
          </span>
        );
      case 'escalated_to_senior':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-950/70 px-2.5 py-1 text-xs font-semibold text-indigo-300 border border-indigo-700/60 whitespace-nowrap">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
            Under Review
          </span>
        );
      case 'revision_requested':
      case 'changes_requested':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/70 px-2.5 py-1 text-xs font-semibold text-amber-300 border border-amber-700/60 whitespace-nowrap">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            Revision Requested
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/70 px-2.5 py-1 text-xs font-semibold text-rose-300 border border-rose-700/60 whitespace-nowrap">
            <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
            Rejected
          </span>
        );
      case 'submitted_raw':
      case 'pending_review':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/70 px-2.5 py-1 text-xs font-semibold text-amber-300 border border-amber-700/60 whitespace-nowrap">
            <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            Pending Review
          </span>
        );
    }
  };

  const getCategoryLabel = (type?: string, cat?: string) => {
    const raw = cat || type || 'word';
    switch (raw.toLowerCase()) {
      case 'word':
        return 'Word / لغت';
      case 'sentence':
        return 'Sentence / جملہ';
      case 'proverb':
        return 'Proverb / ضرب المثل';
      case 'idiom':
        return 'Idiom / محاورہ';
      case 'cultural_expression':
        return 'Cultural / ثقافتی';
      case 'poetry':
        return 'Poetry / شاعری';
      default:
        return raw.replace('_', ' ');
    }
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  return (
    <div id="contributor-dashboard" className="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6">
      {/* Contributor Profile & Greeting Banner */}
      <div className="rounded-3xl bg-[#141414] p-5 sm:p-6 border border-[#242424] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#C9A66B]/15 border border-[#C9A66B]/30 text-[#D4B582]">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-[#F5F5F5]">
                {contributorDisplayName}
              </h2>
              {firebaseUser ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                  Firebase Contributor
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#222] text-[#AAA] border border-[#333]">
                  Community Contributor
                </span>
              )}
            </div>
            <p className="text-xs text-[#888] mt-0.5">
              Indus-Kohistani Digital Preservation Dashboard • <span className="text-[#C9A66B] font-medium">{currentUser.dialect.toUpperCase()} Dialect</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            type="button"
            onClick={onNavigateToContribute}
            className="rounded-xl bg-[#C9A66B] px-4 py-2.5 text-xs font-bold text-[#0C0C0C] hover:bg-[#D4B582] transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <BookOpen className="h-4 w-4" />
            + New Contribution
          </button>
        </div>
      </div>

      {/* 6 Required Metric Cards (Mobile-first responsive grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total contributions */}
        <div id="stat-total-contributions" className="rounded-2xl bg-[#141414] p-4 border border-[#242424] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888] mb-2">
            <span className="text-xs font-medium">Total Entries</span>
            <Layers className="h-4 w-4 text-[#C9A66B]" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] font-mono-code">
              {totalCount}
            </span>
            <span className="text-[11px] text-[#777] block mt-0.5">Submitted by you</span>
          </div>
        </div>

        {/* 2. Verified contributions */}
        <div id="stat-verified-contributions" className="rounded-2xl bg-[#141414] p-4 border border-[#242424] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888] mb-2">
            <span className="text-xs font-medium text-emerald-400">Verified</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono-code">
              {verifiedCount}
            </span>
            <span className="text-[11px] text-[#777] block mt-0.5">In corpus lexicon</span>
          </div>
        </div>

        {/* 3. Audio recordings submitted */}
        <div id="stat-audio-recordings" className="rounded-2xl bg-[#141414] p-4 border border-[#242424] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888] mb-2">
            <span className="text-xs font-medium text-[#D4B582]">Audio Recordings</span>
            <Mic className="h-4 w-4 text-[#C9A66B]" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#D4B582] font-mono-code">
              {audioCount}
            </span>
            <span className="text-[11px] text-[#777] block mt-0.5">Native spoken audio</span>
          </div>
        </div>

        {/* 4. Contributions pending review */}
        <div id="stat-pending-review" className="rounded-2xl bg-[#141414] p-4 border border-[#242424] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888] mb-2">
            <span className="text-xs font-medium text-amber-400">Pending Review</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono-code">
              {pendingCount}
            </span>
            <span className="text-[11px] text-[#777] block mt-0.5">Awaiting reviewer</span>
          </div>
        </div>

        {/* 5. Current points (from existing derived data model) */}
        <div id="stat-current-points" className="rounded-2xl bg-[#141414] p-4 border border-[#242424] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888] mb-2">
            <span className="text-xs font-medium text-[#C9A66B]">Current Points</span>
            <Sparkles className="h-4 w-4 text-[#C9A66B]" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#E8C587] font-mono-code">
                {totalPoints}
              </span>
              <span className="text-xs text-[#888]">pts</span>
            </div>
            <span className="text-[11px] text-[#777] block mt-0.5">Derived from verified</span>
          </div>
        </div>

        {/* 6. Current achievement badge tier */}
        <div id="stat-badge-tier" className="rounded-2xl bg-[#141414] p-4 border border-[#242424] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888] mb-2">
            <span className="text-xs font-medium">Badge Tier</span>
            <Award className="h-4 w-4 text-[#C9A66B]" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold text-[#F5F5F5] block truncate">
              {unlockedMilestones.length > 0
                ? unlockedMilestones[unlockedMilestones.length - 1].nameEn.split(' ')[0]
                : 'Contributor'}
            </span>
            <span className="text-[11px] text-[#C9A66B] block mt-0.5">
              {unlockedMilestones.length}/5 Badges
            </span>
          </div>
        </div>
      </div>

      {/* Achievement & Badge Progress Section */}
      <div className="rounded-3xl bg-[#141414] p-5 sm:p-6 border border-[#242424]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#222]">
          <div>
            <h3 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
              <Award className="h-5 w-5 text-[#C9A66B]" />
              Achievement & Preservation Badges
            </h3>
            <p className="text-xs text-[#888] mt-0.5">
              Badges are unlocked through verified linguistic contributions in the corpus.
            </p>
          </div>

          {nextMilestone && (
            <div className="text-xs text-[#D4B582] bg-[#C9A66B]/10 px-3 py-1.5 rounded-xl border border-[#C9A66B]/30 flex items-center gap-1.5 self-start sm:self-center">
              <span>Next Badge: <strong>{nextMilestone.nameEn}</strong> ({verifiedCount}/{nextMilestone.threshold} verified)</span>
            </div>
          )}
        </div>

        {/* Milestones Badge Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
          {MILESTONES.map((m) => {
            const isUnlocked = verifiedCount >= m.threshold;
            return (
              <div
                key={m.id}
                className={`rounded-2xl p-3.5 border text-center transition flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-[#1C1810] border-[#C9A66B]/60 text-[#E5E5E5] shadow-xs'
                    : 'bg-[#111111] border-[#222222] opacity-60'
                }`}
              >
                <div>
                  <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold mb-2 shadow-xs ${
                    isUnlocked ? 'bg-[#C9A66B] text-[#0C0C0C]' : 'bg-[#222] text-[#666]'
                  }`}>
                    {m.id === 'bronze' && '🥉'}
                    {m.id === 'silver' && '🥈'}
                    {m.id === 'gold' && '🥇'}
                    {m.id === 'platinum' && '👑'}
                    {m.id === 'guardian' && '🛡️'}
                  </div>
                  <p className="text-xs font-bold text-[#F5F5F5]">{m.nameEn}</p>
                  <p className="font-urdu text-[11px] text-[#C9A66B] mt-0.5" dir="rtl">{m.nameUrdu}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#262626] text-[10px] text-[#888] font-mono-code flex items-center justify-center gap-1">
                  {isUnlocked ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                      <Check className="h-3 w-3" /> Unlocked
                    </span>
                  ) : (
                    <span>{verifiedCount} / {m.threshold}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contribution History & Status */}
      <div className="rounded-3xl bg-[#141414] p-5 sm:p-6 border border-[#242424]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222]">
          <div>
            <h3 className="text-base font-bold text-[#F5F5F5]">
              My Contribution History
            </h3>
            <p className="text-xs text-[#888] mt-0.5">
              Review and inspect your submitted Indus-Kohistani entries and their live verification status.
            </p>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition cursor-pointer ${
                filterStatus === 'all' ? 'bg-[#C9A66B] text-[#0C0C0C]' : 'bg-[#1E1E1E] text-[#888] hover:bg-[#282828]'
              }`}
            >
              All ({ownContributions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('verified')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition cursor-pointer ${
                filterStatus === 'verified' ? 'bg-emerald-700 text-white' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/40'
              }`}
            >
              Verified ({verifiedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition cursor-pointer ${
                filterStatus === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-950/40 text-amber-300 border border-amber-800/40 hover:bg-amber-900/40'
              }`}
            >
              Pending Review ({pendingCount})
            </button>
            {underReviewCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterStatus('under_review')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition cursor-pointer ${
                  filterStatus === 'under_review' ? 'bg-indigo-700 text-white' : 'bg-indigo-950/40 text-indigo-300 border border-indigo-800/40 hover:bg-indigo-900/40'
                }`}
              >
                Under Review ({underReviewCount})
              </button>
            )}
            {rejectedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterStatus('rejected')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition cursor-pointer ${
                  filterStatus === 'rejected' ? 'bg-rose-700 text-white' : 'bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/40'
                }`}
              >
                Rejected ({rejectedCount})
              </button>
            )}
          </div>
        </div>

        {/* History List Items */}
        <div className="mt-4 divide-y divide-[#1F1F1F]">
          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-[#777]">
              <p className="text-sm font-semibold">No contributions found in this filter.</p>
              <button
                type="button"
                onClick={onNavigateToContribute}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#C9A66B] px-4 py-2 text-xs font-bold text-[#0C0C0C] hover:bg-[#D4B582] transition cursor-pointer"
              >
                + Submit your first contribution
              </button>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const currentStatus = item.verified?.status || item.raw?.status || item.status;
              const hasAudio = Boolean(item.raw?.audioUrl || item.derived?.hasAudio || (item.raw as any)?.associatedRecordingId);
              const ikText = item.verified?.correctedIkText || item.raw?.ikText;
              const urduMeaning = item.verified?.correctedUrduMeaning || item.raw?.urduMeaning;
              const englishMeaning = item.verified?.correctedEnglishMeaning || item.raw?.englishMeaning;
              const dialect = item.verified?.verifiedDialect || item.raw?.dialect || 'Patan';
              const category = getCategoryLabel(item.type, item.raw?.category);
              const submittedDate = item.raw?.submittedAt ? new Date(item.raw.submittedAt).toLocaleDateString() : 'Recent';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedContribution(item)}
                  className="py-4 px-2 hover:bg-[#181818] rounded-2xl transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E1E1E] text-[#AAA] font-bold text-xs uppercase group-hover:bg-[#C9A66B]/20 group-hover:text-[#D4B582] transition border border-[#2E2E2E]">
                      {item.type === 'word' ? 'W' : item.type === 'sentence' ? 'S' : 'E'}
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      {/* IK Text & Transcription */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-kohistani text-lg sm:text-xl font-bold text-[#F5F5F5] leading-relaxed" dir="rtl">
                          {ikText}
                        </span>
                        {item.raw?.ikTranscription && (
                          <span className="font-mono-code text-xs text-[#888]">
                            [{item.verified?.correctedTranscription || item.raw.ikTranscription}]
                          </span>
                        )}
                        {item.isDemoData && (
                          <span className="rounded bg-[#222] text-[#888] text-[10px] font-mono-code font-bold px-1.5 py-0.2 border border-[#333]">
                            [DEMO]
                          </span>
                        )}
                      </div>

                      {/* Meanings (Urdu & English) */}
                      <div className="text-xs text-[#AAA] flex flex-wrap items-center gap-x-3 gap-y-1">
                        {urduMeaning && (
                          <span className="font-urdu text-[#E5E5E5]" dir="rtl">
                            اردو: {urduMeaning}
                          </span>
                        )}
                        {englishMeaning && (
                          <span className="text-[#BBB]">
                            EN: {englishMeaning}
                          </span>
                        )}
                      </div>

                      {/* Metadata: Category, Dialect, Date, Audio */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#777]">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-[#666]" />
                          <span>{category}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Globe2 className="h-3 w-3 text-[#666]" />
                          <span>{getDialectDisplayName(dialect)}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#666]" />
                          <span>{submittedDate}</span>
                        </span>
                        {hasAudio && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-[#D4B582] bg-[#C9A66B]/15 px-2 py-0.5 rounded-md font-semibold text-[10px] border border-[#C9A66B]/30">
                              <Volume2 className="h-3 w-3" />
                              Audio Attached
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#222]">
                    <div className="flex flex-col md:items-end gap-1">
                      {renderStatusBadge(currentStatus)}
                      {item.derived?.calculatedPoints ? (
                        <span className="text-[11px] font-semibold text-[#D4B582] font-mono-code">
                          +{item.derived.calculatedPoints} pts
                        </span>
                      ) : null}
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#555] group-hover:text-[#C9A66B] transition" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Contribution Detailed Inspection Modal */}
      {selectedContribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#141414] p-5 sm:p-6 shadow-2xl border border-[#2E2E2E] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#888] font-mono-code uppercase">
                  Contribution ID: {selectedContribution.id}
                </span>
                {selectedContribution.isDemoData && (
                  <span className="rounded bg-[#222] text-[#888] text-[10px] font-mono-code font-bold px-1.5 py-0.5 border border-[#333]">
                    [DEMO DATA]
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedContribution(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#222] text-[#AAA] hover:bg-[#333] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs text-[#888]">
                  <span>Type: <strong className="text-[#E5E5E5] capitalize">{selectedContribution.type}</strong></span>
                  <span>•</span>
                  <span>Dialect: <strong className="capitalize text-[#E5E5E5]">{selectedContribution.raw?.dialect}</strong></span>
                </div>
                {renderStatusBadge(selectedContribution.verified?.status || selectedContribution.status)}
              </div>

              {/* RAW vs VERIFIED Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Layer 1: RAW (Immutable Contributor Input) */}
                <div className="rounded-2xl bg-[#181818] p-4 border border-[#2A2A2A] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                    <span className="text-xs font-bold text-[#AAA] uppercase tracking-wider flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-[#666]" />
                      RAW Submission (Original)
                    </span>
                    <span className="text-[10px] text-[#666]">Immutable</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#777] block">Indus-Kohistani Text:</span>
                      <p className="font-kohistani text-lg font-bold text-[#F5F5F5] mt-0.5" dir="rtl">
                        {selectedContribution.raw?.ikText}
                      </p>
                    </div>
                    {selectedContribution.raw?.ikTranscription && (
                      <div>
                        <span className="text-[10px] text-[#777] block">Transcription:</span>
                        <p className="font-mono-code text-[#AAA]">{selectedContribution.raw.ikTranscription}</p>
                      </div>
                    )}
                    {selectedContribution.raw?.urduMeaning && (
                      <div>
                        <span className="text-[10px] text-[#777] block">Urdu Meaning:</span>
                        <p className="font-urdu text-[#E5E5E5]" dir="rtl">{selectedContribution.raw.urduMeaning}</p>
                      </div>
                    )}
                    {selectedContribution.raw?.englishMeaning && (
                      <div>
                        <span className="text-[10px] text-[#777] block">English Meaning:</span>
                        <p className="text-[#DDD]">{selectedContribution.raw.englishMeaning}</p>
                      </div>
                    )}
                    {selectedContribution.raw?.culturalContext && (
                      <div>
                        <span className="text-[10px] text-[#777] block">Cultural Context:</span>
                        <p className="text-[#AAA] italic">{selectedContribution.raw.culturalContext}</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-[#262626] text-[11px] text-[#777]">
                      <span>Submitted: {new Date(selectedContribution.raw?.submittedAt || '').toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Layer 2: VERIFIED (Reviewer Corrections & Corpus State) */}
                <div className="rounded-2xl bg-[#121E17] p-4 border border-emerald-900/60 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-emerald-400" />
                      Corpus Verified Layer
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">Canonical</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-emerald-400/80 block">Verified IK Text:</span>
                      <p className="font-kohistani text-lg font-bold text-emerald-100 mt-0.5" dir="rtl">
                        {selectedContribution.verified?.correctedIkText || selectedContribution.raw?.ikText}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400/80 block">Verified Meanings:</span>
                      <p className="font-urdu text-emerald-200" dir="rtl">
                        {selectedContribution.verified?.correctedUrduMeaning || selectedContribution.raw?.urduMeaning || '—'}
                      </p>
                      <p className="text-emerald-100/90 mt-0.5">
                        {selectedContribution.verified?.correctedEnglishMeaning || selectedContribution.raw?.englishMeaning || '—'}
                      </p>
                    </div>

                    {selectedContribution.verified?.reviewedBy && (
                      <div className="rounded-xl bg-[#0C1610] p-2.5 border border-emerald-800/50 text-[11px] mt-2">
                        <p className="font-bold text-emerald-300">
                          Reviewed By: {selectedContribution.verified.reviewedBy} ({selectedContribution.verified.reviewerRole?.replace('_', ' ')})
                        </p>
                        {selectedContribution.verified.reviewNotes && (
                          <p className="text-emerald-200 mt-1 italic">
                            "{selectedContribution.verified.reviewNotes}"
                          </p>
                        )}
                        <span className="text-[10px] text-emerald-400/70 block mt-1">
                          {selectedContribution.verified.verifiedAt ? new Date(selectedContribution.verified.verifiedAt).toLocaleString() : ''}
                        </span>
                      </div>
                    )}

                    {selectedContribution.verified?.escalationTarget && (
                      <div className="rounded-xl bg-indigo-950/60 p-2.5 border border-indigo-800/50 text-[11px] text-indigo-300 font-medium">
                        <strong>Escalated to:</strong> {selectedContribution.verified.escalationTarget.replace('_', ' ')}
                        <p className="text-indigo-200 mt-0.5">{selectedContribution.verified.escalationReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Audio Pronunciation Player if available */}
              {selectedContribution.raw?.audioUrl && (
                <div className="rounded-2xl bg-[#181818] p-3.5 border border-[#2A2A2A] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-[#C9A66B]" />
                    <span className="text-xs font-semibold text-[#E5E5E5]">Audio Pronunciation Recording</span>
                  </div>
                  <AudioPlayer 
                    audioUrl={selectedContribution.raw.audioUrl} 
                    durationSec={selectedContribution.raw.audioDurationSec} 
                  />
                </div>
              )}

              {/* Review History / Provenance Log */}
              {selectedContribution.verified?.reviewHistory && selectedContribution.verified.reviewHistory.length > 0 && (
                <div className="rounded-2xl bg-[#181818] p-4 border border-[#2A2A2A]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#AAA] mb-2 flex items-center gap-1.5">
                    <History className="h-4 w-4 text-[#777]" />
                    Review History Log
                  </h4>
                  <div className="space-y-2">
                    {selectedContribution.verified.reviewHistory.map((h, i) => (
                      <div key={h.id || i} className="text-xs border-l-2 border-[#C9A66B] pl-3 py-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#E5E5E5]">{h.reviewerName}</span>
                          <span className="text-[10px] uppercase font-bold text-[#C9A66B]">[{h.reviewerRole}]</span>
                          <span className="text-[10px] text-[#777]">{new Date(h.timestamp).toLocaleString()}</span>
                          <span className="rounded bg-[#222] px-1.5 py-0.2 text-[10px] font-bold uppercase text-[#D4B582] border border-[#333]">
                            {h.action}
                          </span>
                        </div>
                        {h.comments && <p className="text-[#AAA] mt-0.5">{h.comments}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#222] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedContribution(null)}
                className="rounded-xl bg-[#222] px-5 py-2 text-xs font-bold text-[#E5E5E5] hover:bg-[#333] cursor-pointer"
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
