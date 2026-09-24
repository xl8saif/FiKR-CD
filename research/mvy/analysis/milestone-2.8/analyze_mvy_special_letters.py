from pathlib import Path
import csv, json, re, unicodedata
from collections import Counter, defaultdict
from itertools import combinations

ROOT = Path(__file__).resolve().parents[4]
SRC = ROOT / "research/mvy/source/common-voice-27/validated.tsv"
OUT = ROOT / "research/mvy/analysis/milestone-2.8/output"
OUT.mkdir(parents=True, exist_ok=True)

if not SRC.exists():
    raise SystemExit(f"Missing source: {SRC}")

SPECIAL = ["ݜ", "ڇ", "څ", "ڙ", "ݨ"]
SPECIAL_SET = set(SPECIAL)
TOKEN_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z0-9]+")

def is_mark(ch):
    return unicodedata.combining(ch) != 0 or unicodedata.category(ch).startswith("M")

def clusters(text):
    result, current = [], ""
    for ch in text:
        if is_mark(ch):
            if current:
                current += ch
            else:
                result.append(ch)
        else:
            if current:
                result.append(current)
            current = ch
    if current:
        result.append(current)
    return result

def base(grapheme):
    return next((ch for ch in grapheme if not is_mark(ch)), grapheme)

def unicode_sequence(text):
    return " ".join(f"U+{ord(ch):04X}" for ch in text)

def write_csv(path, fields, rows):
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

with SRC.open("r", encoding="utf-8-sig", newline="") as fh:
    reader = csv.DictReader(fh, delimiter="\\t")
    if "sentence" not in (reader.fieldnames or []):
        raise SystemExit(f"No sentence column: {reader.fieldnames}")
    sentences = [row.get("sentence") or "" for row in reader]

frequency = Counter()
word_sets = defaultdict(set)
sentence_frequency = Counter()
positions = defaultdict(Counter)
left_context = Counter()
right_context = Counter()
neighborhoods = Counter()
bigrams = Counter()
trigrams = Counter()
word_cooccurrence = Counter()
sentence_cooccurrence = Counter()
word_position = Counter()
examples = defaultdict(list)
total_words = 0
special_word_occurrences = 0
special_sentences = set()

for sentence_id, sentence in enumerate(sentences):
    sentence_specials = set()

    for word in TOKEN_RE.findall(sentence):
        total_words += 1
        gs = clusters(word)
        specials_in_word = []

        for i, grapheme in enumerate(gs):
            gbase = base(grapheme)
            if gbase not in SPECIAL_SET:
                continue

            specials_in_word.append(gbase)
            special_word_occurrences += 1
            frequency[gbase] += 1
            word_sets[gbase].add(word)

            pos = (
                "isolated" if len(gs) == 1 else
                "initial" if i == 0 else
                "final" if i == len(gs) - 1 else
                "medial"
            )
            positions[gbase][pos] += 1
            normalized = 0.0 if len(gs) <= 1 else round(i / (len(gs) - 1), 6)
            word_position[(gbase, pos, len(gs))] += 1

            left = base(gs[i - 1]) if i else "<WORD_START>"
            right = base(gs[i + 1]) if i + 1 < len(gs) else "<WORD_END>"
            left_context[(gbase, left)] += 1
            right_context[(gbase, right)] += 1
            neighborhoods[(gbase, left, right)] += 1

            if i > 0:
                bigrams[(base(gs[i - 1]), gbase)] += 1
            if i + 1 < len(gs):
                bigrams[(gbase, base(gs[i + 1]))] += 1
            if i > 1:
                trigrams[(base(gs[i - 2]), base(gs[i - 1]), gbase)] += 1
            if i + 2 < len(gs):
                trigrams[(gbase, base(gs[i + 1]), base(gs[i + 2]))] += 1

            sentence_specials.add(gbase)
            if len(examples[gbase]) < 20 and word not in examples[gbase]:
                examples[gbase].append(word)

        for a, b in combinations(sorted(set(specials_in_word)), 2):
            word_cooccurrence[(a, b)] += 1

    if sentence_specials:
        special_sentences.add(sentence_id)
        for a, b in combinations(sorted(sentence_specials), 2):
            sentence_cooccurrence[(a, b)] += 1

write_csv(
    OUT / "mvy-special-letter-frequency.csv",
    ["letter", "unicode", "frequency", "unique_words", "sentence_frequency",
     "initial", "medial", "final", "isolated", "example_words"],
    [
        {
            "letter": g,
            "unicode": unicode_sequence(g),
            "frequency": frequency[g],
            "unique_words": len(word_sets[g]),
            "sentence_frequency": sentence_frequency[g],
            "initial": positions[g]["initial"],
            "medial": positions[g]["medial"],
            "final": positions[g]["final"],
            "isolated": positions[g]["isolated"],
            "example_words": " | ".join(examples[g]),
        }
        for g in SPECIAL
    ],
)

# sentence_frequency is tracked independently so repeated occurrences in one sentence count once.
sentence_frequency.clear()
for sentence in sentences:
    present = {base(g) for word in TOKEN_RE.findall(sentence) for g in clusters(word) if base(g) in SPECIAL_SET}
    for g in present:
        sentence_frequency[g] += 1

write_csv(
    OUT / "mvy-special-letter-frequency.csv",
    ["letter", "unicode", "frequency", "unique_words", "sentence_frequency",
     "initial", "medial", "final", "isolated", "example_words"],
    [
        {
            "letter": g,
            "unicode": unicode_sequence(g),
            "frequency": frequency[g],
            "unique_words": len(word_sets[g]),
            "sentence_frequency": sentence_frequency[g],
            "initial": positions[g]["initial"],
            "medial": positions[g]["medial"],
            "final": positions[g]["final"],
            "isolated": positions[g]["isolated"],
            "example_words": " | ".join(examples[g]),
        }
        for g in SPECIAL
    ],
)

write_csv(
    OUT / "mvy-special-letter-left-context.csv",
    ["letter", "left_context", "frequency"],
    [{"letter": g, "left_context": l, "frequency": n}
     for (g, l), n in left_context.most_common()],
)

write_csv(
    OUT / "mvy-special-letter-right-context.csv",
    ["letter", "right_context", "frequency"],
    [{"letter": g, "right_context": r, "frequency": n}
     for (g, r), n in right_context.most_common()],
)

write_csv(
    OUT / "mvy-special-letter-neighborhoods.csv",
    ["letter", "left_context", "right_context", "frequency"],
    [{"letter": g, "left_context": l, "right_context": r, "frequency": n}
     for (g, l, r), n in neighborhoods.most_common()],
)

write_csv(
    OUT / "mvy-special-letter-bigrams.csv",
    ["left_grapheme", "right_grapheme", "frequency", "involves_special_letter"],
    [{"left_grapheme": a, "right_grapheme": b, "frequency": n,
      "involves_special_letter": "yes"}
     for (a, b), n in bigrams.most_common()
     if a in SPECIAL_SET or b in SPECIAL_SET],
)

write_csv(
    OUT / "mvy-special-letter-trigrams.csv",
    ["grapheme_1", "grapheme_2", "grapheme_3", "frequency", "involves_special_letter"],
    [{"grapheme_1": a, "grapheme_2": b, "grapheme_3": c, "frequency": n,
      "involves_special_letter": "yes"}
     for (a, b, c), n in trigrams.most_common()
     if a in SPECIAL_SET or b in SPECIAL_SET or c in SPECIAL_SET],
)

write_csv(
    OUT / "mvy-special-letter-cooccurrence.csv",
    ["letter_a", "letter_b", "word_cooccurrence", "sentence_cooccurrence"],
    [
        {
            "letter_a": a,
            "letter_b": b,
            "word_cooccurrence": word_cooccurrence[(a, b)],
            "sentence_cooccurrence": sentence_cooccurrence[(a, b)],
        }
        for a, b in combinations(SPECIAL, 2)
    ],
)

write_csv(
    OUT / "mvy-special-letter-word-position.csv",
    ["letter", "position", "word_grapheme_length", "frequency"],
    [
        {"letter": g, "position": p, "word_grapheme_length": length, "frequency": n}
        for (g, p, length), n in sorted(word_position.items(), key=lambda x: (SPECIAL.index(x[0][0]), x[0][1], x[0][2]))
    ],
)

manifest = {
    "project": "FiKR&CD",
    "language": "Indus-Kohistani",
    "iso_639_3": "mvy",
    "milestone": "2.8",
    "title": "Special-Letter Context Analysis",
    "corpus_rows": len(sentences),
    "word_occurrences": total_words,
    "special_letters": SPECIAL,
    "special_letter_occurrences": special_word_occurrences,
    "sentences_with_special_letters": len(special_sentences),
    "special_letter_summary": [
        {
            "letter": g,
            "unicode": unicode_sequence(g),
            "frequency": frequency[g],
            "unique_words": len(word_sets[g]),
            "sentence_frequency": sentence_frequency[g],
            "positions": dict(positions[g]),
            "examples": examples[g],
        }
        for g in SPECIAL
    ],
    "cooccurrence_pairs": [
        {
            "letter_a": a,
            "letter_b": b,
            "word_cooccurrence": word_cooccurrence[(a, b)],
            "sentence_cooccurrence": sentence_cooccurrence[(a, b)],
        }
        for a, b in combinations(SPECIAL, 2)
    ],
    "method_notes": [
        "Special letters are analyzed as base graphemes after Unicode combining-mark grouping.",
        "Word and sentence co-occurrence count presence, not repeated occurrences.",
        "Context tables report adjacent base graphemes and explicit word-boundary markers.",
        "Position is defined over grapheme-cluster indices, not Unicode code points.",
        "The analysis is orthographic and does not infer phonemic values."
    ],
    "outputs": sorted(p.name for p in OUT.glob("*") if p.is_file()),
}

(OUT / "mvy-special-letter-manifest.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
)

report = [
    "# Milestone 2.8 — Special-Letter Context Analysis",
    "",
    f"- Corpus rows: **{len(sentences):,}**",
    f"- Word occurrences: **{total_words:,}**",
    f"- Established special letters: **{len(SPECIAL):,}**",
    f"- Special-letter occurrences: **{special_word_occurrences:,}**",
    f"- Sentences containing at least one special letter: **{len(special_sentences):,}**",
    "",
    "## Scope",
    "",
    "This milestone examines the five established Mvy special letters: ݜ, ڇ, څ, ڙ, and ݨ.",
    "It measures frequency, lexical and sentence distribution, word position, adjacent contexts, local neighborhoods, bigrams, trigrams, and co-occurrence.",
    "",
    "## Method",
    "",
    "Analysis is performed on Unicode grapheme clusters after grouping combining marks. Contexts use base graphemes and explicit word-boundary markers. Results are descriptive orthographic statistics and do not make phonemic claims.",
    "",
    "## Outputs",
    "",
]
report.extend(f"- {p.name}" for p in sorted(OUT.glob("*")))
(OUT / "milestone-2.8-special-letter-report.md").write_text(
    "\n".join(report) + "\n", encoding="utf-8"
)

print("\n".join(report))
