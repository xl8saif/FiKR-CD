#!/usr/bin/env python3
"""Prepare a reproducible Mvy ASR dataset manifest from Common Voice validated.tsv.

This is a preparation/manifest stage. It preserves source transcription, records
a minimally normalized NFC form, validates audio references when audio is present,
and never silently edits orthography.
"""
from __future__ import annotations

import csv, hashlib, json, os, re, unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "research/mvy/source/common-voice-27"
TSV = SOURCE / "validated.tsv"
OUT = ROOT / "research/mvy/analysis/milestone-3.1/output"
OUT.mkdir(parents=True, exist_ok=True)

REQUIRED = {"path", "sentence"}
AUDIO_EXTS = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".webm"}

def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def normalize_text(text: str) -> str:
    text = unicodedata.normalize("NFC", text)
    return re.sub(r"\s+", " ", text).strip()

def resolve_audio(rel: str):
    rel = rel.replace("\\", "/")
    candidate = (SOURCE / rel).resolve()
    try:
        candidate.relative_to(SOURCE.resolve())
    except ValueError:
        return None
    return candidate if candidate.is_file() else None

def main():
    if not TSV.is_file():
        raise SystemExit(f"Missing source TSV: {TSV}")

    with TSV.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f, delimiter="\t")
        headers = reader.fieldnames or []
        missing = sorted(REQUIRED - set(headers))
        if missing:
            raise SystemExit(f"Missing required TSV columns: {missing}")

        records = []
        validation_rows = []
        normalization_rows = []
        missing_audio_rows = []
        malformed = 0
        audio_present = 0
        normalized_changed = 0

        for row_number, row in enumerate(reader, start=2):
            path = (row.get("path") or "").strip()
            sentence = row.get("sentence")
            if not path or sentence is None or not sentence.strip():
                malformed += 1
                validation_rows.append({"row": row_number, "status": "malformed", "path": path, "reason": "missing path or sentence"})
                continue

            original = sentence
            nfc = normalize_text(original)
            if original != nfc:
                normalized_changed += 1
                normalization_rows.append({
                    "row": row_number, "path": path,
                    "sentence_original": original, "sentence_nfc": nfc
                })

            audio = resolve_audio(path)
            audio_ok = audio is not None
            if audio_ok:
                audio_present += 1
            else:
                missing_audio_rows.append({
                    "row": row_number, "path": path, "reason": "audio file not present in repository source tree"
                })

            record_key = "\t".join([path, original, str(row_number)])
            record_id = "mvy-" + sha256_text(record_key)[:20]
            record = {
                "id": record_id,
                "audio_filepath": path,
                "audio_available": audio_ok,
                "text": nfc,
                "text_original": original,
                "locale": row.get("locale") or "mvy",
                "client_id": row.get("client_id") or "",
                "segment": row.get("segment") or "",
                "up_votes": row.get("up_votes") or "",
                "down_votes": row.get("down_votes") or "",
                "age": row.get("age") or "",
                "gender": row.get("gender") or "",
                "accent": row.get("accent") or "",
                "source_row": row_number,
                "text_sha256": sha256_text(original),
            }
            if audio_ok:
                record["audio_bytes"] = audio.stat().st_size
            records.append(record)
            validation_rows.append({
                "row": row_number, "status": "valid", "path": path,
                "audio_available": audio_ok, "text_nfc_changed": original != nfc
            })

    jsonl = OUT / "mvy-asr-manifest.jsonl"
    with jsonl.open("w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")

    def write_csv(name, rows):
        p = OUT / name
        if not rows:
            p.write_text("", encoding="utf-8")
            return
        fields = list(rows[0].keys())
        with p.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fields)
            w.writeheader()
            w.writerows(rows)

    write_csv("mvy-asr-source-validation.csv", validation_rows)
    write_csv("mvy-asr-missing-audio.csv", missing_audio_rows)
    write_csv("mvy-asr-text-normalization.csv", normalization_rows)

    text_lengths = Counter(len(r["text"]) for r in records)
    summary = {
        "milestone": "M3.1",
        "title": "ASR Dataset Preparation",
        "source": str(TSV.relative_to(ROOT)).replace(os.sep, "/"),
        "source_sha256": sha256_text(TSV.read_text(encoding="utf-8-sig")),
        "source_columns": headers,
        "records": len(records),
        "malformed_rows": malformed,
        "audio_available_records": audio_present,
        "audio_missing_records": len(missing_audio_rows),
        "text_nfc_changed_records": normalized_changed,
        "unique_transcriptions": len({r["text"] for r in records}),
        "text_length_min": min(text_lengths) if text_lengths else 0,
        "text_length_max": max(text_lengths) if text_lengths else 0,
        "manifest_sha256": sha256_text(jsonl.read_text(encoding="utf-8")),
        "method": [
            "Preserve original transcription.",
            "Apply Unicode NFC and whitespace normalization only to the ASR text field.",
            "Retain original text for auditability.",
            "Resolve audio paths only inside the Common Voice source tree.",
            "Do not perform orthographic correction or audio-quality scoring in M3.1."
        ],
        "status": "ready_for_m3_2_audio_text_quality_control",
    }
    (OUT / "mvy-asr-preparation-summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )

    report = [
        "# Mvy Milestone 3.1 — ASR Dataset Preparation",
        "",
        f"- Source rows accepted: **{len(records):,}**",
        f"- Malformed rows: **{malformed:,}**",
        f"- Audio references resolved: **{audio_present:,}**",
        f"- Audio references unavailable: **{len(missing_audio_rows):,}**",
        f"- Transcriptions changed by NFC/whitespace normalization: **{normalized_changed:,}**",
        f"- Unique normalized transcriptions: **{summary['unique_transcriptions']:,}**",
        "",
        "## Scope",
        "",
        "M3.1 creates a deterministic ASR manifest while preserving the original transcription. "
        "Normalization is limited to Unicode NFC and whitespace normalization. No orthographic "
        "correction, pronunciation inference, or audio-quality judgment is made at this stage.",
        "",
        "## Next milestone",
        "",
        "M3.2 will perform audio–text quality control, including checks appropriate to the audio files "
        "that are actually available in the source package.",
        "",
    ]
    (OUT / "milestone-3.1-asr-preparation-report.md").write_text("\n".join(report), encoding="utf-8")

if __name__ == "__main__":
    main()
