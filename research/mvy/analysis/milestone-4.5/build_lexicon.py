#!/usr/bin/env python3
"""M4.5 reproducible corpus-derived lexical resource."""
from pathlib import Path
import csv,json,re,hashlib,unicodedata
from collections import Counter,defaultdict
ROOT=Path(__file__).resolve().parents[4]; SRC=ROOT/"research/mvy/source/common-voice-27/validated.tsv"; OUT=ROOT/"research/mvy/analysis/milestone-4.5/output"; OUT.mkdir(parents=True,exist_ok=True)
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda: f.read(1048576), b''): h.update(b)
 return h.hexdigest()
with SRC.open(encoding="utf-8-sig",newline="") as f:rs=list(csv.DictReader(f,delimiter="\t"))
c=Counter(); examples=defaultdict(list)
for r in rs:
 for w in re.findall(r"[^\W\d_]+(?:[’'-][^\W\d_]+)*",unicodedata.normalize("NFC",r.get("sentence","")),re.UNICODE):
  k=w.casefold();c[k]+=1
  if len(examples[k])<3:examples[k].append(r.get("sentence",""))
rows=[{"word":w,"frequency":n,"examples":" || ".join(examples[w])} for w,n in c.most_common()]
with (OUT/"mvy-lexicon.csv").open("w",encoding="utf-8",newline="") as f:w=csv.DictWriter(f,fieldnames=["word","frequency","examples"]);w.writeheader();w.writerows(rows)
m={"milestone":"M4.5","title":"Lexicon & Dictionary","status":"corpus_derived_lexical_resource","source_sha256":sha(SRC),"types":len(c),"entries":len(rows),"scope":"Frequency lexicon with corpus examples; not a semantic dictionary.","future_annotation":["part of speech","sense","definition","etymology","dialect","citation","speaker metadata"]}
(OUT/"mvy-lexicon-manifest.json").write_text(json.dumps(m,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(OUT/"milestone-4.5-lexicon-report.md").write_text("# Mvy M4.5 — Lexicon & Dictionary\n\nThis release is a corpus-derived frequency lexicon. Semantic and grammatical dictionary fields require expert annotation.\n",encoding="utf-8")