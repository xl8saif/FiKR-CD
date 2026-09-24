#!/usr/bin/env python3
"""Mvy M3.4 — deterministic speaker-disjoint ASR train/validation/test splits."""
from __future__ import annotations
import csv, hashlib, json, random
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[4]
TSV=ROOT/"research/mvy/source/common-voice-27/validated.tsv"
OUT=ROOT/"research/mvy/analysis/milestone-3.4/output"
OUT.mkdir(parents=True,exist_ok=True)
SEED=3401
RATIOS={"train":0.80,"validation":0.10,"test":0.10}

def h(s): return hashlib.sha256(s.encode("utf-8")).hexdigest()

def main():
    if not TSV.is_file(): raise SystemExit(f"Missing source: {TSV}")
    with TSV.open("r",encoding="utf-8-sig",newline="") as f:
        rows=list(csv.DictReader(f,delimiter="\t"))
    for i,r in enumerate(rows,start=2):
        r["_row"]=i
        r["_client_id"]=(r.get("client_id") or "").strip()
        r["_path"]=(r.get("path") or "").strip()
        r["_sentence"]=(r.get("sentence") or "").strip()

    usable=[r for r in rows if r["_path"] and r["_sentence"]]
    unknown=[r for r in usable if not r["_client_id"]]
    speakers={}
    for r in usable:
        speakers.setdefault(r["_client_id"] or f"__unknown_{r['_row']}",[]).append(r)

    known=[k for k in speakers if not k.startswith("__unknown_")]
    rng=random.Random(SEED)
    rng.shuffle(known)

    # Greedy assignment by recording count keeps splits close to target while
    # guaranteeing that known speakers occur in only one split.
    total=len(usable)
    targets={k:total*v for k,v in RATIOS.items()}
    assigned={k:[] for k in RATIOS}
    counts={k:0 for k in RATIOS}
    for sp in sorted(known,key=lambda k:len(speakers[k]),reverse=True):
        dest=min(RATIOS,key=lambda k:(counts[k]-targets[k],k))
        assigned[dest].extend(speakers[sp]); counts[dest]+=len(speakers[sp])

    # Rows lacking client IDs cannot be speaker-disjoint. Keep them isolated
    # in train and explicitly report this limitation.
    assigned["train"].extend(unknown); counts["train"]+=len(unknown)

    membership={}
    for split,rs in assigned.items():
        for r in rs: membership[r["_row"]]=split

    split_rows=[]
    for r in usable:
        split_rows.append({"source_row":r["_row"],"split":membership[r["_row"]],
                           "client_id":r["_client_id"] or "__unknown__",
                           "path":r["_path"],"sentence":r["_sentence"]})
    split_rows.sort(key=lambda x:x["source_row"])

    def write(name,rs,fields):
        with (OUT/name).open("w",encoding="utf-8",newline="") as f:
            w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rs)
    write("mvy-asr-split-manifest.csv",split_rows,["source_row","split","client_id","path","sentence"])

    for split in RATIOS:
        rs=[x for x in split_rows if x["split"]==split]
        write(f"mvy-asr-{split}.csv",rs,["source_row","split","client_id","path","sentence"])

    overlap={}
    for split in RATIOS:
        overlap[split]=len({x["client_id"] for x in split_rows if x["split"]==split and x["client_id"]!="__unknown__"})
    summary={"milestone":"M3.4","title":"Train Validation Test Splits","source":"research/mvy/source/common-voice-27/validated.tsv",
             "source_sha256":h(TSV.read_text(encoding="utf-8-sig")),"seed":SEED,"ratios":RATIOS,
             "usable_records":len(usable),"excluded_malformed":len(rows)-len(usable),
             "records_without_client_id":len(unknown),"split_counts":counts,
             "split_percentages":{k:round(v/total*100,4) if total else 0 for k,v in counts.items()},
             "known_speakers_total":len(known),"known_speakers_by_split":overlap,
             "speaker_disjoint_known_ids":len(set().union(*[
                 {x["client_id"] for x in split_rows if x["split"]==s and x["client_id"]!="__unknown__"} for s in RATIOS
             ]))==sum(overlap.values()),
             "unknown_client_rows_assigned_to":"train",
             "method":["Deterministic seed 3401.","Known client IDs are assigned to exactly one split.",
                       "Greedy speaker-group allocation targets 80/10/10 by recording count.",
                       "Rows without client_id are assigned to train and explicitly reported as a limitation.",
                       "No speaker or transcription data are modified."],
             "next_milestone":"M3.5 ASR Dataset Release"}
    (OUT/"mvy-asr-split-manifest.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    (OUT/"milestone-3.4-split-report.md").write_text(
      "# Mvy Milestone 3.4 — Train / Validation / Test Splits\n\n"
      f"Usable records: **{len(usable):,}**\n\n"
      f"Split counts: **{json.dumps(counts)}**\n\n"
      f"Known speakers: **{len(known):,}**\n\n"
      f"Rows without client ID: **{len(unknown):,}**\n\n"
      "Known speakers are kept disjoint across train, validation, and test. "
      "Records without a client ID are isolated in train and flagged because speaker-level "
      "disjointness cannot be established for those records.\n",encoding="utf-8")

if __name__=="__main__": main()
