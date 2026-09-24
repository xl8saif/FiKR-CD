from pathlib import Path
import csv, json, re, unicodedata
from collections import Counter, defaultdict

root = Path(__file__).resolve().parents[4]
src = root / "research/mvy/source/common-voice-27/validated.tsv"
out = root / "research/mvy/analysis/milestone-2.7/output"
out.mkdir(parents=True, exist_ok=True)
if not src.exists():
    raise SystemExit(f"Missing source: {src}")

token_re = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z0-9]+")
aspirated_bases = set("ب پ ت ٹ ج چ ڇ څ د ڈ ر ڑ ژ ڙ ک گ ل م ن ݨ".split())
aspirated = {b + "ھ" for b in aspirated_bases}

def ismark(c):
    return unicodedata.combining(c) != 0 or unicodedata.category(c).startswith("M")

def clusters(s):
    result, current = [], ""
    for c in s:
        if ismark(c):
            if current:
                current += c
            else:
                result.append(c)
        else:
            if current:
                result.append(current)
            current = c
    if current:
        result.append(current)
    return result

def base(g):
    return next((c for c in g if not ismark(c)), g)

def ucs(s):
    return " ".join(f"U+{ord(c):04X}" for c in s)

def write_csv(path, fields, rows):
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

freq = Counter()
words = defaultdict(set)
positions = defaultdict(Counter)
left_context = Counter()
right_context = Counter()
pair_context = Counter()
sentence_counts = Counter()
word_counts = Counter()
examples = defaultdict(list)
total_words = 0

with src.open("r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f, delimiter="\t")
    if "sentence" not in reader.fieldnames:
        raise SystemExit(f"No sentence column: {reader.fieldnames}")
    sentences = [r.get("sentence") or "" for r in reader]

for sentence_id, sentence in enumerate(sentences):
    seen_in_sentence = set()
    for word in token_re.findall(sentence):
        total_words += 1
        gs = clusters(word)
        for i, g in enumerate(gs):
            if g not in aspirated:
                continue
            freq[g] += 1
            words[g].add(word)
            pos = "isolated" if len(gs) == 1 else ("initial" if i == 0 else ("final" if i == len(gs)-1 else "medial"))
            positions[g][pos] += 1
            left = base(gs[i-1]) if i else "<WORD_START>"
            right = base(gs[i+1]) if i+1 < len(gs) else "<WORD_END>"
            left_context[(g,left)] += 1
            right_context[(g,right)] += 1
            pair_context[(g,left,right)] += 1
            seen_in_sentence.add(g)
            if len(examples[g]) < 15 and word not in examples[g]:
                examples[g].append(word)
    for g in seen_in_sentence:
        sentence_counts[g] += 1

for g in aspirated:
    word_counts[g] = len(words[g])

write_csv(
    out/"mvy-aspirated-frequency.csv",
    ["sequence","base","unicode_sequence","frequency","unique_words","sentence_frequency","initial","medial","final","isolated","example_words"],
    [
        {"sequence":g,"base":g[:-1],"unicode_sequence":ucs(g),"frequency":freq[g],
         "unique_words":len(words[g]),"sentence_frequency":sentence_counts[g],
         "initial":positions[g]["initial"],"medial":positions[g]["medial"],
         "final":positions[g]["final"],"isolated":positions[g]["isolated"],
         "example_words":" | ".join(examples[g])}
        for g in sorted(aspirated, key=lambda x:(-freq[x],x))
    ]
)

write_csv(
    out/"mvy-aspirated-left-context.csv",
    ["sequence","left_context","frequency"],
    [{"sequence":g,"left_context":l,"frequency":n}
     for (g,l),n in left_context.most_common()]
)

write_csv(
    out/"mvy-aspirated-right-context.csv",
    ["sequence","right_context","frequency"],
    [{"sequence":g,"right_context":r,"frequency":n}
     for (g,r),n in right_context.most_common()]
)

write_csv(
    out/"mvy-aspirated-neighborhoods.csv",
    ["sequence","left_context","right_context","frequency"],
    [{"sequence":g,"left_context":l,"right_context":r,"frequency":n}
     for (g,l,r),n in pair_context.most_common()]
)

manifest = {
    "project":"FiKR&CD",
    "language":"Indus-Kohistani",
    "iso_639_3":"mvy",
    "milestone":"2.7",
    "title":"Aspirated Consonant Analysis",
    "corpus_rows":len(sentences),
    "word_occurrences":total_words,
    "established_aspirated_sequences":sorted(aspirated),
    "observed_aspirated_sequences":[
        {"sequence":g,"frequency":freq[g],"unique_words":len(words[g]),"sentence_frequency":sentence_counts[g]}
        for g in sorted(aspirated,key=lambda x:(-freq[x],x))
    ],
    "total_aspirated_occurrences":sum(freq.values()),
    "distinct_observed_aspirated_sequences":sum(1 for g in aspirated if freq[g] > 0),
    "position_totals":{
        p:sum(positions[g][p] for g in aspirated)
        for p in ["initial","medial","final","isolated"]
    },
    "outputs":sorted(p.name for p in out.glob("*") if p.is_file())
}
(out/"mvy-aspirated-manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")

report = [
    "# Milestone 2.7 — Aspirated Consonant Analysis",
    "",
    f"- Corpus rows: **{len(sentences):,}**",
    f"- Word occurrences: **{total_words:,}**",
    f"- Established aspirated sequences: **{len(aspirated):,}**",
    f"- Observed aspirated sequence types: **{sum(1 for g in aspirated if freq[g] > 0):,}**",
    f"- Aspirated occurrences: **{sum(freq.values()):,}**",
    "",
    "## Method",
    "",
    "The analysis treats consonant+ھ sequences as orthographic graphemic patterns. It reports frequency, lexical and sentence distribution, word position, and local grapheme neighborhoods. It does not convert these patterns into phonemic claims.",
    "",
    "## Outputs",
    ""
]
report.extend(f"- {p.name}" for p in sorted(out.glob("*")))
(out/"milestone-2.7-aspirated-report.md").write_text("\n".join(report)+"\n",encoding="utf-8")
print("\n".join(report))
