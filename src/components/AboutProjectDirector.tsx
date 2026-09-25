import React, { useState } from 'react';
import {
  ExternalLink,
  ShieldCheck,
  Languages,
  BookOpen,
  Mic,
  Cpu,
  HeartHandshake,
  Award,
  Sparkles,
  Users,
  GitBranch,
  FileCheck2,
  Calendar,
  Compass,
  CheckCircle2,
  BookmarkCheck,
  TrendingUp,
  GraduationCap,
  Layers,
  Network,
  Globe,
  Database,
  Search,
  ChevronRight,
  FolderLock,
  Briefcase,
  FileText,
  Clock,
  MapPin,
  Check,
  Info,
  Scale
} from 'lucide-react';
import saifPortrait from '../assets/images/saif_ullah.jpg';
import linkedinIcon from '../assets/images/linkedin_icon.png';
import {
  PROJECT_DIRECTOR_LINKEDIN,
  PROJECT_DIRECTOR_FACEBOOK,
  PROJECT_DIRECTOR_WHATSAPP
} from '../services/speechAiService';
import { LinkedInIconLink } from './LinkedInIconLink';
import { UILanguage } from '../types';
import {
  MASTER_EVIDENCE_LEDGER,
  WORK_EXPERIENCE_RECORDS,
  LEADERSHIP_STORY_RECORDS,
  RELATIONSHIP_RECORDS,
  UK_COURSE_RECORDS,
  COURSE_SKILL_IMPACT_MAP,
  EVIDENCE_DOCUMENT_INDEX,
  EvidenceLedgerItem
} from '../data/projectDirectorEvidenceData';

interface AboutProjectDirectorProps {
  className?: string;
  showCardWrapper?: boolean;
  uiLang?: UILanguage;
}

type EvidenceTabSection = 
  | 'overview' 
  | 'indus_work' 
  | 'leadership' 
  | 'evidence_ledger' 
  | 'work_experience' 
  | 'relationships' 
  | 'leadership_stories' 
  | 'career_plan' 
  | 'uk_courses' 
  | 'course_impact_map' 
  | 'timeline' 
  | 'document_index';

type EvidenceFilterCategory = 'all' | 'leadership' | 'relationship' | 'professional' | 'community' | 'research' | 'career';

interface TimelineEvent {
  period: string;
  stage: string;
  title: string;
  description: string;
  highlights: string[];
}

const CAREER_TIMELINE: TimelineEvent[] = [
  {
    period: '2012 – 2018',
    stage: 'Foundational Professional Experience',
    title: 'Multilingual Translation, Interpretation & Localization Practice',
    description: 'Began professional career in multilingual translation, interpretation, and terminology management across Arabic, Urdu, Persian, and English, developing deep expertise in cross-cultural communication and localization quality assurance (LQA).',
    highlights: [
      'Extensive translation across technical, legal, academic, and cultural domains',
      'Interpretation and consecutive multilingual communication',
      'Quality assurance and terminology database structuring'
    ]
  },
  {
    period: '2018 – 2021',
    stage: 'Specialized Linguistic Work & Field Documentation',
    title: 'Indus-Kohistani & Dardic Language Documentation',
    description: 'Initiated structured fieldwork and linguistic documentation for Indus-Kohistani and Shina, collecting native oral literature, documenting morphological structures, and analyzing phonological variations across valley communities.',
    highlights: [
      'Extensive dialectal recordings across Duber-Kandia, Jijal, Seo, and Patan',
      'Phonetic analysis of retroflex affricates and specialized phonemes',
      'Community engagement with native elders, poets, and storytellers'
    ]
  },
  {
    period: '2021 – 2024',
    stage: 'Institutional Leadership & Digital Infrastructure',
    title: 'Founding of FiKR&CD & Digital Orthography Standardization',
    description: 'Formed the Forum for Indus-Kohistani Research & Cultural Development (FiKR&CD) to institutionalize preservation efforts, establish Unicode-compliant digital orthography (ڇ، څ، ݜ، ڙ، ݨ), and build trilingual lexical databases.',
    highlights: [
      'Establishment of FiKR&CD community and research governance',
      'Unicode standard integration and Perso-Arabic digital typing support',
      'Multi-dialect trilingual dictionary and morphological cataloging'
    ]
  },
  {
    period: '2024 – 2026+',
    stage: 'Language Technology & Computational Preservation',
    title: 'AI/NLP Datasets, Speech Engineering & Sustainable Future Impact',
    description: 'Architected modern computational preservation systems, connecting community-verified datasets with Whisper ASR speech models, MTPE machine translation workflows, and instruction-tuning datasets to ensure long-term digital survival.',
    highlights: [
      'M1–M30 milestone engineering and institutional data release governance',
      'Whisper ASR dataset manifests and LLM instruction fine-tuning splits',
      'Sustainable open-access digital infrastructure for future generations'
    ]
  }
];

export const AboutProjectDirector: React.FC<AboutProjectDirectorProps> = ({
  className = '',
  showCardWrapper = true
}) => {
  const [activeTab, setActiveTab] = useState<EvidenceTabSection>('overview');
  const [selectedLedgerCategory, setSelectedLedgerCategory] = useState<EvidenceFilterCategory>('all');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>('all');

  const filteredLedger = MASTER_EVIDENCE_LEDGER.filter((item) => {
    const matchesCategory = selectedLedgerCategory === 'all' || item.category === selectedLedgerCategory;
    const matchesSearch = ledgerSearch.trim() === '' || 
      item.activity.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      item.organizationProject.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      item.role.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      item.action.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      item.result.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      item.evidenceReference.toLowerCase().includes(ledgerSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredDocs = EVIDENCE_DOCUMENT_INDEX.filter((doc) => {
    return docCategoryFilter === 'all' || doc.category === docCategoryFilter;
  });

  const content = (
    <div className={`space-y-8 ${className}`}>
      {/* 1. Header & LinkedIn Verified Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#C9A66B] animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#C9A66B] uppercase">
              Leadership & Digital Preservation Stewardship
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight mt-1">
            About the Project Director
          </h2>
          <p className="text-xs sm:text-sm text-[#888] mt-0.5">
            Factual profile, linguistic leadership, and structured evidence framework for FiKR&CD
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
          <a
            id="about-director-linkedin-cta"
            href={PROJECT_DIRECTOR_LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Saif Ullah on LinkedIn"
            title="Saif Ullah on LinkedIn"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-bold transition shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-white shrink-0"
            >
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28Z" />
            </svg>
            <span>LinkedIn</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-80" />
          </a>

          <a
            id="about-director-facebook-cta"
            href={PROJECT_DIRECTOR_FACEBOOK}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Saif Ullah on Facebook"
            title="Saif Ullah on Facebook"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#1465cc] text-white text-xs font-bold transition shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-white shrink-0"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Facebook</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-80" />
          </a>

          <a
            id="about-director-whatsapp-cta"
            href={PROJECT_DIRECTOR_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact Saif Ullah on WhatsApp"
            title="Contact Saif Ullah on WhatsApp"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-white text-xs font-bold transition shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-white shrink-0"
            >
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.45 1.03 2.62.13.17 1.77 2.71 4.29 3.8.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.12-.22-.19-.47-.32z" />
            </svg>
            <span>WhatsApp</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-80" />
          </a>
        </div>
      </div>

      {/* 2. Main Two-Column Profile: Portrait + Executive Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Portrait & Key Attributes */}
        <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
          <div className="relative group">
            <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-3xl overflow-hidden border-2 border-[#C9A66B]/50 bg-[#161616] shadow-2xl relative">
              <img
                src={saifPortrait}
                alt="Saif Ullah - Project Director, FiKR&CD"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top transition duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('/images/saif_ullah.jpg')) {
                    target.src = '/images/saif_ullah.jpg';
                  }
                }}
              />
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 lg:left-4 lg:translate-x-0 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0E0E0E] border border-[#C9A66B]/70 text-[11px] font-bold text-[#D4B582] shadow-lg whitespace-nowrap">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Project Director & Lead Specialist</span>
            </div>
          </div>

          <div className="pt-3 w-full">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <h3 className="text-2xl font-bold text-[#F5F5F5]">Saif Ullah</h3>
              <LinkedInIconLink id="about-director-saif-linkedin" size={22} />
              <a
                id="about-director-saif-facebook"
                href={PROJECT_DIRECTOR_FACEBOOK}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Saif Ullah on Facebook"
                title="Saif Ullah on Facebook"
                className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-[4px] bg-[#1877F2] hover:bg-[#1465cc] text-white transition transform hover:scale-105 active:scale-95 shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                id="about-director-saif-whatsapp"
                href={PROJECT_DIRECTOR_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact Saif Ullah on WhatsApp"
                title="Contact Saif Ullah on WhatsApp"
                className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-[4px] bg-[#25D366] hover:bg-[#20b858] text-white transition transform hover:scale-105 active:scale-95 shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.45 1.03 2.62.13.17 1.77 2.71 4.29 3.8.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.12-.22-.19-.47-.32z" />
                </svg>
              </a>
            </div>
            <p className="text-xs font-semibold text-[#C9A66B] mt-1.5 leading-snug">
              Senior Translator & Localization Specialist | Indus-Kohistani Language Preservation & Language Technology
            </p>

            {/* RTL Script Representations */}
            <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-[#141414] border border-[#222] text-right space-y-2 shadow-inner">
              <p className="text-base sm:text-lg font-kohistani text-[#D4B582] font-bold leading-relaxed tracking-wide" dir="rtl">
                سَیْفُ اللہ — پراجیکٹ ڈائریکٹر
              </p>
              <p className="text-sm sm:text-base font-kohistani text-zinc-300 font-medium leading-relaxed tracking-wide" dir="rtl">
                اِنڈَس کُستَئی ژِیباں ڈیجیٹل سَنْبَھلتُب اَں تَکْنِیْکی مَنْصُوبَہ
              </p>
            </div>

            {/* Quick Metrics Badges */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-left">
              <div className="p-3 rounded-xl bg-[#141414] border border-[#222]">
                <span className="text-[10px] text-[#777] block uppercase font-bold tracking-wider">{t("Experience", "تجربہ")}</span>
                <span className="text-sm font-extrabold text-[#F5F5F5]">12+ Years</span>
                <span className="text-[10px] text-[#666] block">Verified Work Records</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141414] border border-[#222]">
                <span className="text-[10px] text-[#777] block uppercase font-bold tracking-wider">{t("Initiative", "منصوبہ")}</span>
                <span className="text-sm font-extrabold text-[#C9A66B]">FiKR&CD</span>
                <span className="text-[10px] text-[#666] block">Indus-Kohistani</span>
              </div>
            </div>

            {/* Languages Working Proficiencies */}
            <div className="mt-4 p-3 rounded-2xl bg-[#141414] border border-[#222] text-left">
              <span className="text-[10px] text-[#777] block uppercase font-bold tracking-wider mb-2">
                Language Working Proficiencies
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Indus-Kohistani (کستَئی)', primary: true, note: 'Specialist Preservation' },
                  { name: 'Urdu (اردو)', primary: true, note: 'Native Fluency' },
                  { name: 'English', primary: true, note: 'Professional & Tech' },
                  { name: 'Arabic (العربية)', primary: true, note: 'Translation & Religious' },
                  { name: 'Persian (فارسی)', primary: false, note: 'Translation & Texts' },
                  { name: 'Shina (شِینَا)', primary: false, note: 'Dardic Language Quality' }
                ].map((lang) => (
                  <span
                    key={lang.name}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border ${
                      lang.primary
                        ? 'bg-[#C9A66B]/15 border-[#C9A66B]/30 text-[#D4B582]'
                        : 'bg-[#1C1C1C] border-[#2A2A2A] text-[#AAA]'
                    }`}
                  >
                    {lang.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Professional Profile & Core Competencies */}
        <div className="lg:col-span-8 space-y-6">
          {/* Executive Biography (Factual Profile) */}
          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-[#CCC] leading-relaxed space-y-3.5">
            <p>
              <strong className="text-[#F5F5F5]">Saif Ullah</strong> is a multilingual translator, interpreter, and localization specialist with <strong className="text-[#C9A66B]">12+ years of documented professional experience</strong> across Arabic, Urdu, Persian, and English, alongside specialist linguistic work in Indus-Kohistani and Shina.
            </p>
            <p>
              As the <strong className="text-[#C9A66B]">Project Director of the FiKR&CD Indus-Kohistani Digital Preservation Initiative</strong>, he leads comprehensive documentation, digital corpus development, and language technology infrastructure for Indus-Kohistani (an endangered, under-resourced Dardic language of Northern Pakistan).
            </p>
            <p>
              His practice systematically connects <strong className="text-[#F5F5F5]">traditional linguistic knowledge with modern localization, NLP, speech technology, and digital preservation</strong>, establishing standardized Perso-Arabic orthographies, trilingual lexical resources, acoustic speech datasets, and community-verified computational datasets.
            </p>
          </div>

          {/* Professional Competencies Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#777] mb-3">
              Core Professional Competencies
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { title: 'Translation & Interpretation', desc: 'Arabic, Urdu, Persian, English, Kohistani & Shina' },
                { title: 'Localization & LQA', desc: 'Software, UI strings & cultural adaptation' },
                { title: 'MTPE & Post-Editing', desc: 'AI translation refinement & quality auditing' },
                { title: 'Game & Multimedia Localization', desc: 'Interactive narrative & character dialogue mapping' },
                { title: 'Language Technology & NLP', desc: 'ASR datasets, instruction tuning & corpus engineering' },
                { title: 'Digital Orthography & Unicode', desc: 'Standardized Perso-Arabic characters (ڇ، څ، ݜ، ڙ، ݨ)' }
              ].map((comp, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#141414] border border-[#222] space-y-1">
                  <span className="text-xs font-bold text-[#F5F5F5] block leading-snug">{comp.title}</span>
                  <span className="text-[10px] text-[#777] block leading-normal">{comp.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Foundational Principle Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#181818] to-[#131313] border border-[#C9A66B]/30 shadow-md">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#C9A66B]/15 text-[#C9A66B] shrink-0 mt-0.5">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-[#F5F5F5]">{t("Community-Centered and Human-Verified Principle", "برادری پر مبنی اور انسانی تصدیق کا اصول")}</h4>
                  <Sparkles className="h-3.5 w-3.5 text-[#C9A66B]" />
                </div>
                <p className="text-xs text-[#AAA] leading-relaxed">
                  Under Saif Ullah's leadership, the FiKR&CD initiative is firmly grounded in native community stewardship:
                  <span className="text-[#D4B582] font-semibold block mt-1">
                    "AI is used as a supporting technology. It does not replace native speakers, community knowledge, or qualified linguistic reviewers."
                  </span>
                  Linguistic resources, dialectal recordings, and morphological analyses are validated by native speakers, elders, and qualified reviewers to safeguard authentic cultural context.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Sub-Tabs to explore the structured sections */}
      <div className="border-t border-[#222] pt-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#222] scrollbar-thin">
          {[
            { id: 'overview', label: 'Overview', icon: Compass },
            { id: 'indus_work', label: 'My Work in Indus-Kohistani', icon: BookOpen },
            { id: 'leadership', label: 'Leadership & Development', icon: Users },
            { id: 'evidence_ledger', label: 'Master Evidence Ledger', icon: Award },
            { id: 'work_experience', label: 'Work Experience & Hours', icon: Briefcase },
            { id: 'relationships', label: 'Relationship Building', icon: Network },
            { id: 'leadership_stories', label: 'Leadership Story Records', icon: ShieldCheck },
            { id: 'career_plan', label: 'Career Plan (Short/Med/Long)', icon: TrendingUp },
            { id: 'uk_courses', label: '3 UK Course Research', icon: GraduationCap },
            { id: 'course_impact_map', label: 'Course → Skills → Impact', icon: Layers },
            { id: 'timeline', label: 'Career Timeline', icon: Calendar },
            { id: 'document_index', label: 'Evidence Document Index', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id as EvidenceTabSection)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-[#C9A66B] text-[#0C0C0C] shadow-sm font-bold'
                    : 'bg-[#161616] text-[#AAA] hover:text-[#FFF] hover:bg-[#202020] border border-[#262626]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Tab Content: Section 1 - Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6 pt-2">
          {/* Strategic Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#222] space-y-1.5">
              <div className="flex items-center gap-2 text-[#C9A66B]">
                <BookOpen className="h-4 w-4" />
                <h4 className="text-xs font-bold text-[#F5F5F5]">{t("Corpus & Dictionary", "کارپس اور ڈکشنری")}</h4>
              </div>
              <p className="text-[11px] text-[#888] leading-normal">
                Standardized digital text corpus, trilingual lexical databases, and morphological tagging across Duber-Kandia, Jijal, Seo, and Patan dialects.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#141414] border border-[#222] space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400">
                <Mic className="h-4 w-4" />
                <h4 className="text-xs font-bold text-[#F5F5F5]">{t("Speech & Orthography", "صوتی مواد اور املا")}</h4>
              </div>
              <p className="text-[11px] text-[#888] leading-normal">
                High-fidelity native speech collection, sub-second timestamps, and standardizing specialized Perso-Arabic Unicode glyphs (ڇ، څ، ݜ، ڙ، ݨ).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#141414] border border-[#222] space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-400">
                <Cpu className="h-4 w-4" />
                <h4 className="text-xs font-bold text-[#F5F5F5]">{t("AI & NLP Infrastructure", "AI اور NLP بنیادی ڈھانچہ")}</h4>
              </div>
              <p className="text-[11px] text-[#888] leading-normal">
                Whisper ASR dataset manifests, Alpaca/DPO/ShareGPT instruction tuning splits, and neural MTPE workflows for low-resource preservation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#141414] border border-[#222] space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400">
                <Users className="h-4 w-4" />
                <h4 className="text-xs font-bold text-[#F5F5F5]">{t("Community Leadership", "برادری کی قیادت")}</h4>
              </div>
              <p className="text-[11px] text-[#888] leading-normal">
                Mobilizing native elders, educators, writers, and youth contributors under strict human-verification and community consensus custody.
              </p>
            </div>
          </div>

          {/* Quick Snapshot of Evidence & Highlights */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#222] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9A66B]">
                Key Professional Evidence & Impact Highlights
              </h4>
              <button
                onClick={() => setActiveTab('evidence_ledger')}
                className="text-[11px] text-[#D4B582] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Explore Master Ledger</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#181818] border border-[#282828] space-y-1">
                <span className="text-[10px] text-[#777] uppercase font-bold block">Leadership</span>
                <p className="text-xs font-semibold text-[#EEE]">Project Director, FiKR&CD</p>
                <p className="text-[11px] text-[#888]">Initiative founder & institutional governance architect across 30 BALL milestones.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#181818] border border-[#282828] space-y-1">
                <span className="text-[10px] text-[#777] uppercase font-bold block">Linguistics</span>
                <p className="text-xs font-semibold text-[#EEE]">{t("Indus-Kohistani Specialist", "انڈس کوہستانی ماہر")}</p>
                <p className="text-[11px] text-[#888]">Digital orthography, 4-dialect taxonomy, 40 Hadith translation (~5,000 copies).</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#181818] border border-[#282828] space-y-1">
                <span className="text-[10px] text-[#777] uppercase font-bold block">{t("Experience", "تجربہ")}</span>
                <p className="text-xs font-semibold text-[#EEE]">{t("12+ Years Multilingual Practice", "12+ سالہ کثیر لسانی پیشہ ورانہ تجربہ")}</p>
                <p className="text-[11px] text-[#888]">CloudTrans 30k words sprint, ~500k words Saudi project, 1,500+ Shina videos audit.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab Content: Section 2 - My Work in Indus-Kohistani Language */}
      {activeTab === 'indus_work' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#C9A66B]" />
              <h3 className="text-lg font-bold text-[#F5F5F5]">My Work in Indus-Kohistani Language</h3>
            </div>
            <p className="text-xs text-[#888]">
              Comprehensive long-term documentation, preservation, digital corpus development, and language technology developed through FiKR&CD.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Database,
                title: 'Digital Corpus Development',
                desc: 'Standardized digital text corpus collection with ISO 639-3 (mvy) metadata, morpheme tagging, and aligned parallel sentence pairs across diverse cultural domains.'
              },
              {
                icon: BookOpen,
                title: 'Dictionary & Lexical Development',
                desc: 'Trilingual Indus-Kohistani–Urdu–English lexical databases featuring morphological roots, grammatical categories, phonetic pronunciations, and contextual idioms.'
              },
              {
                icon: Mic,
                title: 'Native-Speaker Data & Speech Collection',
                desc: 'High-fidelity audio recordings of native speakers, elders, and storytellers with sub-second timestamps, acoustic validation, and signal-to-noise quality scoring.'
              },
              {
                icon: Languages,
                title: 'Dialectal Documentation',
                desc: 'Systematic documentation across all 4 major regional dialects: Duber-Kandia, Jijal, Seo, and Patan, preserving phonological and lexical variations.'
              },
              {
                icon: Sparkles,
                title: 'Digital Orthography & Unicode',
                desc: 'Standardization and digital keyboard encoding of unique Indus-Kohistani Perso-Arabic letters (ڇ، څ، ݜ، ڙ، ݨ) ensuring seamless rendering across modern digital devices.'
              },
              {
                icon: Cpu,
                title: 'AI/NLP Resource Development',
                desc: 'Instruction-tuning splits (Alpaca, DPO, ShareGPT), Whisper ASR manifests, and MTPE neural translation pipelines tailored specifically for low-resource Dardic languages.'
              },
              {
                icon: FolderLock,
                title: 'Digital Preservation & Archival',
                desc: 'Immutable cryptographic checksums, open-standard data packaging (JSON, CSV, CoNLL-U, Audio WAV), and structured escrow for permanent linguistic survival.'
              },
              {
                icon: GraduationCap,
                title: 'Oral-Language Documentation & Grammar',
                desc: 'Morphological segmentation, ergative case structures, verb aspect systems, and syntactic parsing to support academic research and future pedagogical textbooks.'
              },
              {
                icon: Globe,
                title: 'Cultural & Linguistic Heritage Preservation',
                desc: 'Safeguarding oral folklore, traditional proverbs, botanical/toponymic nomenclature, and historical community narratives embedded in the native language.'
              }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="p-4 rounded-2xl bg-[#141414] border border-[#222] space-y-2">
                  <div className="flex items-center gap-2 text-[#C9A66B]">
                    <Icon className="h-4 w-4" />
                    <h4 className="text-xs font-bold text-[#F5F5F5]">{item.title}</h4>
                  </div>
                  <p className="text-xs text-[#888] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span className="text-[10px] text-[#777] uppercase font-bold tracking-wider block">Initiative Framework</span>
              <p className="text-xs font-bold text-[#D4B582]">
                FiKR&CD — Forum for Indus-Kohistani Research & Cultural Development
              </p>
            </div>
            <span className="text-xs text-[#888] font-mono">ISO 639-3: mvy • Dardic / Kohistany • Perso-Arabic Digital Script</span>
          </div>
        </div>
      )}

      {/* 6. Tab Content: Section 3 - Leadership & Project Development */}
      {activeTab === 'leadership' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#C9A66B]" />
              <h3 className="text-lg font-bold text-[#F5F5F5]">Leadership & Project Development</h3>
            </div>
            <p className="text-xs text-[#888]">
              Factual record of Saif Ullah's leadership in establishing FiKR&CD, project planning, and coordinating multi-stakeholder collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#141414] border border-[#222] space-y-3">
              <div className="flex items-center gap-2 text-[#C9A66B]">
                <ShieldCheck className="h-4 w-4" />
                <h4 className="text-sm font-bold text-[#F5F5F5]">Establishment & Project Direction of FiKR&CD</h4>
              </div>
              <p className="text-xs text-[#AAA] leading-relaxed">
                As Project Director, Saif Ullah established FiKR&CD from the ground up, directing planning and execution:
              </p>
              <ul className="space-y-2 text-xs text-[#888]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Conceived and executed the M1–M30 institutional data architecture, uniting RAW ingestion, human validation, and DERIVED engineering splits.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Formulated linguistic review protocols, consensus quorum rules, and dialect parity standards across Duber-Kandia, Jijal, Seo, and Patan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Established digital preservation infrastructure with immutable cryptographic checksums and open-access research exports.</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-[#141414] border border-[#222] space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Network className="h-4 w-4" />
                <h4 className="text-sm font-bold text-[#F5F5F5]">Coordination of Language Professionals & Community</h4>
              </div>
              <p className="text-xs text-[#AAA] leading-relaxed">
                Coordinating multi-stakeholder collaboration uniting native speakers, elders, and specialists:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  'Native Speakers & Elders',
                  'Local Educators & Teachers',
                  'Translators & Interpreters',
                  'Poets & Native Writers',
                  'Volunteer Transcribers',
                  'Linguistic Reviewers',
                  'Research Collaborators',
                  'Language Tech Practitioners'
                ].map((item, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-[#1A1A1A] border border-[#262626] text-[11px] text-[#CCC] flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C9A66B]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab Content: Section 4 - Master Evidence Ledger */}
      {activeTab === 'evidence_ledger' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#C9A66B]" />
                <h3 className="text-lg font-bold text-[#F5F5F5]">Master Evidence Ledger</h3>
              </div>
              <p className="text-xs text-[#888]">
                Structured factual records mapped by: Activity → Role → Action → Result/Impact → Evidence
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              {/* Category Filter */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-xs sm:max-w-none">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'leadership', label: 'Leadership' },
                  { id: 'professional', label: 'Professional' },
                  { id: 'community', label: 'Community' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedLedgerCategory(cat.id as EvidenceFilterCategory)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      selectedLedgerCategory === cat.id
                        ? 'bg-[#C9A66B]/20 text-[#D4B582] border border-[#C9A66B]/50'
                        : 'bg-[#161616] text-[#777] hover:text-[#CCC]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#666]" />
                <input
                  type="text"
                  placeholder="Filter evidence..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 rounded-lg bg-[#141414] border border-[#262626] text-xs text-[#EEE] placeholder-[#666] focus:outline-none focus:border-[#C9A66B] w-36 sm:w-44"
                />
              </div>
            </div>
          </div>

          {/* Evidence Cards */}
          <div className="space-y-4">
            {filteredLedger.map((item) => (
              <div key={item.id} className="p-5 rounded-2xl bg-[#141414] border border-[#222] space-y-3 hover:border-[#333] transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F1F1F] pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-[#C9A66B] tracking-wider block">
                        {item.categoryLabel}
                      </span>
                      <span className="text-[10px] text-[#666] font-mono">• {item.date}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#F5F5F5] mt-0.5">{item.activity}</h4>
                    <p className="text-xs text-[#999]">{item.organizationProject}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-[10px] font-mono text-emerald-400 self-start sm:self-center">
                    Role: {item.role}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#777] uppercase font-bold block mb-0.5">Situation / Challenge</span>
                    <p className="text-[#AAA] leading-relaxed">{item.situationChallenge}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777] uppercase font-bold block mb-0.5">Action Personally Taken</span>
                    <p className="text-[#CCC] leading-relaxed">{item.action}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1C1C1C] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#777] uppercase font-bold block mb-0.5">Result & Measurable Impact</span>
                    <p className="text-[#D4B582] leading-relaxed font-medium">{item.measurableImpact}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777] uppercase font-bold block mb-0.5">Verifiable Evidence Reference</span>
                    <p className="text-[#AAA] font-mono text-[11px] leading-relaxed">{item.evidenceReference}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Tab Content: Section 5 - Work Experience & Hours */}
      {activeTab === 'work_experience' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#C9A66B]" />
              <h3 className="text-lg font-bold text-[#F5F5F5]">Work Experience Evidence Records</h3>
            </div>
            <p className="text-xs text-[#888]">
              Factual records documenting organizational tenure, weekly hours, post-undergraduate status, and verifiable underlying evidence.
            </p>
          </div>

          <div className="space-y-3.5">
            {WORK_EXPERIENCE_RECORDS.map((exp) => (
              <div key={exp.id} className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#222] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#1F1F1F] pb-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#F5F5F5]">{exp.position}</h4>
                    <p className="text-xs font-semibold text-[#C9A66B]">{exp.organization}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-[11px] font-mono text-[#DDD]">
                      {exp.startDate} – {exp.endDate}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#C9A66B]/15 border border-[#C9A66B]/30 text-[11px] font-bold text-[#D4B582]">
                      {exp.hoursPerWeek} hrs/week
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#777] uppercase font-bold block mb-0.5">Calculated Scope Note</span>
                    <p className="text-[#AAA] leading-relaxed">{exp.calculatedHoursNote}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777] uppercase font-bold block mb-0.5">Supporting Evidence Documentation</span>
                    <p className="text-[#888] font-mono text-[11px] leading-relaxed">{exp.supportingEvidence}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1A1A1A] flex flex-wrap gap-1.5">
                  {exp.scopeHighlights.map((hl, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-[#161616] border border-[#262626] text-[10px] text-[#999]">
                      ✓ {hl}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] space-y-1.5 text-xs text-[#AAA]">
            <div className="flex items-center gap-2 text-[#C9A66B]">
              <Info className="h-4 w-4" />
              <strong className="text-[#F5F5F5]">Auditability Note on Work Experience</strong>
            </div>
            <p className="leading-relaxed">
              Employment records preserve specific dates, hours per week, and primary documentation. For overlapping periods (e.g., simultaneous public sector service, directorship, and specialist contracts), hours represent independent verifiable engagements without artificial inflation.
            </p>
          </div>
        </div>
      )}

      {/* 9. Tab Content: Section 6 - Relationship Building Records */}
      {activeTab === 'relationships' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-[#C9A66B]" />
              <h3 className="text-lg font-bold text-[#F5F5F5]">Relationship-Building Records</h3>
            </div>
            <p className="text-xs text-[#888]">
              Structured framework documenting engagement: Who → Why → Action → Collaboration → Result
            </p>
          </div>

          <div className="space-y-4">
            {RELATIONSHIP_RECORDS.map((rel) => (
              <div key={rel.id} className="p-5 rounded-2xl bg-[#141414] border border-[#222] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#1F1F1F] pb-2">
                  <h4 className="text-sm font-bold text-[#F5F5F5]">{rel.who}</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-[10px] font-mono text-[#C9A66B] self-start sm:self-center">
                    {rel.stakeholderType}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#777] uppercase font-bold block mb-0.5">Purpose (Why)</span>
                    <p className="text-[#AAA] leading-relaxed">{rel.why}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777] uppercase font-bold block mb-0.5">Action Personally Taken</span>
                    <p className="text-[#CCC] leading-relaxed">{rel.action}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1C1C1C] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#777] uppercase font-bold block mb-0.5">Collaboration Method</span>
                    <p className="text-[#AAA] leading-relaxed">{rel.collaboration}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-0.5">Outcome / Result</span>
                    <p className="text-[#D4B582] leading-relaxed font-medium">{rel.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. Tab Content: Section 7 - Leadership Story Records */}
      {activeTab === 'leadership_stories' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#C9A66B]" />
              <h3 className="text-lg font-bold text-[#F5F5F5]">Leadership Story Evidence Records</h3>
            </div>
            <p className="text-xs text-[#888]">
              Factual case studies structured as: Challenge → Decision → Mobilisation → Team → Quality System → Result
            </p>
          </div>

          <div className="space-y-6">
            {LEADERSHIP_STORY_RECORDS.map((story) => (
              <div key={story.id} className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#222] space-y-4">
                <div className="border-b border-[#1F1F1F] pb-3">
                  <span className="text-[10px] uppercase font-bold text-[#C9A66B] tracking-wider block">
                    {story.domain}
                  </span>
                  <h4 className="text-base font-bold text-[#F5F5F5] mt-0.5">{story.title}</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#181818] border border-[#242424] space-y-1">
                    <span className="text-[10px] text-[#888] uppercase font-bold block">1. The Challenge</span>
                    <p className="text-[#CCC] leading-relaxed">{story.challenge}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#181818] border border-[#242424] space-y-1">
                    <span className="text-[10px] text-[#888] uppercase font-bold block">2. Strategic Decision</span>
                    <p className="text-[#CCC] leading-relaxed">{story.decision}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#181818] border border-[#242424] space-y-1">
                    <span className="text-[10px] text-[#888] uppercase font-bold block">3. Mobilisation & Network</span>
                    <p className="text-[#CCC] leading-relaxed">{story.mobilisation}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#181818] border border-[#242424] space-y-1">
                    <span className="text-[10px] text-[#888] uppercase font-bold block">4. Team Structure</span>
                    <p className="text-[#CCC] leading-relaxed">{story.team}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#181818] border border-[#242424] space-y-1 text-xs">
                  <span className="text-[10px] text-[#888] uppercase font-bold block">5. Quality Assurance System</span>
                  <p className="text-[#CCC] leading-relaxed">{story.qualitySystem}</p>
                </div>

                <div className="p-4 rounded-xl bg-[#161616] border border-[#C9A66B]/30 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">6. Result & Verified Outcome</span>
                    <span className="text-[10px] text-[#666] font-mono">Proof: {story.verifiableProof}</span>
                  </div>
                  <p className="text-[#D4B582] leading-relaxed font-semibold">{story.result}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 11. Tab Content: Section 8 - Career Plan Record */}
      {activeTab === 'career_plan' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#C9A66B]" />
              <h3 className="text-lg font-bold text-[#F5F5F5]">Career Plan Record (Short, Medium & Long Term)</h3>
            </div>
            <p className="text-xs text-[#888]">
              Factual planning records articulating the intended development of language technology and digital preservation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#141414] border border-[#222] space-y-3">
              <div className="flex items-center gap-2 text-[#C9A66B]">
                <Clock className="h-4 w-4" />
                <h4 className="text-sm font-bold text-[#F5F5F5]">Short Term (1–3 Years)</h4>
              </div>
              <p className="text-xs text-[#AAA] leading-relaxed">
                Return to Pakistan after completing advanced postgraduate study in the UK:
              </p>
              <ul className="space-y-2 text-xs text-[#888]">
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C9A66B] shrink-0 mt-1.5" />
                  <span>Apply advanced computational linguistics and speech technology skills directly to FiKR&CD.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C9A66B] shrink-0 mt-1.5" />
                  <span>Strengthen professional translation and localization services in Pakistan through CloudTrans.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C9A66B] shrink-0 mt-1.5" />
                  <span>Expand structured digital language resources for Indus-Kohistani and regional Dardic languages.</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-[#141414] border border-[#222] space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Layers className="h-4 w-4" />
                <h4 className="text-sm font-bold text-[#F5F5F5]">Medium Term (3–5 Years)</h4>
              </div>
              <p className="text-xs text-[#AAA] leading-relaxed">
                Consolidate and publish comprehensive digital language infrastructure:
              </p>
              <ul className="space-y-2 text-xs text-[#888]">
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                  <span>Deploy interactive trilingual digital dictionary, lexical databases, and morphosyntactic parser.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                  <span>Train and deploy bespoke automatic speech recognition (ASR) models for unwritten Dardic speech.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                  <span>Build local capacity by training native youth, educators, and transcribers in digital language tools.</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-[#141414] border border-[#222] space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Globe className="h-4 w-4" />
                <h4 className="text-sm font-bold text-[#F5F5F5]">Long Term (5–10+ Years)</h4>
              </div>
              <p className="text-xs text-[#AAA] leading-relaxed">
                Scalable ecosystem uniting Language Technology + Digital Preservation + Community Development:
              </p>
              <ul className="space-y-2 text-xs text-[#888]">
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                  <span>Scale the FiKR&CD digital preservation model across other endangered Pakistani languages.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                  <span>Advise national education bodies, international linguistic archives, and NLP research institutes.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                  <span>Ensure long-term digital survival and literacy rights for marginalized linguistic communities.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 12. Tab Content: Section 9 - Three UK Course Research Records */}
      {activeTab === 'uk_courses' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#C9A66B]" />
              <h3 className="text-lg font-bold text-[#F5F5F5]">Three UK Course Research Records</h3>
            </div>
            <p className="text-xs text-[#888]">
              Structured academic research identifying potential UK master's programs relevant to speech technology, NLP, and documentation.
            </p>
          </div>

          <div className="space-y-6">
            {UK_COURSE_RECORDS.map((course) => (
              <div key={course.id} className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#222] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F1F1F] pb-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#C9A66B]/15 text-[#D4B582] border border-[#C9A66B]/30 text-[10px] font-bold uppercase tracking-wider inline-block mb-1">
                      {course.choice}
                    </span>
                    <h4 className="text-base font-bold text-[#F5F5F5]">{course.exactDegreeTitle}</h4>
                    <p className="text-xs font-semibold text-[#AAA]">{course.university} • {course.courseDuration}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <span className="text-[10px] text-[#777] uppercase font-bold block">Relevant Modules</span>
                    <div className="space-y-1">
                      {course.relevantModules.map((mod, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[#CCC]">
                          <Check className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{mod}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-[#777] uppercase font-bold block">Key Research Areas</span>
                    <div className="space-y-1">
                      {course.researchAreas.map((res, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[#CCC]">
                          <ChevronRight className="h-3 w-3 text-[#C9A66B] shrink-0 mt-0.5" />
                          <span>{res}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#1C1C1C] text-xs">
                  <div>
                    <span className="text-[10px] text-[#777] uppercase font-bold block mb-0.5">Why Relevant to Existing Experience</span>
                    <p className="text-[#AAA] leading-relaxed">{course.whyRelevantToExistingExp}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-0.5">Application to FiKR&CD</span>
                    <p className="text-[#D4B582] leading-relaxed">{course.applicationToFikrcd}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 13. Tab Content: Section 10 - Course -> Skills -> Impact Map */}
      {activeTab === 'course_impact_map' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#C9A66B]" />
              <h3 className="text-lg font-bold text-[#F5F5F5]">Course → Skills → Impact Map</h3>
            </div>
            <p className="text-xs text-[#888]">
              Planning matrix linking: Existing Experience → Skill Gap → UK Course Contribution → FiKR&CD Application → Future Impact
            </p>
          </div>

          <div className="space-y-4">
            {COURSE_SKILL_IMPACT_MAP.map((mapItem, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#141414] border border-[#222] space-y-3">
                <div className="border-b border-[#1F1F1F] pb-2">
                  <span className="text-[10px] text-[#777] uppercase font-bold block">1. Existing Experience Baseline</span>
                  <h4 className="text-xs font-bold text-[#F5F5F5]">{mapItem.existingExperience}</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#181818] border border-[#242424] space-y-1">
                    <span className="text-[10px] text-[#888] uppercase font-bold block">2. Identified Skill Gap</span>
                    <p className="text-[#AAA] leading-relaxed">{mapItem.skillGap}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#181818] border border-[#242424] space-y-1">
                    <span className="text-[10px] text-[#C9A66B] uppercase font-bold block">3. UK Course Contribution</span>
                    <p className="text-[#CCC] leading-relaxed">{mapItem.ukCourseContribution}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1C1C1C] text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-0.5">4. Application to FiKR&CD</span>
                    <p className="text-[#D4B582] leading-relaxed">{mapItem.fikrcdApplication}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-400 uppercase font-bold block mb-0.5">5. Future Sustainable Impact</span>
                    <p className="text-[#DDD] leading-relaxed">{mapItem.futureImpact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 14. Tab Content: Section 11 - Career Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#C9A66B]" />
              <h3 className="text-lg font-bold text-[#F5F5F5]">{t("Career Evidence Timeline", "پیشہ ورانہ شواہد کی ٹائم لائن")}</h3>
            </div>
            <p className="text-xs text-[#888]">
              Chronological progression showing development across professional translation, documentation, leadership, and language technology.
            </p>
          </div>

          <div className="relative border-l-2 border-[#262626] ml-3 sm:ml-4 pl-4 sm:pl-6 space-y-6">
            {CAREER_TIMELINE.map((event, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-[23px] sm:-left-[31px] top-1 h-3.5 w-3.5 rounded-full bg-[#C9A66B] border-2 border-[#0C0C0C] group-hover:scale-125 transition" />
                <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#222] space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-mono font-bold text-[#C9A66B]">{event.period}</span>
                    <span className="text-[11px] text-[#777] font-semibold">{event.stage}</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#F5F5F5]">{event.title}</h4>
                  <p className="text-xs text-[#AAA] leading-relaxed">{event.description}</p>
                  <div className="pt-2 border-t border-[#1C1C1C] space-y-1">
                    {event.highlights.map((hl, hIdx) => (
                      <div key={hIdx} className="flex items-center gap-1.5 text-[11px] text-[#888]">
                        <ChevronRight className="h-3 w-3 text-[#C9A66B] shrink-0" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 15. Tab Content: Section 12 - Evidence Document Index */}
      {activeTab === 'document_index' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#C9A66B]" />
                <h3 className="text-lg font-bold text-[#F5F5F5]">{t("Evidence Document Index", "شواہد کی دستاویزات کا اشاریہ")}</h3>
              </div>
              <p className="text-xs text-[#888]">
                Confidential index and reference system cataloging primary documentation and verification artifacts.
              </p>
            </div>

            {/* Document Filter */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Documents' },
                { id: 'Employment & Appointment', label: 'Employment' },
                { id: 'Client & Project Record', label: 'Client Projects' },
                { id: 'Community & Linguistic', label: 'Community & Books' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setDocCategoryFilter(filter.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    docCategoryFilter === filter.id
                      ? 'bg-[#C9A66B]/20 text-[#D4B582] border border-[#C9A66B]/50'
                      : 'bg-[#161616] text-[#777] hover:text-[#CCC]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#222] space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-[#1F1F1F] pb-2">
                  <span className="text-[10px] font-mono text-[#C9A66B] font-bold">{doc.referenceCode}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-[9px] font-mono text-[#777]">
                    {doc.classification}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#F5F5F5]">{doc.title}</h4>
                  <p className="text-[11px] text-[#C9A66B] mt-0.5">{doc.issuingParty} • {doc.timeframe}</p>
                </div>

                <p className="text-xs text-[#888] leading-relaxed">{doc.description}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] text-xs text-[#777] flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#C9A66B] shrink-0" />
            <span>
              This index maintains factual citation codes for institutional verification while keeping private personal documents securely archived.
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (!showCardWrapper) {
    return content;
  }

  return (
    <div className="rounded-3xl bg-[#111111] p-6 sm:p-8 shadow-md border border-[#222]">
      {content}
    </div>
  );
};
