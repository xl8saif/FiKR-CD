import React, { useEffect, useState } from 'react';

type Resource = { id:string; title:string; milestone?:string; status?:string; description?:string };
type Index = { schema_version?:string; resources?:Resource[] };

export const MvyResearchDashboard: React.FC = () => {
  const [index,setIndex]=useState<Index|null>(null);
  useEffect(()=>{fetch('/research/mvy/milestone-5.4/index.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(setIndex).catch(()=>setIndex(null));},[]);
  const resources=index?.resources ?? [];
  return <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
    <header className="border-b border-zinc-800 pb-7">
      <p className="text-[11px] uppercase tracking-[.22em] text-[#C9A66B]">FiKR&CD Research</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">Indus-Kohistani language research</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Corpus, language documentation, speech data and computational research resources.</p>
    </header>
    <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800">
      {[['Corpus','M2'],['Speech data','M3'],['Language research','M4'],['Public resources','M5']].map(([a,b])=><div key={b} className="bg-zinc-950 px-4 py-4"><div className="text-sm text-zinc-200">{a}</div><div className="mt-1 text-[11px] text-zinc-500">{b}</div></div>)}
    </div>
    <div className="mt-8">
      <div className="flex items-baseline justify-between"><h2 className="text-base font-medium text-zinc-200">Research resources</h2><span className="text-[11px] text-zinc-600">{index?.schema_version ? `catalogue ${index.schema_version}` : ''}</span></div>
      <div className="mt-3 divide-y divide-zinc-800 border-y border-zinc-800">
        {resources.map(r=><div key={r.id} className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0"><div className="text-sm text-zinc-200 truncate">{r.title}</div><div className="mt-1 text-xs text-zinc-500">{r.description || r.milestone || 'Research resource'}</div></div>
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-zinc-500">{r.status || 'available'}</span>
        </div>)}
        {!resources.length && <div className="py-8 text-sm text-zinc-500">Research resources are loading.</div>}
      </div>
    </div>
    <div className="mt-10">
      <h2 className="text-base font-medium text-zinc-200">FiKR&CD contributors</h2>
      <p className="mt-1 text-xs leading-5 text-zinc-500">Native speakers, researchers, linguists and contributors to the Indus-Kohistani language and cultural research programme.</p>
      <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800 sm:grid-cols-2">
        {[
          ['Dr. Hussain Ahmad Faizy','Co-owner of FiKR&CD · Researcher · Linguist · Contributor'],
          ['Rasheed Ahmad Faizy Adv.','Native speaker · Researcher · Linguist · Contributor'],
          ['Molana Mujib ul Haq Jailani','Native speaker · Researcher · Linguist · Contributor'],
          ['Molana Hasan Jamil','Native speaker · Researcher · Linguist · Contributor'],
          ['Iqbal Ahmad Abasindi','Native speaker · Researcher · Linguist · Contributor']
        ].map(([name,role])=><div key={name} className="bg-zinc-950 px-4 py-4"><div className="text-sm text-zinc-200">{name}</div><div className="mt-1 text-xs text-zinc-500">{role}</div></div>)}
      </div>
    </div>
  </section>;
};
