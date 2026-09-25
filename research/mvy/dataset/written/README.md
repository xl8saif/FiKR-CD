# Mvy Written Dataset

This directory defines the written-text dataset layer for FiKR&CD's Indus-Kohistani (mvy) research programme.

## Scope

Audio and ASR sources are intentionally excluded from this stage. The dataset is derived from the archived written Mvy corpus:

`research/mvy/source/1765213289901-Mvy_text_corpus.tar.gz`

The current written-data pipeline produces:

- a full corpus-derived lexical inventory;
- frequency statistics;
- hapax statistics;
- sentence-level corpus attestations;
- reproducible provenance and SHA-256 checksums;
- validation reports comparing independently recomputed statistics with generated artifacts.

## Generated research artifacts

The generated lexical inventory is published at:

`src/data/mvyCorpusFullLexicon.json`

Sentence-level evidence is published at:

`src/data/mvyCorpusExamples.json`

Validation output is generated under:

`research/mvy/analysis/milestone-written-dataset-validation/output/`

The validation manifest records the corpus checksum, generated-artifact checksums, corpus counts, lexical counts, example coverage, integrity checks, and comparison with the historical M2.5 figures.

## Data semantics

A corpus-derived lexical candidate is evidence that a written form occurs in the corpus. It is not automatically a dictionary definition, translation, lemma, phonological analysis, or human-verified lexical entry.

Human-verified dictionary records remain separate in Firestore and are published only after explicit review.

## Reproducibility

The source corpus is not modified. The extraction process applies Unicode NFC normalization, whitespace normalization, and a documented Arabic-script/Latin-alphanumeric tokenizer. PDF sources are extracted page-by-page; text, TSV, and CSV sources are processed line-by-line.

The authoritative processing script is:

`research/mvy/analysis/milestone-written-dataset-validation/validate_written_dataset.py`

The corpus-example generation script is:

`research/mvy/analysis/milestone-corpus-examples/build_corpus_examples.py`

## Planned written-data sequence

1. Full-corpus statistical validation.
2. Orthographic normalization audit.
3. Duplicate and near-duplicate detection.
4. Sentence/document quality flags.
5. Dialect/variety metadata where evidence exists.
6. Leakage-aware train/validation/test splits for NLP experiments.
7. Versioned dataset card and DOI-ready research release.

Audio/ASR engineering remains a separate future milestone and is not required for this written-data release.
