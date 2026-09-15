import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Volume2, 
  BookOpen, 
  Layers, 
  Tag, 
  Sparkles, 
  Compass, 
  FileText, 
  ShieldCheck,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { Contribution } from '../types';
import { DIALECTS, CONTRIBUTION_CATEGORIES, SEMANTIC_DOMAINS, getDialectDisplayName } from '../data/initialData';
import { AudioPlayer } from './AudioPlayer';

interface DictionaryModalProps {
  item: Contribution | null;
  onClose: () => void;
}

export const DictionaryModal: React.FC<DictionaryModalProps> = ({ item, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!item) return null;

  // Extract canonical verified text (fallback to raw if missing)
  const ikText = item.verified?.correctedIkText || item.raw.ikText;
  const transcription = item.verified?.correctedTranscription || item.raw.ikTranscription;
  const ipa = item.verified?.verifiedIpa || item.raw.ipa;
  const urdu = item.verified?.correctedUrduMeaning || item.raw.urduMeaning;
  const english = item.verified?.correctedEnglishMeaning || item.raw.englishMeaning;
  const dialectId = item.verified?.verifiedDialect || item.raw.dialect;
  const pos = item.verified?.verifiedPosTag || item.raw.posTag;
  const semanticDomainId = item.verified?.verifiedSemanticDomain || item.raw.semanticDomain;
  const variants = item.verified?.verifiedVariantForms || item.raw.variantForms || [];
  const relatedTerms = item.verified?.verifiedRelatedTerms || item.raw.relatedTerms || [];
  const context = item.raw.culturalContext;
  const audioUrl = item.raw.audioUrl;
  const duration = item.raw.audioDurationSec;

  const categoryObj = CONTRIBUTION_CATEGORIES.find(c => c.id === item.type);
  const domainObj = SEMANTIC_DOMAINS.find(d => d.id === semanticDomainId);
  const dialectObj = DIALECTS.find(d => d.id === dialectId || d.nameUr === dialectId);

  const handleCopyCitation = () => {
    const citation = `${ikText} [${transcription || ''}] — Urdu: ${urdu || 'N/A'}, English: ${english || 'N/A'}. Dialect: ${getDialectDisplayName(dialectId)}. Indus-Kohistani Digital Preservation Initiative (FiKR&CD).`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#111111] border border-[#2A2A2A] shadow-2xl p-6 sm:p-8 text-[#E5E5E5]"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Action Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-700/60">
              <CheckCircle2 className="h-3.5 w-3.5" />
              مصدقہ مستند لغت اندراج (Verified Canonical)
            </span>
            <span className="text-[11px] font-mono text-[#888]">
              ID: {item.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCitation}
              title="Copy Citation"
              className="p-2 rounded-xl bg-[#1A1A1A] text-[#AAA] hover:text-[#FFF] hover:bg-[#252525] border border-[#333] transition cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#1A1A1A] text-[#AAA] hover:text-[#FFF] hover:bg-[#252525] border border-[#333] transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Headword Section */}
        <div className="py-6 border-b border-[#222] bg-gradient-to-b from-[#161616]/50 to-transparent rounded-2xl px-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <div className="w-full">
              {/* Indus-Kohistani Main Script */}
              <h2 
                className="font-kohistani text-4xl sm:text-5xl font-bold text-[#F5F5F5] text-right leading-relaxed tracking-normal select-text"
                dir="rtl"
              >
                {ikText}
              </h2>

              {/* Phonetics / IPA Row */}
              <div className="flex items-center gap-3 flex-wrap mt-2">
                {transcription && (
                  <span className="font-mono text-sm font-semibold text-[#C9A66B] bg-[#1A1A1A] px-2.5 py-0.5 rounded-lg border border-[#333]">
                    [{transcription}]
                  </span>
                )}
                {ipa && (
                  <span className="font-mono text-xs text-[#999] bg-[#141414] px-2 py-0.5 rounded-lg border border-[#222]">
                    IPA: {ipa}
                  </span>
                )}
                {pos && (
                  <span className="text-xs font-bold uppercase text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-900/50">
                    {pos}
                  </span>
                )}
                {categoryObj && (
                  <span className="text-xs font-medium text-[#BBB] bg-[#222] px-2 py-0.5 rounded-lg border border-[#333]">
                    {categoryObj.nameUr} ({categoryObj.nameEn})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Audio Pronunciation if available */}
          {audioUrl && (
            <div className="mt-4 pt-3 border-t border-[#222] flex items-center gap-3">
              <AudioPlayer audioUrl={audioUrl} durationSec={duration} />
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <Volume2 className="h-3.5 w-3.5" /> Authentic Native Speaker Audio Pronunciation
              </span>
            </div>
          )}
        </div>

        {/* Trilingual Meanings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          {/* Urdu Section */}
          <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
            <div className="flex items-center justify-between pb-2 border-b border-[#222]">
              <span className="text-xs font-bold text-[#888]">اردو معنی و تشریح</span>
              <span className="text-[10px] text-[#C9A66B] font-mono">Urdu Definition</span>
            </div>
            <p 
              className="font-urdu text-lg sm:text-xl font-medium text-[#F5F5F5] pt-3 text-right leading-loose"
              dir="rtl"
            >
              {urdu || 'کوئی اردو ترجمہ درج نہیں ہے۔'}
            </p>
          </div>

          {/* English Section */}
          <div className="rounded-2xl bg-[#161616] p-4 border border-[#262626]">
            <div className="flex items-center justify-between pb-2 border-b border-[#222]">
              <span className="text-xs font-bold text-[#888]">English Translation</span>
              <span className="text-[10px] text-[#C9A66B] font-mono">English Definition</span>
            </div>
            <p className="text-sm sm:text-base font-normal text-[#DDD] pt-3 leading-relaxed">
              {english || 'No English translation recorded.'}
            </p>
          </div>
        </div>

        {/* Linguistic & Dialect Metadata */}
        <div className="space-y-4 rounded-2xl bg-[#141414] p-5 border border-[#222]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#999] flex items-center gap-1.5 pb-2 border-b border-[#222]">
            <Compass className="h-3.5 w-3.5 text-[#C9A66B]" />
            Linguistic & Dialectal Classification (لسانی درجہ بندی)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#777] block text-[11px]">Dialect Variety (بولی):</span>
              <span className="font-bold text-[#E5E5E5] block mt-0.5">
                {getDialectDisplayName(dialectId)}
              </span>
              {dialectObj?.nameEn && (
                <span className="text-[11px] text-[#888] font-mono">{dialectObj.nameEn}</span>
              )}
            </div>

            <div>
              <span className="text-[#777] block text-[11px]">Semantic Domain (معنوی دائرہ):</span>
              <span className="font-bold text-[#D4B582] block mt-0.5">
                {domainObj ? `${domainObj.nameUr} (${domainObj.nameEn})` : 'General Lexicon (عام لغت)'}
              </span>
            </div>

            {variants.length > 0 && (
              <div className="col-span-full">
                <span className="text-[#777] block text-[11px] mb-1">Variant Spellings / Dialect Forms (لہجاتی صورتیں):</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {variants.map((v, i) => (
                    <span key={i} className="font-kohistani text-sm bg-[#1C1C1C] px-2 py-0.5 rounded border border-[#333] text-[#EEE]" dir="rtl">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {relatedTerms.length > 0 && (
              <div className="col-span-full">
                <span className="text-[#777] block text-[11px] mb-1">Related Terms & Synonyms (متعلقہ الفاظ):</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {relatedTerms.map((t, i) => (
                    <span key={i} className="text-xs bg-[#1A1A1A] px-2 py-0.5 rounded border border-[#2A2A2A] text-[#CCC]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ethnographic & Cultural Context */}
          {context && (
            <div className="pt-3 border-t border-[#222]">
              <span className="text-[#777] block text-[11px] mb-1 font-bold">Cultural / Ethnographic Context (ثقافتی پس منظر):</span>
              <p className="text-xs text-[#AAA] italic bg-[#181818] p-3 rounded-xl border border-[#262626]">
                {context}
              </p>
            </div>
          )}
        </div>

        {/* Verification Guarantee & Provenance Seal */}
        <div className="mt-6 pt-4 border-t border-[#222] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#777]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>
              Validated by <strong className="text-[#BBB]">FiKR&CD Linguistic Review Board</strong>
            </span>
          </div>
          <span className="text-[11px] text-[#666] font-mono">
            Canonical Version 1.0 • Non-Commercial Preservation License
          </span>
        </div>
      </div>
    </div>
  );
};
