from pathlib import Path
import csv, json, re, unicodedata
from collections import Counter, defaultdict

root = Path(__file__).resolve().parents[4]
src = root / "research/mvy/source/common-voice-27/validated.tsv"
out = root / "research/mvy/analysis/milestone-2.4/output"
out.mkdir(parents=True, exist_ok=True)

if not src.exists():
    raise SystemExit(f"Missing source: {src}")

token_re = re.compile(r"[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFFA-Za-z0-9]+")

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

with src.open("r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f, delimiter="\\t")
    if "sentence" not in reader.fieldnames:
        raise SystemExit(f"No sentence column: {reader.fieldnames}")
    sentences = [r.get("sentence") or "" for r in reader]

bigrams = Counter()
trigrams = Counter()
initial = Counter()
medial = Counter()
final = Counter()
isolated = Counter()
word_lengths = Counter()
shape_counts = Counter()
special_context = Counter()
aspirated_context = Counter()
base_sequences = Counter()
variant_words = defaultdict(set)
lexical = Counter()
total_tokens = 0

special = set("ݜ ڇ څ ڙ ݨ")

for sentence in sentences:
    for word in token_re.findall(sentence):
        lexical[word] += 1
        total_tokens += 1
        gs = clusters(word)
        if not gs:
            continue
        word_lengths[len(gs)] += 1
        bases = tuple(base(g) for g in gs)
        base_sequences[" ".join(bases)] += 1

        if len(gs) == 1:
            isolated[bases[0]] += 1
        else:
            initial[bases[0]] += 1
            final[bases[-1]] += 1
            for g in gs[1:-1]:
                medial[base(g)] += 1

        for g in gs:
            b = base(g)
            if b in special:
                left = base(gs[gs.index(g)-1]) if gs.index(g) > 0 else "<WORD_START>"
                right = base(gs[gs.index(g)+1]) if gs.index(g)+1 < len(gs) else "<WORD_END>"
                special_context[(b, left, right)] += 1

        for i in range(len(gs) - 1):
            pair = (base(gs[i]), base(gs[i + 1]))
            bigrams[pair] += 1
            if gs[i + 1] == "ھ":
                aspirated_context[pair] += 1

        for i in range(len(gs) - 2):
            trigrams[(base(gs[i]), base(gs[i+1]), base(gs[i+2]))] += 1

        shape = "".join("V" if base(g) in "اےییوؤئ" else "C" for g in gs)
        shape_counts[shape] += 1

        normalized = unicodedata.normalize("NFC", word)
        if normalized != word:
            variant_words[normalized].add(word)

# Explicit orthographic diagnostics.
observed_bases = Counter()
for sentence in sentences:
    for word in token_re.findall(sentence):
        for g in clusters(word):
            observed_bases[base(g)] += 1

write_csv(
    out / "mvy-orthographic-bigrams.csv",
    ["grapheme_1", "grapheme_2", "sequence", "frequency"],
    [{"grapheme_1": a, "grapheme_2": b, "sequence": a+b, "frequency": n}
     for (a,b), n in bigrams.most_common()]
)

write_csv(
    out / "mvy-orthographic-trigrams.csv",
    ["grapheme_1", "grapheme_2", "grapheme_3", "sequence", "frequency"],
    [{"grapheme_1": a, "grapheme_2": b, "grapheme_3": c, "sequence": a+b+c, "frequency": n}
     for (a,b,c), n in trigrams.most_common()]
)

write_csv(
    out / "mvy-word-position-distribution.csv",
    ["grapheme", "initial", "medial", "final", "isolated", "total"],
    [{"grapheme": g, "initial": initial[g], "medial": medial[g], "final": final[g],
      "isolated": isolated[g],
      "total": initial[g] + medial[g] + final[g] + isolated[g]}
     for g in sorted(observed_bases, key=lambda x: (-observed_bases[x], x))]
)

write_csv(
    out / "mvy-word-length-distribution.csv",
    ["grapheme_cluster_length", "word_occurrences"],
    [{"grapheme_cluster_length": k, "word_occurrences": n}
     for k,n in sorted(word_lengths.items())]
)

write_csv(
    out / "mvy-word-shape-distribution.csv",
    ["shape", "word_occurrences"],
    [{"shape": s, "word_occurrences": n}
     for s,n in shape_counts.most_common()]
)

write_csv(
    out / "mvy-special-letter-neighborhoods.csv",
    ["special_letter", "left_base", "right_base", "frequency"],
    [{"special_letter": a, "left_base": b, "right_base": c, "frequency": n}
     for (a,b,c), n in special_context.most_common()]
)

write_csv(
    out / "mvy-aspirated-orthographic-contexts.csv",
    ["base", "following", "sequence", "frequency"],
    [{"base": a, "following": b, "sequence": a+b, "frequency": n}
     for (a,b), n in aspirated_context.most_common()]
)

write_csv(
    out / "mvy-normalization-variants.csv",
    ["normalized_form", "observed_variant_count", "observed_variants"],
    [{"normalized_form": n, "observed_variant_count": len(v), "observed_variants": " | ".join(sorted(v))}
     for n,v in sorted(variant_words.items(), key=lambda x: (-len(x[1]), x[0]))]
)

manifest = {
    "project": "FiKR&CD",
    "language": "Indus-Kohistani",
    "iso_639_3": "mvy",
    "milestone": "2.4",
    "title": "Orthographic Pattern Analysis",
    "corpus_rows": len(sentences),
    "lexical_token_occurrences": total_tokens,
    "unique_lexical_types": len(lexical),
    "distinct_base_graphemes": len(observed_bases),
    "distinct_bigrams": len(bigrams),
    "distinct_trigrams": len(trigrams),
    "distinct_word_shapes": len(shape_counts),
    "normalization_variant_groups": len(variant_words),
    "top_bigrams": [{"sequence": a+b, "frequency": n} for (a,b),n in bigrams.most_common(25)],
    "top_trigrams": [{"sequence": a+b+c, "frequency": n} for (a,b,c),n in trigrams.most_common(25)],
    "top_word_shapes": [{"shape": s, "frequency": n} for s,n in shape_counts.most_common(25)],
    "outputs": sorted(p.name for p in out.glob("*") if p.is_file())
}

(out / "mvy-orthographic-pattern-manifest.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2),
    encoding="utf-8"
)

report = [
    "# Milestone 2.4 — Orthographic Pattern Analysis",
    "",
    f"- Corpus rows: **{len(sentences):,}**",
    f"- Lexical token occurrences: **{total_tokens:,}**",
    f"- Unique lexical types: **{len(lexical):,}**",
    f"- Distinct base graphemes observed: **{len(observed_bases):,}**",
    f"- Distinct orthographic bigrams: **{len(bigrams):,}**",
    f"- Distinct orthographic trigrams: **{len(trigrams):,}**",
    f"- Distinct word-shape patterns: **{len(shape_counts):,}**",
    f"- NFC normalization-variant groups: **{len(variant_words):,}**",
    "",
    "## Method",
    "",
    "The analysis operates on grapheme clusters derived from the validated corpus. It measures recurring adjacent grapheme sequences, word-position distributions, word lengths, abstract C/V shapes, special-letter neighborhoods, aspirated orthographic contexts, and Unicode NFC normalization variants. It does not infer phonemes, morphology, or etymology.",
    "",
    "## Outputs",
    ""
]
report.extend(f"- {p.name}" for p in sorted(out.glob("*")))
(out / "milestone-2.4-orthographic-report.md").write_text("\n".join(report) + "\n", encoding="utf-8")
print("\n".join(report))
