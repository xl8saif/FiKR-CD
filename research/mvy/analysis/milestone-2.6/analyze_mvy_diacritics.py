from pathlib import Path
import csv, json, re, unicodedata
from collections import Counter, defaultdict

root = Path(__file__).resolve().parents[4]
src = root / "research/mvy/source/common-voice-27/validated.tsv"
out = root / "research/mvy/analysis/milestone-2.6/output"
out.mkdir(parents=True, exist_ok=True)
if not src.exists():
    raise SystemExit(f"Missing source: {src}")

token_re = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z0-9]+")

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

sentences = []
with src.open("r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f, delimiter="\t")
    if "sentence" not in reader.fieldnames:
        raise SystemExit(f"No sentence column: {reader.fieldnames}")
    sentences = [r.get("sentence") or "" for r in reader]

mark_freq = Counter()
mark_base_context = Counter()
cluster_freq = Counter()
mark_stack_freq = Counter()
attached_clusters = Counter()
unattached_marks = Counter()
word_marked = Counter()
sentence_marked = Counter()
mark_words = defaultdict(set)
mark_examples = defaultdict(list)
total_chars = 0
total_clusters = 0
total_words = 0
marked_words = 0
marked_sentences = 0

for sentence in sentences:
    sentence_has_mark = False
    for ch in sentence:
        total_chars += 1
        if ismark(ch):
            mark_freq[ch] += 1
    for word in token_re.findall(sentence):
        total_words += 1
        gs = clusters(word)
        total_clusters += len(gs)
        has_mark = False
        for g in gs:
            cluster_freq[g] += 1
            marks = [c for c in g if ismark(c)]
            if marks:
                has_mark = True
                attached_clusters[base(g)] += 1
                stack = tuple(marks)
                mark_stack_freq[stack] += 1
                for m in marks:
                    mark_words[m].add(word)
                    if len(mark_examples[m]) < 10 and word not in mark_examples[m]:
                        mark_examples[m].append(word)
                    mark_base_context[(m, base(g))] += 1
            for m in marks:
                if ismark(m):
                    mark_freq[m] += 0
        if has_mark:
            marked_words += 1
    if sentence_has_mark:
        marked_sentences += 1

# Detect unattached combining marks directly from token-level grapheme parsing.
for sentence in sentences:
    for word in token_re.findall(sentence):
        gs = clusters(word)
        for g in gs:
            if all(ismark(c) for c in g):
                for c in g:
                    unattached_marks[c] += 1

for sentence in sentences:
    if any(ismark(c) for c in sentence):
        marked_sentences += 1

write_csv(
    out / "mvy-diacritic-frequency.csv",
    ["mark","unicode","unicode_name","category","combining_class","frequency","unique_words","example_words"],
    [
        {
            "mark": m,
            "unicode": f"U+{ord(m):04X}",
            "unicode_name": unicodedata.name(m, "UNKNOWN"),
            "category": unicodedata.category(m),
            "combining_class": unicodedata.combining(m),
            "frequency": n,
            "unique_words": len(mark_words[m]),
            "example_words": " | ".join(mark_examples[m])
        }
        for m,n in sorted(mark_freq.items(), key=lambda x:(-x[1], ord(x[0])))
    ]
)

write_csv(
    out / "mvy-diacritic-base-context.csv",
    ["mark","base_grapheme","frequency"],
    [
        {"mark":m,"base_grapheme":b,"frequency":n}
        for (m,b),n in sorted(mark_base_context.items(), key=lambda x:(-x[1], x[0]))
    ]
)

write_csv(
    out / "mvy-diacritic-stacks.csv",
    ["mark_stack","unicode_sequence","frequency"],
    [
        {"mark_stack":"".join(stack),"unicode_sequence":ucs("".join(stack)),"frequency":n}
        for stack,n in sorted(mark_stack_freq.items(), key=lambda x:(-x[1], x[0]))
    ]
)

write_csv(
    out / "mvy-marked-graphemes.csv",
    ["grapheme","base_grapheme","unicode_sequence","frequency"],
    [
        {"grapheme":g,"base_grapheme":base(g),"unicode_sequence":ucs(g),"frequency":n}
        for g,n in sorted(cluster_freq.items(), key=lambda x:(-x[1], x[0]))
        if any(ismark(c) for c in g)
    ]
)

write_csv(
    out / "mvy-unattached-combining-marks.csv",
    ["mark","unicode","unicode_name","frequency"],
    [
        {"mark":m,"unicode":f"U+{ord(m):04X}","unicode_name":unicodedata.name(m,"UNKNOWN"),"frequency":n}
        for m,n in sorted(unattached_marks.items(), key=lambda x:(-x[1], ord(x[0])))
    ]
)

marked_cluster_occurrences = sum(n for g,n in cluster_freq.items() if any(ismark(c) for c in g))
distinct_marks = len(mark_freq)
distinct_marked_graphemes = sum(1 for g in cluster_freq if any(ismark(c) for c in g))

manifest = {
    "project":"FiKR&CD",
    "language":"Indus-Kohistani",
    "iso_639_3":"mvy",
    "milestone":"2.6",
    "title":"Diacritic & Combining-Mark Analysis",
    "corpus_rows":len(sentences),
    "word_occurrences":total_words,
    "grapheme_cluster_occurrences":total_clusters,
    "unicode_codepoint_occurrences":total_chars,
    "distinct_combining_marks":distinct_marks,
    "combining_mark_occurrences":sum(mark_freq.values()),
    "distinct_marked_graphemes":distinct_marked_graphemes,
    "marked_grapheme_occurrences":marked_cluster_occurrences,
    "marked_word_occurrences":marked_words,
    "marked_sentence_occurrences":sum(1 for s in sentences if any(ismark(c) for c in s)),
    "unattached_mark_occurrences":sum(unattached_marks.values()),
    "top_marks":[{"mark":m,"frequency":n,"unicode":f"U+{ord(m):04X}"} for m,n in mark_freq.most_common(25)],
    "top_marked_graphemes":[{"grapheme":g,"frequency":n} for g,n in cluster_freq.most_common(50) if any(ismark(c) for c in g)][:50],
    "outputs":sorted(p.name for p in out.glob("*") if p.is_file())
}
(out/"mvy-diacritic-manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")

report = [
    "# Milestone 2.6 — Diacritic & Combining-Mark Analysis",
    "",
    f"- Corpus rows: **{len(sentences):,}**",
    f"- Word occurrences: **{total_words:,}**",
    f"- Grapheme-cluster occurrences: **{total_clusters:,}**",
    f"- Unicode code-point occurrences: **{total_chars:,}**",
    f"- Distinct combining marks: **{distinct_marks:,}**",
    f"- Combining-mark occurrences: **{sum(mark_freq.values()):,}**",
    f"- Distinct marked graphemes: **{distinct_marked_graphemes:,}**",
    f"- Marked grapheme occurrences: **{marked_cluster_occurrences:,}**",
    f"- Unattached combining-mark occurrences: **{sum(unattached_marks.values()):,}**",
    "",
    "## Method",
    "",
    "Unicode combining marks are identified by Unicode combining class or mark category and associated with the preceding base character when forming grapheme clusters. This milestone is descriptive: it reports encoding and orthographic behavior without asserting phonological or grammatical interpretation.",
    "",
    "## Outputs",
    ""
]
report.extend(f"- {p.name}" for p in sorted(out.glob("*")))
(out/"milestone-2.6-diacritic-report.md").write_text("\n".join(report)+"\n",encoding="utf-8")
print("\n".join(report))
