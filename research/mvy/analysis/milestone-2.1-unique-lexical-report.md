# Mvy Milestone 2.1 — Unique-Sentence Lexical Analysis & Orthographic Variant Detection

## Dataset

This pass deduplicates the validated Common Voice 27.0 mvy clip metadata by `sentence_id`, producing 6,582 unique sentence texts from 16,612 validated clip records.

The source records are not modified.

## Lexical profile

The 6,582 unique sentences contain 9,903 distinct surface token types under the Unicode-aware tokenizer used in the analysis.

The most frequent forms include `تُھو`, `مہ`, `آں`, `نہ`, `تھی`, `لا`, `چے`, `تے`, `کھیں`, `ہِن`, `نی`, `تھہ`, `یاں`, and `ݜُو`.

Because repeated recordings were removed before this pass, these frequencies are more useful for lexical analysis than the clip-level frequencies in Milestone 2.

## Word-length profile

The modal surface-token lengths are 3, 2, 4, and 5 Unicode characters. Very long tokens occur but are rare: 14-character tokens occur only three times in the unique-sentence corpus.

## Character n-grams

Frequent bigrams include forms such as `یں`, `ُو`, `اں`, `ھی`, `ن٘`, `یا`, `لا`, `َی`, `ان`, and `تھ`.

Frequent trigrams include `َیں`, `ُھو`, `تُھ`, `تھی`, `ہُو`, `ان٘`, `یاں`, `ھیں`, and `کھی`.

These frequencies provide a baseline for future grapheme-level ASR/tokenization work.

## Orthographic variant detection

A conservative heuristic normalization was used only to detect candidate equivalence classes:

- Arabic yeh `ي` → Persian yeh `ی`
- Arabic kaf `ك` → Persian/Urdu kaf `ک`
- alef maqsura `ى` → yeh `ی`
- Arabic heh with yeh above `ۀ` → heh `ہ`
- Arabic teh marbuta `ة` → heh `ہ`

This is a detection heuristic, not a linguistic claim that the forms are interchangeable.

The analysis identified 18 non-identical source forms that collapse into candidate variant clusters under these mappings and/or NFC canonicalization. Several are clearly punctuation/combining-mark ordering differences rather than lexical spelling differences, for example forms involving `مکَّیں`, `حضورِؐ`, and `محمَّد`.

The Arabic-yeh cases are particularly sparse. The validated corpus contains only 10 U+064A occurrences compared with 48,486 U+06CC occurrences. This supports flagging them for manual review rather than normalization.

## Edit-distance candidates

A preliminary distance-1 search over low-frequency word types identifies many near-neighbor pairs. These are candidate review items, not automatic corrections. Examples include pairs differing by one vowel/diacritic or one consonant, as well as potentially distinct lexical items.

The machine-readable outputs deliberately preserve the distinction between:
1. likely encoding/orthographic variants,
2. combining-mark ordering variants,
3. genuine lexical near-neighbors,
4. possible transcription errors.

No automatic correction is applied.

## Research significance

This pass establishes a unique-sentence lexical baseline for mvy and identifies concrete orthographic review targets. It also provides character n-gram statistics suitable for later grapheme modeling.

The next stage should use linguistic constraints and the FiKR&CD orthographic inventory to classify candidate variants. In particular, U+075C `ݜ` and the other language-specific letters should be treated as phonographic evidence, not generic Arabic-script noise.

## Output files

- `mvy-unique-word-frequency-top500.csv`
- `mvy-orthographic-variant-candidates.csv`
- `mvy-character-ngrams.csv`
- `mvy-milestone-2.1-summary.json`

## Important limitation

This remains a Common Voice-only analysis. The separate 8,141-line FiKR&CD Mvy text corpus archive has not been extracted in the current environment, so lexical overlap between the two independent sources remains pending.
