#!/usr/bin/env python3
"""M4.2 comparative Dardic analysis framework; uses only supplied corpora."""
from pathlib import Path
import csv,hashlib,json,re,unicodedata
ROOT=Path(__file__).resolve().parents[4]; MVY=ROOT/"research/mvy/source/common-voice-27/validated.tsv"; SRC=ROOT/"research/dardic/comparative/source"; OUT=ROOT/"research/mvy/analysis/milestone-4.2/output"; OUT.mkdir(parents=True,exist_ok=True)
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b): h.update(b)
 return h.hexdigest()
def words(s): return re.findall(r"[^\W\d_]+(?:[’'-][^\W\d_]+)*",unicodedata.normalize("NFC",s),re.UNICODE)
def profile(path):
 with path.open(encoding="utf-8-sig",newline="") as f:
  rs=list(csv.DictReader(f,delimiter="\t"))
 texts=[r.get("sentence","").strip() for r in rs if r.get("sentence","").strip()]
 ts=[w for s in texts for w in words(s)]; types=len(set(ts))
 return {"file":str(path.relative_to(ROOT)),"sha256":sha(path),"sentences":len(texts),"tokens":len(ts),"types":types,"ttr":round(types/len(ts),6) if ts else 0}
profiles=[]
if MVY.exists(): profiles.append({"language":"mvy","label":"Indus-Kohistani (Mvy)","profile":profile(MVY)})
if SRC.exists():
 for p in sorted(SRC.glob("*.tsv")):
  try: profiles.append({"language":p.stem,"label":p.stem,"profile":profile(p)})
manifest={"milestone":"M4.2","title":"Comparative Dardic Analysis","status":"comparative_framework_with_available_sources","profiles":profiles,"comparability_notes":["Only corpora physically supplied in the repository are compared.","Absence of a corpus is not treated as evidence about a language.","Frequency differences are corpus-dependent and are not interpreted as typological conclusions.","Validated comparative claims require documented, comparable corpora and linguistic metadata."],"next_milestone":"M4.3 Phonology & Orthography"}
(OUT/"mvy-dardic-comparative-manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(OUT/"milestone-4.2-comparative-dardic-report.md").write_text("# Mvy M4.2 — Comparative Dardic Analysis\n\nThis release compares only documented corpora present in the repository. It provides corpus-level evidence and a reproducible comparison framework; it does not infer typological relationships from missing or non-comparable data.\n\n"+json.dumps(profiles,ensure_ascii=False,indent=2),encoding="utf-8")