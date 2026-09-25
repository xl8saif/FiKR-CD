# Mvy Written Dataset — Full-Corpus Validation

Independent recomputation of lexical statistics from the archived written corpus, followed by integrity checks against generated lexical and sentence-evidence artifacts.

## Corpus
- Source documents: **8**
- Text files: **1**
- PDF files: **7**
- Text/page units: **7,540**
- Token occurrences: **247,222**
- Lexical types: **23,371**
- Hapax legomena: **13,622**

## Generated lexical artifact
- Lexicon entries: **21,279**
- Lexicon frequency total: **246,757**
- Words with attested examples: **21,279**
- Example coverage: **100.0000%**

## Historical M2.5 comparison
| Statistic | Historical M2.5 | Full-corpus recomputation | Difference |
|---|---:|---:|---:|
| Lexical Types | 10,696 | 23,371 | +12,675 |
| Token Occurrences | 135,375 | 247,222 | +111,847 |

## Integrity checks
- [FAIL] lexicon type count matches corpus
- [FAIL] lexicon token total matches corpus
- [FAIL] lexicon frequencies match recomputed corpus
- [PASS] example lexicon word count matches
- [FAIL] example source document count matches
- [FAIL] all corpus types represented in lexicon
- [PASS] no extra lexicon types

## Method
- Unicode normalization: NFC.
- Whitespace is collapsed before tokenization.
- Arabic-script and Latin alphanumeric tokens are counted.
- PDF text is extracted page-by-page; text/TSV/CSV sources are processed line-by-line.
- Raw source material is never modified.
- Corpus-derived candidates remain distinct from human-verified dictionary definitions.

## Provenance
- Corpus SHA-256: 8a1345bbc0feb8ffaf83525356eccfc9019da72a3933750e3f205d46c9f356aa
- Full lexicon SHA-256: be22b664ec2ad0314bdc02ba24bb943b7cf396267bd5d748d40343ddfc73bdec
- Corpus examples SHA-256: 4c5b8d9689d12b0abe77e2148c18bdedf29de7e88bb0a7eb0841eed7137ce7f0

**Validation status: validation_failed**
