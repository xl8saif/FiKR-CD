from pathlib import Path
import csv, json, re, unicodedata
from collections import Counter, defaultdict

root = Path(__file__).resolve().parents[4]
src = root / "research/mvy/source/common-voice-27/validated.tsv"
out = root / "research/mvy/analysis/milestone-2.5/output"
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

def write_csv(path, fields, rows):
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

lexical = Counter()
word_sentences = defaultdict(set)
word_forms = defaultdict(set)
lengths = Counter()
sentence_token_counts = Counter()
total_tokens = 0

with src.open("r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f, delimiter="\t")
    if "sentence" not in reader.fieldnames:
        raise SystemExit(f"No sentence column: {reader.fieldnames}")
    sentences = [r.get("sentence") or "" for r in reader]

for sentence_id, sentence in enumerate(sentences):
    tokens = token_re.findall(sentence)
    sentence_token_counts[len(tokens)] += 1
    for word in tokens:
        lexical[word] += 1
        word_sentences[word].add(sentence_id)
        word_forms[unicodedata.normalize("NFC", word)].add(word)
        lengths[len(clusters(word))] += 1
        total_tokens += 1

types = len(lexical)
hapax = sum(n == 1 for n in lexical.values())
dis = sum(1 for n in lexical.values() if n == 2)
freq_3_5 = sum(1 for n in lexical.values() if 3 <= n <= 5)
freq_6_10 = sum(1 for n in lexical.values() if 6 <= n <= 10)
freq_11_50 = sum(1 for n in lexical.values() if 11 <= n <= 50)
freq_51_plus = sum(1 for n in lexical.values() if n >= 51)

def yules_k(counter, total):
    if total <= 0:
        return None
    m1 = sum(n for n in counter.values() if n == 1)
    m2 = sum(n*n for n in counter.values())
    return 10000 * (m2 - total) / (total * total)

def herdan_v(types_count, tokens_count):
    if types_count <= 0 or tokens_count <= 1:
        return None
    return __import__("math").log(types_count) / __import__("math").log(tokens_count)

def entropy(counter, total):
    import math
    if total == 0:
        return 0.0
    return -sum((n/total) * math.log2(n/total) for n in counter.values() if n)

write_csv(
    out / "mvy-lexical-frequency.csv",
    ["rank","word","frequency","sentence_frequency","relative_frequency_per_10000","grapheme_length","hapax","dislegomenon"],
    [
        {
            "rank": i,
            "word": word,
            "frequency": n,
            "sentence_frequency": len(word_sentences[word]),
            "relative_frequency_per_10000": round(n / total_tokens * 10000, 6),
            "grapheme_length": len(clusters(word)),
            "hapax": n == 1,
            "dislegomenon": n == 2
        }
        for i, (word, n) in enumerate(lexical.most_common(), 1)
    ]
)

write_csv(
    out / "mvy-hapax-legomena.csv",
    ["rank","word","frequency"],
    [{"rank": i, "word": word, "frequency": n}
     for i,(word,n) in enumerate(sorted(lexical.items(), key=lambda x:x[0]) if False else sorted(((w,n) for w,n in lexical.items() if n == 1), key=lambda x:x[0]), 1)]
)

write_csv(
    out / "mvy-frequency-spectrum.csv",
    ["frequency","type_count","token_count"],
    [
        {"frequency": k, "type_count": sum(n == k for n in lexical.values()),
         "token_count": sum(n for n in lexical.values() if n == k)}
        for k in sorted(set(lexical.values()))
    ]
)

write_csv(
    out / "mvy-word-length-lexical.csv",
    ["grapheme_length","type_count","token_count"],
    [
        {"grapheme_length": k,
         "type_count": sum(1 for w in lexical if len(clusters(w)) == k),
         "token_count": n}
        for k,n in sorted(lengths.items())
    ]
)

top50 = lexical.most_common(50)
top100 = lexical.most_common(100)
top1000 = lexical.most_common(1000)

manifest = {
    "project": "FiKR&CD",
    "language": "Indus-Kohistani",
    "iso_639_3": "mvy",
    "milestone": "2.5",
    "title": "Lexical Frequency & Hapax Analysis",
    "corpus_rows": len(sentences),
    "token_occurrences": total_tokens,
    "lexical_types": types,
    "type_token_ratio": round(types / total_tokens, 8) if total_tokens else None,
    "hapax_types": hapax,
    "hapax_ratio_types": round(hapax / types, 8) if types else None,
    "dislegomena_types": dis,
    "frequency_bands": {
        "1": hapax,
        "2": dis,
        "3-5": freq_3_5,
        "6-10": freq_6_10,
        "11-50": freq_11_50,
        "51+": freq_51_plus
    },
    "yules_k": round(yules_k(lexical, total_tokens), 6) if total_tokens else None,
    "herdan_v": round(herdan_v(types, total_tokens), 8) if total_tokens else None,
    "lexical_entropy_bits": round(entropy(lexical, total_tokens), 8),
    "top_50": [{"rank": i, "word": w, "frequency": n} for i,(w,n) in enumerate(top50,1)],
    "top_100": [{"rank": i, "word": w, "frequency": n} for i,(w,n) in enumerate(top100,1)],
    "top_1000": [{"rank": i, "word": w, "frequency": n} for i,(w,n) in enumerate(top1000,1)],
    "outputs": sorted(p.name for p in out.glob("*") if p.is_file())
}

(out / "mvy-lexical-frequency-manifest.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2),
    encoding="utf-8"
)

report = [
    "# Milestone 2.5 — Lexical Frequency & Hapax Analysis",
    "",
    f"- Corpus rows: **{len(sentences):,}**",
    f"- Token occurrences: **{total_tokens:,}**",
    f"- Lexical types: **{types:,}**",
    f"- Type-token ratio: **{types / total_tokens:.6f}**" if total_tokens else "- Type-token ratio: **0**",
    f"- Hapax legomena: **{hapax:,}**",
    f"- Dislegomena: **{dis:,}**",
    f"- Yule's K: **{yules_k(lexical, total_tokens):.4f}**" if total_tokens else "- Yule's K: **0**",
    f"- Herdan's V: **{herdan_v(types, total_tokens):.6f}**" if total_tokens else "- Herdan's V: **0**",
    f"- Lexical entropy: **{entropy(lexical, total_tokens):.4f} bits**",
    "",
    "## Frequency spectrum",
    "",
    f"- Frequency 1: **{hapax:,} types**",
    f"- Frequency 2: **{dis:,} types**",
    f"- Frequency 3–5: **{freq_3_5:,} types**",
    f"- Frequency 6–10: **{freq_6_10:,} types**",
    f"- Frequency 11–50: **{freq_11_50:,} types**",
    f"- Frequency 51+: **{freq_51_plus:,} types**",
    "",
    "## Method",
    "",
    "Tokens are extracted from the validated corpus using the same Arabic-script-aware tokenization family used in the Mvy analysis series. Frequencies are descriptive corpus statistics. Hapax and frequency-spectrum results are not morphological analyses and do not imply lemma boundaries.",
    "",
    "## Outputs",
    ""
]
report.extend(f"- {p.name}" for p in sorted(out.glob("*")))
(out / "milestone-2.5-lexical-report.md").write_text("\n".join(report) + "\n", encoding="utf-8")
print("\n".join(report))
