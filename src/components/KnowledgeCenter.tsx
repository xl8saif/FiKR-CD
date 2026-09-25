import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Database,
  Mic,
  Languages,
  Library,
  Users,
  ExternalLink,
  Search,
  GitBranch,
  ShieldCheck,
  ArrowRight,
  FileText,
  Headphones,
} from 'lucide-react';

interface KnowledgeCenterProps {
  uiLang: 'en' | 'ur';
  onNavigate: (tab: 'contribute' | 'corpus_explorer' | 'mvy_milestone_23') => void;
}

interface ResearchResource {
  id?: string;
  title?: string;
  description?: string;
  path?: string;
  status?: string;
}

export const KnowledgeCenter: React.FC<KnowledgeCenterProps> = ({ uiLang, onNavigate }) => {
  const ur = uiLang === 'ur';
  const [resources, setResources] = useState<ResearchResource[]>([]);

  useEffect(() => {
    let active = true;
    fetch('/research/mvy/milestone-5.4/index.json', { cache: 'force-cache' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!active) return;
        const items = Array.isArray(data?.resources) ? data.resources : [];
        setResources(items.filter((item: ResearchResource) => item?.status === 'published'));
      })
      .catch(() => {
        if (active) setResources([]);
      });
    return () => { active = false; };
  }, []);

  const t = (en: string, urdu: string) => ur ? urdu : en;

  const cards = [
    {
      icon: FileText,
      title: t('Written Corpus', 'تحریری متنی ذخیرہ'),
      text: t(
        'Explore the documented Indus-Kohistani text corpus and learn how the written evidence is organized for research.',
        'دستاویزی انڈس کوہستانی تحریری متون دیکھیں اور جانیں کہ تحقیقی شواہد کو کس طرح منظم کیا گیا ہے۔'
      ),
      action: t('Open corpus', 'متنی ذخیرہ کھولیں'),
      tab: 'corpus_explorer' as const,
    },
    {
      icon: Languages,
      title: t('Alphabet & Orthography', 'حروفِ تہجی اور املاء'),
      text: t(
        'Study the documented alphabet, graphemes, spelling patterns and orthographic research before contributing new examples.',
        'دستاویزی حروفِ تہجی، گرافیمز، املائی نمونوں اور املائی تحقیق کا مطالعہ کریں تاکہ نئی مثالیں بہتر طور پر شامل کی جا سکیں۔'
      ),
      action: t('Explore research', 'تحقیق دیکھیں'),
      tab: 'mvy_milestone_23' as const,
    },
    {
      icon: Mic,
      title: t('Speech & Common Voice', 'صوتی مواد اور کامن وائس'),
      text: t(
        'FiKR&CD documents speech research while Mozilla Common Voice remains the external source for its public Indus Kohistani speech dataset.',
        'FiKR&CD صوتی تحقیق کو دستاویزی شکل دیتا ہے، جبکہ Mozilla Common Voice اپنے عوامی انڈس کوہستانی صوتی ڈیٹا کا بیرونی ماخذ ہے۔'
      ),
      action: t('Open Common Voice', 'کامن وائس کھولیں'),
      href: 'https://commonvoice.mozilla.org/en/datasets',
    },
    {
      icon: Library,
      title: t('Texts, Literature & Folklore', 'متون، ادب اور لوک روایت'),
      text: t(
        'Build a growing reference collection of texts, translations, oral traditions and documented cultural material.',
        'متون، تراجم، زبانی روایات اور ثقافتی مواد کا بڑھتا ہوا تحقیقی ذخیرہ تشکیل دیں۔'
      ),
      action: t('Contribute material', 'مواد شامل کریں'),
      tab: 'contribute' as const,
    },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10" dir={ur ? 'rtl' : 'ltr'}>
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 sm:p-8 shadow-xl">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-[#C9A66B]">
            <Database className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-[0.18em]">
              {t('Knowledge & Data Center', 'علم و ڈیٹا مرکز')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-100">
            {t('Indus-Kohistani Knowledge & Data Center', 'انڈس کوہستانی علم و ڈیٹا مرکز')}
          </h1>
          <p className="mt-3 text-sm sm:text-base leading-7 text-zinc-400">
            {t(
              'A starting point for contributors and researchers: learn from existing evidence, explore published resources, then add new material through the review process.',
              'نئے معاونین اور محققین کے لیے ایک مرکزی مقام: پہلے موجود شواہد کا مطالعہ کریں، شائع شدہ وسائل دیکھیں، پھر جائزے کے عمل کے ذریعے نیا مواد شامل کریں۔'
            )}
          </p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Database, t('Corpus', 'متنی ذخیرہ'), t('Written language data', 'تحریری لسانی ڈیٹا')],
            [Headphones, t('Speech', 'صوتی مواد'), t('Audio and ASR research', 'آڈیو اور ASR تحقیق')],
            [Languages, t('Orthography', 'املاء'), t('Letters and writing system', 'حروف اور نظامِ تحریر')],
            [Users, t('Contributors', 'معاونین'), t('People and sources', 'افراد اور ماخذ')],
          ].map(([Icon, title, subtitle], index) => {
            const IconComponent = Icon as React.ComponentType<{ className?: string }>;
            return (
              <div key={index} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <IconComponent className="h-5 w-5 text-[#C9A66B]" />
                <div className="mt-3 text-sm font-semibold text-zinc-100">{title}</div>
                <div className="mt-1 text-xs text-zinc-500">{subtitle}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-700 transition">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-[#C9A66B]/10 p-2.5 text-[#D4B582]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-zinc-100">{card.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{card.text}</p>
                    {card.href ? (
                      <a
                        href={card.href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-[#C9A66B] hover:text-[#D4B582]"
                      >
                        {card.action}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => card.tab && onNavigate(card.tab)}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-[#C9A66B] hover:text-[#D4B582]"
                      >
                        {card.action}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-[#C9A66B]" />
              <h2 className="text-sm font-semibold text-zinc-100">
                {t('Research catalogue', 'تحقیقی فہرست')}
              </h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              {t(
                'Published FiKR&CD research resources are surfaced here. Internal milestone terminology remains in the technical archive, while the public interface focuses on the research subject.',
                'FiKR&CD کے شائع شدہ تحقیقی وسائل یہاں دکھائے جاتے ہیں۔ تکنیکی آرکائیو میں اندرونی milestone نام برقرار رہتے ہیں، جبکہ عوامی انٹرفیس تحقیق کے موضوع پر مرکوز ہے۔'
              )}
            </p>
            <div className="mt-4 space-y-2">
              {resources.slice(0, 8).map((resource, index) => (
                <div key={resource.id || resource.path || index} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-zinc-200">{resource.title || resource.id || 'Research resource'}</div>
                    {resource.description && <div className="mt-0.5 truncate text-[11px] text-zinc-500">{resource.description}</div>}
                  </div>
                  {resource.path && (
                    <a href={resource.path} className="shrink-0 text-[#C9A66B] hover:text-[#D4B582]" aria-label={t('Open research resource', 'تحقیقی وسیلہ کھولیں')}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))}
              {resources.length === 0 && (
                <div className="rounded-xl border border-dashed border-zinc-800 px-3 py-4 text-xs text-zinc-500">
                  {t('Published research resources will appear here.', 'شائع شدہ تحقیقی وسائل یہاں ظاہر ہوں گے۔')}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#C9A66B]" />
              <h2 className="text-sm font-semibold text-zinc-100">
                {t('Data stewardship', 'ڈیٹا نگہداشت')}
              </h2>
            </div>
            <p className="mt-2 text-xs leading-6 text-zinc-500">
              {t(
                'Only approved public material should be published here. Restricted recordings, personal information and unpublished research remain protected and are handled separately.',
                'یہاں صرف منظور شدہ عوامی مواد شائع کیا جائے گا۔ محدود ریکارڈنگز، ذاتی معلومات اور غیر شائع شدہ تحقیق محفوظ رہیں گے اور الگ طریقے سے سنبھالے جائیں گے۔'
              )}
            </p>
            <div className="mt-5 space-y-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2"><GitBranch className="h-3.5 w-3.5 text-zinc-500" />{t('Versioned research archive', 'ورژن شدہ تحقیقی آرکائیو')}</div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-zinc-500" />{t('Reviewed contributions', 'جائزہ شدہ شمولیات')}</div>
              <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-zinc-500" />{t('Contributor attribution', 'معاونین کی نسبت')}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#C9A66B]/20 bg-[#C9A66B]/5 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                {t('Ready to contribute?', 'شمولیت کے لیے تیار ہیں؟')}
              </h2>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {t(
                  'Review the existing corpus and research first, then submit text, words, dialect evidence, audio or corrections.',
                  'پہلے موجود متنی ذخیرے اور تحقیق دیکھیں، پھر متن، الفاظ، لسانی شواہد، آڈیو یا تصحیح جمع کریں۔'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('contribute')}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C9A66B] px-4 py-2.5 text-xs font-bold text-zinc-950 hover:bg-[#D4B582]"
            >
              {t('Start contributing', 'شمولیت شروع کریں')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
