import React, { useState } from 'react';
import { 
  BookOpen,
  Database, 
  CheckSquare, 
  Award, 
  Settings, 
  Layers, 
  UserCheck, 
  Languages, 
  ChevronDown,
  Sparkles,
  ShieldCheck,
  KeyRound,
  User as UserIcon,
  Scale,
  Activity,
  GitBranch,
  Cpu,
  Mic,
  Brain,
  Route,
  Menu,
  X,
  House,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { UserRole, UILanguage, UserProfile } from '../types';
import { DEMO_USERS } from '../data/initialData';
import { AuthStatus } from '../services/authService';
import { LinkedInIconLink } from './LinkedInIconLink';
import fikrLogo from '../assets/images/fikrcd_logo_1787381137891.jpg';

interface HeaderProps {
  activeTab: 'contribute' | 'my_contributions' | 'verification_queue' | 'corpus_explorer' | 'admin_panel' | 'quality_dashboard' | 'dataset_releases' | 'nlp_workspace' | 'translation_workspace' | 'speech_workspace' | 'llm_workspace' | 'mvy_milestone_23' | 'mvy_research' | 'knowledge_center' | 'roadmap' | 'my_profile' | 'consent_license' | 'dictionary';
  setActiveTab: (tab: 'contribute' | 'my_contributions' | 'verification_queue' | 'corpus_explorer' | 'admin_panel' | 'quality_dashboard' | 'dataset_releases' | 'nlp_workspace' | 'translation_workspace' | 'speech_workspace' | 'llm_workspace' | 'mvy_milestone_23' | 'mvy_research' | 'knowledge_center' | 'roadmap' | 'my_profile' | 'consent_license' | 'dictionary') => void;
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  uiLang: UILanguage;
  setUiLang: (lang: UILanguage) => void;
  pendingReviewCount: number;
  escalatedCount: number;
  verifiedCount: number;
  firebaseUser: FirebaseUser | null;
  authStatus: AuthStatus;
  onOpenAuthModal: () => void;
}

interface NavTabItem {
  id: HeaderProps['activeTab'];
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  urgent?: boolean;
  group: 'Intake & Archive' | 'AI & Computational NLP' | 'Governance & System';
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  setCurrentUser,
  uiLang,
  setUiLang,
  pendingReviewCount,
  escalatedCount,
  verifiedCount,
  firebaseUser,
  authStatus,
  onOpenAuthModal
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlatformOpen, setIsPlatformOpen] = useState(false);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'project_director':
        return 'bg-[#C9A66B]/20 text-[#D4B582] border-[#C9A66B]/40';
      case 'linguistic_advisor':
        return 'bg-purple-950/40 text-purple-300 border-purple-800/40';
      case 'senior_reviewer':
        return 'bg-blue-950/40 text-blue-300 border-blue-800/40';
      case 'reviewer':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40';
      case 'administrator':
        return 'bg-amber-950/40 text-amber-300 border-amber-800/40';
      default:
        return 'bg-[#1C1C1C] text-[#C9A66B] border-[#333]';
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const user = DEMO_USERS.find(u => u.id === selectedId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const t = (en: string, ur: string) => uiLang === 'ur' ? ur : en;
  const navTabs: NavTabItem[] = [
    { id: 'dictionary', label: t('Dictionary', 'ڈکشنری'), sublabel: 'Dictionary / ڈکشنری', icon: BookOpen, group: 'Intake & Archive' },
    { id: 'knowledge_center', label: t('Knowledge & Data', 'علم و ڈیٹا'), sublabel: 'Knowledge & Data / علم و ڈیٹا', icon: Database, group: 'Intake & Archive' },
    { id: 'mvy_milestone_23', label: t('Research', 'تحقیق'), sublabel: 'Research / تحقیق', icon: BookOpen, group: 'AI & Computational NLP' },
    { id: 'corpus_explorer', label: t('Explore', 'دریافت'), sublabel: 'Explore / دریافت', icon: Layers, group: 'Intake & Archive' },
    { id: 'contribute', label: t('Contribute', 'شمولیت'), sublabel: 'Contribute / شمولیت', icon: BookOpen, group: 'Intake & Archive' },
    { id: 'my_profile', label: t('About FiKR&CD', 'فکر اینڈ سی ڈی'), sublabel: 'About FiKR&CD / فکر اینڈ سی ڈی', icon: UserIcon, group: 'Governance & System' },
    { id: 'my_contributions', label: t('My contributions', 'میری شمولیات'), sublabel: 'My contributions / میری شمولیات', icon: Award, count: verifiedCount, group: 'Governance & System' },
    { id: 'verification_queue', label: t('Review', 'جائزہ'), sublabel: 'Review / جائزہ', icon: CheckSquare, count: pendingReviewCount + escalatedCount, urgent: pendingReviewCount > 0, group: 'Governance & System' },
    { id: 'nlp_workspace', label: t('AI & NLP', 'اے آئی اور لسانیات'), sublabel: 'AI & NLP / اے آئی اور لسانیات', icon: Cpu, group: 'AI & Computational NLP' },
    { id: 'translation_workspace', label: t('Translation', 'ترجمہ'), sublabel: 'Translation / ترجمہ', icon: Sparkles, group: 'AI & Computational NLP' },
    { id: 'speech_workspace', label: t('Speech', 'صوتی تحقیق'), sublabel: 'Speech / صوتی تحقیق', icon: Mic, group: 'AI & Computational NLP' },
    { id: 'llm_workspace', label: t('Language models', 'لسانی ماڈلز'), sublabel: 'Language models / لسانی ماڈلز', icon: Brain, group: 'AI & Computational NLP' },
    { id: 'quality_dashboard', label: t('Quality', 'معیار'), sublabel: 'Quality / معیار', icon: Activity, group: 'Governance & System' },
    { id: 'dataset_releases', label: t('Data releases', 'ڈیٹا ریلیز'), sublabel: 'Data releases / ڈیٹا ریلیز', icon: GitBranch, group: 'Governance & System' },
    { id: 'admin_panel', label: t('Administration', 'انتظامیہ'), sublabel: 'Administration / انتظامیہ', icon: Settings, group: 'Governance & System' },
    { id: 'roadmap', label: t('Project plan', 'منصوبہ'), sublabel: 'Project plan / منصوبہ', icon: Route, group: 'Governance & System' },
    { id: 'consent_license', label: t('Consent & terms', 'رضامندی اور شرائط'), sublabel: 'Consent & terms / شرائط', icon: Scale, group: 'Governance & System' }
  ];

  const publicNavTabs = navTabs.filter(tab =>
    ['knowledge_center', 'mvy_milestone_23', 'dictionary', 'corpus_explorer', 'contribute', 'my_profile'].includes(tab.id)
  );
  const platformTabs = navTabs.filter(tab =>
    !['knowledge_center', 'mvy_research', 'dictionary', 'corpus_explorer', 'contribute', 'my_profile'].includes(tab.id)
  );

  const currentActiveTabObj = navTabs.find(t => t.id === activeTab) || navTabs[0];
  const CurrentIcon = currentActiveTabObj.icon;

  const handleSelectTab = (tabId: HeaderProps['activeTab']) => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
  };

  const groupedTabs = {
    'Public': publicNavTabs
  };

  const groupLabel = (group: string) => uiLang === 'ur'
    ? ({ 'Public': 'اہم صفحات' } as Record<string, string>)[group]
    : 'Main navigation';

  return (
    <>
      <header id="main-app-header" className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        {/* Minimalist Top Header Bar with Hamburger */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 gap-3">
          
          {/* Left: Hamburger Button + Brand + Active Context */}
          <div className="flex items-center gap-3">
            {/* Hamburger Toggle Button */}
            <button
              id="header-hamburger-menu-btn"
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={uiLang === 'ur' ? 'نیویگیشن مینو کھولیں' : 'Toggle navigation menu'}
              aria-expanded={isMenuOpen}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isMenuOpen
                  ? 'bg-[#C9A66B] border-[#C9A66B] text-zinc-950 shadow-md shadow-[#C9A66B]/20'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-700/80 text-zinc-100 hover:text-white'
              }`}
            >
              {isMenuOpen ? (
                <X className="h-4 w-4 shrink-0" />
              ) : (
                <Menu className="h-4 w-4 text-[#C9A66B] shrink-0" />
              )}
              <span className="font-bold tracking-wide">{uiLang === 'ur' ? 'مینو' : 'Menu'}</span>
              {(pendingReviewCount > 0 || verifiedCount > 0) && !isMenuOpen && (
                <span className="h-2 w-2 rounded-full bg-[#C9A66B] animate-pulse" />
              )}
            </button>

            {/* Home Button */}
            <button
              id="header-home-btn"
              type="button"
              onClick={() => handleSelectTab('knowledge_center')}
              aria-label={uiLang === 'ur' ? 'ہوم' : 'Home'}
              title={uiLang === 'ur' ? 'ہوم' : 'Home'}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-[#C9A66B]/60 hover:bg-zinc-800 hover:text-white cursor-pointer"
            >
              <House className="h-4 w-4 text-[#C9A66B]" />
              <span className="hidden sm:inline">{uiLang === 'ur' ? 'ہوم' : 'Home'}</span>
            </button>

            {/* Brand Logo & Title */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectTab('knowledge_center')}
                aria-label={uiLang === 'ur' ? 'ہوم' : 'Home'}
                className="rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9A66B]/60 cursor-pointer"
              >
              <img 
                src={fikrLogo} 
                alt="FiKR&CD Logo" 
                referrerPolicy="no-referrer"
                className="h-9 w-auto object-contain rounded-md bg-white p-0.5 border border-zinc-800 hidden xs:inline-block" 
              />
              </button>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-wider text-[#C9A66B]">FiKR&CD</span>
                  <span className="text-zinc-600 hidden sm:inline">•</span>
                  <span className="hidden sm:inline-block text-xs text-zinc-300 font-medium">
                    Indus-Kohistani Language & Culture
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span>{uiLang === 'ur' ? 'ڈائریکٹر: ' : 'Director: '}<strong className="text-zinc-200 font-medium">Saif Ullah</strong></span>
                  <LinkedInIconLink id="header-director-linkedin-link" size={15} />
                </div>
              </div>
            </div>

            {/* Active Workspace Indicator Pill */}
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-zinc-800">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-medium">
                <CurrentIcon className="h-3.5 w-3.5 text-[#C9A66B]" />
                <span>{currentActiveTabObj.label}</span>
                {currentActiveTabObj.count !== undefined && currentActiveTabObj.count > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#C9A66B]/20 text-[#D4B582] border border-[#C9A66B]/30">
                    {currentActiveTabObj.count}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Controls (Language + Live Auth + Persona Switcher) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Switcher */}
            <div className="flex items-center rounded-lg bg-zinc-900/80 p-0.5 border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setUiLang('en')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                  uiLang === 'en' ? 'bg-[#C9A66B] text-zinc-950 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setUiLang('ur')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                  uiLang === 'ur' ? 'bg-[#C9A66B] text-zinc-950 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                اردو
              </button>
            </div>

            {/* Live Auth Pill */}
            <button
              id="header-firebase-auth-btn"
              type="button"
              onClick={onOpenAuthModal}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border text-xs font-medium transition ${
                firebaseUser
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700'
                  : 'bg-[#C9A66B]/10 border-[#C9A66B]/30 text-[#D4B582] hover:bg-[#C9A66B]/20'
              }`}
            >
              {firebaseUser ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs max-w-[90px] sm:max-w-[120px] truncate">
                    {firebaseUser.email || 'User'}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5 text-[#C9A66B] shrink-0" />
                  <span>{uiLang === 'ur' ? 'سائن اِن' : 'Sign In'}</span>
                </>
              )}
            </button>

            {/* Role Persona Switcher */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-lg bg-zinc-900/80 px-2 py-1 border border-zinc-800 text-xs">
              <UserCheck className="h-3.5 w-3.5 text-zinc-500" />
              <div className="relative">
                <select
                  id="role-persona-switcher"
                  value={currentUser.id}
                  onChange={handleRoleChange}
                  aria-label="Select Testing Role Persona"
                  className="appearance-none bg-transparent pr-4 text-xs text-zinc-300 font-medium focus:outline-none cursor-pointer"
                >
                  {DEMO_USERS.map((user) => (
                    <option key={user.id} value={user.id} className="bg-zinc-900 text-zinc-200">
                      {user.name} ({user.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(currentUser.role)}`}>
                {currentUser.role.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hamburger Drawer & Overlay */}
      {isMenuOpen && (
        <div 
          id="hamburger-menu-overlay"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-start transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        >
          <div 
            id="hamburger-menu-drawer"
            className="w-full max-w-sm sm:max-w-md h-full bg-zinc-950 border-r border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-zinc-900/60">
              <div className="flex items-center gap-2.5">
                <img 
                  src={fikrLogo} 
                  alt="FiKR&CD Logo" 
                  referrerPolicy="no-referrer"
                  className="h-8 w-auto object-contain rounded bg-white p-0.5" 
                />
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Platform Navigation</h3>
                  <p className="text-[11px] text-[#C9A66B] font-kohistani" dir="rtl">
                    اِنڈَس کُستَئی ژِیباں ڈیجیٹل سَنْبَھلتُب
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Simplified public navigation */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-2">
                  {uiLang === 'ur' ? 'اہم صفحات' : 'Main navigation'}
                </h4>
                <div className="space-y-1">
                  {publicNavTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id || (tab.id === 'mvy_milestone_23' && activeTab === 'mvy_milestone_23');
                    return (
                      <button
                        key={tab.id}
                        id={`drawer-nav-${tab.id.replace(/_/g, '-')}`}
                        type="button"
                        onClick={() => handleSelectTab(tab.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                          isActive
                            ? 'bg-[#C9A66B]/15 border-[#C9A66B] text-white shadow-xs'
                            : 'bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800/80 text-zinc-300 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isActive ? 'bg-[#C9A66B] text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${isActive ? 'text-[#D4B582]' : 'text-zinc-200'}`}>{tab.label}</p>
                            <p className="text-[11px] text-zinc-400 font-kohistani leading-tight" dir="rtl">{tab.sublabel}</p>
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 ${isActive ? 'text-[#C9A66B]' : 'text-zinc-600'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-zinc-800/80 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPlatformOpen(!isPlatformOpen)}
                  aria-expanded={isPlatformOpen}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 transition"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {uiLang === 'ur' ? 'پلیٹ فارم اور ٹولز' : 'Platform & tools'}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isPlatformOpen ? 'rotate-180' : ''}`} />
                </button>

                {isPlatformOpen && (
                  <div className="mt-2 space-y-1">
                    {platformTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          id={`drawer-platform-${tab.id.replace(/_/g, '-')}`}
                          type="button"
                          onClick={() => handleSelectTab(tab.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition cursor-pointer ${
                            isActive
                              ? 'bg-[#C9A66B]/10 border-[#C9A66B]/70 text-white'
                              : 'bg-zinc-900/30 hover:bg-zinc-900 border-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4 text-zinc-500" />
                            <span className="text-xs font-medium">{tab.label}</span>
                          </div>
                          {tab.count !== undefined && tab.count > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              tab.urgent
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                            }`}>{tab.count}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer with Director & Quick Info */}
            <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/70 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-zinc-400">{uiLang === 'ur' ? 'پروجیکٹ ڈائریکٹر اور شریک بانی' : 'Project Director & Co-Founder'}</p>
                  <p className="font-semibold text-zinc-100 text-sm">Saif Ullah</p>
                </div>
                <div className="flex items-center gap-2">
                  <LinkedInIconLink id="drawer-director-linkedin-link" size={20} />
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-kohistani" dir="rtl">
                اِنڈَس کُستَئی ژِیباں ڈیجیٹل سَنْبَھلتُب اَں تَکْنِیْکی مَنْصُوبَہ
              </p>
              <p className="text-[10px] text-zinc-500">
                {uiLang === 'ur' ? 'فکر اینڈ سی ڈی پلیٹ فارم • انڈس کوہستانی زبان کے تحفظ کا منصوبہ' : 'FiKR&CD Platform • Indus-Kohistani Language Preservation Initiative'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
