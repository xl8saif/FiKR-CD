from __future__ import annotations
import hashlib, json, re, tarfile, unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
ARCHIVE = ROOT / "research/mvy/source/1765213289901-Mvy_text_corpus.tar.gz"
LEXICON = ROOT / "src/data/mvyCorpusFullLexicon.json"
EXAMPLES = ROOT / "src/data/mvyCorpusExamples.json"
OUT_DIR = ROOT / "research/mvy/analysis/milestone-written-dataset-validation/output"
REPORT = OUT_DIR / "mvy-written-dataset-validation.md"
MANIFEST = OUT_DIR / "mvy-written-dataset-manifest.json"

TOKEN_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z0-9]+")
BASELINE = {"lexical_types": 10696, "token_occurrences": 135375}

def sha256(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""): h.update(block)
    return h.hexdigest()

def normalize(value):
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", value or "")).strip()

def read_text_bytes(data):
    for encoding in ("utf-8-sig", "utf-8", "utf-16"):
        try: return data.decode(encoding)
        except UnicodeDecodeError: pass
    return data.decode("utf-8", errors="replace")

def iter_text_units():
    if not ARCHIVE.exists(): raise SystemExit(f"Missing corpus archive: {ARCHIVE}")
    with tarfile.open(ARCHIVE, "r:gz") as archive:
        for member in archive.getmembers():
            if not member.isfile(): continue
            lower = member.name.lower()
            if not lower.endswith((".txt", ".tsv", ".csv", ".pdf")): continue
            handle = archive.extractfile(member)
            if handle is None: continue
            data = handle.read()
            if lower.endswith(".pdf"):
                import fitz
                pdf = fitz.open(stream=data, filetype="pdf")
                for page_number, page in enumerate(pdf, start=1):
                    text = normalize(page.get_text("text"))
                    if text: yield member.name, page_number, None, text
                pdf.close()
            else:
                text = read_text_bytes(data)
                for line_number, line in enumerate(text.splitlines(), start=1):
                    text = normalize(line)
                    if text: yield member.name, None, line_number, text

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    if not LEXICON.exists(): raise SystemExit(f"Missing generated lexicon: {LEXICON}")
    if not EXAMPLES.exists(): raise SystemExit(f"Missing generated examples: {EXAMPLES}")
    lexicon = json.loads(LEXICON.read_text(encoding="utf-8"))
    examples = json.loads(EXAMPLES.read_text(encoding="utf-8"))
    frequencies = Counter()
    documents, text_files, pdf_files = set(), set(), set()
    text_units = pdf_units = 0
    for source, page, line, text in iter_text_units():
        documents.add(source); text_units += 1
        if page is not None: pdf_units += 1; pdf_files.add(source)
        else: text_files.add(source)
        frequencies.update(TOKEN_RE.findall(text))
    lexical_types = len(frequencies)
    token_occurrences = sum(frequencies.values())
    hapax = sum(1 for n in frequencies.values() if n == 1)
    spectrum = Counter(frequencies.values())
    lexicon_entries = lexicon.get("entries", [])
    lexicon_total = sum(int(x.get("frequency", 0)) for x in lexicon_entries)
    lexicon_types = len(lexicon_entries)
    example_entries = examples.get("entries", {})
    words_with_examples = sum(1 for x in example_entries.values() if x.get("examples"))
    lexicon_words = {str(x.get("word", "")) for x in lexicon_entries}
    missing = sorted(set(frequencies) - lexicon_words)
    extra = sorted(lexicon_words - set(frequencies))
    frequencies_match = all(frequencies.get(str(x.get("word", ""))) == int(x.get("frequency", -1)) for x in lexicon_entries)
    checks = {
        "lexicon_type_count_matches_corpus": lexicon_types == lexical_types,
        "lexicon_token_total_matches_corpus": lexicon_total == token_occurrences,
        "lexicon_frequencies_match_recomputed_corpus": frequencies_match,
        "example_lexicon_word_count_matches": int(examples.get("lexicon_words", 0)) == lexicon_types,
        "example_source_document_count_matches": int(examples.get("source_documents", 0)) == len(documents),
        "all_corpus_types_represented_in_lexicon": not missing,
        "no_extra_lexicon_types": not extra,
    }
    baseline = {}
    for key, old in BASELINE.items():
        new = lexical_types if key == "lexical_types" else token_occurrences
        baseline[key] = {"historical_m2_5": old, "recomputed_full_corpus": new, "difference": new - old}
    status = "validated" if all(checks.values()) else "validation_failed"
    manifest = {
        "project": "FiKR&CD", "language": "Indus-Kohistani", "iso_639_3": "mvy",
        "dataset": "Mvy Written Corpus", "stage": "written-dataset-validation", "status": status,
        "source_archive": str(ARCHIVE.relative_to(ROOT)).replace("\\", "/"),
        "source_archive_sha256": sha256(ARCHIVE), "lexicon_sha256": sha256(LEXICON),
        "examples_sha256": sha256(EXAMPLES),
        "corpus": {"source_documents": len(documents), "text_files": len(text_files), "pdf_files": len(pdf_files),
                   "text_units": text_units, "pdf_page_units": pdf_units, "token_occurrences": token_occurrences,
                   "lexical_types": lexical_types, "hapax_legomena": hapax,
                   "frequency_spectrum": dict(sorted(spectrum.items()))},
        "lexicon": {"entries": lexicon_types, "frequency_total": lexicon_total,
                    "words_with_attested_examples": words_with_examples,
                    "example_coverage_percent": round(words_with_examples / lexicon_types * 100, 4) if lexicon_types else 0},
        "baseline_comparison": baseline, "checks": checks,
        "discrepancies": {"missing_from_lexicon_count": len(missing), "extra_in_lexicon_count": len(extra),
                          "missing_from_lexicon_sample": missing[:100], "extra_in_lexicon_sample": extra[:100]},
        "reproducibility": {"normalization": "Unicode NFC + whitespace normalization",
                            "tokenization": "Arabic-script plus Latin alphanumeric token regex",
                            "source_preserved": True,
                            "generated_derivatives": ["src/data/mvyCorpusFullLexicon.json", "src/data/mvyCorpusExamples.json"]},
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    lines = [
        "# Mvy Written Dataset — Full-Corpus Validation", "",
        "Independent recomputation of lexical statistics from the archived written corpus, followed by integrity checks against generated lexical and sentence-evidence artifacts.", "",
        "## Corpus",
        f"- Source documents: **{len(documents):,}**", f"- Text files: **{len(text_files):,}**", f"- PDF files: **{len(pdf_files):,}**",
        f"- Text/page units: **{text_units:,}**", f"- Token occurrences: **{token_occurrences:,}**", f"- Lexical types: **{lexical_types:,}**",
        f"- Hapax legomena: **{hapax:,}**", "",
        "## Generated lexical artifact", f"- Lexicon entries: **{lexicon_types:,}**",
        f"- Lexicon frequency total: **{lexicon_total:,}**", f"- Words with attested examples: **{words_with_examples:,}**",
        f"- Example coverage: **{manifest['lexicon']['example_coverage_percent']:.4f}%**", "",
        "## Historical M2.5 comparison", "| Statistic | Historical M2.5 | Full-corpus recomputation | Difference |", "|---|---:|---:|---:|"
    ]
    for key, item in baseline.items():
        lines.append(f"| {key.replace('_', ' ').title()} | {item['historical_m2_5']:,} | {item['recomputed_full_corpus']:,} | {item['difference']:+,} |")
    lines += ["", "## Integrity checks"]
    for key, value in checks.items(): lines.append(f"- [{'PASS' if value else 'FAIL'}] {key.replace('_', ' ')}")
    lines += ["", "## Method", "- Unicode normalization: NFC.", "- Whitespace is collapsed before tokenization.",
              "- Arabic-script and Latin alphanumeric tokens are counted.", "- PDF text is extracted page-by-page; text/TSV/CSV sources are processed line-by-line.",
              "- Raw source material is never modified.", "- Corpus-derived candidates remain distinct from human-verified dictionary definitions.", "",
              "## Provenance", f"- Corpus SHA-256: {manifest['source_archive_sha256']}",
              f"- Full lexicon SHA-256: {manifest['lexicon_sha256']}", f"- Corpus examples SHA-256: {manifest['examples_sha256']}", "",
              f"**Validation status: {status}**"]
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Documents: {len(documents):,}")
    print(f"Token occurrences: {token_occurrences:,}")
    print(f"Lexical types: {lexical_types:,}")
    print(f"Hapax legomena: {hapax:,}")
    print(f"Words with examples: {words_with_examples:,}")
    print(f"Validation status: {status}")
    if not all(checks.values()): raise SystemExit("Written dataset validation failed. See the validation report for discrepancies.")

if __name__ == "__main__": main()
