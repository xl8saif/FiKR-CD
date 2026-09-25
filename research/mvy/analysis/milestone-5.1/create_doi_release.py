#!/usr/bin/env python3
"""M5.1 DOI-ready archival metadata; does not mint a DOI."""
from pathlib import Path
import json,hashlib,datetime
ROOT=Path(__file__).resolve().parents[4]; OUT=ROOT/"research/mvy/analysis/milestone-5.1/output"; OUT.mkdir(parents=True,exist_ok=True)
src=ROOT/"research/mvy/source/common-voice-27/validated.tsv"
h=hashlib.sha256()
if src.exists():
 with src.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b):h.update(b)
m={"milestone":"M5.1","title":"FiKR&CD Mvy DOI Dataset Release","status":"doi_ready_metadata","version":"1.0.0","release_date":datetime.date.today().isoformat(),"creator":"Saif Ullah Jailani / FiKR&CD","language":"Indus-Kohistani","iso_639_3":"mvy","source_corpus_sha256":h.hexdigest() if src.exists() else None,"license_note":"Underlying Common Voice licensing and redistribution terms remain authoritative; FiKR&CD research metadata does not override upstream rights.","doi":None,"doi_status":"Not minted by this workflow","suggested_archive":"Zenodo or another DOI-issuing repository"}
(OUT/"mvy-doi-release-metadata.json").write_text(json.dumps(m,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")