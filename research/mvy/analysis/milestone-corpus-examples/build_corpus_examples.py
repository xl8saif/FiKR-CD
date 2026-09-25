from __future__ import annotations

import json
import re
import tarfile
import unicodedata
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[4]
ARCHIVE = ROOT / "research/mvy/source/1765213289901-Mvy_text_corpus.tar.gz"
LEXICON = ROOT / "src/data/mvyCorpusLexicon.json"
OUT = ROOT / "src/data/mvyCorpusExamples.json"

TOKEN_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z0-9]+")
SPLIT_RE = re.compile(r"(?<=[۔!?؟])\s+|\n+")
PUNCT = "،۔,.;:!?؟!؛»«()[]{}\"'“”‘’"

def normalize(value: str) -> str:
    value = unicodedata.normalize("NFC", value or "")
    return re.sub(r"\s+", " ", value).strip()

def key(value: str) -> str:
    return normalize(value).strip(PUNCT).strip()

def read_text_bytes(data: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-8", "utf-16"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            pass
    return data.decode("utf-8", errors="replace")

def extract_sources() -> list[dict]:
    if not ARCHIVE.exists():
        raise SystemExit(f"Missing corpus archive: {ARCHIVE}")
    documents = []
    with tarfile.open(ARCHIVE, "r:gz") as archive:
        for member in archive.getmembers():
            if not member.isfile():
                continue
            name = member.name
            lower = name.lower()
            if not lower.endswith((".txt", ".tsv", ".csv", ".pdf")):
                continue
            handle = archive.extractfile(member)
            if handle is None:
                continue
            data = handle.read()
            if lower.endswith(".pdf"):
                try:
                    import fitz
                except ImportError as exc:
                    raise SystemExit("PyMuPDF is required to extract PDF corpus sources.") from exc
                pdf = fitz.open(stream=data, filetype="pdf")
                for page_number, page in enumerate(pdf, start=1):
                    text = normalize(page.get_text("text"))
                    if text:
                        documents.append({"source": name, "page": page_number, "text": text})
                pdf.close()
            else:
                text = read_text_bytes(data)
                for line_number, line in enumerate(text.splitlines(), start=1):
                    line = normalize(line)
                    if line:
                        documents.append({"source": name, "line": line_number, "text": line})
    return documents

def main() -> None:
    lexicon = json.loads(LEXICON.read_text(encoding="utf-8"))
    words = [str(item.get("word", "")) for item in lexicon.get("entries", []) if item.get("word")]
    wanted = {key(word): word for word in words}
    records = defaultdict(lambda: {"occurrences": 0, "examples": []})
    documents = extract_sources()

    for document in documents:
        chunks = [normalize(chunk) for chunk in SPLIT_RE.split(document["text"]) if normalize(chunk)]
        for chunk in chunks:
            seen_in_chunk = set()
            for token in TOKEN_RE.findall(chunk):
                token_key = key(token)
                canonical = wanted.get(token_key)
                if not canonical:
                    continue
                records[canonical]["occurrences"] += 1
                if token_key in seen_in_chunk or len(records[canonical]["examples"]) >= 5:
                    continue
                seen_in_chunk.add(token_key)
                example = {"text": chunk, "source": document["source"]}
                if document.get("page"):
                    example["page"] = document["page"]
                if document.get("line"):
                    example["line"] = document["line"]
                records[canonical]["examples"].append(example)

    output = {
        "project": "FiKR&CD",
        "language": "Indus-Kohistani",
        "iso_639_3": "mvy",
        "milestone": "Corpus sentence-level lexical evidence",
        "status": "attested corpus examples",
        "source_archive": str(ARCHIVE.relative_to(ROOT)).replace("\\", "/"),
        "lexicon_source": str(LEXICON.relative_to(ROOT)).replace("\\", "/"),
        "max_examples_per_word": 5,
        "source_documents": len(documents),
        "words_with_examples": sum(bool(item["examples"]) for item in records.values()),
        "entries": {word: records[word] for word in words if records[word]["examples"]},
    }
    OUT.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Corpus documents: {len(documents)}")
    print(f"Lexicon words: {len(words)}")
    print(f"Words with examples: {output['words_with_examples']}")
    print(f"Wrote: {OUT}")

if __name__ == "__main__":
    main()
