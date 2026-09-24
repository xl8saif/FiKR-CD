import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, BookOpen, Database, ExternalLink, FileText, RefreshCw, Search, ShieldCheck } from 'lucide-react';

type Grapheme = {
  grapheme: string;
  unicode_sequence: string;
  frequency: number;
  unique_words: number;
  initial: number;
  medial: number;
  final: number;
  isolated: number;
  diacritic_bearing: number;
  aspirated: boolean;
  rare: boolean;
  anomaly: boolean;
};

type MvyManifest = {
  project: string;
  language: string;
  iso_639_3: string;
  milestone: string;
  corpus_rows: number;
  grapheme_count: number;
  inventory: Grapheme[];
};

const SOURCE_URL = 'https://github.com/xl8saif/FiKR-CD/blob/main/research/mvy/source/common-voice-27/validated.tsv';
const SCRIPT_URL = 'https://github.com/xl8saif/FiKR-CD/blob/main/research/mvy/analysis/milestone-2.3/analyze_mvy_graphemes.py';

export const MvyMilestone23: React.FC = () => {
  const [data, setData] = useState<MvyManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = () => {
    setError(null);
    fetch('/research/mvy/milestone-2.3/mvy-grapheme-inventory.json', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(`Research manifest unavailable (HTTP ${r.status})`); return r.json(); })
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Unable to load M2.3 research data.'));
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const q = query.trim();
    if (!data) return [];
    return data.inventory
      .filter(g => !q || g.grapheme.includes(q) || g.unicode_sequence.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 80);
  }, [data, query]);

  if (error) {
    return <div className="mx-auto max-w-7xl px-4 py-8"><div className="rounded-3xl border border-red-900/50 bg-[#111] p-6"><h2 className="text-xl font-bold text-red-300">Mvy Milestone 2.3</h2><p className="mt-2 text-sm text-zinc-400">{error}</p><button onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm"><RefreshCw className="h-4 w-4" /> Retry</button></div></div>;
  }

  if (!data) return <div className="mx-auto max-w-7xl px-4 py-8"><div className="rounded-3xl border border-zinc-800 bg-[#111] p-6 text-sm text-zinc-400">Loading Mvy Milestone 2.3 research manifest…</div></div>;

  const totalFreq = data.inventory.reduce((n, g) => n + g.frequency, 0);
  const rare = data.inventory.filter(g => g.rare).length;
  const anomalous = data.inventory.filter(g => g.anomaly).length;
  const top = rows.slice(0, 20);

  return <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
    <section className="rounded-3xl border border-[#C9A66B]/30 bg-[#111] p-6 sm:p-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="rounded-full border border-[#C9A66B]/30 bg-[#C9A66B]/10 px-3 py-1 text-xs font-bold text-[#D4B582]">MILESTONE 2.3</span>
            <span className="rounded-full border border-emerald-800/50 bg-emerald-950/40 px-3 py-1 text-xs font-bold text-emerald-300"><ShieldCheck className="inline h-3.5 w-3.5 mr-1" /> Reproducible Analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100">Mvy Grapheme Frequency & Positional Analysis</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">Computational orthographic analysis of the validated Common Voice 27 corpus for Indus-Kohistani (mvy). Raw corpus text is preserved; anomalies are diagnostic review flags rather than automatic corrections.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200"><BookOpen className="h-4 w-4" /> Corpus</a>
          <a href={SCRIPT_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200"><FileText className="h-4 w-4" /> Analysis Script</a>
        </div>
      </div>
    </section>

    <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {[
        ['Corpus Rows', data.corpus_rows.toLocaleString(), Database],
        ['Grapheme Types', data.grapheme_count.toLocaleString(), BarChart3],
        ['Grapheme Occurrences', totalFreq.toLocaleString(), BarChart3],
        ['Rare Clusters', rare.toLocaleString(), Search],
        ['Diagnostic Flags', anomalous.toLocaleString(), ShieldCheck],
      ].map(([label, value, Icon]) => <div key={label as string} className="rounded-2xl border border-zinc-800 bg-[#111] p-4"><Icon className="h-4 w-4 text-[#C9A66B]" /><p className="mt-3 text-xl font-black text-zinc-100">{value as string}</p><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label as string}</p></div>)}
    </section>

    <section className="rounded-3xl border border-zinc-800 bg-[#111] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold text-zinc-100">Observed Grapheme Inventory</h2><p className="text-xs text-zinc-500 mt-1">Frequency and positional distribution generated from the committed analysis program.</p></div>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search grapheme / Unicode" className="rounded-xl border border-zinc-700 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-200 outline-none focus:border-[#C9A66B]" /></div>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-xs"><thead><tr className="border-b border-zinc-800 text-zinc-500"><th className="p-3">Grapheme</th><th className="p-3">Unicode</th><th className="p-3">Frequency</th><th className="p-3">Unique words</th><th className="p-3">Initial</th><th className="p-3">Medial</th><th className="p-3">Final</th><th className="p-3">Isolated</th></tr></thead>
        <tbody>{top.map(g => <tr key={g.grapheme + g.unicode_sequence} className="border-b border-zinc-900"><td className="p-3 text-lg font-kohistani text-[#D4B582]" dir="rtl">{g.grapheme}</td><td className="p-3 font-mono text-zinc-500">{g.unicode_sequence}</td><td className="p-3 font-bold text-zinc-200">{g.frequency.toLocaleString()}</td><td className="p-3 text-zinc-400">{g.unique_words.toLocaleString()}</td><td className="p-3 text-zinc-400">{g.initial.toLocaleString()}</td><td className="p-3 text-zinc-400">{g.medial.toLocaleString()}</td><td className="p-3 text-zinc-400">{g.final.toLocaleString()}</td><td className="p-3 text-zinc-400">{g.isolated.toLocaleString()}</td></tr>)}</tbody></table>
      </div>
      <p className="mt-4 text-[11px] text-zinc-600">Showing up to 80 matching grapheme clusters, ordered by corpus frequency.</p>
    </section>

    <section className="rounded-3xl border border-zinc-800 bg-[#111] p-6">
      <h2 className="text-lg font-bold text-zinc-100">Research Provenance</h2>
      <div className="mt-4 grid md:grid-cols-3 gap-3 text-xs">
        <div className="rounded-2xl bg-zinc-900/70 p-4"><strong className="text-[#D4B582]">Language</strong><p className="mt-1 text-zinc-400">Indus-Kohistani · ISO 639-3 mvy</p></div>
        <div className="rounded-2xl bg-zinc-900/70 p-4"><strong className="text-[#D4B582]">Method</strong><p className="mt-1 text-zinc-400">Unicode grapheme clustering, frequency counts, positional distribution and diagnostic anomaly detection.</p></div>
        <div className="rounded-2xl bg-zinc-900/70 p-4"><strong className="text-[#D4B582]">Machine-readable release</strong><p className="mt-1 text-zinc-400">Generated JSON manifest served directly by the production application.</p></div>
      </div>
    </section>
  </div>;
};
