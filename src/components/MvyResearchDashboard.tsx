import React, { useEffect, useState } from 'react';

type Resource = { id: string; title: string; milestone?: string; status?: string; description?: string };
type Index = { schema_version?: string; resources?: Resource[] };

export const MvyResearchDashboard: React.FC<{ uiLang?: 'en' | 'ur' }> = ({ uiLang = 'en' }) => {
  const [index, setIndex] = useState<Index | null>(null);
  const ur = uiLang === 'ur';

  useEffect(() => {
    fetch('/research/mvy/milestone-5.4/index.json', { cache: 'force-cache' })
      .then(r => r.ok ? r.json() : null)
      .then(setIndex)
      .catch(() => setIndex(null));
  }, []);

  const resources = (index?.resources ?? []).filter(r => r.status === 'published').map(r => ({ ...r, title: r.title || ({ '2.3': 'Grapheme inventory', '5.4': 'Research catalogue' } as Record<string,string>)[r.milestone || ''] || 'Research resource' }));
  const sections = ur
    ? ['لسانی ذخیرہ', 'صوتی ڈیٹا', 'لسانی تحقیق', 'عوامی وسائل']
    : ['Corpus', 'Speech data', 'Language research', 'Public resources'];

  const contributors = [
    ['Saif Ullah', ur ? 'پراجیکٹ ڈائریکٹر' : 'Project Director'],
    ['Dr. Hussain Ahmad Faizy', ur ? 'فکر اینڈ سی ڈی کے شریک بانی · کتاب مصنف · محقق · ماہرِ لسانیات · معاون' : 'Co-founder of FiKR&CD · Book Author · Researcher · Linguist · Contributor'],
    ['Mujeeb ul Haq Jailani', ur ? 'مقامی زبان کے بولنے والے · محقق · ماہرِ لسانیات · معاون' : 'Native speaker · Researcher · Linguist · Contributor'],
    ['Rasheed Ahmad Faizy', ur ? 'مقامی زبان کے بولنے والے · محقق · ماہرِ لسانیات · معاون' : 'Native speaker · Researcher · Linguist · Contributor'],
    ['Muhammad Iqbal Abasindi', ur ? 'مقامی زبان کے بولنے والے · محقق · ماہرِ لسانیات · معاون' : 'Native speaker · Researcher · Linguist · Contributor'],
    ['Ihsan Ullah', ur ? 'مقامی زبان کے بولنے والے · محقق · معاون' : 'Native speaker · Researcher · Contributor'],
    ['Abdul Hadi', ur ? 'مقامی زبان کے بولنے والے · محقق · معاون' : 'Native speaker · Researcher · Contributor'],
    ['Aslam Dani', ur ? 'مقامی زبان کے بولنے والے · محقق · معاون' : 'Native speaker · Researcher · Contributor'],
    ['Atta Ur Rehman Aziz', ur ? 'مقامی زبان کے بولنے والے · محقق · معاون' : 'Native speaker · Researcher · Contributor'],
    ['Jameel Ahmad Umang', ur ? 'مقامی زبان کے بولنے والے · محقق · معاون' : 'Native speaker · Researcher · Contributor'],
    ['Ahsanullah Majid', ur ? 'مقامی زبان کے بولنے والے · محقق · معاون' : 'Native speaker · Researcher · Contributor'],
    ['Hasan Jamil', ur ? 'مقامی زبان کے بولنے والے · محقق · معاون' : 'Native speaker · Researcher · Contributor'],
    ['FiKR&CD Admin Team', ur ? 'منتظمین' : 'Administrator']
  ];

  return <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12" dir={ur ? 'rtl' : 'ltr'}>
    <header className="border-b border-zinc-800 pb-7">
      <p className="text-[11px] uppercase tracking-[.22em] text-[#C9A66B]">{ur ? 'فکر اینڈ سی ڈی · تحقیق' : 'FiKR&CD · Research'}</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">{ur ? 'انڈس کوہستانی زبان کی تحقیق' : 'Indus-Kohistani language research'}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{ur ? 'لسانی ذخیرہ، زبان کی دستاویز بندی، صوتی ڈیٹا اور کمپیوٹیشنل تحقیق کے وسائل۔' : 'Corpus, language documentation, speech data and computational research resources.'}</p>
    </header>

    <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800">
      {sections.map(label => <div key={label} className="bg-zinc-950 px-4 py-4"><div className="text-sm text-zinc-200">{label}</div></div>)}
    </div>

    <div className="mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-base font-medium text-zinc-200">{ur ? 'تحقیقی وسائل' : 'Research resources'}</h2>
        {resources.length > 0 && <span className="text-[11px] text-zinc-600">{ur ? `${resources.length} وسائل` : `${resources.length} resources`}</span>}
      </div>
      <div className="mt-3 divide-y divide-zinc-800 border-y border-zinc-800">
        {resources.map(r => <a key={r.id} href={r.path?.replace(/^\/public/, '')} className="flex items-center justify-between gap-4 py-4 transition hover:bg-zinc-900/60">
          <div className="min-w-0"><div className="text-sm text-zinc-200 truncate">{r.title}</div><div className="mt-1 text-xs text-zinc-500">{ur ? 'مشین سے قابلِ مطالعہ تحقیقی وسیلہ' : 'Machine-readable research resource'}</div></div>
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-zinc-500">{ur ? 'دستیاب' : 'Open'}</span>
        </a>)}
        {!resources.length && <div className="py-8 text-sm text-zinc-500">{ur ? 'تحقیقی وسائل لوڈ ہو رہے ہیں۔' : 'Research resources are loading.'}</div>}
      </div>
    </div>

    <div className="mt-10">
      <h2 className="text-base font-medium text-zinc-200">{ur ? 'فکر اینڈ سی ڈی کے معاونین' : 'FiKR&CD contributors'}</h2>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{ur ? 'مادری زبان کے بولنے والے، محققین، ماہرینِ لسانیات اور انڈس کوہستانی زبان و ثقافت کے تحقیقی منصوبے کے معاونین۔' : 'Native speakers, researchers, linguists and contributors to the Indus-Kohistani language and cultural research programme.'}</p>
      <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800 sm:grid-cols-2">
        {contributors.map(([name, role]) => <div key={name} className="bg-zinc-950 px-4 py-4"><div className="text-sm text-zinc-200">{name}</div><div className="mt-1 text-xs text-zinc-500">{role}</div></div>)}
      </div>
    </div>
  </section>;
};
