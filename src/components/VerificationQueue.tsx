import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Edit3, 
  XCircle, 
  AlertTriangle, 
  Layers, 
  Volume2, 
  History, 
  UserCheck, 
  Filter, 
  ShieldCheck, 
  MessageSquare,
  Sparkles,
  ArrowRight,
  Lock,
  Search,
  Check,
  Globe,
  Tag,
  Calendar,
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Contribution, PartOfSpeech, UserProfile, UserRole, SpecializedIkCharacter, VerificationStatus } from '../types';
import { 
  DIALECTS, 
  DEFAULT_DIALECT_ID, 
  getDialectDisplayName, 
  OFFICIAL_IK_SPECIAL_CHARS, 
  CONTRIBUTION_CATEGORIES 
} from '../data/initialData';
import { 
  approveContribution, 
  correctContribution, 
  rejectContribution, 
  escalateContribution,
  getStoredSpecialChars
} from '../services/storage';
import { AudioPlayer } from './AudioPlayer';

interface VerificationQueueProps {
  contributions: Contribution[];
  currentUser: UserProfile;
  firebaseUser?: FirebaseUser | null;
  onDataUpdated: () => void;
  onNavigateToContribute?: () => void;
}

export const VerificationQueue: React.FC<VerificationQueueProps> = ({
  contributions,
  currentUser,
  firebaseUser,
  onDataUpdated,
  onNavigateToContribute
}) => {
  // Access Control: A Contributor must never access the reviewer workspace
  const isAuthorizedReviewer = useMemo(() => {
    const role = currentUser.role;
    return (
      role === 'reviewer' ||
      role === 'senior_reviewer' ||
      role === 'linguistic_advisor' ||
      role === 'project_director' ||
      role === 'administrator'
    );
  }, [currentUser.role]);

  // Queue state
  const [statusFilter, setStatusFilter] = useState<'pending' | 'under_review' | 'verified' | 'rejected' | 'all'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialectFilter, setDialectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selection and Modal Action states
  const [activeItem, setActiveItem] = useState<Contribution | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'correct' | 'clarify' | 'reject' | null>(null);
  
  // Correction Form Fields (never overwrites RAW)
  const [proposedIkText, setProposedIkText] = useState('');
  const [proposedTranscription, setProposedTranscription] = useState('');
  const [proposedUrdu, setProposedUrdu] = useState('');
  const [proposedEnglish, setProposedEnglish] = useState('');
  const [verifiedDialect, setVerifiedDialect] = useState('');
  const [verifiedPosTag, setVerifiedPosTag] = useState<PartOfSpeech>('noun');
  const [orthographyNotes, setOrthographyNotes] = useState('');
  const [specialCharactersVerified, setSpecialCharactersVerified] = useState(true);
  const [vowelDiacriticsAccurate, setVowelDiacriticsAccurate] = useState(true);

  // Approval Form Fields
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalSpecialCharsCheck, setApprovalSpecialCharsCheck] = useState(true);
  const [approvalDiacriticsCheck, setApprovalDiacriticsCheck] = useState(true);

  // Clarification / Escalation Form Fields
  const [clarificationTarget, setClarificationTarget] = useState<'senior_reviewer' | 'linguistic_advisor' | 'project_director'>('senior_reviewer');
  const [clarificationQuery, setClarificationQuery] = useState('');

  // Rejection Form Fields
  const [rejectionReason, setRejectionReason] = useState('');

  // Specialized IK Characters from authoritative standard: ڇ, څ, ݜ, ڙ, ݨ
  const specialChars = useMemo(() => getStoredSpecialChars(), []);

  // Effective Reviewer Identity
  const reviewerId = firebaseUser?.uid || currentUser.id;
  const reviewerName = firebaseUser?.displayName || currentUser.name;
  const reviewerRole = currentUser.role;

  // Review Queue Authorization & Scoping Filter
  const authorizedQueue = useMemo(() => {
    return contributions.filter((item) => {
      // Role-specific scoping:
      // Senior reviewers and linguistic advisors specialize on escalated/complex items as well as standard queue
      // Reviewers focus on pending_review queue
      // Project director and Admin have omni-oversight
      if (reviewerRole === 'reviewer') {
        // Standard reviewer sees pending and general submissions
        return true;
      }
      return true;
    });
  }, [contributions, reviewerRole]);

  // Counts for tabs
  const pendingCount = useMemo(() => {
    return authorizedQueue.filter(c => (c.verified?.status || c.status || 'pending_review') === 'pending_review' || c.status === 'submitted_raw').length;
  }, [authorizedQueue]);

  const underReviewCount = useMemo(() => {
    return authorizedQueue.filter(c => c.verified?.status === 'escalated_to_senior').length;
  }, [authorizedQueue]);

  const verifiedCount = useMemo(() => {
    return authorizedQueue.filter(c => c.verified?.status === 'approved' || c.verified?.status === 'corrected').length;
  }, [authorizedQueue]);

  const rejectedCount = useMemo(() => {
    return authorizedQueue.filter(c => c.verified?.status === 'rejected').length;
  }, [authorizedQueue]);

  // Filtered Review Queue
  const filteredQueue = useMemo(() => {
    return authorizedQueue.filter((item) => {
      const currentStatus = item.verified?.status || item.status || 'pending_review';

      // Status filter
      if (statusFilter === 'pending' && currentStatus !== 'pending_review' && currentStatus !== 'submitted_raw') {
        return false;
      }
      if (statusFilter === 'under_review' && currentStatus !== 'escalated_to_senior') {
        return false;
      }
      if (statusFilter === 'verified' && currentStatus !== 'approved' && currentStatus !== 'corrected') {
        return false;
      }
      if (statusFilter === 'rejected' && currentStatus !== 'rejected') {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && item.type !== categoryFilter && item.raw?.category !== categoryFilter) {
        return false;
      }

      // Dialect filter
      if (dialectFilter !== 'all') {
        const d = (item.verified?.verifiedDialect || item.raw?.dialect || '').toLowerCase();
        const selectedOption = DIALECTS.find(dl => dl.id === dialectFilter);
        const matchUr = selectedOption ? selectedOption.nameUr.toLowerCase() : '';
        const matchEn = selectedOption ? selectedOption.nameEn.toLowerCase() : '';
        if (
          !d.includes(dialectFilter.toLowerCase()) &&
          !(matchUr && d.includes(matchUr)) &&
          !(matchEn && d.includes(matchEn))
        ) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ik = (item.verified?.correctedIkText || item.raw?.ikText || '').toLowerCase();
        const ur = (item.verified?.correctedUrduMeaning || item.raw?.urduMeaning || '').toLowerCase();
        const en = (item.verified?.correctedEnglishMeaning || item.raw?.englishMeaning || '').toLowerCase();
        const contrib = (item.raw?.contributorName || '').toLowerCase();
        const id = item.id.toLowerCase();
        if (!ik.includes(q) && !ur.includes(q) && !en.includes(q) && !contrib.includes(q) && !id.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [authorizedQueue, statusFilter, categoryFilter, dialectFilter, searchQuery]);

  // Handle opening action modal
  const openActionModal = (item: Contribution, action: 'approve' | 'correct' | 'clarify' | 'reject') => {
    setActiveItem(item);
    setActionType(action);

    if (action === 'approve') {
      setApprovalNotes('');
      setApprovalSpecialCharsCheck(true);
      setApprovalDiacriticsCheck(true);
    } else if (action === 'correct') {
      setProposedIkText(item.verified?.correctedIkText || item.raw?.ikText || '');
      setProposedTranscription(item.verified?.correctedTranscription || item.raw?.ikTranscription || '');
      setProposedUrdu(item.verified?.correctedUrduMeaning || item.raw?.urduMeaning || '');
      setProposedEnglish(item.verified?.correctedEnglishMeaning || item.raw?.englishMeaning || '');
      setVerifiedDialect(item.verified?.verifiedDialect || item.raw?.dialect || DEFAULT_DIALECT_ID);
      setVerifiedPosTag(item.verified?.verifiedPosTag || item.raw?.posTag || 'noun');
      setOrthographyNotes('');
      setSpecialCharactersVerified(true);
      setVowelDiacriticsAccurate(true);
    } else if (action === 'clarify') {
      setClarificationQuery('');
      setClarificationTarget(
        currentUser.role === 'reviewer' ? 'senior_reviewer' : 'linguistic_advisor'
      );
    } else if (action === 'reject') {
      setRejectionReason('');
    }
  };

  // 1. Review Action: Approve
  const handleConfirmApprove = () => {
    if (!activeItem) return;
    approveContribution(
      activeItem.id,
      reviewerName,
      reviewerRole,
      approvalNotes || 'Approved by reviewer. Orthography & semantics validated.',
      activeItem.verified?.verifiedDialect || activeItem.raw?.dialect,
      activeItem.verified?.verifiedPosTag || activeItem.raw?.posTag,
      {
        reviewerId,
        specialCharactersVerified: approvalSpecialCharsCheck,
        vowelDiacriticsAccurate: approvalDiacriticsCheck,
        orthographyNotes: approvalNotes
      }
    );
    setActionType(null);
    setActiveItem(null);
    onDataUpdated();
  };

  // 2. Review Action: Suggest / Apply Correction (Never overwrites RAW)
  const handleConfirmCorrection = () => {
    if (!activeItem) return;
    correctContribution(
      activeItem.id,
      reviewerName,
      reviewerRole,
      {
        correctedIkText: proposedIkText.trim(),
        correctedTranscription: proposedTranscription.trim() || undefined,
        correctedUrduMeaning: proposedUrdu.trim() || undefined,
        correctedEnglishMeaning: proposedEnglish.trim() || undefined,
        verifiedDialect,
        verifiedPosTag
      },
      orthographyNotes || 'Correction proposed & verified in canonical layer.',
      {
        reviewerId,
        specialCharactersVerified,
        vowelDiacriticsAccurate,
        orthographyNotes
      }
    );
    setActionType(null);
    setActiveItem(null);
    onDataUpdated();
  };

  // 3. Review Action: Request Clarification / Escalate
  const handleConfirmClarification = () => {
    if (!activeItem || !clarificationQuery.trim()) return;
    escalateContribution(
      activeItem.id,
      reviewerName,
      reviewerRole,
      clarificationTarget,
      clarificationQuery.trim(),
      {
        reviewerId
      }
    );
    setActionType(null);
    setActiveItem(null);
    onDataUpdated();
  };

  // 4. Review Action: Reject
  const handleConfirmReject = () => {
    if (!activeItem || !rejectionReason.trim()) return;
    rejectContribution(
      activeItem.id,
      reviewerName,
      reviewerRole,
      rejectionReason.trim(),
      {
        reviewerId
      }
    );
    setActionType(null);
    setActiveItem(null);
    onDataUpdated();
  };

  // Helper for status badge rendering
  const renderStatusBadge = (status?: VerificationStatus | string) => {
    switch (status) {
      case 'approved':
      case 'corrected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-700/60 whitespace-nowrap">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            Verified
          </span>
        );
      case 'escalated_to_senior':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-950/80 px-2.5 py-1 text-xs font-bold text-indigo-300 border border-indigo-700/60 whitespace-nowrap">
            <AlertTriangle className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            Under Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/80 px-2.5 py-1 text-xs font-bold text-rose-300 border border-rose-700/60 whitespace-nowrap">
            <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            Rejected
          </span>
        );
      case 'submitted_raw':
      case 'pending_review':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/80 px-2.5 py-1 text-xs font-bold text-amber-300 border border-amber-700/60 whitespace-nowrap">
            <HelpCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            Pending Review
          </span>
        );
    }
  };

  const getCategoryLabel = (type?: string, cat?: string) => {
    const raw = cat || type || 'word';
    const match = CONTRIBUTION_CATEGORIES.find(c => c.id === raw);
    return match ? match.nameEn : raw.replace('_', ' ');
  };

  // If a Contributor attempts to access the Reviewer Workspace, show blocked screen
  if (!isAuthorizedReviewer) {
    return (
      <div id="contributor-blocked-screen" className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-3xl bg-[#141414] p-8 sm:p-12 border border-rose-900/40 shadow-xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950/70 text-rose-400 border border-rose-700/50">
            <Lock className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-3 py-1 rounded-full border border-rose-800/40">
              Access Restricted — Contributor Role
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
              Reviewer Workspace Requires Editorial Credentials
            </h2>
            <p className="text-sm text-[#999] max-w-lg mx-auto leading-relaxed">
              You are currently logged in as a <strong>Community Contributor</strong> ({currentUser.name}).
              The Reviewer Workspace is restricted to certified <em>Reviewers</em>, <em>Senior Reviewers</em>, <em>Linguistic Advisors</em>, and the <em>Project Director</em>.
            </p>
          </div>

          <div className="rounded-2xl bg-[#1A1A1A] p-4 max-w-md mx-auto border border-[#2B2B2B] text-left text-xs space-y-2 text-[#AAA]">
            <p className="font-bold text-[#E5E5E5] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#C9A66B]" />
              FiKR&CD Editorial Integrity Policy:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#888]">
              <li>Contributors submit authentic raw dialectal material.</li>
              <li>Only certified editorial reviewers can verify or correct corpus entries.</li>
              <li>To apply for reviewer accreditation, contact the FiKR&CD Directorate.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onNavigateToContribute && (
              <button
                type="button"
                onClick={onNavigateToContribute}
                className="w-full sm:w-auto rounded-xl bg-[#C9A66B] px-6 py-3 text-xs font-bold text-[#0C0C0C] hover:bg-[#D4B582] transition cursor-pointer"
              >
                Go to Contributor Portal (جمع کریں)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="reviewer-workspace" className="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6">
      {/* Workspace Header & Editorial Protocol Banner */}
      <div className="rounded-3xl bg-[#141414] p-5 sm:p-7 border border-[#242424] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-[#C9A66B]/15 px-3 py-0.5 text-xs font-bold text-[#D4B582] border border-[#C9A66B]/30">
                FiKR&CD Editorial Directorate
              </span>
              <span className="text-xs text-[#888] font-mono-code flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-[#C9A66B]" />
                Reviewer: <strong className="text-[#F5F5F5]">{reviewerName}</strong>
                <span className="text-[#C9A66B] uppercase text-[10px] font-bold px-1.5 py-0.2 bg-[#222] rounded border border-[#333]">
                  {reviewerRole.replace('_', ' ')}
                </span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
              Indus-Kohistani Reviewer Workspace & Verification Engine
            </h2>
            <p className="mt-1.5 text-lg sm:text-xl lg:text-2xl font-kohistani text-[#D4B582] font-semibold leading-relaxed tracking-wide sm:[word-spacing:0.12em]" dir="rtl">
              اِنڈَس کُستَئی ژِیباں ڈیجیٹل تَوْثِیْق اَں اِدَارَتِی ورک سپیس
            </p>
            <p className="text-xs text-[#888] max-w-3xl">
              <strong className="text-[#DDD]">Editorial Protocol:</strong> RAW submitted entries are strictly immutable. Corrections and verifications are committed to the <em>VERIFIED</em> layer with append-only review history.
            </p>
          </div>

          {/* Quick Metrics Summary */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="rounded-2xl bg-[#1E1710] px-3.5 py-2.5 border border-amber-800/50 text-center min-w-[85px]">
              <span className="text-lg sm:text-xl font-black text-amber-300 font-mono-code">{pendingCount}</span>
              <span className="block text-[10px] font-bold uppercase text-amber-400/90">Pending</span>
            </div>
            <div className="rounded-2xl bg-[#171424] px-3.5 py-2.5 border border-indigo-800/50 text-center min-w-[85px]">
              <span className="text-lg sm:text-xl font-black text-indigo-300 font-mono-code">{underReviewCount}</span>
              <span className="block text-[10px] font-bold uppercase text-indigo-400/90">Under Review</span>
            </div>
            <div className="rounded-2xl bg-[#0F1E16] px-3.5 py-2.5 border border-emerald-800/50 text-center min-w-[85px]">
              <span className="text-lg sm:text-xl font-black text-emerald-300 font-mono-code">{verifiedCount}</span>
              <span className="block text-[10px] font-bold uppercase text-emerald-400/90">Verified</span>
            </div>
          </div>
        </div>

        {/* Special Character Check Visual Palette */}
        <div className="mt-5 pt-4 border-t border-[#222] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#AAA] flex-wrap">
            <span className="font-bold text-[#E5E5E5] flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-[#C9A66B]" />
              Preserved Specialized IK Glyphs:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['ڇ', 'څ', 'ݜ', 'ڙ', 'ݨ'].map((char) => (
                <span
                  key={char}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E1E1E] text-base font-kohistani font-bold text-[#D4B582] border border-[#333]"
                  title={`Special IK Character: ${char}`}
                >
                  {char}
                </span>
              ))}
            </div>
            <span className="text-[11px] text-[#777] hidden md:inline">
              (Preserved strictly without phonetic normalization)
            </span>
          </div>

          <div className="text-[11px] text-[#777] font-mono-code">
            Authority: <strong className="text-[#BBB]">{reviewerRole.replace('_', ' ').toUpperCase()}</strong>
          </div>
        </div>
      </div>

      {/* Review Queue Filters & Search Bar */}
      <div className="rounded-3xl bg-[#141414] p-4 sm:p-5 border border-[#242424] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`rounded-xl px-3.5 py-2 font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-[#1E1E1E] text-[#AAA] hover:bg-[#282828]'
              }`}
            >
              <span>Pending Review</span>
              <span className="rounded-full bg-black/30 px-1.5 py-0.2 text-[10px]">{pendingCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('under_review')}
              className={`rounded-xl px-3.5 py-2 font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'under_review'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-[#1E1E1E] text-[#AAA] hover:bg-[#282828]'
              }`}
            >
              <span>Under Review / Escalated</span>
              <span className="rounded-full bg-black/30 px-1.5 py-0.2 text-[10px]">{underReviewCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('verified')}
              className={`rounded-xl px-3.5 py-2 font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'verified'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-[#1E1E1E] text-[#AAA] hover:bg-[#282828]'
              }`}
            >
              <span>Verified Corpus</span>
              <span className="rounded-full bg-black/30 px-1.5 py-0.2 text-[10px]">{verifiedCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`rounded-xl px-3.5 py-2 font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'rejected'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-[#1E1E1E] text-[#AAA] hover:bg-[#282828]'
              }`}
            >
              <span>Rejected</span>
              <span className="rounded-full bg-black/30 px-1.5 py-0.2 text-[10px]">{rejectedCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-xl px-3.5 py-2 font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-[#C9A66B] text-[#0C0C0C] shadow-xs'
                  : 'bg-[#1E1E1E] text-[#AAA] hover:bg-[#282828]'
              }`}
            >
              <span>All ({authorizedQueue.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#666]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search IK text, translation, ID..."
              className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] pl-9 pr-3 py-2 text-xs text-[#E5E5E5] placeholder-[#666] focus:border-[#C9A66B] focus:outline-none"
            />
          </div>
        </div>

        {/* Secondary Category and Dialect Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#222] text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#777] font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg bg-[#1A1A1A] border border-[#333] px-2.5 py-1.5 text-xs text-[#DDD] focus:border-[#C9A66B] focus:outline-none"
            >
              <option value="all">All Categories</option>
              {CONTRIBUTION_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.nameEn}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#777] font-medium">Dialect:</span>
            <select
              value={dialectFilter}
              onChange={(e) => setDialectFilter(e.target.value)}
              className="rounded-lg bg-[#1A1A1A] border border-[#333] px-2.5 py-1.5 text-xs text-[#DDD] focus:border-[#C9A66B] focus:outline-none"
            >
              <option value="all">All Dialects (تمام بولیاں)</option>
              {DIALECTS.map(d => (
                <option key={d.id} value={d.id}>{d.nameUr}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Review Queue List */}
      <div className="space-y-4">
        {filteredQueue.length === 0 ? (
          <div className="rounded-3xl bg-[#141414] p-12 text-center text-[#777] border border-[#242424]">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
            <p className="text-base font-bold text-[#E5E5E5]">Review Queue is Clear</p>
            <p className="text-xs text-[#777] mt-1">No items match the selected filter criteria.</p>
          </div>
        ) : (
          filteredQueue.map((item) => {
            const currentStatus = item.verified?.status || item.status || 'pending_review';
            const hasAudio = Boolean(item.raw?.audioUrl || item.derived?.hasAudio || (item.raw as any)?.associatedRecordingId);
            const rawIkText = item.raw?.ikText || '';
            const verifiedIkText = item.verified?.correctedIkText;
            const urduMeaning = item.verified?.correctedUrduMeaning || item.raw?.urduMeaning;
            const englishMeaning = item.verified?.correctedEnglishMeaning || item.raw?.englishMeaning;
            const dialect = item.verified?.verifiedDialect || item.raw?.dialect || 'Patan';
            const category = getCategoryLabel(item.type, item.raw?.category);
            const contributorName = item.raw?.contributorName || 'Community Member';
            const submittedDate = item.raw?.submittedAt ? new Date(item.raw.submittedAt).toLocaleDateString() : 'Recent';
            const reviewsHistory = item.verified?.reviewHistory || [];

            return (
              <div
                key={item.id}
                className="rounded-3xl bg-[#141414] p-5 sm:p-6 border border-[#242424] hover:border-[#C9A66B]/50 transition space-y-4 shadow-xs"
              >
                {/* 1. Header Metadata Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#222] text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded bg-[#202020] px-2.5 py-0.5 font-bold uppercase text-[#D4B582] font-mono-code border border-[#333]">
                      {category}
                    </span>
                    <span className="font-bold text-[#DDD] flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-[#888]" />
                      {getDialectDisplayName(dialect)}
                    </span>
                    <span className="text-[#555]">•</span>
                    <span className="text-[#888]">
                      Contributor: <strong className="text-[#CCC]">{contributorName}</strong> ({submittedDate})
                    </span>
                    {item.isDemoData && (
                      <span className="rounded bg-[#222] text-[#888] text-[10px] font-mono-code font-bold px-1.5 py-0.2 border border-[#333]">
                        [DEMO DATA]
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono-code text-[11px] text-[#666]">ID: {item.id}</span>
                    {renderStatusBadge(currentStatus)}
                  </div>
                </div>

                {/* 2. Main Content: RAW vs VERIFIED Dual-Layer Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* RAW Layer (Immutable Submission) */}
                  <div className="rounded-2xl bg-[#181818] p-4 border border-[#2A2A2A] space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                      <span className="text-xs font-bold text-[#AAA] uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-[#777]" />
                        RAW Contributor Input
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono-code uppercase font-semibold">
                        Immutable
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#777] block">Original Indus-Kohistani Text:</span>
                      <p className="font-kohistani text-xl font-bold text-[#F5F5F5] leading-relaxed mt-0.5" dir="rtl">
                        {rawIkText}
                      </p>
                    </div>

                    {item.raw?.ikTranscription && (
                      <div>
                        <span className="text-[10px] text-[#777] block">Transcription:</span>
                        <p className="font-mono-code text-xs text-[#AAA]">[{item.raw.ikTranscription}]</p>
                      </div>
                    )}

                    <div className="space-y-1 text-xs border-t border-[#262626] pt-2">
                      {item.raw?.urduMeaning && (
                        <p className="font-urdu text-[#DDD]" dir="rtl">
                          <strong>اردو معنی:</strong> {item.raw.urduMeaning}
                        </p>
                      )}
                      {item.raw?.englishMeaning && (
                        <p className="text-[#CCC]">
                          <strong>English Meaning:</strong> {item.raw.englishMeaning}
                        </p>
                      )}
                      {item.raw?.culturalContext && (
                        <p className="text-[#999] italic text-[11px] mt-1">
                          <strong>Context:</strong> {item.raw.culturalContext}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* VERIFIED Layer (Editorial Corpus Output) */}
                  <div className="rounded-2xl bg-[#121E17] p-4 border border-emerald-900/60 flex flex-col justify-between space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2">
                        <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          Corpus Verified Target
                        </span>
                        {item.derived?.isCorpusEligible && (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700/60">
                            Corpus Ready
                          </span>
                        )}
                      </div>

                      <div className="mt-2">
                        <span className="text-[10px] text-emerald-400/80 block">Verified IK Text:</span>
                        <p className="font-kohistani text-xl font-bold text-emerald-100 leading-relaxed mt-0.5" dir="rtl">
                          {verifiedIkText || rawIkText}
                        </p>
                      </div>

                      <div className="space-y-1 text-xs border-t border-emerald-900/50 pt-2 mt-2">
                        <p className="font-urdu text-emerald-200" dir="rtl">
                          <strong>تصدیق شدہ اردو:</strong> {item.verified?.correctedUrduMeaning || item.raw?.urduMeaning || '—'}
                        </p>
                        <p className="text-emerald-100/90">
                          <strong>Verified English:</strong> {item.verified?.correctedEnglishMeaning || item.raw?.englishMeaning || '—'}
                        </p>
                      </div>

                      {item.verified?.reviewNotes && (
                        <div className="mt-2 rounded-xl bg-[#0C1610] p-2.5 text-xs text-emerald-200 border border-emerald-800/50 italic">
                          <strong>Reviewer Note:</strong> "{item.verified.reviewNotes}"
                        </div>
                      )}
                    </div>

                    {/* Audio Player if recording exists (never altered or auto-transcribed) */}
                    <div className="pt-2 border-t border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {hasAudio ? (
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4 text-[#C9A66B]" />
                          <AudioPlayer 
                            audioUrl={item.raw?.audioUrl} 
                            durationSec={item.raw?.audioDurationSec} 
                          />
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#777] italic">No audio recording attached</span>
                      )}

                      {item.derived?.tokenCount ? (
                        <span className="text-[11px] font-mono-code text-emerald-400/70">
                          Tokens: {item.derived.tokenCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* 3. Chronological Review History Audit Log */}
                {reviewsHistory.length > 0 && (
                  <div className="rounded-2xl bg-[#181818] p-3.5 sm:p-4 border border-[#282828] space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#AAA] flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5 text-[#888]" />
                      Review History & Audit Trail (Append-Only)
                    </h4>
                    <div className="space-y-2 divide-y divide-[#222]">
                      {reviewsHistory.map((rev, idx) => (
                        <div key={rev.id || idx} className="pt-2 first:pt-0 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-[#E5E5E5]">{rev.reviewerName}</strong>
                              <span className="text-[10px] uppercase font-bold text-[#C9A66B] bg-[#222] px-1.5 py-0.2 rounded border border-[#333]">
                                {rev.reviewerRole?.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-[#777]">
                                {new Date(rev.timestamp).toLocaleString()}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                rev.action === 'approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                rev.action === 'corrected' ? 'bg-teal-950 text-teal-300 border border-teal-800' :
                                rev.action === 'rejected' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                'bg-indigo-950 text-indigo-300 border border-indigo-800'
                              }`}>
                                {rev.verdict || rev.action}
                              </span>
                            </div>

                            {rev.comments && (
                              <p className="text-[#AAA] italic text-[11px] mt-0.5">"{rev.comments}"</p>
                            )}

                            {rev.proposedIkText && (
                              <div className="text-[11px] text-[#BBB]">
                                <strong>Proposed Correction:</strong>{' '}
                                <span className="font-kohistani font-bold text-emerald-300" dir="rtl">{rev.proposedIkText}</span>
                              </div>
                            )}
                          </div>

                          <div className="text-[10px] text-[#666] font-mono-code shrink-0">
                            ID: {rev.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Reviewer Action Controls (Approve, Suggest Correction, Clarification, Reject) */}
                <div className="pt-3 border-t border-[#222] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-[#888]">
                    <UserCheck className="h-4 w-4 text-[#666]" />
                    <span>
                      Reviewing as: <strong className="text-[#DDD]">{reviewerName}</strong> ({reviewerRole.replace('_', ' ')})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action 1: Approve */}
                    <button
                      type="button"
                      onClick={() => openActionModal(item, 'approve')}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      1. Approve
                    </button>

                    {/* Action 2: Suggest Correction */}
                    <button
                      type="button"
                      onClick={() => openActionModal(item, 'correct')}
                      className="flex items-center gap-1.5 rounded-xl bg-teal-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer active:scale-95"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      2. Suggest Correction
                    </button>

                    {/* Action 3: Request Clarification / Escalate */}
                    <button
                      type="button"
                      onClick={() => openActionModal(item, 'clarify')}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer active:scale-95"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      3. Request Clarification
                    </button>

                    {/* Action 4: Reject */}
                    <button
                      type="button"
                      onClick={() => openActionModal(item, 'reject')}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-950/70 px-3.5 py-2 text-xs font-bold text-rose-300 border border-rose-700/60 hover:bg-rose-900/80 transition cursor-pointer active:scale-95"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      4. Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Action Modals */}
      {actionType && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#141414] p-5 sm:p-6 shadow-2xl border border-[#2E2E2E] space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div>
                <h3 className="text-base font-extrabold text-[#F5F5F5] flex items-center gap-2">
                  {actionType === 'approve' && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                  {actionType === 'correct' && <Edit3 className="h-5 w-5 text-teal-400" />}
                  {actionType === 'clarify' && <AlertTriangle className="h-5 w-5 text-indigo-400" />}
                  {actionType === 'reject' && <XCircle className="h-5 w-5 text-rose-400" />}

                  {actionType === 'approve' && 'Approve Linguistic Contribution'}
                  {actionType === 'correct' && 'Propose Correction (RAW Remains Untouched)'}
                  {actionType === 'clarify' && 'Request Clarification / Escalate'}
                  {actionType === 'reject' && 'Reject Contribution from Corpus'}
                </h3>
                <p className="text-xs text-[#777] font-mono-code mt-0.5">Contribution ID: {activeItem.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setActionType(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#222] text-[#AAA] hover:bg-[#333] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Bodies */}
            <div className="space-y-4 text-xs">
              {/* 1. APPROVE MODAL */}
              {actionType === 'approve' && (
                <div className="space-y-3.5">
                  <div className="rounded-2xl bg-[#14221A] p-4 border border-emerald-900/60 text-emerald-200 space-y-1">
                    <p className="font-bold text-emerald-300">Approval Certification:</p>
                    <p className="text-xs text-emerald-200/90 leading-relaxed">
                      Approving will certify this entry into the official Indus-Kohistani verified preservation corpus. Contributor points will be derived from the verified data model.
                    </p>
                  </div>

                  {/* Special Character Verification Checkbox */}
                  <div className="space-y-2 rounded-xl bg-[#1A1A1A] p-3 border border-[#2E2E2E]">
                    <label className="flex items-center gap-2 font-semibold text-[#E5E5E5] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={approvalSpecialCharsCheck}
                        onChange={(e) => setApprovalSpecialCharsCheck(e.target.checked)}
                        className="rounded border-[#444] text-[#C9A66B] focus:ring-0 cursor-pointer"
                      />
                      <span>Special characters verified (ڇ, څ, ݜ, ڙ, ݨ preserved accurately)</span>
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-[#E5E5E5] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={approvalDiacriticsCheck}
                        onChange={(e) => setApprovalDiacriticsCheck(e.target.checked)}
                        className="rounded border-[#444] text-[#C9A66B] focus:ring-0 cursor-pointer"
                      />
                      <span>Vowel diacritics & phonetic orthography accurate</span>
                    </label>
                  </div>

                  <div>
                    <label className="block font-bold text-[#CCC] mb-1">
                      Reviewer Notes / Linguistic Comments (Optional):
                    </label>
                    <textarea
                      rows={3}
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="e.g. Standard lexical item confirmed with native elders in Seo / Patan valley."
                      className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] p-2.5 text-xs text-[#E5E5E5] placeholder-[#666] focus:border-[#C9A66B] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 2. SUGGEST CORRECTION MODAL */}
              {actionType === 'correct' && (
                <div className="space-y-3.5">
                  <div className="rounded-2xl bg-teal-950/50 p-3.5 border border-teal-800/50 text-teal-200">
                    <strong className="text-teal-300">FiKR&CD Correction Model:</strong> RAW data remains completely untouched and immutable. Your proposed correction is stored in <code className="font-mono text-teal-300">/reviews/</code> and creates a new canonical verified layer.
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-[#CCC]">
                        Proposed Indus-Kohistani Text (Arabic Script):
                      </label>
                      <span className="text-[10px] text-[#888]">
                        Click to insert specialized glyph:
                      </span>
                    </div>

                    {/* Specialized IK Character Palette */}
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      {specialChars.map(sc => (
                        <button
                          key={sc.char}
                          type="button"
                          onClick={() => setProposedIkText(prev => prev + sc.char)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#222] border border-[#333] font-kohistani text-sm font-bold text-[#C9A66B] hover:bg-[#2A2A2A] hover:border-[#C9A66B] transition cursor-pointer"
                          title={`${sc.name} (${sc.unicode}) — ${sc.description}`}
                        >
                          {sc.char}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={2}
                      dir="rtl"
                      value={proposedIkText}
                      onChange={(e) => setProposedIkText(e.target.value)}
                      className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] p-2.5 font-kohistani text-lg text-[#F5F5F5] focus:border-[#C9A66B] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#CCC] mb-1">
                        Latin Orthographic Transcription:
                      </label>
                      <input
                        type="text"
                        value={proposedTranscription}
                        onChange={(e) => setProposedTranscription(e.target.value)}
                        className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] p-2 text-xs font-mono-code text-[#E5E5E5] focus:border-[#C9A66B] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#CCC] mb-1">
                        Verified Dialect (تصدیق شدہ بولی):
                      </label>
                      <select
                        value={verifiedDialect}
                        onChange={(e) => setVerifiedDialect(e.target.value)}
                        className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] p-2 text-xs text-[#E5E5E5] focus:border-[#C9A66B] focus:outline-none"
                      >
                        {DIALECTS.map(d => (
                          <option key={d.id} value={d.id} className="bg-[#1A1A1A]">{d.nameUr} {d.nameEn ? `(${d.nameEn})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#CCC] mb-1">
                        Proposed Urdu Meaning:
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={proposedUrdu}
                        onChange={(e) => setProposedUrdu(e.target.value)}
                        className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] p-2 font-urdu text-xs text-[#E5E5E5] focus:border-[#C9A66B] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#CCC] mb-1">
                        Proposed English Meaning:
                      </label>
                      <input
                        type="text"
                        value={proposedEnglish}
                        onChange={(e) => setProposedEnglish(e.target.value)}
                        className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] p-2 text-xs text-[#E5E5E5] focus:border-[#C9A66B] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="rounded-xl bg-[#1A1A1A] p-3 border border-[#2E2E2E] space-y-2">
                    <label className="flex items-center gap-2 font-semibold text-[#DDD] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={specialCharactersVerified}
                        onChange={(e) => setSpecialCharactersVerified(e.target.checked)}
                        className="rounded border-[#444] text-[#C9A66B] focus:ring-0 cursor-pointer"
                      />
                      <span>Special characters verified (ڇ, څ, ݜ, ڙ, ݨ)</span>
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-[#DDD] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vowelDiacriticsAccurate}
                        onChange={(e) => setVowelDiacriticsAccurate(e.target.checked)}
                        className="rounded border-[#444] text-[#C9A66B] focus:ring-0 cursor-pointer"
                      />
                      <span>Vowel diacritics accurate in Arabic script</span>
                    </label>
                  </div>

                  <div>
                    <label className="block font-bold text-[#CCC] mb-1">
                      Orthography Notes & Correction Rationale <span className="text-rose-400">*</span>:
                    </label>
                    <textarea
                      rows={2}
                      value={orthographyNotes}
                      onChange={(e) => setOrthographyNotes(e.target.value)}
                      placeholder="Explain what orthography or translation adjustments were made and why..."
                      className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] p-2.5 text-xs text-[#E5E5E5] placeholder-[#666] focus:border-[#C9A66B] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 3. REQUEST CLARIFICATION / ESCALATE MODAL */}
              {actionType === 'clarify' && (
                <div className="space-y-3.5">
                  <div className="rounded-2xl bg-indigo-950/50 p-3.5 border border-indigo-800/50 text-indigo-200">
                    <strong className="text-indigo-300">Clarification & Escalation Protocol:</strong> Routes this contribution to senior linguistic experts or the Project Director when dialect variation or phonetic ambiguity requires higher advisory consensus.
                  </div>

                  <div>
                    <label className="block font-bold text-[#CCC] mb-1">
                      Route Clarification Request To:
                    </label>
                    <select
                      value={clarificationTarget}
                      onChange={(e) => setClarificationTarget(e.target.value as any)}
                      className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] p-2.5 text-xs text-[#E5E5E5] focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="senior_reviewer" className="bg-[#1A1A1A]">Senior Reviewer (Abdul Qadir Kohistani)</option>
                      <option value="linguistic_advisor" className="bg-[#1A1A1A]">Linguistic Advisor (Dr. Tariq Kohistani)</option>
                      <option value="project_director" className="bg-[#1A1A1A]">Project Director (Saif Ullah)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#CCC] mb-1">
                      Linguistic Clarification Query / Reason <span className="text-rose-400">*</span>:
                    </label>
                    <textarea
                      rows={3}
                      value={clarificationQuery}
                      onChange={(e) => setClarificationQuery(e.target.value)}
                      placeholder="e.g. Unclear morphological suffix between Duber and Jijal dialect; requires linguistic advisory verification."
                      className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] p-2.5 text-xs text-[#E5E5E5] placeholder-[#666] focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 4. REJECT MODAL */}
              {actionType === 'reject' && (
                <div className="space-y-3.5">
                  <div className="rounded-2xl bg-rose-950/50 p-3.5 border border-rose-800/50 text-rose-200">
                    <strong className="text-rose-300">Rejection Criteria:</strong> Submissions should only be rejected if spam, completely inaccurate, corrupted, or non-Indus-Kohistani. The reason is recorded immutably in the audit log.
                  </div>

                  <div>
                    <label className="block font-bold text-[#CCC] mb-1">
                      Reason for Rejection <span className="text-rose-400">*</span>:
                    </label>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Specify reason (e.g. non-IK language, corrupted audio, duplicate spam)..."
                      className="w-full rounded-xl bg-[#1A1A1A] border border-[#333] p-2.5 text-xs text-[#E5E5E5] placeholder-[#666] focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Action Buttons */}
            <div className="pt-3 border-t border-[#222] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActionType(null)}
                className="rounded-xl bg-[#222] px-4 py-2 text-xs font-bold text-[#AAA] hover:bg-[#333] hover:text-white cursor-pointer"
              >
                Cancel
              </button>

              {actionType === 'approve' && (
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  className="rounded-xl bg-emerald-800 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  Confirm Approval
                </button>
              )}

              {actionType === 'correct' && (
                <button
                  type="button"
                  onClick={handleConfirmCorrection}
                  disabled={!proposedIkText.trim() || !orthographyNotes.trim()}
                  className="rounded-xl bg-teal-800 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
                >
                  Save Correction in Verified Layer
                </button>
              )}

              {actionType === 'clarify' && (
                <button
                  type="button"
                  onClick={handleConfirmClarification}
                  disabled={!clarificationQuery.trim()}
                  className="rounded-xl bg-indigo-800 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  Route Clarification
                </button>
              )}

              {actionType === 'reject' && (
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={!rejectionReason.trim()}
                  className="rounded-xl bg-rose-800 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  Confirm Rejection
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
