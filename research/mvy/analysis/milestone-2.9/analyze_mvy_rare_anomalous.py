from pathlib import Path
import csv, json, re, unicodedata
from collections import Counter, defaultdict
from itertools import combinations

ROOT = Path(__file__).resolve().parents[4]
SRC = ROOT / "research/mvy/source/common-voice-27/validated.tsv"
OUT = ROOT / "research/mvy/analysis/milestone-2.9/output"
OUT.mkdir(parents=True, exist_ok=True)
if not SRC.exists():
    raise SystemExit(f"Missing source: {SRC}")

TOKEN_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z0-9]+")
ESTABLISHED = set("ا ب بھ پ پھ ت تھ ٹ ٹھ ث ج جھ چ چھ ڇ ڇھ ح خ څ څھ د دھ ڈ ڈھ ذ ر رھ ڑ ڑھ ز ژ ژھ ڙ ڙھ س ش ݜ ص ض ط ظ ع غ ف ق ک کھ گ گھ ل لھ م مہ ن نہ ݨ و ہ ء ی ې ے".split())
SPECIAL = set("ݜ ڇ څ ڙ ݨ".split())
KNOWN_MULTICHAR = set("بھ پھ تھ ٹھ جھ چھ ڇھ څھ دھ ڈھ ڑھ ژھ ڙھ کھ گھ لھ مہ نہ ݨھ".split())

def is_mark(c):
    return unicodedata.combining(c) != 0 or unicodedata.category(c).startswith("M")

def clusters(s):
    out, cur = [], ""
    for c in s:
        if is_mark(c):
            if cur: cur += c
            else: out.append(c)
        else:
            if cur: out.append(cur)
            cur = c
    if cur: out.append(cur)
    return out

def base(g):
    return next((c for c in g if not is_mark(c)), g)

def write_csv(path, fields, rows):
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader(); w.writerows(rows)

with SRC.open("r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f, delimiter="\t")
    if "sentence" not in (reader.fieldnames or []):
        raise SystemExit(f"No sentence column: {reader.fieldnames}")
    sentences = [r.get("sentence") or "" for r in reader]

seq_freq = Counter()
seq_sentences = Counter()
seq_words = defaultdict(set)
seq_examples = defaultdict(list)
bigram = Counter()
trigram = Counter()
anomalous_chars = Counter()
anomalous_sequences = Counter()
anomalous_words = defaultdict(set)
anomalous_examples = defaultdict(list)
rare_word_sequences = Counter()
word_count = 0

for sid, sentence in enumerate(sentences):
    seen_seq = set()
    for word in TOKEN_RE.findall(sentence):
        word_count += 1
        gs = clusters(word)
        bases = [base(g) for g in gs]
        for i, g in enumerate(gs):
            if g not in ESTABLISHED:
                anomalous_chars[g] += 1
                anomalous_words[g].add(word)
                if len(anomalous_examples[g]) < 15 and word not in anomalous_examples[g]:
                    anomalous_examples[g].append(word)
        for n, counter in ((2, bigram), (3, trigram)):
            for i in range(len(bases)-n+1):
                seq = tuple(bases[i:i+n])
                counter[seq] += 1
                if any(x not in ESTABLISHED for x in seq):
                    anomalous_sequences["".join(seq)] += 1
        for i in range(len(gs)-1):
            seq = gs[i] + gs[i+1]
            if seq not in KNOWN_MULTICHAR and (len(seq) > 1):
                # Only flag sequences whose adjacent bases contain an established base but form an unregistered cluster pattern.
                if bases[i] in ESTABLISHED and bases[i+1] in ESTABLISHED:
                    rare_word_sequences[seq] += 1
        # Rare sequences are defined by corpus frequency after counting below.
        local = []
        for n in (2, 3):
            for i in range(len(bases)-n+1):
                seq = "".join(bases[i:i+n])
                local.append((n, seq))
        for n, seq in local:
            seq_freq[(n, seq)] += 1
            seq_words[(n, seq)].add(word)
            seen_seq.add((n, seq))
            if len(seq_examples[(n, seq)]) < 10 and word not in seq_examples[(n, seq)]:
                seq_examples[(n, seq)].append(word)
    for key in seen_seq:
        seq_sentences[key] += 1

# Explicit anomalous sequence candidates: grapheme/mark anomalies plus low-frequency n-grams.
anomaly_rows = []
for g, n in anomalous_chars.most_common():
    anomaly_rows.append({
        "anomaly_type": "unestablished_grapheme",
        "sequence": g,
        "frequency": n,
        "unique_words": len(anomalous_words[g]),
        "example_words": " | ".join(anomalous_examples[g]),
    })

rare_rows = []
for (n, seq), freq in sorted(seq_freq.items(), key=lambda x: (x[1], x[0][0], x[0][1])):
    if freq <= 2:
        rare_rows.append({
            "sequence_type": f"{n}-gram",
            "sequence": seq,
            "frequency": freq,
            "sentence_frequency": seq_sentences[(n, seq)],
            "unique_words": len(seq_words[(n, seq)]),
            "example_words": " | ".join(seq_examples[(n, seq)]),
            "anomaly_flag": "low_frequency",
        })

write_csv(OUT/"mvy-anomalous-graphemes.csv",
          ["anomaly_type","sequence","frequency","unique_words","example_words"], anomaly_rows)
write_csv(OUT/"mvy-rare-sequences.csv",
          ["sequence_type","sequence","frequency","sentence_frequency","unique_words","example_words","anomaly_flag"], rare_rows)
write_csv(OUT/"mvy-anomalous-bigrams.csv",
          ["grapheme_1","grapheme_2","frequency","anomaly_flag"],
          [{"grapheme_1":a,"grapheme_2":b,"frequency":n,
            "anomaly_flag":"contains_unestablished_grapheme" if a not in ESTABLISHED or b not in ESTABLISHED else "known"}
           for (a,b),n in bigram.most_common() if a not in ESTABLISHED or b not in ESTABLISHED])
write_csv(OUT/"mvy-anomalous-trigrams.csv",
          ["grapheme_1","grapheme_2","grapheme_3","frequency","anomaly_flag"],
          [{"grapheme_1":a,"grapheme_2":b,"grapheme_3":c,"frequency":n,
            "anomaly_flag":"contains_unestablished_grapheme"}
           for (a,b,c),n in trigram.most_common()
           if a not in ESTABLISHED or b not in ESTABLISHED or c not in ESTABLISHED])
write_csv(OUT/"mvy-anomalous-sequence-summary.csv",
          ["sequence","frequency"],
          [{"sequence":s,"frequency":n} for s,n in anomalous_sequences.most_common()])
write_csv(OUT/"mvy-rare-adjacent-sequences.csv",
          ["sequence","frequency"],
          [{"sequence":s,"frequency":n} for s,n in rare_word_sequences.most_common()])

manifest = {
    "project":"FiKR&CD","language":"Indus-Kohistani","iso_639_3":"mvy",
    "milestone":"2.9","title":"Rare & Anomalous Sequence Detection",
    "corpus_rows":len(sentences),"word_occurrences":word_count,
    "established_grapheme_count":len(ESTABLISHED),
    "special_letter_count":len(SPECIAL),
    "unestablished_graphemes":[
        {"sequence":g,"frequency":n,"unique_words":len(anomalous_words[g])}
        for g,n in anomalous_chars.most_common()
    ],
    "rare_sequence_threshold":2,
    "rare_sequence_count":len(rare_rows),
    "anomalous_bigram_count":sum(1 for a,b in bigram if a not in ESTABLISHED or b not in ESTABLISHED),
    "anomalous_trigram_count":sum(1 for a,b,c in trigram if a not in ESTABLISHED or b not in ESTABLISHED or c not in ESTABLISHED),
    "method_notes":[
        "A grapheme is anomalous when it is not in the established Mvy grapheme inventory used by the FiKR&CD analysis pipeline.",
        "Rare sequences are corpus bigrams/trigrams occurring no more than twice.",
        "Sequence detection is descriptive and orthographic; anomalies are candidates for review, not automatic corrections.",
        "Known multi-character aspirated patterns are retained as expected orthographic sequences."
    ],
    "outputs":sorted(p.name for p in OUT.glob("*") if p.is_file())
}
(OUT/"mvy-rare-anomalous-manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")

report = [
"# Milestone 2.9 — Rare & Anomalous Sequence Detection","",
f"- Corpus rows: **{len(sentences):,}**",
f"- Word occurrences: **{word_count:,}**",
f"- Established graphemes: **{len(ESTABLISHED):,}**",
f"- Unestablished grapheme types observed: **{len(anomalous_chars):,}**",
f"- Rare n-gram sequences (frequency ≤ 2): **{len(rare_rows):,}**","",
"## Method","",
"Rare bigrams and trigrams are identified at frequency ≤ 2. Anomalous graphemes are characters/clusters outside the established inventory. These are review candidates and are not automatically treated as errors.","",
"## Outputs",""
]
report += [f"- {p.name}" for p in sorted(OUT.glob("*"))]
(OUT/"milestone-2.9-rare-anomalous-report.md").write_text("\n".join(report)+"\n",encoding="utf-8")
print("\n".join(report))
