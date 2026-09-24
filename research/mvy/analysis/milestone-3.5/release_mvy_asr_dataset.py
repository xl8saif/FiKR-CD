#!/usr/bin/env python3
"""Mvy M3.5 reproducible ASR dataset release compiler."""
from __future__ import annotations
import hashlib,json,csv
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/"research/mvy"; SPLIT=BASE/"analysis/milestone-3.4/output"; OUT=BASE/"analysis/milestone-3.5/output"
OUT.mkdir(parents=True,exist_ok=True)
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""): h.update(b)
 return h.hexdigest()
def main():
 sm=SPLIT/"mvy-asr-split-manifest.json"; sc=SPLIT/"mvy-asr-split-manifest.csv"
 if not sm.is_file() or not sc.is_file(): raise SystemExit("M3.4 outputs required")
 meta=json.loads(sm.read_text(encoding="utf-8"))
 rows=list(csv.DictReader(sc.open(encoding="utf-8",newline="")))
 release=[]
 for r in rows:
  audio=(BASE/"source/common-voice-27"/r["path"]).is_file()
  rid="mvy-"+hashlib.sha256((r["path"]+"\t"+r["sentence"]+"\t"+r["source_row"]).encode()).hexdigest()[:20]
  release.append({"id":rid,"split":r["split"],"audio_filepath":r["path"],"audio_available":audio,
                  "text":r["sentence"],"text_original":r["sentence"],"client_id":r["client_id"],
                  "source_row":int(r["source_row"])})
 release.sort(key=lambda x:(x["split"],x["source_row"]))
 def write_jsonl(p,items):
  with p.open("w",encoding="utf-8") as f:
   for x in items:f.write(json.dumps(x,ensure_ascii=False,sort_keys=True)+"\n")
 write_jsonl(OUT/"mvy-asr-dataset-release.jsonl",release)
 for s in ("train","validation","test"): write_jsonl(OUT/f"mvy-asr-{s}.jsonl",[x for x in release if x["split"]==s])
 files=[{"file":p.name,"bytes":p.stat().st_size,"sha256":sha(p)} for p in sorted(OUT.glob("*.jsonl"))]
 avail=sum(x["audio_available"] for x in release)
 manifest={"milestone":"M3.5","title":"ASR Dataset Release","release_status":"release_candidate",
 "source":"research/mvy/source/common-voice-27/validated.tsv","m3_4_split_manifest_sha256":sha(sm),
 "records":len(release),"audio_available_records":avail,"audio_unavailable_records":len(release)-avail,
 "split_counts":{s:sum(x["split"]==s for x in release) for s in ("train","validation","test")},
 "speaker_disjointness_basis":"M3.4 known client_id groups","files":files,
 "reproducibility":{"split_seed":meta.get("seed",3401),"split_ratios":meta.get("ratios",{"train":.8,"validation":.1,"test":.1})},
 "limitations":["Text-side manifest release; audio is referenced, not redistributed.",
 "Records without client_id retain the M3.4 train-only limitation.",
 "External audio licensing/redistribution rights are not established by this repository release."],
 "next_milestone":"M4.1 Linguistic Corpus Research"}
 (OUT/"mvy-asr-dataset-release-manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2,sort_keys=True)+"\n",encoding="utf-8")
 (OUT/"RELEASE-NOTES.md").write_text("# Mvy ASR Dataset Release — M3.5\n\nReproducible JSONL train/validation/test manifests derived from M3.4. Original transcription and source-row provenance are retained. Audio is referenced, not redistributed.\n",encoding="utf-8")
 (OUT/"milestone-3.5-asr-dataset-release-report.md").write_text(f"# Mvy Milestone 3.5 — ASR Dataset Release\n\nRecords: **{len(release):,}**\n\nAudio available: **{avail:,}**\n\nAudio unavailable: **{len(release)-avail:,}**\n",encoding="utf-8")
if __name__=="__main__": main()
