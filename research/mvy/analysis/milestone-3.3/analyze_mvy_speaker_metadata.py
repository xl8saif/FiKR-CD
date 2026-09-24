#!/usr/bin/env python3
"""Mvy M3.3 — Speaker & Recording Metadata analysis.

Profiles metadata supplied by the Common Voice validated.tsv source.
No demographic inference is performed: blank/unknown source values remain unknown.
"""
from __future__ import annotations
import csv, hashlib, json
from collections import Counter, defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[4]
TSV=ROOT/"research/mvy/source/common-voice-27/validated.tsv"
OUT=ROOT/"research/mvy/analysis/milestone-3.3/output"
OUT.mkdir(parents=True,exist_ok=True)

FIELDS=["client_id","age","gender","accent","locale","segment","up_votes","down_votes"]

def sha256(s): return hashlib.sha256(s.encode("utf-8")).hexdigest()

def norm(v): return (v or "").strip()

def write_csv(name,rows,fields):
    p=OUT/name
    with p.open("w",encoding="utf-8",newline="") as f:
        w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows(rows)

def main():
    if not TSV.is_file(): raise SystemExit(f"Missing source: {TSV}")
    with TSV.open("r",encoding="utf-8-sig",newline="") as f:
        reader=csv.DictReader(f,delimiter="\t")
        headers=reader.fieldnames or []
        rows=list(reader)

    speakers={}
    rec_by_speaker=Counter()
    speaker_meta=defaultdict(dict)
    metadata_conflicts=defaultdict(list)
    field_counts={k:Counter() for k in FIELDS}
    recording_rows=[]
    for i,row in enumerate(rows,start=2):
        cid=norm(row.get("client_id"))
        key=cid or f"__unknown_row_{i}"
        rec_by_speaker[key]+=1
        for field in FIELDS:
            value=norm(row.get(field))
            field_counts[field][value or "__unknown__"]+=1
            if cid and field in {"age","gender","accent","locale"}:
                old=speaker_meta[cid].get(field)
                if old is None and value: speaker_meta[cid][field]=value
                elif value and old and value!=old: metadata_conflicts[(cid,field)].append(value)
        recording_rows.append({
            "row":i,"client_id":cid or "__unknown__","path":norm(row.get("path")),
            "locale":norm(row.get("locale")),"age":norm(row.get("age")),
            "gender":norm(row.get("gender")),"accent":norm(row.get("accent")),
            "segment":norm(row.get("segment")),"up_votes":norm(row.get("up_votes")),
            "down_votes":norm(row.get("down_votes"))
        })

    known_speakers={k:v for k,v in rec_by_speaker.items() if not k.startswith("__unknown_row_")}
    speaker_rows=[]
    for cid,n in sorted(known_speakers.items(),key=lambda x:(-x[1],x[0])):
        m=speaker_meta.get(cid,{})
        speaker_rows.append({"client_id":cid,"recordings":n,
            "age":m.get("age",""),"gender":m.get("gender",""),
            "accent":m.get("accent",""),"locale":m.get("locale","")})

    distributions=[]
    for field,c in field_counts.items():
        for value,n in c.most_common():
            distributions.append({"field":field,"value":value,"records":n,
                                   "percent":round(n/len(rows)*100,4) if rows else 0})

    conflicts=[{"client_id":cid,"field":field,"observed_values":" | ".join(sorted(set(vals)))}
               for (cid,field),vals in metadata_conflicts.items()]
    write_csv("mvy-speaker-recording-metadata.csv",recording_rows,
              ["row","client_id","path","locale","age","gender","accent","segment","up_votes","down_votes"])
    write_csv("mvy-speaker-summary.csv",speaker_rows,
              ["client_id","recordings","age","gender","accent","locale"])
    write_csv("mvy-metadata-distributions.csv",distributions,["field","value","records","percent"])
    write_csv("mvy-speaker-metadata-conflicts.csv",conflicts,["client_id","field","observed_values"])

    missing={f:field_counts[f].get("__unknown__",0) for f in FIELDS}
    summary={
      "milestone":"M3.3","title":"Speaker & Recording Metadata",
      "source":"research/mvy/source/common-voice-27/validated.tsv",
      "source_sha256":sha256(TSV.read_text(encoding="utf-8-sig")),
      "records":len(rows),"known_speakers":len(known_speakers),
      "records_without_client_id":field_counts["client_id"].get("__unknown__",0),
      "metadata_missing_records":missing,
      "metadata_conflict_pairs":len(conflicts),
      "unique_values":{f:len(c) - (1 if "__unknown__" in c else 0) for f,c in field_counts.items()},
      "method":[
        "Use source-provided metadata only.",
        "Treat missing values as unknown; do not infer speaker demographics.",
        "Profile client-level recording counts and supplied age, gender, accent, and locale.",
        "Flag within-client metadata conflicts for review rather than resolving them automatically.",
        "Preserve recording-level provenance through source row and audio path."
      ],
      "next_milestone":"M3.4 Train/Validation/Test Splits"
    }
    (OUT/"mvy-speaker-recording-metadata-manifest.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    (OUT/"milestone-3.3-speaker-recording-metadata-report.md").write_text(
      "# Mvy Milestone 3.3 — Speaker & Recording Metadata\n\n"
      f"Records: **{len(rows):,}**\n\nKnown speakers: **{len(known_speakers):,}**\n\n"
      f"Records without client ID: **{summary['records_without_client_id']:,}**\n\n"
      f"Metadata conflict groups: **{len(conflicts):,}**\n\n"
      "This milestone profiles source-supplied metadata without demographic inference. "
      "Conflicting metadata within a client ID is flagged for review.\n\n"
      "## Next\n\nM3.4 — Train/Validation/Test Splits.\n",encoding="utf-8")

if __name__=="__main__": main()
