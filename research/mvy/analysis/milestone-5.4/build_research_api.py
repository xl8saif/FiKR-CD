#!/usr/bin/env python3
"""M5.4 static research API index over public Mvy manifests."""
from pathlib import Path
import json,datetime
ROOT=Path(__file__).resolve().parents[4]; PUB=ROOT/"public/research/mvy"; OUT=ROOT/"research/mvy/analysis/milestone-5.4/output"; OUT.mkdir(parents=True,exist_ok=True)
expected=[
("2.3","mvy-grapheme-inventory.json"),("2.5","mvy-lexical-frequency-manifest.json"),("2.6","mvy-diacritic-manifest.json"),
("2.7","mvy-aspirated-manifest.json"),("2.8","mvy-special-letter-manifest.json"),("2.9","mvy-rare-anomalous-manifest.json"),
("2.10","mvy-inventory-validation-manifest.json"),("2.11","mvy-lexical-morphology-manifest.json"),("2","mvy-milestone-2-release-manifest.json"),
("3.1","mvy-asr-preparation-manifest.json"),("3.2","mvy-audio-text-qc-manifest.json"),("3.3","mvy-speaker-recording-metadata-manifest.json"),
("3.4","mvy-asr-split-manifest.json"),("3.5","mvy-asr-dataset-release-manifest.json"),
("4.1","mvy-linguistic-corpus-manifest.json"),("4.2","mvy-dardic-comparative-manifest.json"),("4.3","mvy-phonology-orthography-manifest.json"),
("4.4","mvy-morphology-syntax-manifest.json"),("4.5","mvy-lexicon-manifest.json"),("4.6","mvy-research-publication-manifest.json"),
("5.2","mvy-versioned-research-archive.json"),("5.3","fikrcd-institutional-publication-package.json"),("5.4","index.json")]
items=[]
for m,name in expected:
 p=PUB/f"milestone-{m}"/name
 exists=p.exists()
 item={"milestone":m,"path":"/"+str(p.relative_to(ROOT)).replace("\\","/"),"status":"published" if exists else "workflow_pending"}
 if exists:
  try:
   d=json.loads(p.read_text(encoding="utf-8")); item["title"]=d.get("title"); item["manifest_milestone"]=d.get("milestone")
  except Exception: item["status"]="published_unparsed"
 items.append(item)
api={"api_version":"1.1","generated":datetime.datetime.now(datetime.timezone.utc).isoformat(),"language":"mvy","name":"FiKR&CD Mvy Research API","resources":items,"omitted_milestone":"5.1 DOI release (intentionally skipped pending external DOI publication)","notes":["workflow_pending means the repository workflow is implemented but its generated public manifest is not present in the default branch.","This index never fabricates analysis results.","Source files and upstream licenses remain authoritative."]}
(OUT/"mvy-research-api-index.json").write_text(json.dumps(api,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
