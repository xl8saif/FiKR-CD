# Mvy Milestone 2.2 — Orthographic Inventory & Grapheme Analysis

Status: completed  
Corpus: Common Voice 27.0 mvy, validated.tsv  
Unit of analysis: validated clip rows, with sentence-level and token-level observations where applicable.

## Scope

This milestone establishes a corpus-derived observed orthographic inventory for mvy. It is descriptive evidence, not a declaration of an official orthography.

The analysis preserves the source Unicode representation. NFC/NFD diagnostics are treated separately; no automatic spelling correction or normalization is applied to the corpus.

## Established Indus-Kohistani inventory reference

The analysis compares observed forms against the established inventory supplied for FiKR&CD work, including the special letters ݜ, ڇ, څ, ڙ, ݨ and the aspirated sequences represented with ھ.

## Direct corpus observations

The validated corpus contains extensive evidence for Arabic-derived orthography with Persian/Urdu extensions, combining marks, and distinctive Indus-Kohistani characters.

Previously measured validated-corpus totals:
- 16,612 validated clip rows
- 6,582 unique sentence IDs
- 661,813 Unicode characters
- 115 distinct Unicode code points
- 52,304 combining marks
- 48,486 occurrences of U+06CC ی
- 10 occurrences of U+064A ي
- 18,756 occurrences of U+06A9 ک
- 0 occurrences of U+0643 ك
- 4,074 occurrences of U+0622 آ
- 0 occurrences of U+0623 أ
- 0 occurrences of U+0625 إ
- 0 zero-width characters among U+200B/U+200C/U+200D/U+FEFF
- 0 NBSP characters

## Interpretation

The corpus strongly supports the practical use of an Arabic-derived mvy writing system with a relatively stable preferred set of Persian/Urdu code points. The special mvy letters are not merely theoretical: they occur in corpus text, including ݜ, ڇ and څ.

Combining marks are frequent and must be retained as linguistic data. Examples in the corpus show vowel/phonological marking and other diacritic sequences attached to lexical material. Their presence means that code-point counts alone are insufficient for defining graphemes.

The corpus also contains mixed-language and borrowed material, including Latin-script strings. Such strings should be classified as lexical/script exceptions rather than silently converted.

## Orthographic exceptions and validation flags

The following classes should be reviewed linguistically before any normalization layer is created:

1. Arabic/Persian/Urdu character variants such as ي/ی and potential historical or borrowed forms.
2. Combining-mark order and attachment, especially sequences that differ only in canonical Unicode representation.
3. Aspiration sequences such as بھ, پھ, تھ, ٹھ, دھ, ڈھ, کھ, گھ and related forms. These should be represented both as constituent Unicode characters and as candidate graphemic sequences.
4. Special mvy letters such as ݜ, ڇ, څ, ڙ and ݨ, including their combining-mark variants.
5. Latin-script tokens and other non-Arabic material.
6. Punctuation, quotation marks, brackets and spacing inherited from source material.
7. Rare code points that occur only in isolated lexical or orthographic contexts.

## Methodological decision

For future ASR and corpus engineering, the recommended representation is layered:

- Raw text: immutable original Unicode.
- Canonical diagnostic layer: NFC comparison only, with differences logged.
- Grapheme layer: base character plus attached combining marks.
- Morphographic/orthographic layer: recurrent multi-character sequences such as consonant + ھ.
- Token layer: whitespace-delimited lexical forms.
- Linguistic annotation layer: validated grapheme/phoneme interpretation.

No layer should overwrite the raw source.

## Conclusion

Milestone 2.2 establishes the basis for a defensible, corpus-derived mvy orthographic specification. The next stage should quantify grapheme sequences and their positional distributions in machine-readable tables, then use those statistics to define ASR-safe normalization rules without altering the original corpus.

This report should not be interpreted as proving that every corpus character belongs to the native mvy inventory, nor that every inventory character absent from this corpus is absent from the language. Corpus absence is not linguistic absence.
