import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Building2, 
  Globe2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Save, 
  Calendar,
  KeyRound,
  LogIn,
  Linkedin,
  ExternalLink
} from 'lucide-react';
import saifPortrait from '../assets/images/saif_ullah.jpg';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  ContributorProfile, 
  getOrCreateUserProfile, 
  updateContributorProfile 
} from '../services/userService';
import { UILanguage } from '../types';
import { DIALECTS, DEFAULT_DIALECT_ID } from '../data/initialData';
import {
  PROJECT_DIRECTOR_LINKEDIN,
  PROJECT_DIRECTOR_FACEBOOK,
  PROJECT_DIRECTOR_WHATSAPP
} from '../services/speechAiService';
import { AboutProjectDirector } from './AboutProjectDirector';
import { LinkedInIconLink } from './LinkedInIconLink';

interface MyProfileProps {
  firebaseUser: FirebaseUser | null;
  uiLang: UILanguage;
  onOpenAuthModal: () => void;
}

export const MyProfile: React.FC<MyProfileProps> = ({
  firebaseUser,
  uiLang,
  onOpenAuthModal
}) => {
  const [profile, setProfile] = useState<ContributorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const contributors = [
    ['Saif Ullah', 'Project Director'],
    ['Dr. Hussain Ahmad Faizy', 'Co-founder of FiKR&CD · Book Author · Researcher · Linguist · Contributor'],
    ['Mujeeb ul Haq Jailani', 'Native speaker · Researcher · Linguist · Contributor'],
    ['Rasheed Ahmad Faizy', 'Native speaker · Researcher · Linguist · Contributor'],
    ['Muhammad Iqbal Abasindi', 'Native speaker · Researcher · Linguist · Contributor'],
    ['Ihsan Ullah', 'Native speaker · Researcher · Contributor'],
    ['Abdul Hadi', 'Native speaker · Researcher · Contributor'],
    ['Aslam Dani', 'Native speaker · Researcher · Contributor'],
    ['Atta Ur Rehman Aziz', 'Native speaker · Researcher · Contributor'],
    ['Jameel Ahmad Umang', 'Native speaker · Researcher · Contributor'],
    ['Ahsanullah Majid', 'Native speaker · Researcher · Contributor'],
    ['Hasan Jamil', 'Native speaker · Researcher · Contributor'],
    ['FiKR&CD Admin Team', 'Administrator']
  ];


  // Form editable states
  const [displayName, setDisplayName] = useState('');
  const [institution, setInstitution] = useState('');
  const [nativeDialect, setNativeDialect] = useState(DEFAULT_DIALECT_ID);
  const [isNativeSpeaker, setIsNativeSpeaker] = useState(true);

  const contributorsSection = (
  <section id="fikrcd-contributors" className="max-w-5xl mx-auto px-4 py-10 space-y-6">
    <div className="text-center max-w-3xl mx-auto">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9A66B] font-semibold mb-2">FiKR&CD contributors</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5]">Contributors to the Indus-Kohistani research programme</h1>
      <p className="mt-3 text-sm leading-6 text-[#999]">
        Native speakers, researchers, linguists and contributors to the Indus-Kohistani language and cultural research programme.
      </p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {contributors.map(([name, role]) => (
        <article key={name} className="rounded-2xl bg-[#141414] border border-[#262626] p-5 hover:border-[#C9A66B]/40 transition">
          <h2 className="text-sm font-bold text-[#F5F5F5]">{name}</h2>
          <p className="mt-1.5 text-xs leading-5 text-[#999]">{role}</p>
        </article>
      ))}
    </div>
  </section>
  );

  // Load profile whenever firebaseUser changes
  useEffect(() => {
    if (!firebaseUser) {
      setProfile(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);

    getOrCreateUserProfile(firebaseUser)
      .then((p) => {
        if (!isMounted) return;
        setProfile(p);
        setDisplayName(p.displayName || '');
        setInstitution(p.institution || '');
        setNativeDialect(p.nativeDialect || DEFAULT_DIALECT_ID);
        setIsNativeSpeaker(p.isNativeSpeaker ?? true);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load profile:', err);
        setErrorMsg(err.message || 'Failed to load contributor profile from Firestore.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [firebaseUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !profile) return;

    if (!displayName.trim()) {
      setErrorMsg('Display name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateContributorProfile(firebaseUser.uid, {
        displayName: displayName.trim(),
        institution: institution.trim(),
        nativeDialect: nativeDialect.trim(),
        isNativeSpeaker
      });

      setProfile(prev => prev ? ({
        ...prev,
        displayName: displayName.trim(),
        institution: institution.trim(),
        nativeDialect: nativeDialect.trim(),
        isNativeSpeaker,
        updatedAt: new Date().toISOString()
      }) : null);

      setSuccessMsg('Contributor profile updated successfully in Firestore (/users/' + firebaseUser.uid + ').');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!firebaseUser) {
    return (
      <div className="space-y-2">
        {contributorsSection}
        <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-8 text-center max-w-lg mx-auto shadow-2xl">
          <div className="h-14 w-14 rounded-2xl bg-[#C9A66B]/15 border border-[#C9A66B]/30 flex items-center justify-center text-[#C9A66B] mx-auto mb-4">
            <UserIcon className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">
            Authenticated Contributor Profile
          </h2>
          <p className="text-xs text-[#888] mb-6 leading-relaxed">
            Please sign in with your Firebase account to view and manage your authenticated contributor profile.
          </p>
          <button
            id="profile-signin-btn"
            type="button"
            onClick={onOpenAuthModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A66B] hover:bg-[#D4B582] text-[#0C0C0C] text-xs font-bold transition shadow-sm"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In to Firebase</span>
          </button>
        </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-[#888]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A66B] mb-3" />
        <p className="text-xs">Loading contributor profile from Firestore (/users/{firebaseUser.uid})...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {contributorsSection}
      <div id="my-profile-view" className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#141414] border border-[#262626]">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#C9A66B]/15 border border-[#C9A66B]/30 flex items-center justify-center text-[#C9A66B] shrink-0">
            <UserIcon className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-[#F5F5F5]">
                {profile?.displayName || 'Contributor Profile'}
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                {profile?.role || 'Contributor'}
              </span>
            </div>
            <p className="text-xs text-[#888] font-mono mt-0.5">
              Firestore Path: /users/{firebaseUser.uid}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          <LinkedInIconLink id="profile-director-linkedin-btn" size={24} />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B1B1B] border border-[#333] text-xs text-[#AAA]">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-[11px] font-mono">Firebase Verified</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <strong className="block mb-0.5">Profile Notice</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Read-Only System Identity Fields */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
              <Lock className="h-4 w-4 text-[#888]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#AAA]">
                Immutable System Identity
              </h3>
            </div>

            {/* UID */}
            <div>
              <label className="block text-[11px] text-[#666] font-medium mb-1">
                Firebase UID (Immutable)
              </label>
              <div className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#262626] text-[11px] font-mono text-[#888] break-all select-all">
                {firebaseUser.uid}
              </div>
            </div>

            {/* Verified Email */}
            <div>
              <label className="block text-[11px] text-[#666] font-medium mb-1">
                Authenticated Email (Firebase Auth)
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1A1A1A] border border-[#262626] text-xs text-[#BBB] break-all">
                <Mail className="h-3.5 w-3.5 text-[#666] shrink-0" />
                <span>{firebaseUser.email || 'No email associated'}</span>
              </div>
            </div>

            {/* Authorized Role */}
            <div>
              <label className="block text-[11px] text-[#666] font-medium mb-1">
                Assigned Role (Server Authoritative)
              </label>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1A1A1A] border border-[#262626] text-xs text-[#E5E5E5]">
                <span className="font-semibold">{profile?.role || 'Contributor'}</span>
                <span className="text-[10px] text-[#777] font-mono">No Self-Escalation</span>
              </div>
              <p className="text-[10px] text-[#666] mt-1">
                Roles are managed exclusively by Project Leadership and cannot be modified by client requests.
              </p>
            </div>

            {/* Created At */}
            {profile?.createdAt && (
              <div>
                <label className="block text-[11px] text-[#666] font-medium mb-1">
                  Registration Timestamp
                </label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1A1A1A] border border-[#262626] text-[11px] font-mono text-[#777]">
                  <Calendar className="h-3.5 w-3.5 text-[#555] shrink-0" />
                  <span>{new Date(profile.createdAt).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Editable Profile Fields */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#C9A66B]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5E5E5]">
                  Editable Contributor Information
                </h3>
              </div>
              <span className="text-[11px] text-[#777]">
                BALL 15.3 Profile Standard
              </span>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="profile-display-name" className="block text-xs font-medium text-[#BBB] mb-1.5">
                Display Name / Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                <input
                  id="profile-display-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Saif Ullah or Contributor Name"
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#E5E5E5] placeholder-[#555] focus:outline-none focus:border-[#C9A66B] focus:ring-1 focus:ring-[#C9A66B] transition"
                />
              </div>
              <p className="text-[11px] text-[#666] mt-1">
                This name will be attributed to your linguistic contributions in the public corpus.
              </p>
            </div>

            {/* Institution / Organization */}
            <div>
              <label htmlFor="profile-institution" className="block text-xs font-medium text-[#BBB] mb-1.5">
                Affiliated Institution / Village / Community Group
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                <input
                  id="profile-institution"
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. FiKR&CD / Indus Kohistan Cultural Forum"
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#E5E5E5] placeholder-[#555] focus:outline-none focus:border-[#C9A66B] focus:ring-1 focus:ring-[#C9A66B] transition"
                />
              </div>
            </div>

            {/* Native Dialect */}
            <div>
              <label htmlFor="profile-dialect" className="block text-xs font-medium text-[#BBB] mb-1.5">
                Native Indus-Kohistani Dialect
              </label>
              <div className="relative">
                <Globe2 className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                <select
                  id="profile-dialect"
                  value={nativeDialect}
                  onChange={(e) => setNativeDialect(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#E5E5E5] focus:outline-none focus:border-[#C9A66B] focus:ring-1 focus:ring-[#C9A66B] transition cursor-pointer"
                >
                  {DIALECTS.map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#1A1A1A] text-[#E5E5E5]">
                      {d.nameUr} {d.nameEn ? `(${d.nameEn})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Is Native Speaker Checkbox */}
            <div className="p-4 rounded-xl bg-[#191919] border border-[#2A2A2A]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  id="profile-is-native-speaker"
                  type="checkbox"
                  checked={isNativeSpeaker}
                  onChange={(e) => setIsNativeSpeaker(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#444] bg-[#222] text-[#C9A66B] focus:ring-[#C9A66B] cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-[#E5E5E5] block">
                    I am a native speaker of Indus-Kohistani (مادری زبان بولنے والے)
                  </span>
                  <span className="text-[11px] text-[#777] block mt-0.5">
                    Helps the editorial board classify maternal dialect nuances and phonetic recordings during review.
                  </span>
                </div>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                id="profile-save-btn"
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C9A66B] hover:bg-[#D4B582] text-[#0C0C0C] text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#0C0C0C]" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Project Leadership & Custodianship Panel */}
      <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#C9A66B]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5E5E5]">
              Project Leadership & Digital Custodianship
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">FiKR&CD Governance</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#181818] border border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl overflow-hidden border border-[#C9A66B]/40 bg-[#161616] shrink-0">
              <img
                src={saifPortrait}
                alt="Saif Ullah - Project Director"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('/images/saif_ullah.jpg')) {
                    target.src = '/images/saif_ullah.jpg';
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#F5F5F5]">Saif Ullah</h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                  Project Director
                </span>
              </div>
              <p className="text-xs text-[#888] mt-0.5">
                Senior Translator & Localization Specialist • Indus-Kohistani Digital Preservation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LinkedInIconLink id="leadership-saif-linkedin-link" size={26} />
            <a
              id="leadership-saif-facebook-link"
              href={PROJECT_DIRECTOR_FACEBOOK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Saif Ullah on Facebook"
              title="Saif Ullah on Facebook"
              className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-[4px] bg-[#1877F2] hover:bg-[#1465cc] text-white transition transform hover:scale-105 active:scale-95 shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              id="leadership-saif-whatsapp-link"
              href={PROJECT_DIRECTOR_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact Saif Ullah on WhatsApp"
              title="Contact Saif Ullah on WhatsApp"
              className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-[4px] bg-[#25D366] hover:bg-[#20b858] text-white transition transform hover:scale-105 active:scale-95 shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.45 1.03 2.62.13.17 1.77 2.71 4.29 3.8.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.12-.22-.19-.47-.32z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Full About the Project Director Section */}
      <div className="mt-8">
        <AboutProjectDirector />
      </div>
      </div>
    </div>
  );
};
