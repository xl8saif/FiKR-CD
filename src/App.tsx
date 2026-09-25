import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { ContributeForm } from './components/ContributeForm';
import { MyContributions } from './components/MyContributions';
import { VerificationQueue } from './components/VerificationQueue';
import { CorpusExplorer } from './components/CorpusExplorer';
import { CorpusQualityDashboard } from './components/CorpusQualityDashboard';
import { AdminPanel } from './components/AdminPanel';
import { DatasetReleases } from './components/DatasetReleases';
import { NlpDatasetWorkspace } from './components/NlpDatasetWorkspace';
import { TranslationWorkspace } from './components/TranslationWorkspace';
import { SpeechAiWorkspace } from './components/SpeechAiWorkspace';
import { LlmInstructionWorkspace } from './components/LlmInstructionWorkspace';
import { RoadmapView } from './components/RoadmapView';
import { MyProfile } from './components/MyProfile';
import { ConsentLicenseView } from './components/ConsentLicenseView';
import { MvyMilestone23 } from './components/MvyMilestone23';
import { MvyResearchDashboard } from './components/MvyResearchDashboard';
import { Contribution, RewardConfig, UILanguage, UserProfile } from './types';
import { DEMO_USERS, INITIAL_REWARD_CONFIG } from './data/initialData';
import { getStoredContributions, getStoredRewardConfig } from './services/storage';
import { onAuthStateChanged, AuthStatus } from './services/authService';
import { PROJECT_DIRECTOR_LINKEDIN } from './services/speechAiService';
import { LinkedInIconLink } from './components/LinkedInIconLink';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'contribute' | 'my_contributions' | 'verification_queue' | 'corpus_explorer' | 'admin_panel' | 'quality_dashboard' | 'dataset_releases' | 'nlp_workspace' | 'translation_workspace' | 'speech_workspace' | 'llm_workspace' | 'mvy_milestone_23' | 'mvy_research' | 'roadmap' | 'my_profile' | 'consent_license'
  >('mvy_milestone_23');


  // Real Firebase Authentication State (BALL 15.2)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('AUTHENTICATING');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Development Mock Persona Switcher (clearly separated)
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USERS[4]); // Default to Muhammad Saeed (Contributor)
  const [uiLang, setUiLang] = useState<UILanguage>('en');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [rewardConfig, setRewardConfig] = useState<RewardConfig>(INITIAL_REWARD_CONFIG);

  const refreshData = () => {
    const loaded = getStoredContributions();
    const cfg = getStoredRewardConfig();
    setContributions(loaded);
    setRewardConfig(cfg);
  };

  // Real Firebase Auth listener via onAuthStateChanged
  useEffect(() => {
    refreshData();

    setAuthStatus('AUTHENTICATING');
    const unsubscribe = onAuthStateChanged((user) => {
      if (user) {
        setFirebaseUser(user);
        setAuthStatus('AUTHENTICATED');
        setAuthError(null);
      } else {
        setFirebaseUser(null);
        setAuthStatus('UNAUTHENTICATED');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const pendingCount = (contributions || []).filter(c => c?.verified?.status === 'pending_review').length;
  const escalatedCount = (contributions || []).filter(c => c?.verified?.status === 'escalated_to_senior').length;
  const verifiedCount = (contributions || []).filter(
    c => c?.raw?.contributorId === currentUser?.id && (c?.verified?.status === 'approved' || c?.verified?.status === 'corrected')
  ).length;

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-[#E5E5E5] flex flex-col font-sans selection:bg-[#C9A66B] selection:text-[#0C0C0C]">
      {/* Sticky Header with real Firebase Auth Status and separated testing persona */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        uiLang={uiLang}
        setUiLang={setUiLang}
        pendingReviewCount={pendingCount}
        escalatedCount={escalatedCount}
        verifiedCount={verifiedCount}
        firebaseUser={firebaseUser}
        authStatus={authStatus}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Real Firebase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        firebaseUser={firebaseUser}
        authStatus={authStatus}
        authError={authError}
        setAuthStatus={setAuthStatus}
        setAuthError={setAuthError}
      />

      {/* Main Content Area */}
      <main className="flex-1 bg-[#0C0C0C]">
        {activeTab === 'contribute' && (
          <ContributeForm
            currentUser={currentUser}
            firebaseUser={firebaseUser}
            rewardConfig={rewardConfig}
            onContributionAdded={refreshData}
            onNavigateToPortfolio={() => setActiveTab('my_contributions')}
            onNavigateToConsent={() => setActiveTab('consent_license')}
            onNavigateToDirector={() => setActiveTab('my_profile')}
          />
        )}

        {activeTab === 'my_contributions' && (
          <MyContributions
            contributions={contributions}
            currentUser={currentUser}
            firebaseUser={firebaseUser}
            onNavigateToContribute={() => setActiveTab('contribute')}
          />
        )}

        {activeTab === 'verification_queue' && (
          <VerificationQueue
            contributions={contributions}
            currentUser={currentUser}
            firebaseUser={firebaseUser}
            onDataUpdated={refreshData}
            onNavigateToContribute={() => setActiveTab('contribute')}
          />
        )}

        {activeTab === 'corpus_explorer' && (
          <CorpusExplorer contributions={contributions} />
        )}

        {activeTab === 'admin_panel' && (
          <AdminPanel
            contributions={contributions}
            rewardConfig={rewardConfig}
            currentUser={currentUser}
            onConfigUpdated={(cfg) => {
              setRewardConfig(cfg);
              refreshData();
            }}
            onDataReset={refreshData}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'quality_dashboard' && (
          <CorpusQualityDashboard
            contributions={contributions}
            currentUser={currentUser}
            uiLang={uiLang}
            onNavigateToVerification={() => setActiveTab('verification_queue')}
            onNavigateToCorpus={() => setActiveTab('corpus_explorer')}
          />
        )}

        {activeTab === 'dataset_releases' && (
          <DatasetReleases
            contributions={contributions}
            currentUser={currentUser}
            onNavigateToCorpus={() => setActiveTab('corpus_explorer')}
          />
        )}

        {activeTab === 'nlp_workspace' && (
          <NlpDatasetWorkspace
            contributions={contributions}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'translation_workspace' && (
          <TranslationWorkspace
            contributions={contributions}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'speech_workspace' && (
          <SpeechAiWorkspace
            currentUser={currentUser}
            uiLang={uiLang}
          />
        )}

        {activeTab === 'llm_workspace' && (
          <LlmInstructionWorkspace
            currentUser={currentUser}
            uiLang={uiLang}
          />
        )}

        {activeTab === 'mvy_milestone_23' && <MvyResearchDashboard uiLang={uiLang === 'ur' ? 'ur' : 'en'} />}

        {activeTab === 'roadmap' && (
          <RoadmapView
            contributions={contributions}
            rewardConfig={rewardConfig}
            currentUser={currentUser}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'my_profile' && (
          <MyProfile
            firebaseUser={firebaseUser}
            uiLang={uiLang}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'consent_license' && (
          <ConsentLicenseView
            currentUser={currentUser}
            firebaseUser={firebaseUser}
            onConsentUpdated={refreshData}
            onNavigateToContribute={() => setActiveTab('contribute')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 bg-zinc-950 py-5 text-center text-xs text-zinc-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-left">
            <span className="font-bold text-[#C9A66B] tracking-wider">FiKR&CD</span>
            <span className="hidden sm:inline text-zinc-700">•</span>
            <span className="text-zinc-300">
              {uiLang === 'ur' ? 'انڈس کوہستانی زبان کی ڈیجیٹل حفاظت' : 'Indus-Kohistani Language Digital Preservation'}
            </span>
          </div>

          <div className="text-xs sm:text-sm text-[#D4B582] font-kohistani leading-relaxed tracking-wide" dir="rtl">
            اِنڈَس کُستَئی ژِیباں ڈیجیٹل سَنْبَھلتُب اَں تَکْنِیْکی مَنْصُوبَہ
          </div>

          <div className="text-[11px] text-zinc-500 flex items-center gap-2 flex-wrap">
            <span>{uiLang === 'ur' ? 'ڈائریکٹر: ' : 'Director: '}<strong className="text-zinc-200">Saif Ullah</strong></span>
            <LinkedInIconLink id="footer-director-linkedin-link" size={16} />
            <span>•</span>
            <span className="text-[#C9A66B] font-mono">v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
