import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { BookOpen, CheckCircle2, Database, ExternalLink, Plus, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { db } from '../services/firebase';
import corpusLexicon from '../data/mvyCorpusLexicon.json';
import { User as FirebaseUser } from 'firebase/auth';

type UILang = 'en' | 'ur';

interface DictionaryEntry {
  id: string;
  indusKohistani: string;
  urdu: string;
  english: string;
  dialect?: string;
  notes?: string;
  source?: string;
  status?: string;
  createdAt?: unknown;
  createdBy?: string;
}

interface DictionaryProps {
  uiLang: UILang;
  firebaseUser: FirebaseUser | null;
}

const Dictionary: React.FC<DictionaryProps> = ({ uiLang, firebaseUser }) => {
  const ur = uiLang === 'ur';
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [mozillaWords] = useState<Array<{ word: string; frequency: number }>>(
    Array.isArray(corpusLexicon.entries) ? corpusLexicon.entries : []
  );
  const mozillaLoading = false;
  const [query, setQuery] = useState('');
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminAllowed, setAdminAllowed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ indusKohistani: '', urdu: '', english: '', dialect: '', notes: '', verified: true });

  const t = (en: string, urdu: string) => ur ? urdu : en;

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'dictionary_entries'),
      (snapshot) => {
        const next = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as DictionaryEntry))
          .filter((item) => item.status === 'verified');
        setEntries(next);
      },
      () => setEntries([])
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    let active = true;
    if (!firebaseUser) {
      setAdminAllowed(false);
      return () => { active = false; };
    }
    getDoc(doc(db, 'users', firebaseUser.uid))
      .then((snapshot) => {
        if (!active) return;
        const role = String(snapshot.data()?.role || '').toLowerCase();
        setAdminAllowed(['administrator', 'project_director'].includes(role));
      })
      .catch(() => {
        if (active) setAdminAllowed(false);
      });
    return () => { active = false; };
  }, [firebaseUser]);

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return entries;
    return entries.filter((item) =>
      [item.indusKohistani, item.urdu, item.english, item.dialect]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(q))
    );
  }, [entries, query]);

  const filteredMozilla = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return mozillaWords;
    return mozillaWords.filter((item) => item.word.toLocaleLowerCase().includes(q));
  }, [mozillaWords, query]);

  const openAdd = (word = '') => {
    setForm({ indusKohistani: word, urdu: '', english: '', dialect: '', notes: '', verified: true });
    setShowAdminForm(true);
  };

  const saveEntry = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adminAllowed || !form.indusKohistani.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'dictionary_entries'), {
        indusKohistani: form.indusKohistani.trim(),
        urdu: form.urdu.trim(),
        english: form.english.trim(),
        dialect: form.dialect.trim(),
        notes: form.notes.trim(),
        source: form.urdu || form.english ? 'FiKR&CD Dictionary' : 'Mozilla Common Voice 27.0',
        sourceDataset: 'Common Voice 27.0 — Indus Kohistani (mvy)',
        status: form.verified ? 'verified' : 'pending_review',
        createdBy: firebaseUser?.uid || '',
        createdAt: serverTimestamp(),
      });
      setShowAdminForm(false);
      setForm({ indusKohistani: '', urdu: '', english: '', dialect: '', notes: '', verified: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10" dir={ur ? 'rtl' : 'ltr'}>
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 sm:p-8 shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-[#C9A66B]">
              <BookOpen className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">{t('Indus-Kohistani Dictionary', 'انڈس کوہستانی ڈکشنری')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-100">
              {t('Digital Dictionary & Verified Lexicon', 'ڈیجیٹل ڈکشنری اور مصدقہ ذخیرۂ الفاظ')}
            </h1>
            <p className="mt-3 text-sm sm:text-base leading-7 text-zinc-400">
              {t(
                'A growing Indus-Kohistani ↔ Urdu ↔ English dictionary. Mozilla Common Voice provides an open linguistic source of mvy speech text; FiKR&CD administrators can turn useful candidates into reviewed dictionary entries by adding meanings, dialect information and notes.',
                'بڑھتی ہوئی انڈس کوہستانی ↔ اردو ↔ انگریزی ڈکشنری۔ Mozilla Common Voice انڈس کوہستانی mvy صوتی متن کا ایک کھلا لسانی ماخذ فراہم کرتا ہے؛ FiKR&CD منتظمین مفید الفاظ میں معانی، لہجے کی معلومات اور توضیحات شامل کرکے انہیں جائزہ شدہ ڈکشنری اندراجات بنا سکتے ہیں۔'
              )}
            </p>
          </div>
          {adminAllowed && (
            <button type="button" onClick={() => openAdd()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C9A66B] px-4 py-2.5 text-xs font-bold text-zinc-950 hover:bg-[#D4B582]">
              <Plus className="h-4 w-4" />
              {t('Add dictionary word', 'ڈکشنری میں لفظ شامل کریں')}
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Search Indus-Kohistani, Urdu or English…', 'انڈس کوہستانی، اردو یا انگریزی میں تلاش کریں…')} className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 py-3 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-[#C9A66B]" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs text-zinc-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {entries.length} {t('verified entries', 'مصدقہ اندراجات')}
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">{t('FiKR&CD Canonical Dictionary', 'FiKR&CD مصدقہ ڈکشنری')}</h2>
                <p className="mt-1 text-xs text-zinc-500">{t('Human-reviewed entries published by FiKR&CD.', 'FiKR&CD کی جانب سے جائزہ شدہ اور شائع شدہ اندراجات۔')}</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-[#C9A66B]" />
            </div>
            <div className="mt-4 space-y-2 max-h-[560px] overflow-auto pr-1">
              {filteredEntries.map((item) => (
                <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="font-kohistani text-base text-zinc-100">{item.indusKohistani}</div>
                    <div className="text-sm text-zinc-300">{item.urdu || '—'}</div>
                    <div className="text-sm text-zinc-400">{item.english || '—'}</div>
                  </div>
                  {(item.dialect || item.notes) && <div className="mt-2 text-[11px] leading-5 text-zinc-500">{[item.dialect, item.notes].filter(Boolean).join(' · ')}</div>}
                </div>
              ))}
              {filteredEntries.length === 0 && (
                <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-xs text-zinc-500">
                  {t('The canonical dictionary is ready for its first reviewed entries.', 'مصدقہ ڈکشنری پہلے جائزہ شدہ اندراجات کے لیے تیار ہے۔')}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">{t('Corpus-derived lexical candidates', 'کارپس سے اخذ کردہ لغوی امیدوار')}</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {t('Frequency-ranked lexical candidates from the published M2.5 corpus analysis. They are corpus evidence, not semantic definitions or automatically canonical entries.', 'شائع شدہ M2.5 کارپس تجزیے سے تعدادی طور پر مرتب لغوی امیدوار۔ یہ کارپس کے شواہد ہیں، لغوی تعریفیں یا خودکار طور پر مصدقہ اندراجات نہیں۔')}
                </p>
              </div>
              <Database className="h-5 w-5 text-[#C9A66B]" />
            </div>
            <div className="mt-4 space-y-2 max-h-[560px] overflow-auto pr-1">
              {mozillaLoading && <div className="px-3 py-8 text-center text-xs text-zinc-500">{t('Loading corpus lexicon…', 'کارپس کا لغوی ذخیرہ لوڈ ہو رہا ہے…')}</div>}
              {!mozillaLoading && filteredMozilla.map((item) => (
                <div key={item.word} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
                  <span className="font-kohistani text-sm text-zinc-100">{item.word}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">{item.frequency}</span>
                    {adminAllowed && (
                      <button type="button" onClick={() => openAdd(item.word)} className="rounded-lg border border-zinc-700 p-1.5 text-[#C9A66B] hover:border-[#C9A66B]" title={t('Add to dictionary', 'ڈکشنری میں شامل کریں')}>
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!mozillaLoading && filteredMozilla.length === 0 && <div className="px-3 py-8 text-center text-xs text-zinc-500">{t('No corpus candidates found.', 'کارپس کے الفاظ نہیں ملے۔')}</div>}
            </div>
            <a href="https://commonvoice.mozilla.org/en/datasets" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs text-[#C9A66B] hover:text-[#D4B582]">
              {t('Common Voice 27.0 dataset catalogue', 'Common Voice 27.0 ڈیٹا سیٹ فہرست')}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#C9A66B]/20 bg-[#C9A66B]/5 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A66B]" />
            <p className="text-xs leading-6 text-zinc-400">
              {t('Dictionary workflow: Mozilla candidate → administrator adds Urdu/English meaning and dialect notes → human verification → canonical FiKR&CD entry. This keeps the external source distinct from FiKR&CD’s own verified lexicon.', 'ڈکشنری کا طریقہ: Mozilla امیدوار لفظ → منتظم اردو/انگریزی معنی اور لہجے کی توضیحات شامل کرے → انسانی تصدیق → FiKR&CD کا مصدقہ اندراج۔ اس طرح بیرونی ماخذ اور FiKR&CD کا اپنا مصدقہ ذخیرہ الگ رہتا ہے۔')}
            </p>
          </div>
        </div>

        {showAdminForm && adminAllowed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <form onSubmit={saveEntry} className="w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-zinc-100">{t('Add dictionary entry', 'ڈکشنری اندراج شامل کریں')}</h2>
                <button type="button" onClick={() => setShowAdminForm(false)} className="text-xs text-zinc-500 hover:text-zinc-200">{t('Close', 'بند کریں')}</button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <input required value={form.indusKohistani} onChange={(e) => setForm({ ...form, indusKohistani: e.target.value })} placeholder={t('Indus-Kohistani', 'انڈس کوہستانی')} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 outline-none focus:border-[#C9A66B]" />
                <input value={form.urdu} onChange={(e) => setForm({ ...form, urdu: e.target.value })} placeholder={t('Urdu meaning', 'اردو معنی')} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 outline-none focus:border-[#C9A66B]" />
                <input value={form.english} onChange={(e) => setForm({ ...form, english: e.target.value })} placeholder={t('English meaning', 'انگریزی معنی')} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 outline-none focus:border-[#C9A66B]" />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input value={form.dialect} onChange={(e) => setForm({ ...form, dialect: e.target.value })} placeholder={t('Dialect / variety', 'لہجہ / قسم')} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 outline-none focus:border-[#C9A66B]" />
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t('Notes / usage', 'توضیحات / استعمال')} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 outline-none focus:border-[#C9A66B]" />
              </div>
              <label className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
                <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />
                {t('Publish as verified canonical entry', 'مصدقہ بنیادی اندراج کے طور پر شائع کریں')}
              </label>
              <button disabled={saving} type="submit" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#C9A66B] px-4 py-2.5 text-xs font-bold text-zinc-950 disabled:opacity-50">
                <Plus className="h-4 w-4" />
                {saving ? t('Saving…', 'محفوظ ہو رہا ہے…') : t('Save entry', 'اندراج محفوظ کریں')}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};

export default Dictionary;
