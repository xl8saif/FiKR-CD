#!/usr/bin/env python3
"""Leakage-aware deterministic train/validation/test splitting for the Mvy written corpus."""
from __future__ import annotations
import argparse, csv, hashlib, json, math, re, unicodedata
from collections import Counter, defaultdict
from pathlib import Path

SPLITS = ("train", "validation", "test")

def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()

def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))

def norm(value: str) -> str:
    value = unicodedata.normalize("NFC", value or "")
    return re.sub(r"\s+", " ", value).strip()

def identity(row: dict, index: int) -> str:
    source = norm(str(row.get("source") or row.get("source_id") or ""))
    document = norm(str(row.get("document") or row.get("document_id") or ""))
    if source and document:
        return "source_document:" + sha256_text(source + "\0" + document)[:24]
    if document:
        return "document:" + sha256_text(document)[:24]
    if source:
        return "source:" + sha256_text(source)[:24]
    return "row:" + str(index)

def load_rows(path: Path) -> list[dict]:
    if path.suffix.lower() == ".jsonl":
        rows = []
        with path.open("r", encoding="utf-8") as f:
            for n, line in enumerate(f, 1):
                if line.strip():
                    row = json.loads(line)
                    if not isinstance(row, dict):
                        raise ValueError(f"{path}:{n}: expected JSON object")
                    rows.append(row)
        return rows
    delimiter = "\t" if path.suffix.lower() == ".tsv" else ","
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f, delimiter=delimiter))

def write_jsonl(path: Path, rows: list[dict]) -> str:
    h = hashlib.sha256()
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            line = json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n"
            f.write(line)
            h.update(line.encode("utf-8"))
    return h.hexdigest()

def find(x, parent):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x

def union(a, b, parent):
    a, b = find(a, parent), find(b, parent)
    if a != b:
        parent[b] = a

def allocate(groups: dict[str, list[dict]], ratios: dict[str, float]) -> dict[str, str]:
    total = sum(map(len, groups.values()))
    targets = {s: ratios[s] * total for s in SPLITS}
    counts = Counter()
    result = {}
    for gid, rows in sorted(groups.items(), key=lambda kv: (-len(kv[1]), sha256_text(kv[0]))):
        split = max(SPLITS, key=lambda s: (targets[s] - counts[s], -SPLITS.index(s)))
        result[gid] = split
        counts[split] += len(rows)
    return result

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, type=Path)
    ap.add_argument("--output-dir", required=True, type=Path)
    ap.add_argument("--train", type=float, default=0.80)
    ap.add_argument("--validation", type=float, default=0.10)
    ap.add_argument("--test", type=float, default=0.10)
    args = ap.parse_args()

    ratios = {"train": args.train, "validation": args.validation, "test": args.test}
    if any(v <= 0 for v in ratios.values()) or not math.isclose(sum(ratios.values()), 1.0, abs_tol=1e-9):
        raise SystemExit("train + validation + test must equal 1.0 and each must be > 0")

    rows = load_rows(args.input)
    if not rows:
        raise SystemExit("Input dataset is empty")
    if any("text" not in r for r in rows):
        raise SystemExit("Every input record must contain a text field")

    row_group = [identity(r, i) for i, r in enumerate(rows)]
    text_to_indices = defaultdict(list)
    for i, row in enumerate(rows):
        text = norm(str(row.get("text", "")))
        if text:
            text_to_indices[text].append(i)

    parent = {g: g for g in row_group}
    duplicate_records = 0
    for indices in text_to_indices.values():
        if len(indices) > 1:
            duplicate_records += len(indices) - 1
            base = row_group[indices[0]]
            for i in indices[1:]:
                union(base, row_group[i], parent)

    groups = defaultdict(list)
    for i, row in enumerate(rows):
        groups[find(row_group[i], parent)].append(row)

    assignment = allocate(groups, ratios)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    split_rows = {s: [] for s in SPLITS}
    group_manifest = []
    for gid, group in sorted(groups.items()):
        split = assignment[gid]
        for row in group:
            out = dict(row)
            out["split"] = split
            out["leakage_group_id"] = gid
            split_rows[split].append(out)
        group_manifest.append({
            "leakage_group_id": gid,
            "split": split,
            "records": len(group),
            "sources": sorted({norm(str(r.get("source") or r.get("source_id") or "")) for r in group if r.get("source") or r.get("source_id")}),
            "documents": sorted({norm(str(r.get("document") or r.get("document_id") or "")) for r in group if r.get("document") or r.get("document_id")}),
        })

    output_hashes = {s: write_jsonl(args.output_dir / f"{s}.jsonl", split_rows[s]) for s in SPLITS}
    group_hash = write_jsonl(args.output_dir / "group-manifest.jsonl", group_manifest)

    def sets(field, split):
        return {norm(str(r.get(field) or r.get(field + "_id") or "")) for r in split_rows[split] if r.get(field) or r.get(field + "_id")}

    group_sets = {s: {g["leakage_group_id"] for g in group_manifest if g["split"] == s} for s in SPLITS}
    source_sets = {s: sets("source", s) for s in SPLITS}
    document_sets = {s: sets("document", s) for s in SPLITS}

    def overlaps(mapping):
        return {f"{a}_vs_{b}": len(mapping[a] & mapping[b]) for i, a in enumerate(SPLITS) for b in SPLITS[i+1:]}

    group_overlaps = overlaps(group_sets)
    source_overlaps = overlaps(source_sets)
    document_overlaps = overlaps(document_sets)
    leakage_free = all(v == 0 for v in group_overlaps.values()) and all(v == 0 for v in source_overlaps.values()) and all(v == 0 for v in document_overlaps.values())

    summary = {
        "milestone": "M3.6",
        "title": "Leakage-aware train/validation/test splitting",
        "input": str(args.input).replace("\\", "/"),
        "input_sha256": sha256_bytes(args.input.read_bytes()),
        "requested_ratios": ratios,
        "records": len(rows),
        "leakage_groups": len(groups),
        "duplicate_records_connected": duplicate_records,
        "split_records": {s: len(split_rows[s]) for s in SPLITS},
        "split_ratios_actual": {s: len(split_rows[s]) / len(rows) for s in SPLITS},
        "split_groups": {s: sum(g["split"] == s for g in group_manifest) for s in SPLITS},
        "group_overlap_counts": group_overlaps,
        "source_overlap_counts": source_overlaps,
        "document_overlap_counts": document_overlaps,
        "leakage_free": leakage_free,
        "output_sha256": output_hashes,
        "group_manifest_sha256": group_hash,
        "policy": [
            "Split whole source/document groups; never split rows independently.",
            "Connect exact normalized transcription duplicates across source/document boundaries.",
            "When source/document metadata are missing, fail closed to row-level groups.",
            "Verify group, source, and document overlaps after assignment."
        ]
    }
    (args.output_dir / "split-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    report = [
        "# Mvy Milestone 3.6 — Leakage-Aware Dataset Splitting", "",
        f"- Input records: **{len(rows):,}**",
        f"- Leakage groups: **{len(groups):,}**",
        f"- Exact duplicate records connected: **{duplicate_records:,}**", "",
        "## Split sizes", ""
    ]
    for s in SPLITS:
        report.append(f"- {s}: **{len(split_rows[s]):,}** ({len(split_rows[s])/len(rows):.2%}); groups: **{sum(g['split'] == s for g in group_manifest):,}**")
    report += [
        "", "## Leakage checks", "",
        f"- Leakage-group overlaps: {group_overlaps}",
        f"- Source overlaps: {source_overlaps}",
        f"- Document overlaps: {document_overlaps}",
        f"- Leakage-free: **{leakage_free}**", "",
        "Rows are assigned by whole source/document identity rather than independently. "
        "Exact normalized transcription duplicates are also connected before splitting."
    ]
    (args.output_dir / "milestone-3.6-split-report.md").write_text("\n".join(report) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
