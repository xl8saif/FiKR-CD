#!/usr/bin/env python3
"""M5.4 static research API index over public Mvy manifests."""
from pathlib import Path
import json,datetime
ROOT=Path(__file__).resolve().parents[4]; PUB=ROOT/"public/research/mvy"; OUT=ROOT/"research/mvy/analysis/milestone-5.4/output"; OUT.mkdir(parents=True,exist_ok=True)
items=[]
for p in sorted(PUB.rglob("*.json")) if PUB.exists() else []:
 try:
  d=json.loads(p.read_text(encoding="utf-8"));items.append({"path":"/"+str(p.relative_to(ROOT)).replace("\\\\","/"),"milestone":d.get("milestone"),"title":d.get("title")})
 except Exception: pass
api={"api_version":"1.0","generated":datetime.datetime.now(datetime.timezone.utc).isoformat(),"language":"mvy","name":"FiKR&CD Mvy Research API","endpoints":{"index":"/research/mvy/milestone-5.4/index.json"},"resources":items,"note":"Static discovery index; source files and upstream licenses remain authoritative."}
(OUT/"mvy-research-api-index.json").write_text(json.dumps(api,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")