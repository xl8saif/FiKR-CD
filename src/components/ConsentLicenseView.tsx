import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  ShieldCheck, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Lock, 
  Calendar,
  Sparkles,
  ArrowRight,
  Award
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile } from '../types';
import { 
  recordContributionConsent, 
  getLatestConsent, 
  ConsentRecord, 
  ContributionLicenseOption 
} from '../services/consentService';
import fikrLogo from '../assets/images/fikrcd_logo_1787381137891.jpg';

interface ConsentLicenseViewProps {
  currentUser: UserProfile;
  firebaseUser: FirebaseUser | null;
  onConsentUpdated?: () => void;
  onNavigateToContribute?: () => void;
}

export const ConsentLicenseView: React.FC<ConsentLicenseViewProps> = ({
  currentUser,
  firebaseUser,
  onConsentUpdated,
  onNavigateToContribute
}) => {
  const [selectedLicense, setSelectedLicense] = useState<ContributionLicenseOption>('Public Cultural Preservation');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);
  const [agreedToPreservation, setAgreedToPreservation] = useState<boolean>(true);
  const [currentConsent, setCurrentConsent] = useState<ConsentRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const effectiveUid = firebaseUser?.uid || currentUser.id;

  useEffect(() => {
    async function loadConsent() {
      if (!effectiveUid) return;
      setLoading(true);
      try {
        const consent = await getLatestConsent(effectiveUid);
        if (consent) {
          setCurrentConsent(consent);
          setSelectedLicense(consent.license as ContributionLicenseOption);
        }
      } catch (err) {
        console.warn('Error loading consent record:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConsent();
  }, [effectiveUid]);

  const handleAcceptAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveUid) {
      setErrorMessage('A valid contributor identity is required.');
      return;
    }
    if (!agreedToTerms || !agreedToPreservation) {
      setErrorMessage('You must review and accept the core preservation terms to contribute.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const record = await recordContributionConsent(effectiveUid, selectedLicense);
      setCurrentConsent(record);
      setSuccessMessage('FiKR&CD Contribution Agreement & License successfully recorded and permanently bound to your contributor UID.');
      if (onConsentUpdated) onConsentUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record consent record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="consent-license-view" className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center flex flex-col items-center">
        <img
          src={fikrLogo}
          alt="FiKR&CD Logo"
          referrerPolicy="no-referrer"
          className="h-16 w-auto object-contain rounded-xl bg-white p-2 shadow-md border border-[#333] mb-3"
        />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C9A66B]/15 px-3.5 py-1 text-xs font-bold text-[#D4B582] border border-[#C9A66B]/30">
          <Scale className="h-3.5 w-3.5" /> FiKR&CD Contribution Governance & Licensing (BALL 15.4)
        </span>
        <h1 className="mt-2 text-2xl md:text-3xl font-serif italic text-[#F5F5F5] tracking-tight">
          Contribution Consent & Research Agreement
        </h1>
        <p className="mt-1 text-xs text-[#888] max-w-xl mx-auto font-medium">
          Indus-Kohistani linguistic and cultural preservation agreement. An immutable consent record is created under your authenticated UID prior to data ingestion.
        </p>
      </div>

      {/* Existing Active Consent Status */}
      {currentConsent && (
        <div className="rounded-2xl bg-[#141C16] border border-emerald-800/50 p-5 text-xs text-emerald-200 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Active Consent Verified</h3>
                <p className="text-emerald-300 font-mono text-[11px] mt-0.5">
                  ID: {currentConsent.consentId} • Version: {currentConsent.agreementVersion}
                </p>
                <p className="text-[#AAA] text-[11px] mt-0.5">
                  Selected License: <strong className="text-emerald-300">{currentConsent.license}</strong> • Accepted: {new Date(currentConsent.acceptedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {onNavigateToContribute && (
              <button
                type="button"
                onClick={onNavigateToContribute}
                className="rounded-xl bg-[#C9A66B] px-4 py-2 text-xs font-bold text-[#0C0C0C] hover:bg-[#D4B582] transition flex items-center gap-1.5 shrink-0"
              >
                <span>Proceed to Contribution</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preservation Explanation Mandates */}
      <div className="rounded-3xl bg-[#111111] p-6 border border-[#222] space-y-4">
        <h2 className="text-sm font-bold text-[#E5E5E5] flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#C9A66B]" />
          <span>FiKR&CD Linguistic Documentation Agreement — Required Disclosures</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-[#AAA]">
          <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#262626] space-y-1">
            <h4 className="font-bold text-[#D4B582]">1. Preservation Scope</h4>
            <p className="text-[11px] leading-relaxed text-[#999]">
              Material is contributed specifically for Indus-Kohistani endangered language documentation, revitalization, and digital preservation.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#262626] space-y-1">
            <h4 className="font-bold text-[#D4B582]">2. Permanent Research Archive</h4>
            <p className="text-[11px] leading-relaxed text-[#999]">
              Submitted linguistic text and audio recordings will be preserved in the FiKR&CD research corpus with immutable contributor provenance.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#262626] space-y-1">
            <h4 className="font-bold text-[#D4B582]">3. License Usage & Access</h4>
            <p className="text-[11px] leading-relaxed text-[#999]">
              Permitted educational, linguistic, and computational research depends directly upon your selected license model below.
            </p>
          </div>
        </div>

        {/* License Selector */}
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#D4B582] mb-2.5">
            Select Contribution License (لائسنس کا انتخاب) <span className="text-rose-400">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'FiKR&CD Research Archive Only',
                title: 'FiKR&CD Research Archive Only',
                desc: 'Restricted strictly to FiKR&CD internal linguistic researchers and academic partners. Not distributed in public datasets.',
                badge: 'Restricted Academic'
              },
              {
                id: 'Public Cultural Preservation',
                title: 'Public Cultural Preservation',
                desc: 'Default recommended. Accessible for community education, public dictionary apps, and open cultural preservation projects.',
                badge: 'Recommended'
              },
              {
                id: 'CC BY-NC 4.0',
                title: 'Creative Commons CC BY-NC 4.0',
                desc: 'International open research license allowing non-commercial sharing, adaptation, and NLP modeling with appropriate attribution.',
                badge: 'Open NLP / AI'
              }
            ].map((lic) => {
              const isSelected = selectedLicense === lic.id;
              return (
                <button
                  key={lic.id}
                  id={`license-option-${lic.id.replace(/\s+/g, '-').toLowerCase()}`}
                  type="button"
                  onClick={() => setSelectedLicense(lic.id as ContributionLicenseOption)}
                  className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#C9A66B] bg-[#C9A66B]/15 text-[#F5F5F5] ring-2 ring-[#C9A66B]/20 shadow-md'
                      : 'border-[#262626] bg-[#161616] text-[#888] hover:border-[#383838] hover:bg-[#1C1C1C]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#E5E5E5]">{lic.title}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-[#C9A66B] text-[#0C0C0C] font-bold' : 'bg-[#222] text-[#777]'
                    }`}>
                      {lic.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#999] leading-relaxed mt-auto">
                    {lic.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 pt-3 border-t border-[#222]">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#333] bg-[#161616] text-[#C9A66B] focus:ring-[#C9A66B]"
            />
            <span className="text-xs text-[#BBB] leading-relaxed">
              I certify that I am a native speaker, elder, or authorized community documentarian of Indus-Kohistani and agree to contribute verbatim linguistic material to the FiKR&CD preservation archive.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToPreservation}
              onChange={(e) => setAgreedToPreservation(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#333] bg-[#161616] text-[#C9A66B] focus:ring-[#C9A66B]"
            />
            <span className="text-xs text-[#BBB] leading-relaxed">
              I understand that an immutable consent record with agreement version <strong className="text-[#D4B582] font-mono">FiKR-IK-2026.1</strong> will be bound to my contributor account under license <strong className="text-[#E5E5E5]">{selectedLicense}</strong>.
            </span>
          </label>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#222]">
          <div className="text-[11px] text-[#777] flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-[#C9A66B]" />
            <span>Immutable Consent Ledger: /users/{effectiveUid}/consents/</span>
          </div>

          <button
            id="accept-consent-btn"
            type="button"
            onClick={handleAcceptAgreement}
            disabled={isSubmitting || !agreedToTerms || !agreedToPreservation}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#C9A66B] px-6 py-3 text-xs font-bold text-[#0C0C0C] shadow-md hover:bg-[#D4B582] transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Recording Immutable Consent...</span>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Accept Agreement & Set Contribution License</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
