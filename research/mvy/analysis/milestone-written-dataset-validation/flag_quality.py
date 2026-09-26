from __future__ import annotations
import hashlib
import json
import re
import tarfile
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
ARCHIVE = ROOT / "research/mvy/source/1765213289901-Mvy_text_corpus.tar.gz"
OUT = ROOT / "research/mvy/analysis/milestone-written-dataset-validation/output"
REPORT = OUT / "mvy-written-dataset-quality.json"
MD = OUT / "mvy-written-dataset-quality.md"

TOKEN_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z0-9]+")
ARABIC_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]")
LATIN_RE = re.compile(r"[A-Za-z]")
DIGIT_RE = re.compile(r"[0-9]")
CONTROL_RE = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")
REPEATED_RE = re.compile(r"(.)\1{5,}", re.UNICODE)

MAX_CHARS = 2000
MIN_TOKENS = 2
MAX_DIGIT_RATIO = 0.35
MAX_PUNCT_RATIO = 0.45
MIN_LETTER_RATIO = 0.20

def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", value or "")).strip()

def read_text_bytes(data: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-8", "utf-16"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            pass
    return data.decode("utf-8", errors="replace")

def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def iter_units():
    if not ARCHIVE.exists():
        raise SystemExit(f"Missing corpus archive: {ARCHIVE}")
    with tarfile.open(ARCHIVE, "r:gz") as archive:
        for member in archive.getmembers():
            if not member.isfile():
                continue
            lower = member.name.lower()
            if not lower.endswith((".txt", ".tsv", ".csv", ".pdf")):
                continue
            handle = archive.extractfile(member)
            if handle is None:
                continue
            data = handle.read()
            if lower.endswith(".pdf"):
                import fitz
                pdf = fitz.open(stream=data, filetype="pdf")
                for page_number, page in enumerate(pdf, start=1):
                    text = normalize(page.get_text("text"))
                    if text:
                        yield member.name, page_number, None, text
                pdf.close()
            else:
                text = read_text_bytes(data)
                for line_number, line in enumerate(text.splitlines(), start=1):
                    text = normalize(line)
                    if text:
                        yield member.name, None, line_number, text

def classify(text: str):
    chars = len(text)
    tokens = TOKEN_RE.findall(text)
    token_count = len(tokens)
    arabic = len(ARABIC_RE.findall(text))
    latin = len(LATIN_RE.findall(text))
    digits = len(DIGIT_RE.findall(text))
    punctuation = sum(1 for ch in text if unicodedata.category(ch).startswith("P"))
    letters_digits = sum(1 for ch in text if unicodedata.category(ch).startswith(("L", "N")))
    flags = []

    if chars < 5 or token_count < MIN_TOKENS:
        flags.append("very_short")
    if chars > MAX_CHARS:
        flags.append("very_long")
    if "\ufffd" in text:
        flags.append("replacement_character")
    if CONTROL_RE.search(text):
        flags.append("control_character")
    if REPEATED_RE.search(text):
        flags.append("repeated_character_sequence")

    digit_ratio = digits / chars if chars else 0.0
    punctuation_ratio = punctuation / chars if chars else 0.0
    letter_ratio = letters_digits / chars if chars else 0.0

    if digit_ratio > MAX_DIGIT_RATIO:
        flags.append("digit_heavy")
    if punctuation_ratio > MAX_PUNCT_RATIO:
        flags.append("punctuation_heavy")
    if token_count and arabic == 0 and latin > 0:
        flags.append("latin_only")
    if arabic == 0 and latin == 0 and token_count == 0:
        flags.append("non_lexical")
    if letter_ratio < MIN_LETTER_RATIO and chars >= 10:
        flags.append("low_letter_content")

    metrics = {
        "characters": chars,
        "tokens": token_count,
        "arabic_script_chars": arabic,
        "latin_chars": latin,
        "digits": digits,
        "punctuation": punctuation,
        "digit_ratio": round(digit_ratio, 6),
        "punctuation_ratio": round(punctuation_ratio, 6),
        "letter_digit_ratio": round(letter_ratio, 6),
    }
    return flags, metrics

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    records = []
    flag_counts = Counter()
    flagged_units = 0
    total_units = 0

    for source, page, line, text in iter_units():
        total_units += 1
        flags, metrics = classify(text)
        for flag in flags:
            flag_counts[flag] += 1
        if flags:
            flagged_units += 1
            records.append({
                "id": sha256_text(f"{source}|{page or ''}|{line or ''}|{text}")[:20],
                "source": source,
                "page": page,
                "line": line,
                "text_sha256": sha256_text(text),
                "flags": flags,
                "metrics": metrics,
                "text": text,
            })

    clean_units = total_units - flagged_units
    coverage = clean_units / total_units * 100 if total_units else 0
    report = {
        "dataset": "Mvy Written Corpus",
        "language": "mvy",
        "iso_639_3": "mvy",
        "stage": "written-dataset-quality-review",
        "source_archive": str(ARCHIVE.relative_to(ROOT)).replace("\\", "/"),
        "source_archive_sha256": hashlib.sha256(ARCHIVE.read_bytes()).hexdigest(),
        "policy": {
            "automatic_action": "none",
            "meaning": "Flags identify records for human review; source records are never deleted or rewritten.",
            "thresholds": {
                "very_short": {"characters_lt": 5, "tokens_lt": MIN_TOKENS},
                "very_long": {"characters_gt": MAX_CHARS},
                "digit_heavy": {"ratio_gt": MAX_DIGIT_RATIO},
                "punctuation_heavy": {"ratio_gt": MAX_PUNCT_RATIO},
                "low_letter_content": {"ratio_lt": MIN_LETTER_RATIO, "minimum_characters": 10},
            },
        },
        "summary": {
            "total_text_units": total_units,
            "flagged_text_units": flagged_units,
            "unflagged_text_units": clean_units,
            "unflagged_percent": round(coverage, 4),
            "flag_counts": dict(flag_counts.most_common()),
        },
        "flagged_records": records,
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [
        "# Mvy Written Dataset — Quality Flags",
        "",
        "Conservative record-level review flags for the written corpus. Flags are not automatic rejection decisions.",
        "",
        "## Summary",
        f"- Text/page units examined: **{total_units:,}**",
        f"- Units flagged for review: **{flagged_units:,}**",
        f"- Units without these flags: **{clean_units:,} ({coverage:.4f}%)**",
        "",
        "## Flag counts",
    ]
    if flag_counts:
        lines += [f"- {name} — **{count:,}**" for name, count in flag_counts.most_common()]
    else:
        lines.append("- No quality flags detected.")
    lines += [
        "",
        "## Review policy",
        "- very_short: fewer than 5 characters or fewer than 2 lexical tokens.",
        "- very_long: more than 2,000 characters.",
        "- replacement_character: Unicode replacement character detected.",
        "- control_character: unexpected control character detected.",
        "- repeated_character_sequence: six or more repeated identical characters.",
        "- digit_heavy: more than 35% digits by character count.",
        "- punctuation_heavy: more than 45% punctuation by character count.",
        "- latin_only: lexical content contains Latin letters but no Arabic-script characters.",
        "- non_lexical: no token recognized by the documented tokenizer.",
        "- low_letter_content: low proportion of letters/numbers in a longer unit.",
        "",
        "These heuristics are deliberately conservative and should not be interpreted as proof that a record is erroneous, non-Mvy, or unusable. Human linguistic review remains authoritative.",
        "",
        "Raw source text is preserved.",
    ]
    MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Text/page units: {total_units:,}")
    print(f"Flagged units: {flagged_units:,}")
    print(f"Unflagged units: {clean_units:,}")
    print("Quality flags:", dict(flag_counts))

if __name__ == "__main__":
    main()
