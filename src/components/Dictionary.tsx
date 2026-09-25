import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, getDoc, onSnapshot, serverTimestamp, updateDoc, where, query as firestoreQuery } from 'firebase/firestore';
import { BookOpen, CheckCircle2, Database, ExternalLink, Plus, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { db } from '../services/firebase';
import corpusLexicon from '../data/mvyCorpusFullLexicon.json';
import corpusExamples from '../data/mvyCorpusExamples.json';
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
  sourceDataset?: string;
  corpusExamples?: string[];
  status?: string;
  createdAt?: unknown;
  createdBy?: string;
}

interface CorpusCandidate {
  word: string;
  frequency: number;
}

interface CorpusExampleRecord {
  occurrences: number;
  examples: Array<{
    text: string;
    source: string;
    page?: number;
    line?: number;
  }>;
}

type SelectedRecord =
  | { kind: 'canonical'; entry: DictionaryEntry }
  | { kind: 'candidate'; candidate: CorpusCandidate; evidence?: CorpusExampleRecord };

interface DictionaryProps {
  uiLang: UILang;
  firebaseUser: FirebaseUser | null;
}

const Dictionary: React.FC<DictionaryProps> = ({ uiLang, firebaseUser }) => {
  const ur = uiLang === 'ur';
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [pendingEntries, setPendingEntries] = useState<DictionaryEntry[]>([]);
  const [mozillaWords] = useState<CorpusCandidate[]>(
    Array.isArray(corpusLexicon.entries) ? corpusLexicon.entries : []
  );
  const mozillaLoading = false;
  const corpusEvidence = (corpusExamples.entries || {}) as Record<string, CorpusExampleRecord>;
  const [query, setQuery] = useState('');
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminAllowed, setAdminAllowed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SelectedRecord | null>(null);
  const [form, setForm] = useState({
    indusKohistani: '',
    urdu: '',
    english: '',
    dialect: '',
    notes: '',
    corpusExamples: '',
    source: 'FiKR&CD Dictionary',
    verified: true
  });

  const t = (en: string, urdu: string) => ur ? urdu : en;

  useEffect(() => {
    const source = adminAllowed
      ? collection(db, 'dictionary_entries')
      : firestoreQuery(collection(db, 'dictionary_entries'), where('status', '==', 'verified'));
    const unsubscribe = onSnapshot(
      source,
      (snapshot) => {
        const all = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as DictionaryEntry));
        setEntries(all.filter((item) => item.status === 'verified'));
        if (adminAllowed) setPendingEntries(all.filter((item) => item.status === 'pending_review'));
      },
      () => setEntries([])
    );
    return unsubscribe;
  }, [adminAllowed]);

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

  const openAdd = (word = '', evidence?: CorpusExampleRecord) => {
    setForm({
      indusKohistani: word,
      urdu: '',
      english: '',
      dialect: '',
      notes: '',
      corpusExamples: evidence?.examples?.map((item) => item.text).join('\n') || '',
      source: 'FiKR&CD Dictionary',
      verified: false
    });
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
        source: form.source.trim() || 'FiKR&CD Dictionary',
        sourceDataset: 'Common Voice 27.0 — Indus Kohistani (mvy)',
        corpusExamples: form.corpusExamples
          .split(/\r?\n/)
          .map((example) => example.trim())
          .filter(Boolean),
        status: 'pending_review',
        verificationStatus: 'pending_review',
        createdBy: firebaseUser?.uid || '',
        createdAt: serverTimestamp(),
      });
      setShowAdminForm(false);
      setForm({
        indusKohistani: '',
        urdu: '',
        english: '',
        dialect: '',
        notes: '',
        corpusExamples: '',
        source: 'FiKR&CD Dictionary',
        verified: true
      });
    } finally {
      setSaving(false);
    }
  };

  const approveEntry = async (entry: DictionaryEntry) => {
    if (!adminAllowed) return;
    await updateDoc(doc(db, 'dictionary_entries', entry.id), {
      status: 'verified',
      verificationStatus: 'verified',
      verifiedBy: firebaseUser?.uid || '',
      verifiedAt: serverTimestamp(),
    });
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
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSelectedRecord({ kind: 'canonical', entry: item })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-left transition hover:border-[#C9A66B]/50"
                >
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="font-kohistani text-base text-zinc-100">{item.indusKohistani}</div>
                    <div className="text-sm text-zinc-300">{item.urdu || '—'}</div>
                    <div className="text-sm text-zinc-400">{item.english || '—'}</div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-zinc-500">
                    {item.dialect && <span>{item.dialect}</span>}
                    {item.corpusExamples?.length ? <span>{item.corpusExamples.length} {t('corpus examples', 'کارپس مثالیں')}</span> : null}
                    {item.source && <span>{item.source}</span>}
                  </div>
                </button>
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
                  {t('Frequency-ranked lexical candidates from the full archived Mvy corpus analysis. They are corpus evidence, not semantic definitions or automatically canonical entries.', 'شائع شدہ M2.5 کارپس تجزیے سے تعدادی طور پر مرتب لغوی امیدوار۔ یہ کارپس کے شواہد ہیں، لغوی تعریفیں یا خودکار طور پر مصدقہ اندراجات نہیں۔')}
                </p>
              </div>
              <Database className="h-5 w-5 text-[#C9A66B]" />
            </div>
            <div className="mt-4 space-y-2 max-h-[560px] overflow-auto pr-1">
              {mozillaLoading && <div className="px-3 py-8 text-center text-xs text-zinc-500">{t('Loading corpus lexicon…', 'کارپس کا لغوی ذخیرہ لوڈ ہو رہا ہے…')}</div>}
              {!mozillaLoading && filteredMozilla.map((item) => (
                <div key={item.word} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord({ kind: 'candidate', candidate: item, evidence: corpusEvidence[item.word] })}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="font-kohistani text-sm text-zinc-100">{item.word}</span>
                    <span className="mt-1 block text-[10px] text-zinc-500">
                      {item.frequency} {t('corpus occurrences · open lexical record', 'کارپس استعمالات · لغوی ریکارڈ کھولیں')}
                    </span>
                  </button>
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

        {adminAllowed && pendingEntries.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-700/40 bg-amber-950/10 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">{t('Human verification queue', 'انسانی تصدیقی قطار')}</h2>
                <p className="mt-1 text-xs text-zinc-500">{t('Review meanings, dialect and corpus evidence before publishing a canonical entry.', 'بنیادی اندراج شائع کرنے سے پہلے معنی، لہجے اور کارپس شواہد کا جائزہ لیں۔')}</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-amber-400" />
            </div>
            <div className="mt-4 space-y-2">
              {pendingEntries.map((item) => (
                <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <div className="grid gap-2 sm:grid-cols-4">
                    <div className="font-kohistani text-zinc-100">{item.indusKohistani}</div>
                    <div className="text-sm text-zinc-300">{item.urdu || '—'}</div>
                    <div className="text-sm text-zinc-400">{item.english || '—'}</div>
                    <div className="text-xs text-zinc-500">{item.dialect || t('Dialect not supplied', 'لہجہ درج نہیں')}</div>
                  </div>
                  {item.corpusExamples?.length ? <div className="mt-2 text-[10px] text-zinc-500">{item.corpusExamples.length} {t('corpus examples attached', 'کارپس مثالیں منسلک')}</div> : null}
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setSelectedRecord({ kind: 'canonical', entry: item })} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-[#C9A66B]">{t('Review', 'جائزہ')}</button>
                    <button type="button" onClick={() => approveEntry(item)} className="rounded-lg bg-[#C9A66B] px-3 py-1.5 text-xs font-bold text-zinc-950">{t('Verify & publish', 'تصدیق اور اشاعت')}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-[#C9A66B]/20 bg-[#C9A66B]/5 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A66B]" />
            <p className="text-xs leading-6 text-zinc-400">
              {t('Dictionary workflow: Mozilla candidate → administrator adds Urdu/English meaning and dialect notes → human verification → canonical FiKR&CD entry. This keeps the external source distinct from FiKR&CD’s own verified lexicon.', 'ڈکشنری کا طریقہ: Mozilla امیدوار لفظ → منتظم اردو/انگریزی معنی اور لہجے کی توضیحات شامل کرے → انسانی تصدیق → FiKR&CD کا مصدقہ اندراج۔ اس طرح بیرونی ماخذ اور FiKR&CD کا اپنا مصدقہ ذخیرہ الگ رہتا ہے۔')}
            </p>
          </div>
        </div>

        {selectedRecord && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C9A66B]">
                    {selectedRecord.kind === 'canonical'
                      ? t('Verified lexical record', 'مصدقہ لغوی ریکارڈ')
                      : t('Corpus lexical candidate', 'کارپس لغوی امیدوار')}
                  </div>
                  <h2 className="mt-2 font-kohistani text-2xl text-zinc-100">
                    {selectedRecord.kind === 'canonical' ? selectedRecord.entry.indusKohistani : selectedRecord.candidate.word}
                  </h2>
                </div>
                <button type="button" onClick={() => setSelectedRecord(null)} className="text-xs text-zinc-500 hover:text-zinc-200">
                  {t('Close', 'بند کریں')}
                </button>
              </div>

              {selectedRecord.kind === 'canonical' ? (
                <div className="mt-6 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{t('Urdu meaning', 'اردو معنی')}</div>
                      <div className="mt-2 text-base text-zinc-100">{selectedRecord.entry.urdu || '—'}</div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{t('English meaning', 'انگریزی معنی')}</div>
                      <div className="mt-2 text-base text-zinc-100">{selectedRecord.entry.english || '—'}</div>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div><div className="text-[10px] uppercase tracking-wider text-zinc-500">{t('Dialect / variety', 'لہجہ / قسم')}</div><div className="mt-1 text-sm text-zinc-200">{selectedRecord.entry.dialect || '—'}</div></div>
                    <div><div className="text-[10px] uppercase tracking-wider text-zinc-500">{t('Source', 'ماخذ')}</div><div className="mt-1 text-sm text-zinc-200">{selectedRecord.entry.source || '—'}</div></div>
                    <div><div className="text-[10px] uppercase tracking-wider text-zinc-500">{t('Verification', 'تصدیق')}</div><div className="mt-1 text-sm text-emerald-400">{selectedRecord.entry.status === 'verified' ? t('Verified', 'مصدقہ') : selectedRecord.entry.status || '—'}</div></div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">{t('Corpus examples', 'کارپس مثالیں')}</div>
                    {selectedRecord.entry.corpusExamples?.length ? (
                      <div className="mt-2 space-y-2">
                        {selectedRecord.entry.corpusExamples.map((example, index) => (
                          <div key={index} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-sm leading-6 text-zinc-300">
                            {example}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 rounded-xl border border-dashed border-zinc-800 p-4 text-xs leading-6 text-zinc-500">
                        {t('No attested corpus example has been attached to this dictionary entry yet.', 'اس ڈکشنری اندراج کے ساتھ ابھی کوئی مستند کارپس مثال منسلک نہیں کی گئی۔')}
                      </div>
                    )}
                  </div>
                  {selectedRecord.entry.notes && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{t('Notes / usage', 'توضیحات / استعمال')}</div>
                      <div className="mt-1 text-sm leading-6 text-zinc-300">{selectedRecord.entry.notes}</div>
                    </div>
                  )}
                  {selectedRecord.entry.sourceDataset && (
                    <div className="text-[10px] text-zinc-600">{selectedRecord.entry.sourceDataset}</div>
                  )}
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:col-span-2">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{t('Meaning', 'معنی')}</div>
                      <div className="mt-2 text-sm leading-6 text-zinc-500">
                        {t('Not yet verified. This record is a corpus-derived lexical candidate, not a dictionary definition.', 'ابھی تصدیق شدہ نہیں۔ یہ کارپس سے اخذ کردہ لغوی امیدوار ہے، ڈکشنری کی تعریف نہیں۔')}
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{t('Frequency', 'تعدد')}</div>
                      <div className="mt-2 text-lg text-zinc-100">{selectedRecord.candidate.frequency}</div>
                      {selectedRecord.evidence?.occurrences ? (
                        <div className="mt-1 text-[10px] text-zinc-500">
                          {selectedRecord.evidence.occurrences} {t('indexed corpus matches', 'اشاریہ شدہ کارپس مطابقتیں')}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><div className="text-[10px] uppercase tracking-wider text-zinc-500">{t('Source', 'ماخذ')}</div><div className="mt-1 text-sm text-zinc-200">M2.5 corpus lexicon · Common Voice 27.0</div></div>
                    <div><div className="text-[10px] uppercase tracking-wider text-zinc-500">{t('Verification', 'تصدیق')}</div><div className="mt-1 text-sm text-amber-400">{selectedRecord.evidence?.examples?.length
                        ? t('Candidate — examples indexed, not verified', 'امیدوار — مثالیں اشاریہ شدہ، ابھی مصدقہ نہیں')
                        : t('Candidate — not verified', 'امیدوار — ابھی مصدقہ نہیں')}</div></div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">{t('Attested corpus examples', 'مستند کارپس مثالیں')}</div>
                    {selectedRecord.evidence?.examples?.length ? (
                      <div className="mt-2 space-y-2">
                        {selectedRecord.evidence.examples.map((example, index) => (
                          <div key={index} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                            <div className="text-sm leading-6 text-zinc-200">{example.text}</div>
                            <div className="mt-2 text-[10px] text-zinc-600">
                              {example.source}
                              {example.page ? ` · page ${example.page}` : ''}
                              {example.line ? ` · line ${example.line}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 rounded-xl border border-dashed border-zinc-800 p-4 text-xs leading-6 text-zinc-500">
                        {t('No attested example was found for this lexical candidate in the indexed corpus.', 'اس لغوی امیدوار کے لیے اشاریہ شدہ کارپس میں کوئی مستند مثال نہیں ملی۔')}
                      </div>
                    )}
                  </div>
                  {adminAllowed && (
                    <button type="button" onClick={() => { setSelectedRecord(null); openAdd(selectedRecord.candidate.word, selectedRecord.evidence); }} className="inline-flex items-center gap-2 rounded-xl bg-[#C9A66B] px-4 py-2.5 text-xs font-bold text-zinc-950">
                      <Plus className="h-4 w-4" /> {t('Send for human verification', 'انسانی تصدیق کے لیے بھیجیں')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder={t('Source', 'ماخذ')} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 outline-none focus:border-[#C9A66B]" />
                <textarea value={form.corpusExamples} onChange={(e) => setForm({ ...form, corpusExamples: e.target.value })} rows={3} placeholder={t('Corpus examples — one sentence per line', 'کارپس مثالیں — ہر سطر میں ایک جملہ')} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 outline-none focus:border-[#C9A66B]" />
              </div>
              <label className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
                <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />
                {t('Entry is submitted to the human verification queue. Publication requires explicit verification.', 'اندراج انسانی تصدیقی قطار میں جمع ہوگا۔ اشاعت کے لیے واضح تصدیق ضروری ہے۔')}
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
