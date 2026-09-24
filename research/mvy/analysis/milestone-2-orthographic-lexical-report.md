# Mvy (Indus-Kohistani) — Milestone 2 Orthographic & Lexical Analysis

## Scope

Analysis performed on the Common Voice 27.0 mvy metadata deposited under `research/mvy/source/common-voice-27/` in the FiKR-CD repository.

The analysis is deliberately non-destructive: source TSVs are treated as immutable. Unicode normalization is measured diagnostically; no normalization is applied to the source data.

The separate archive `1765213289901-Mvy_text_corpus.tar.gz` is present in the repository but cannot be decoded/extracted through the current GitHub connector because it is a binary gzip archive. Therefore, this report does not claim cross-source statistics for that archive.

## Source inventory

| File | Records | Columns |
|---|---:|---:|
| validated.tsv | 16,612 | 13 |
| validated_sentences.tsv | 6,635 | 7 |
| train.tsv | 2,558 | 13 |
| dev.tsv | 1,948 | 13 |
| test.tsv | 2,076 | 13 |
| other.tsv | 1,303 | 13 |
| invalidated.tsv | 570 | 13 |
| unvalidated_sentences.tsv | 221 | 8 |
| reported.tsv | 90 | 4 |
| clip_durations.tsv | 18,485 | 2 |

## Core validated corpus

The validated clip metadata contains 16,612 clip records representing 6,582 unique sentence IDs. Mean clip multiplicity is 2.524 clips per sentence; median is 2; range is 1–12.

There are 6,582 unique sentence IDs in the union of train/dev/test. Train, development, and test have zero pairwise sentence-ID overlap:

- train ∩ dev: 0
- train ∩ test: 0
- dev ∩ test: 0

This indicates sentence-level separation among the three principal splits. The `other` and `invalidated` collections are not independent held-out sets: they share sentence IDs with the principal splits.

The validated corpus contains 35,535 up-votes and 1,341 down-votes.

## Lexical statistics — validated.tsv

Tokenization used a Unicode-aware letter/mark/number tokenizer and did not modify source text.

- Surface tokens: 135,067
- Distinct token types: 9,903
- Type-token ratio: 0.0733
- Hapax legomena: 967
- Dis legomena: 3,524
- Mean tokens per clip: 8.131
- Character count: 661,813 Unicode characters

The relatively low raw TTR is expected for a multi-clip corpus in which the same sentence is recorded repeatedly. Lexical diversity should therefore also be evaluated on the 6,582 unique sentence texts rather than only on clip rows.

Most frequent surface forms include: `تُھو`, `مہ`, `آں`, `نہ`, `تھی`, `لا`, `چے`, `تے`, `نی`, and `ہِن`.

## Unicode and orthography

The validated corpus contains 115 distinct Unicode code points.

Most frequent code points include:

- U+0020 SPACE
- U+0627 ا
- U+06CC ی
- U+0648 و
- U+06BA ں
- U+06C1 ہ
- U+062A ت
- U+0645 م
- U+0644 ل
- U+0646 ن
- U+064F ُ
- U+0631 ر
- U+06BE ھ
- U+06A9 ک
- U+0633 س
- U+0628 ب
- U+0650 ِ
- U+064E َ
- U+06D2 ے
- U+06AF گ
- U+06E1 ٱ/related Qur'anic mark usage
- U+075C ݜ

The corpus therefore clearly uses an Arabic-script orthography with Persian/Urdu extensions and Indus-Kohistani-specific characters rather than plain Arabic orthography.

### Yeh/Kaf variants

Validated corpus counts:

- U+06CC ARABIC LETTER FARSI YEH: 48,486
- U+064A ARABIC LETTER YEH: 10
- U+06A9 ARABIC LETTER KEHEH: 18,756
- U+0643 ARABIC LETTER KAF: 0

The 10 occurrences of U+064A are orthographic variant candidates requiring review. They should not be automatically normalized to U+06CC without linguistic/contextual verification.

Kaf usage is consistent: U+06A9 is used and U+0643 is absent in validated text.

### Alef/Hamza

Validated corpus:

- U+0622 آ: 4,074
- U+0623 أ: 0
- U+0625 إ: 0

This is a strong regularity in the sampled orthography. The presence of U+0622 should be preserved as source orthography.

### Combining marks

Validated text contains 52,304 combining-mark code points. This is substantial and is linguistically relevant: the corpus makes active use of vowel/phonological marking rather than representing the language as an unvocalized Arabic-script corpus.

There are 30 clip texts for which NFC normalization would change the string. This is a small but non-zero normalization-sensitive subset. NFD differs for 9,622 strings because precomposed characters decompose under canonical decomposition; this is not, by itself, evidence of corruption.

No zero-width characters (U+200B/U+200C/U+200D/U+FEFF) and no non-breaking spaces were detected in validated text.

## Script inventory

For validated text characters:

- Arabic-script characters: 495,999
- Latin-script characters: 523
- Other/non-Arabic/non-Latin characters and marks: 40,535

Latin-script material is largely associated with embedded technical/product names and acronyms such as ChatGPT and AI. It should not be removed during corpus cleaning.

## Unicode-sensitive examples

The 30 NFC-sensitive texts include forms containing dense combining-mark sequences, e.g. `مکَّیں`, `رسولِؐ`, `سن٘دے`, and other explicitly marked forms.

These should be preserved in the raw corpus. A future normalized analytical layer should record both original and normalized representations and report every changed string.

## Split-level lexical statistics

| Split | Clips | Tokens | Types | TTR | Hapax |
|---|---:|---:|---:|---:|---:|
| validated | 16,612 | 135,067 | 9,903 | 0.0733 | 967 |
| train | 2,558 | 19,850 | 5,096 | 0.2567 | 3,194 |
| dev | 1,948 | 15,407 | 4,276 | 0.2775 | 2,727 |
| test | 2,076 | 17,455 | 5,214 | 0.2987 | 3,368 |
| other | 1,303 | 10,162 | 3,341 | 0.3288 | 2,223 |
| invalidated | 570 | 5,359 | 1,863 | 0.3476 | 1,078 |

The higher TTR in the smaller splits is a sample-size effect and should not be interpreted as intrinsically greater lexical diversity.

## Clip duration

From 18,485 duration records:

- Total audio duration: 88,563.888 seconds (~24.60 hours)
- Mean: 4.791 seconds
- Median: 4.500 seconds
- 25th percentile: 3.708 seconds
- 75th percentile: 5.508 seconds
- 95th percentile: 7.740 seconds
- Minimum: 1.548 seconds
- Maximum: 20.808 seconds

## Reported/quality issues

The reported file contains 90 reports:

- grammar-or-spelling: 73
- difficult-pronounce: 7
- different-language: 6
- offensive-language: 4

This gives a concrete quality-control signal for subsequent sentence-level review.

## Orthographic findings

1. The corpus has a coherent Arabic-derived script with strong Persian/Urdu orthographic conventions.
2. U+06CC yeh and U+06A9 keheh are dominant; Arabic yeh and Arabic kaf are rare/absent respectively.
3. Combining marks are a major component of the writing system and must not be stripped during preprocessing.
4. Indus-Kohistani-specific characters, including U+075C ݜ, are actively represented.
5. Latin text occurs at low frequency and is mostly embedded terminology/acronyms; it should be retained.
6. No zero-width or non-breaking-space contamination was detected in validated sentences.
7. Thirty NFC-sensitive records require explicit preservation/normalization tracking.
8. The 10 Arabic-yeh occurrences are the clearest automated orthographic-variant candidates identified in this pass.

## Data-engineering findings

The three principal Common Voice splits have no sentence-ID overlap, which is favorable for split integrity. However, `other.tsv` and `invalidated.tsv` overlap with the principal splits and should not be treated as independent evaluation sets.

`validated_sentences.tsv` contains 6,635 unique sentence records. The train/dev/test union contains 6,582 unique sentence IDs, so 53 validated sentence records are outside that union.

## Current limitation

The Common Voice 27 metadata can now be analyzed directly. The separate FiKR&CD text-corpus archive remains binary-only from the current GitHub connector. Consequently, a true cross-source alignment/orthographic comparison between the 8,141-line text corpus and Common Voice cannot yet be claimed.

## Next analytical layer

The next pass should operate on the 6,582 unique validated sentence texts and produce:

- lemma-independent lexical frequency lists
- word-length distributions
- character n-gram frequencies
- orthographic variant clusters
- edit-distance candidate pairs
- punctuation and spacing profiles
- sentence-level duplication analysis
- Common Voice vs. FiKR&CD corpus lexical overlap
- source-corpus coverage and vocabulary intersection
- a machine-readable orthographic exception/variant table

No automatic normalization should be committed to the source data.
