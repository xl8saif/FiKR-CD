import { Contribution, RewardConfig, Milestone, UserProfile, SpecializedIkCharacter, DialectOption } from '../types';

export const OFFICIAL_IK_SPECIAL_CHARS: SpecializedIkCharacter[] = [
  {
    char: 'ڇ',
    name: 'Tcheh',
    unicode: 'U+0686',
    description: 'Tcheh / چھے (Voiceless palato-alveolar affricate)'
  },
  {
    char: 'څ',
    name: 'Tse',
    unicode: 'U+0685',
    description: 'Tse / څے (Voiceless alveolar affricate)'
  },
  {
    char: 'ݜ',
    name: 'Seen with 4 dots',
    unicode: 'U+075C',
    description: 'Seen with 4 dots / ݜے (Voiceless retroflex sibilant)'
  },
  {
    char: 'ڙ',
    name: 'Reh with 4 dots',
    unicode: 'U+0699',
    description: 'Reh with 4 dots / ڙے (Retroflex flap/tap)'
  },
  {
    char: 'ݨ',
    name: 'Noon with small tah',
    unicode: 'U+0768',
    description: 'Noon with small tah / ݨے (Retroflex nasal)'
  }
];

export const SPECIAL_IK_CHARS = OFFICIAL_IK_SPECIAL_CHARS;

export const DIALECTS: readonly DialectOption[] = [
  { 
    id: 'duber_kandia', 
    nameUr: 'دوبیر-کندیا بولی — معیاری بولی', 
    nameEn: 'Duber-Kandia Variety — Standard (معیاری)', 
    nameIK: 'ڈوبیر-کندیا',
    isDefault: true,
    isStandard: true
  },
  { 
    id: 'seo_patan', 
    nameUr: 'سیو-پٹن بولی', 
    nameEn: 'Seo-Patan Variety', 
    nameIK: 'سیو-پٹن' 
  },
  { 
    id: 'jijal_kayal', 
    nameUr: 'جیجال-کیال بولی', 
    nameEn: 'Jijal-Kayal Variety', 
    nameIK: 'جیجال-کیال' 
  },
  { 
    id: 'ranolia', 
    nameUr: 'رانولیا بولی', 
    nameEn: 'Ranolia Variety', 
    nameIK: 'رانولیا' 
  },
  { 
    id: 'bankad', 
    nameUr: 'بنکڈ بولی', 
    nameEn: 'Bankad Variety', 
    nameIK: 'بنکڈ' 
  }
];

export const DEFAULT_DIALECT_ID = 'duber_kandia';
export const DEFAULT_DIALECT_NAME_UR = 'دوبیر-کندیا بولی — معیاری بولی';

export function getDialectDisplayName(dialectStr?: string): string {
  if (!dialectStr) return DEFAULT_DIALECT_NAME_UR;
  const match = DIALECTS.find(
    d => d.id === dialectStr || 
         d.nameUr === dialectStr || 
         d.nameEn === dialectStr || 
         d.nameIK === dialectStr
  );
  if (match) return match.nameUr;
  
  // Historical identifier display fallback (without altering RAW records)
  const lower = dialectStr.toLowerCase();
  if (lower.includes('duber') || lower.includes('kandia')) return 'دوبیر-کندیا بولی — معیاری بولی';
  if (lower.includes('seo') || lower.includes('patan')) return 'سیو-پٹن بولی';
  if (lower.includes('jijal') || lower.includes('kayal')) return 'جیجال-کیال بولی';
  if (lower.includes('ranolia')) return 'رانولیا بولی';
  if (lower.includes('bankad')) return 'بنکڈ بولی';

  return dialectStr;
}

export const CONTRIBUTION_CATEGORIES = [
  { id: 'word', nameEn: 'Lexicon / Word', nameUr: 'لغت / لفظ', nameIK: 'لَفْظ', descEn: 'Lexical entry, vocabulary, noun/verb/adjective with grammatical metadata' },
  { id: 'sentence', nameEn: 'Sentence', nameUr: 'جملہ', nameIK: 'جُمْلَہ', descEn: 'Natural spoken or written sentence in authentic Indus-Kohistani syntax' },
  { id: 'proverb', nameEn: 'Proverb', nameUr: 'ضرب المثل / کہاوت', nameIK: 'مَثَل', descEn: 'Traditional ancestral proverb, moral teaching, or ancestral wisdom saying' },
  { id: 'idiom', nameEn: 'Idiom', nameUr: 'محاورہ / اصطلاح', nameIK: 'مُحَاوَرَہ', descEn: 'Dialectal figurative phrase, idiomatic metaphor, or specialized expression' },
  { id: 'cultural_expression', nameEn: 'Folk / Cultural Expression', nameUr: 'ثقافتی و لوک اصطلاح', nameIK: 'ثَقَافَتِی رَسْم', descEn: 'Customary heritage term, pastoral practice, seasonal ritual, or folklore lore' },
  { id: 'poetry', nameEn: 'Poetry', nameUr: 'شاعری / بیت', nameIK: 'بَیْت / شَاعِرِی', descEn: 'Traditional Indus-Kohistani verse, oral pastoral ballad, or couplet' }
] as const;

export const SEMANTIC_DOMAINS = [
  { id: 'pastoralism', nameEn: 'Pastoralism & Livestock', nameUr: 'مویشی بانی و چرواہا کلچر', nameIK: 'مال مالدارِی' },
  { id: 'nature_geography', nameEn: 'Nature & Geography', nameUr: 'قدرت و جغرافیہ', nameIK: 'قُدْرَت اَں دُنِیَا' },
  { id: 'kinship', nameEn: 'Kinship & Social Relations', nameUr: 'رشتہ داری و معاشرت', nameIK: 'خَوِیْشِی اَں سَنْگَت' },
  { id: 'food_agriculture', nameEn: 'Food & Agriculture', nameUr: 'خوراک و زراعت', nameIK: 'خُورَاك اَں زَمِیْنْدَارِی' },
  { id: 'craft_material', nameEn: 'Material Culture & Traditional Craft', nameUr: 'دستکاری و اشیاء', nameIK: 'دَسْتْكَارِی' },
  { id: 'body_health', nameEn: 'Human Body & Health', nameUr: 'انسانی جسم و صحت', nameIK: 'جِسْم اَں صِحَت' },
  { id: 'wisdom_folklore', nameEn: 'Wisdom, Proverbs & Folklore', nameUr: 'حکمت، کہاوتیں و لوک روایات', nameIK: 'حِکْمَت اَں رَسْم' },
  { id: 'daily_life', nameEn: 'Daily Life & Household', nameUr: 'روزمرہ زندگی و گھریلو معاملات', nameIK: 'رُوْزَمَرَّہ زِنْدَگِی' },
  { id: 'poetry_ballads', nameEn: 'Oral Ballads & Poetry', nameUr: 'زبانی شاعری و لوک گیت', nameIK: 'شَاعِرِی اَں بَیْت' }
] as const;

export const CONTRIBUTION_SOURCES = [
  { id: 'elder_interview', labelEn: 'Elder Interview', labelUr: 'بزرگ سے انٹرویو', descEn: 'Recorded directly from a respected village elder / community knowledge keeper' },
  { id: 'oral_tradition', labelEn: 'Oral Tradition / Ancestral Memory', labelUr: 'زبانی روایات / آبائی یادداشت', descEn: 'Passed down orally through generational family heritage' },
  { id: 'native_speaker', labelEn: 'Native Speaker Everyday Speech', labelUr: 'مقامی بول چال', descEn: 'Observed or spoken in natural daily native discourse' },
  { id: 'fieldwork', labelEn: 'Fieldwork / Linguistic Documentation', labelUr: 'میدانی لسانی تحقیق', descEn: 'Collected during FiKR&CD on-ground dialectological documentation' },
  { id: 'folklore_archive', labelEn: 'Folklore & Traditional Songs', labelUr: 'لوک گیت و لوک کہانیاں', descEn: 'Sourced from traditional Kohistani storytelling or historic folk songs' },
  { id: 'personal_knowledge', labelEn: 'Personal Linguistic Knowledge', labelUr: 'ذاتی لسانی واقفیت', descEn: 'Native linguistic competence of the contributing speaker' }
] as const;

export const INITIAL_REWARD_CONFIG: RewardConfig = {
  wordPoints: 10,
  wordRewardPkr: 50,
  sentencePoints: 25,
  sentenceRewardPkr: 120,
  expressionPoints: 40,
  expressionRewardPkr: 200,
  audioBonusPoints: 15,
  audioBonusRewardPkr: 80,
};

export const MILESTONES: Milestone[] = [
  {
    id: 'bronze',
    nameEn: 'Bronze Contributor',
    nameUrdu: 'کانسی اعزاز',
    threshold: 25,
    tier: 'bronze',
    badgeIcon: 'Award',
    descriptionEn: '25 verified linguistic contributions to the IK preservation corpus.',
    descriptionUrdu: 'انڈس کوہستانی محفوظ ذخیرے میں 25 تصدیق شدہ اندراجات۔'
  },
  {
    id: 'silver',
    nameEn: 'Silver Contributor',
    nameUrdu: 'چاندی اعزاز',
    threshold: 100,
    tier: 'silver',
    badgeIcon: 'ShieldCheck',
    descriptionEn: '100 verified linguistic contributions documenting the language.',
    descriptionUrdu: 'زبان کی دستاویزی کے لیے 100 تصدیق شدہ اندراجات۔'
  },
  {
    id: 'gold',
    nameEn: 'Gold Contributor',
    nameUrdu: 'سونے کا اعزاز',
    threshold: 250,
    tier: 'gold',
    badgeIcon: 'Sparkles',
    descriptionEn: '250 verified contributions enriching text and audio preservation.',
    descriptionUrdu: 'متن اور صوتی ذخیرے کو مالامال کرنے کے لیے 250 تصدیق شدہ خدمات۔'
  },
  {
    id: 'platinum',
    nameEn: 'Platinum Contributor',
    nameUrdu: 'پلاٹینم اعزاز',
    threshold: 500,
    tier: 'platinum',
    badgeIcon: 'Crown',
    descriptionEn: '500 verified contributions establishing high-density linguistic data.',
    descriptionUrdu: '500 تصدیق شدہ اندراجات کے ذریعے عظیم لسانی خدمت۔'
  },
  {
    id: 'guardian',
    nameEn: 'Language Guardian',
    nameUrdu: 'محافظِ زبان',
    threshold: 1000,
    tier: 'guardian',
    badgeIcon: 'Flame',
    descriptionEn: '1,000 verified contributions — Master custodian of Indus-Kohistani heritage.',
    descriptionUrdu: '1,000 تصدیق شدہ اندراجات — انڈس کوہستانی زبان اور ورثے کے عظیم محافظ۔'
  }
];

export const DEMO_USERS: UserProfile[] = [
  { id: 'saif-director', name: 'Saif Ullah', role: 'project_director', dialect: 'duber_kandia', email: 'xl8.saif@gmail.com', linkedIn: 'https://www.linkedin.com/in/xl8saif' },
  { id: 'user-advisor', name: 'Dr. Hussain Ahmad Faizy', role: 'linguistic_advisor', dialect: 'duber_kandia', email: 'info@fikrcd.org' },
  { id: 'user-senior-rev', name: 'Mujeeb ul Haq Jailani', role: 'senior_reviewer', dialect: 'duber_kandia', email: 'info@fikrcd.org' },
  { id: 'user-reviewer', name: 'Rasheed Ahmad Faizy', role: 'reviewer', dialect: 'duber_kandia', email: 'info@fikrcd.org' },
  { id: 'user-contributor', name: 'Muhammad Iqbal Abasindi', role: 'contributor', dialect: 'duber_kandia', email: 'info@fikrcd.org' },
  { id: 'user-admin', name: 'FiKR&CD Admin Team', role: 'administrator', dialect: 'duber_kandia', email: 'admin@fikrcd.org' }
];

export const INITIAL_DEMO_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'demo-ik-001',
    isDemoData: true,
    type: 'word',
    raw: {
      ikText: 'مُوش',
      ikTranscription: 'mūṣ',
      urduMeaning: 'مرد / انسان',
      englishMeaning: 'Man / Human being',
      contributorName: 'Muhammad Saeed',
      contributorId: 'user-contributor',
      dialect: 'seo',
      submittedAt: '2026-08-10T09:15:00Z',
      type: 'word',
      posTag: 'noun',
      culturalContext: 'Fundamental word for human / adult male in Indus-Kohistani.'
    },
    verified: {
      status: 'approved',
      verifiedAt: '2026-08-11T14:20:00Z',
      reviewedBy: 'Mirza Khan',
      reviewerRole: 'reviewer',
      reviewNotes: 'Standard lexical item. Phonetics and orthography verified for Seo variety.',
      verifiedDialect: 'seo',
      verifiedPosTag: 'noun',
      reviewHistory: [
        {
          id: 'rh-1',
          reviewerName: 'Muhammad Saeed',
          reviewerRole: 'contributor',
          timestamp: '2026-08-10T09:15:00Z',
          action: 'submitted',
          comments: 'Initial submission of core lexical term.'
        },
        {
          id: 'rh-2',
          reviewerName: 'Mirza Khan',
          reviewerRole: 'reviewer',
          timestamp: '2026-08-11T14:20:00Z',
          action: 'approved',
          comments: 'Approved without changes. Ready for lexicon corpus.'
        }
      ]
    },
    derived: {
      tokenCount: 1,
      charCount: 4,
      hasAudio: false,
      hasUrdu: true,
      hasEnglish: true,
      isCorpusEligible: true,
      isSpeechCorpusEligible: false,
      calculatedPoints: 10,
      calculatedRewardPkr: 50,
      derivedAt: '2026-08-11T14:20:00Z'
    }
  },
  {
    id: 'demo-ik-002',
    isDemoData: true,
    type: 'sentence',
    raw: {
      ikText: 'مُوں پٹنَئی بَٹْھ کُشتَنی وَئیں پِم',
      ikTranscription: 'mū̃ Paṭanāī baṭh kuštanī wãĩ pim',
      urduMeaning: 'میں پٹن کا صاف پہاڑی پانی پیتا ہوں',
      englishMeaning: 'I drink the clean mountain spring water of Patan',
      contributorName: 'Muhammad Saeed',
      contributorId: 'user-contributor',
      dialect: 'patan',
      submittedAt: '2026-08-12T11:45:00Z',
      type: 'sentence',
      culturalContext: 'Used when referencing pristine mountain spring water in Kohistan.'
    },
    verified: {
      status: 'corrected',
      verifiedAt: '2026-08-13T16:00:00Z',
      reviewedBy: 'Abdul Qadir Kohistani',
      reviewerRole: 'senior_reviewer',
      reviewNotes: 'Corrected diacritics on nasal vowel (مُوں -> مُوۡں) and refined English translation nuances.',
      correctedIkText: 'مُوۡں پٹنَئی بَٹْھ کُشتَنی وَئیں پِم',
      correctedTranscription: 'mū̃ Paṭanāī baṭh kuštanī wãĩ pim',
      correctedUrduMeaning: 'میں پٹن کا صاف پہاڑی پانی پیتا ہوں',
      correctedEnglishMeaning: 'I drink the pure mountain spring water from Patan',
      verifiedDialect: 'patan',
      reviewHistory: [
        {
          id: 'rh-3',
          reviewerName: 'Muhammad Saeed',
          reviewerRole: 'contributor',
          timestamp: '2026-08-12T11:45:00Z',
          action: 'submitted'
        },
        {
          id: 'rh-4',
          reviewerName: 'Abdul Qadir Kohistani',
          reviewerRole: 'senior_reviewer',
          timestamp: '2026-08-13T16:00:00Z',
          action: 'corrected',
          comments: 'Normalized orthography for nasal markers while preserving raw submission.',
          correctionsMade: {
            ikText: 'مُوۡں پٹنَئی بَٹْھ کُشتَنی وَئیں پِم',
            englishMeaning: 'I drink the pure mountain spring water from Patan'
          }
        }
      ]
    },
    derived: {
      tokenCount: 6,
      charCount: 32,
      hasAudio: false,
      hasUrdu: true,
      hasEnglish: true,
      isCorpusEligible: true,
      isSpeechCorpusEligible: false,
      calculatedPoints: 25,
      calculatedRewardPkr: 120,
      derivedAt: '2026-08-13T16:00:00Z'
    }
  },
  {
    id: 'demo-ik-003',
    isDemoData: true,
    type: 'cultural_expression',
    raw: {
      ikText: 'دَریَہ کَٹھَہ تُھو تَمے بَڈَہ لَہُو نَہ بَئے',
      ikTranscription: 'Daryah kaṭhah thū tame baḍah lahū na baye',
      urduMeaning: 'دریا کنارے اگر لکڑی ہے تو بڑا سیلاب بھی اسے بہا نہیں سکتا (اتفاق میں برکت ہے)',
      englishMeaning: 'A deeply rooted timber at the riverbank withstands the greatest flood (Unity is strength)',
      contributorName: 'Muhammad Saeed',
      contributorId: 'user-contributor',
      dialect: 'duber',
      submittedAt: '2026-08-15T15:30:00Z',
      type: 'cultural_expression',
      culturalContext: 'A classical Kohistani elders proverb emphasizing tribal solidarity against external hardships.'
    },
    verified: {
      status: 'approved',
      verifiedAt: '2026-08-16T10:10:00Z',
      reviewedBy: 'Saif Ullah',
      reviewerRole: 'project_director',
      reviewNotes: 'Exceptional oral heritage recording. High value for cultural expressions corpus.',
      verifiedDialect: 'duber',
      reviewHistory: [
        {
          id: 'rh-5',
          reviewerName: 'Muhammad Saeed',
          reviewerRole: 'contributor',
          timestamp: '2026-08-15T15:30:00Z',
          action: 'submitted'
        },
        {
          id: 'rh-6',
          reviewerName: 'Saif Ullah',
          reviewerRole: 'project_director',
          timestamp: '2026-08-16T10:10:00Z',
          action: 'approved',
          comments: 'High priority cultural expression. Authenticated with Duber elders.'
        }
      ]
    },
    derived: {
      tokenCount: 8,
      charCount: 39,
      hasAudio: false,
      hasUrdu: true,
      hasEnglish: true,
      isCorpusEligible: true,
      isSpeechCorpusEligible: false,
      calculatedPoints: 40,
      calculatedRewardPkr: 200,
      derivedAt: '2026-08-16T10:10:00Z'
    }
  },
  {
    id: 'demo-ik-004',
    isDemoData: true,
    type: 'word',
    raw: {
      ikText: 'گَرانْڈ',
      ikTranscription: 'grāṇḍ',
      urduMeaning: 'اونچا پہاڑی ڈھلوان / چٹان',
      englishMeaning: 'Steep mountain slope / cliff',
      contributorName: 'Muhammad Saeed',
      contributorId: 'user-contributor',
      dialect: 'jijal',
      submittedAt: '2026-08-18T08:00:00Z',
      type: 'word',
      posTag: 'noun',
      culturalContext: 'Topographical term describing dangerous precipices in higher valleys.'
    },
    verified: {
      status: 'pending_review',
      reviewHistory: [
        {
          id: 'rh-7',
          reviewerName: 'Muhammad Saeed',
          reviewerRole: 'contributor',
          timestamp: '2026-08-18T08:00:00Z',
          action: 'submitted',
          comments: 'Submitted awaiting dialect review by Jijal team.'
        }
      ]
    },
    derived: {
      tokenCount: 1,
      charCount: 6,
      hasAudio: false,
      hasUrdu: true,
      hasEnglish: true,
      isCorpusEligible: false, // Pending items do not enter main corpus
      isSpeechCorpusEligible: false,
      calculatedPoints: 0,     // Rewards calculate ONLY when verified
      calculatedRewardPkr: 0,
      derivedAt: '2026-08-18T08:00:00Z'
    }
  },
  {
    id: 'demo-ik-005',
    isDemoData: true,
    type: 'sentence',
    raw: {
      ikText: 'اَسُو گَاؤں بَزَن بَٹْھ خْوَش تُھو',
      ikTranscription: 'Asō gāũ bazan baṭh khwash thū',
      urduMeaning: 'ہماری بستی بہت خوبصورت اور پرسکون ہے',
      englishMeaning: 'Our village is very pleasant and serene',
      contributorName: 'Muhammad Saeed',
      contributorId: 'user-contributor',
      dialect: 'seo',
      submittedAt: '2026-08-19T14:10:00Z',
      type: 'sentence',
      culturalContext: 'Standard conversational sentence spoken by Seo community members.'
    },
    verified: {
      status: 'escalated_to_senior',
      escalationTarget: 'linguistic_advisor',
      escalationReason: 'Requires confirmation whether "bazan" vs "baza" is the standard adverbial marker in Northern Seo.',
      reviewHistory: [
        {
          id: 'rh-8',
          reviewerName: 'Muhammad Saeed',
          reviewerRole: 'contributor',
          timestamp: '2026-08-19T14:10:00Z',
          action: 'submitted'
        },
        {
          id: 'rh-9',
          reviewerName: 'Mirza Khan',
          reviewerRole: 'reviewer',
          timestamp: '2026-08-20T11:00:00Z',
          action: 'escalated',
          comments: 'Escalated to Dr. Tariq Kohistani (Linguistic Advisor) for dialectal variation validation.'
        }
      ]
    },
    derived: {
      tokenCount: 6,
      charCount: 29,
      hasAudio: false,
      hasUrdu: true,
      hasEnglish: true,
      isCorpusEligible: false,
      isSpeechCorpusEligible: false,
      calculatedPoints: 0,
      calculatedRewardPkr: 0,
      derivedAt: '2026-08-20T11:00:00Z'
    }
  },
  {
    id: 'demo-ik-006',
    isDemoData: true,
    type: 'word',
    raw: {
      ikText: 'ڇھگور',
      ikTranscription: 'čʰagōr',
      urduMeaning: 'ایک سالہ نر بھیڑ / چھترا',
      englishMeaning: 'Yearling ram / young male sheep',
      contributorName: 'Muhammad Saeed',
      contributorId: 'user-contributor',
      dialect: 'duber_kandia',
      submittedAt: '2026-08-20T10:00:00Z',
      type: 'word',
      posTag: 'noun',
      semanticDomain: 'pastoralism',
      ipa: '/t͡ʃʰaˈɡoːr/',
      variantForms: ['چھگور', 'ڇھگوٗر'],
      relatedTerms: ['بھیڑ', 'مَیش'],
      culturalContext: 'Crucial pastoral livestock terminology used by shepherds in high pasture meadows in Duber and Kandia.'
    },
    verified: {
      status: 'approved',
      verifiedAt: '2026-08-21T11:30:00Z',
      reviewedBy: 'Saif Ullah',
      reviewerRole: 'project_director',
      reviewNotes: 'Standard lexical entry in pastoral vocabulary. Orthography preserves special Indus-Kohistani letter ڇ (U+0686).',
      verifiedDialect: 'duber_kandia',
      verifiedPosTag: 'noun',
      verifiedSemanticDomain: 'pastoralism',
      verifiedIpa: '/t͡ʃʰaˈɡoːr/',
      verifiedVariantForms: ['چھگور', 'ڇھگوٗر'],
      verifiedRelatedTerms: ['بھیڑ', 'مَیش'],
      reviewHistory: [
        {
          id: 'rh-10',
          reviewerName: 'Saif Ullah',
          reviewerRole: 'project_director',
          timestamp: '2026-08-21T11:30:00Z',
          action: 'approved',
          comments: 'Approved canonical representation for Duber-Kandia standard.'
        }
      ]
    },
    derived: {
      tokenCount: 1,
      charCount: 5,
      hasAudio: true,
      hasUrdu: true,
      hasEnglish: true,
      isCorpusEligible: true,
      isSpeechCorpusEligible: true,
      calculatedPoints: 25,
      calculatedRewardPkr: 130,
      derivedAt: '2026-08-21T11:30:00Z'
    }
  },
  {
    id: 'demo-ik-007',
    isDemoData: true,
    type: 'word',
    raw: {
      ikText: 'څھیر',
      ikTranscription: 'tsʰīr',
      urduMeaning: 'دودھ / تازہ خالص دودھ',
      englishMeaning: 'Milk / Fresh mountain dairy milk',
      contributorName: 'Muhammad Saeed',
      contributorId: 'user-contributor',
      dialect: 'duber_kandia',
      submittedAt: '2026-08-20T10:15:00Z',
      type: 'word',
      posTag: 'noun',
      semanticDomain: 'food_agriculture',
      ipa: '/t͡sʰiːr/',
      variantForms: ['څھِیر'],
      relatedTerms: ['دَہِیں', 'گِھؤ'],
      culturalContext: 'Primary dietary staple in Indus-Kohistani households. Preserves character څ (U+0681).'
    },
    verified: {
      status: 'approved',
      verifiedAt: '2026-08-21T12:00:00Z',
      reviewedBy: 'Dr. Tariq Kohistani',
      reviewerRole: 'linguistic_advisor',
      reviewNotes: 'Standard lexical noun. Affricate consonant څ (U+0681) verified.',
      verifiedDialect: 'duber_kandia',
      verifiedPosTag: 'noun',
      verifiedSemanticDomain: 'food_agriculture',
      verifiedIpa: '/t͡sʰiːr/',
      verifiedVariantForms: ['څھِیر'],
      verifiedRelatedTerms: ['دَہِیں', 'گِھؤ'],
      reviewHistory: [
        {
          id: 'rh-11',
          reviewerName: 'Dr. Tariq Kohistani',
          reviewerRole: 'linguistic_advisor',
          timestamp: '2026-08-21T12:00:00Z',
          action: 'approved',
          comments: 'Approved core Indo-Aryan Dardic lexical entry.'
        }
      ]
    },
    derived: {
      tokenCount: 1,
      charCount: 4,
      hasAudio: true,
      hasUrdu: true,
      hasEnglish: true,
      isCorpusEligible: true,
      isSpeechCorpusEligible: true,
      calculatedPoints: 25,
      calculatedRewardPkr: 130,
      derivedAt: '2026-08-21T12:00:00Z'
    }
  },
  {
    id: 'demo-ik-008',
    isDemoData: true,
    type: 'word',
    raw: {
      ikText: 'ݜاری',
      ikTranscription: 'ṣārī',
      urduMeaning: 'ستارہ / صبح کا روشن تارا',
      englishMeaning: 'Star / Morning star (Venus) / dawn glow',
      contributorName: 'Muhammad Saeed',
      contributorId: 'user-contributor',
      dialect: 'seo_patan',
      submittedAt: '2026-08-20T11:00:00Z',
      type: 'word',
      posTag: 'noun',
      semanticDomain: 'nature_geography',
      ipa: '/ʂaːˈriː/',
      variantForms: ['ݜارِی'],
      relatedTerms: ['سُورِی', 'مَاس'],
      culturalContext: 'Used by Kohistani travelers and shepherds navigating by celestial constellations in Karakoram-Himalayan valleys.'
    },
    verified: {
      status: 'approved',
      verifiedAt: '2026-08-21T12:30:00Z',
      reviewedBy: 'Abdul Qadir Kohistani',
      reviewerRole: 'senior_reviewer',
      reviewNotes: 'Verified retroflex sibilant ݜ (U+075C) for Seo-Patan variety.',
      verifiedDialect: 'seo_patan',
      verifiedPosTag: 'noun',
      verifiedSemanticDomain: 'nature_geography',
      verifiedIpa: '/ʂaːˈriː/',
      verifiedVariantForms: ['ݜارِی'],
      verifiedRelatedTerms: ['سُورِی', 'مَاس'],
      reviewHistory: [
        {
          id: 'rh-12',
          reviewerName: 'Abdul Qadir Kohistani',
          reviewerRole: 'senior_reviewer',
          timestamp: '2026-08-21T12:30:00Z',
          action: 'approved'
        }
      ]
    },
    derived: {
      tokenCount: 1,
      charCount: 4,
      hasAudio: false,
      hasUrdu: true,
      hasEnglish: true,
      isCorpusEligible: true,
      isSpeechCorpusEligible: false,
      calculatedPoints: 10,
      calculatedRewardPkr: 50,
      derivedAt: '2026-08-21T12:30:00Z'
    }
  },
  {
    id: 'demo-ik-009',
    isDemoData: true,
    type: 'word',
    raw: {
      ikText: 'ڙگو',
      ikTranscription: 'ʐigō',
      urduMeaning: 'بھانجا (بہن کا بیٹا)',
      englishMeaning: 'Nephew (Sister\'s son)',
      contributorName: 'Muhammad Saeed',
      contributorId: 'user-contributor',
      dialect: 'jijal_kayal',
      submittedAt: '2026-08-20T11:45:00Z',
      type: 'word',
      posTag: 'noun',
      semanticDomain: 'kinship',
      ipa: '/ʐiˈɡoː/',
      variantForms: ['ڙِگوٗ'],
      relatedTerms: ['ژُوئے', 'پُوچ'],
      culturalContext: 'Key kinship term in Jijal-Kayal clans denoting matrilateral nephew.'
    },
    verified: {
      status: 'approved',
      verifiedAt: '2026-08-21T13:00:00Z',
      reviewedBy: 'Abdul Qadir Kohistani',
      reviewerRole: 'senior_reviewer',
      reviewNotes: 'Orthography confirmed with voiced retroflex fricative ڙ (U+0699).',
      verifiedDialect: 'jijal_kayal',
      verifiedPosTag: 'noun',
      verifiedSemanticDomain: 'kinship',
      verifiedIpa: '/ʐiˈɡoː/',
      verifiedVariantForms: ['ڙِگوٗ'],
      verifiedRelatedTerms: ['ژُوئے', 'پُوچ'],
      reviewHistory: [
        {
          id: 'rh-13',
          reviewerName: 'Abdul Qadir Kohistani',
          reviewerRole: 'senior_reviewer',
          timestamp: '2026-08-21T13:00:00Z',
          action: 'approved'
        }
      ]
    },
    derived: {
      tokenCount: 1,
      charCount: 3,
      hasAudio: true,
      hasUrdu: true,
      hasEnglish: true,
      isCorpusEligible: true,
      isSpeechCorpusEligible: true,
      calculatedPoints: 25,
      calculatedRewardPkr: 130,
      derivedAt: '2026-08-21T13:00:00Z'
    }
  },
  {
    id: 'demo-ik-010',
    isDemoData: true,
    type: 'word',
    raw: {
      ikText: 'کاݨ',
      ikTranscription: 'kāṇ',
      urduMeaning: 'کانا / ایک آنکھ سے معذور',
      englishMeaning: 'One-eyed / impaired in one eye',
      contributorName: 'Muhammad Saeed',
      contributorId: 'user-contributor',
      dialect: 'ranolia',
      submittedAt: '2026-08-20T12:00:00Z',
      type: 'word',
      posTag: 'adjective',
      semanticDomain: 'body_health',
      ipa: '/kaːɳ/',
      variantForms: ['کاݨا'],
      relatedTerms: ['اَچِھی', 'اندھو'],
      culturalContext: 'Adjectival descriptive term containing retroflex nasal consonant ݨ (U+0768).'
    },
    verified: {
      status: 'approved',
      verifiedAt: '2026-08-21T13:30:00Z',
      reviewedBy: 'Saif Ullah',
      reviewerRole: 'project_director',
      reviewNotes: 'Canonical adjectival entry. Retroflex nasal ݨ (U+0768) accurately verified.',
      verifiedDialect: 'ranolia',
      verifiedPosTag: 'adjective',
      verifiedSemanticDomain: 'body_health',
      verifiedIpa: '/kaːɳ/',
      verifiedVariantForms: ['کاݨا'],
      verifiedRelatedTerms: ['اَچِھی', 'اندھو'],
      reviewHistory: [
        {
          id: 'rh-14',
          reviewerName: 'Saif Ullah',
          reviewerRole: 'project_director',
          timestamp: '2026-08-21T13:30:00Z',
          action: 'approved'
        }
      ]
    },
    derived: {
      tokenCount: 1,
      charCount: 3,
      hasAudio: false,
      hasUrdu: true,
      hasEnglish: true,
      isCorpusEligible: true,
      isSpeechCorpusEligible: false,
      calculatedPoints: 10,
      calculatedRewardPkr: 50,
      derivedAt: '2026-08-21T13:30:00Z'
    }
  },
  {
    id: 'demo-ik-011',
    isDemoData: true,
    type: 'idiom',
    raw: {
      ikText: 'اَچِھی شِیں تھِیْبُو',
      ikTranscription: 'acʰī šī̃ tʰībū',
      urduMeaning: 'آنکھوں پر بٹھانا / نہایت عزت و احترام سے پیش آنا',
      englishMeaning: 'To welcome warmly / to place someone upon one\'s eyes with highest honor',
      contributorName: 'Muhammad Saeed',
      contributorId: 'user-contributor',
      dialect: 'duber_kandia',
      submittedAt: '2026-08-21T09:00:00Z',
      type: 'idiom',
      posTag: 'idiom_phrase',
      semanticDomain: 'wisdom_folklore',
      ipa: '/aˈt͡ʃʰiː ʃĩː ˈtʰiːbuː/',
      relatedTerms: ['مَہْمَان نَوَازِی', 'عِزَّت'],
      culturalContext: 'Idiom used across Indus-Kohistan expressing deep traditional hospitality for esteemed guests.'
    },
    verified: {
      status: 'approved',
      verifiedAt: '2026-08-21T14:00:00Z',
      reviewedBy: 'Saif Ullah',
      reviewerRole: 'project_director',
      reviewNotes: 'Verified idiomatic expression with accurate nasalization and phrasing.',
      verifiedDialect: 'duber_kandia',
      verifiedPosTag: 'idiom_phrase',
      verifiedSemanticDomain: 'wisdom_folklore',
      verifiedIpa: '/aˈt͡ʃʰiː ʃĩː ˈtʰiːbuː/',
      verifiedRelatedTerms: ['مَہْمَان نَوَازِی', 'عِزَّت'],
      reviewHistory: [
        {
          id: 'rh-15',
          reviewerName: 'Saif Ullah',
          reviewerRole: 'project_director',
          timestamp: '2026-08-21T14:00:00Z',
          action: 'approved'
        }
      ]
    },
    derived: {
      tokenCount: 3,
      charCount: 18,
      hasAudio: true,
      hasUrdu: true,
      hasEnglish: true,
      isCorpusEligible: true,
      isSpeechCorpusEligible: true,
      calculatedPoints: 40,
      calculatedRewardPkr: 200,
      derivedAt: '2026-08-21T14:00:00Z'
    }
  },
  {
    id: 'demo-ik-012',
    isDemoData: true,
    type: 'cultural_expression',
    raw: {
      ikText: 'ژھونْگ رَسْم',
      ikTranscription: 'žhōŋg rasm',
      urduMeaning: 'بہار کے موسم میں بالائی چراگاہوں کی طرف کوچ کی روایتی رسم',
      englishMeaning: 'Traditional spring pastoral migration ritual when herds move to upper alpine pastures',
      contributorName: 'Muhammad Saeed',
      contributorId: 'user-contributor',
      dialect: 'bankad',
      submittedAt: '2026-08-21T10:00:00Z',
      type: 'cultural_expression',
      posTag: 'other',
      semanticDomain: 'craft_material',
      ipa: '/ʒʱoːŋɡ rasm/',
      culturalContext: 'An ancient community event in Bankad valley where songs are sung and elder shepherds bless the herds.'
    },
    verified: {
      status: 'approved',
      verifiedAt: '2026-08-21T15:00:00Z',
      reviewedBy: 'Dr. Tariq Kohistani',
      reviewerRole: 'linguistic_advisor',
      reviewNotes: 'Approved as valuable ethnographic and cultural heritage entry for Bankad dialect.',
      verifiedDialect: 'bankad',
      verifiedPosTag: 'other',
      verifiedSemanticDomain: 'craft_material',
      verifiedIpa: '/ʒʱoːŋɡ rasm/',
      reviewHistory: [
        {
          id: 'rh-16',
          reviewerName: 'Dr. Tariq Kohistani',
          reviewerRole: 'linguistic_advisor',
          timestamp: '2026-08-21T15:00:00Z',
          action: 'approved'
        }
      ]
    },
    derived: {
      tokenCount: 2,
      charCount: 11,
      hasAudio: false,
      hasUrdu: true,
      hasEnglish: true,
      isCorpusEligible: true,
      isSpeechCorpusEligible: false,
      calculatedPoints: 40,
      calculatedRewardPkr: 200,
      derivedAt: '2026-08-21T15:00:00Z'
    }
  },
  {
    id: 'demo-ik-013',
    isDemoData: true,
    type: 'poetry',
    raw: {
      ikText: 'پٹنَئی کوہستانَو یَار مے بَٹْھ یَاد آوُو',
      ikTranscription: 'Paṭanāī Kōhistānow yār mē baṭh yād āwū',
      urduMeaning: 'پٹن کوہستان کے پیارے دوست کی مجھے بہت یاد آتی ہے',
      englishMeaning: 'I deeply remember and long for my cherished friend from Patan Kohistan',
      contributorName: 'Muhammad Saeed',
      contributorId: 'user-contributor',
      dialect: 'seo_patan',
      submittedAt: '2026-08-21T11:00:00Z',
      type: 'poetry',
      posTag: 'other',
      semanticDomain: 'poetry_ballads',
      ipa: '/paʈaˈnaːiː koːhɪsˈtaːnoːw jaːr meː baʈʰ jaːd aːˈwuː/',
      culturalContext: 'Traditional oral couplet recited around hearth gatherings during winter in Patan.'
    },
    verified: {
      status: 'approved',
      verifiedAt: '2026-08-21T16:00:00Z',
      reviewedBy: 'Saif Ullah',
      reviewerRole: 'project_director',
      reviewNotes: 'Approved folk poetry verse. Metric and phonetic cadence validated for Seo-Patan.',
      verifiedDialect: 'seo_patan',
      verifiedPosTag: 'other',
      verifiedSemanticDomain: 'poetry_ballads',
      verifiedIpa: '/paʈaˈnaːiː koːhɪsˈtaːnoːw jaːr meː baʈʰ jaːd aːˈwuː/',
      reviewHistory: [
        {
          id: 'rh-17',
          reviewerName: 'Saif Ullah',
          reviewerRole: 'project_director',
          timestamp: '2026-08-21T16:00:00Z',
          action: 'approved'
        }
      ]
    },
    derived: {
      tokenCount: 7,
      charCount: 37,
      hasAudio: true,
      hasUrdu: true,
      hasEnglish: true,
      isCorpusEligible: true,
      isSpeechCorpusEligible: true,
      calculatedPoints: 40,
      calculatedRewardPkr: 200,
      derivedAt: '2026-08-21T16:00:00Z'
    }
  }
];
