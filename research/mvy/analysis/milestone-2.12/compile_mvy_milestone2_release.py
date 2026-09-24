#!/usr/bin/env python3
from __future__ import annotations
import json,hashlib,datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
AN=ROOT/"research/mvy/analysis"; OUT=AN/"milestone-2.12"; PUB=ROOT/"public/research/mvy/milestone-2"
SOURCE=ROOT/"research/mvy/source/common-voice-27/validated.tsv"
def sha256(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""): h.update(b)
 return h.hexdigest()
def main():
 OUT.mkdir(parents=True,exist_ok=True); PUB.mkdir(parents=True,exist_ok=True)
 ms={}
 for m in ["2.3","2.4","2.5","2.6","2.7","2.8","2.9","2.10","2.11"]:
  c=list((AN/f"milestone-{m}").glob("*manifest.json"))
  if c:
   try: ms[m]=json.loads(c[0].read_text(encoding="utf-8"))
   except Exception: pass
 sh=sha256(SOURCE) if SOURCE.exists() else None
 manifest={"milestone":"2.12","title":"Milestone 2 Research Report & Dataset Release","language":"Indus-Kohistani","iso_639_3":"mvy","source":"research/mvy/source/common-voice-27/validated.tsv","source_sha256":sh,"generated_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),"included_analysis_milestones":sorted(ms),"status":"research_release_candidate","reproducibility":"Milestone analysis scripts are stored in the repository and can be rerun against the corpus.","scope":"Orthographic, lexical, diacritic, aspirated, special-letter, anomaly, inventory-validation, and exploratory morphology analyses.","caveat":"Corpus-derived statistics are separated from linguistic interpretation; morphology and orthographic changes require expert review."}
 data=json.dumps(manifest,ensure_ascii=False,indent=2)+"\n"
 (OUT/"mvy-milestone-2-release-manifest.json").write_text(data,encoding="utf-8"); (PUB/"mvy-milestone-2-release-manifest.json").write_text(data,encoding="utf-8")
 report="# Mvy Milestone 2 — Orthographic & Lexical Research Release\n\n## Language\nIndus-Kohistani (mvy)\n\n## Scope\nConsolidated reproducible corpus analyses from M2.3 through M2.11: grapheme frequency, orthographic patterns, lexical frequency, diacritics, aspirated consonants, special letters, rare/anomalous sequences, inventory validation, and exploratory morphology.\n\n## Source\nresearch/mvy/source/common-voice-27/validated.tsv\n\n"
 if sh: report+=f"Source SHA-256: {sh}\n\n"
 report+="## Included milestones\n"+"".join(f"- M{x}\n" for x in sorted(ms))+"\n## Research status\nResearch release candidate. Deterministic corpus measurements are reproducible; interpretive linguistic claims require expert review.\n\n## Reproducibility\nRun the corresponding scripts under research/mvy/analysis/milestone-*.\n\n## Dataset policy\nPublic metadata does not replace the original corpus licensing and distribution conditions.\n"
 (OUT/"Mvy-Milestone-2-Research-Report.md").write_text(report,encoding="utf-8")
 (OUT/"RELEASE-NOTES.md").write_text("# Mvy Milestone 2 Release Notes\n\nResearch-release candidate consolidating M2.3–M2.11. No automatic orthographic corrections are introduced.\n",encoding="utf-8")
if __name__=="__main__": main()
