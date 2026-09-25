#!/usr/bin/env python3
"""M5.2 immutable-style versioned research archive manifest."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[4]; OUT=ROOT/"research/mvy/analysis/milestone-5.2/output"; OUT.mkdir(parents=True,exist_ok=True)
files=[]
for p in sorted((ROOT/"research/mvy/analysis").rglob("*")):
 if p.is_file() and "milestone-5.2/output" not in str(p) and p.suffix in {".py",".md",".json",".csv",".yml"}:
  h=hashlib.sha256(p.read_bytes()).hexdigest();files.append({"path":str(p.relative_to(ROOT)),"sha256":h,"bytes":p.stat().st_size})
m={"milestone":"M5.2","title":"Versioned Research Archive","schema_version":"1.0","file_count":len(files),"files":files,"integrity":"SHA-256 per file","archive_note":"Commit history remains the authoritative version chronology; this manifest records content hashes for a reproducible snapshot."}
(OUT/"mvy-versioned-research-archive.json").write_text(json.dumps(m,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")