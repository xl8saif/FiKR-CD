#!/usr/bin/env python3
"""M5.3 institutional publication package index."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[4]; OUT=ROOT/"research/mvy/analysis/milestone-5.3/output"; OUT.mkdir(parents=True,exist_ok=True)
docs=[]
for p in sorted((ROOT/"research/mvy/analysis").glob("milestone-*/*")):
 if p.is_file() and p.suffix in {".md",".json"}: docs.append(str(p.relative_to(ROOT)))
m={"milestone":"M5.3","title":"FiKR&CD Institutional Publication Package","status":"publication_package_index","institution":"FiKR&CD — Forum for Indus-Kohistani Research & Cultural Development","researcher":"Saif Ullah Jailani","language":"Indus-Kohistani (mvy)","documents":docs,"editorial_policy":["source provenance","reproducible computation","expert review","versioned releases","explicit uncertainty"]}
(OUT/"fikrcd-institutional-publication-package.json").write_text(json.dumps(m,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(OUT/"INSTITUTIONAL-PUBLICATION.md").write_text("# FiKR&CD Institutional Publication Package\n\nThis index identifies the reproducible Mvy research outputs prepared for institutional review and publication. Computational outputs are distinguished from expert linguistic interpretation.\n",encoding="utf-8")