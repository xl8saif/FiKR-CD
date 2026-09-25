#!/usr/bin/env python3
"""M4.6 compile a publication-ready research index from completed milestones."""
from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parents[4]; OUT=ROOT/"research/mvy/analysis/milestone-4.6/output"; OUT.mkdir(parents=True,exist_ok=True)
milestones=["4.1","4.2","4.3","4.4","4.5"]
items=[]
for m in milestones:
 p=ROOT/f"research/mvy/analysis/milestone-{m}/output"
 found=list(p.glob("*manifest.json")) if p.exists() else []
 items.append({"milestone":f"M{m}","local_manifests":[str(x.relative_to(ROOT)) for x in found],"status":"implemented" if found else "awaiting_workflow_execution"})
pub={"title":"FiKR&CD Mvy Linguistic Research — Milestones 4.1–4.6","status":"publication_candidate","milestones":items,"principles":["reproducibility","source provenance","explicit uncertainty","expert review before linguistic claims"],"next":"M5 DOI and archival release"}
(OUT/"mvy-research-publication-manifest.json").write_text(json.dumps(pub,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(OUT/"Mvy-Linguistic-Research-Publication.md").write_text("# FiKR&CD Mvy Linguistic Research\n\n## Publication candidate\n\nThis package consolidates descriptive corpus research, comparative framework, orthographic evidence, exploratory morphology/syntax evidence, and a corpus-derived lexical resource. It distinguishes computational observations from linguistically validated interpretations and preserves source provenance.\n\n## Review requirement\n\nClaims about phonology, morphology, syntax, semantics, dialectology, and historical relationships require expert linguistic review and, where appropriate, annotated datasets and acoustic evidence.\n",encoding="utf-8")