#!/usr/bin/env python3
"""M4.4 exploratory morphology/syntax proxies; no automatic grammatical annotation."""
from pathlib import Path
import csv,json,re,hashlib,unicodedata
from collections import Counter
ROOT=Path(__file__).resolve().parents[4]; SRC=ROOT/"research/mvy/source/common-voice-27/validated.tsv"; OUT=ROOT/"research/mvy/analysis/milestone-4.4/output"; OUT.mkdir(parents=True,exist_ok=True)
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b):h.update(b)
 return h.hexdigest()
with SRC.open(encoding="utf-8-sig",newline="") as f: rs=list(csv.DictReader(f,delimiter="\t"))
sents=[r.get("sentence","").strip() for r in rs if r.get("sentence","").strip()]; token=Counter(); pairs=Counter(); lens=Counter(); punct=Counter()
for s in sents:
 ws=re.findall(r"[^\W\d_]+",unicodedata.normalize("NFC",s),re.UNICODE); token.update(ws); lens[len(ws)]+=1
 for i in range(len(ws)-1): pairs[(ws[i],ws[i+1])]+=1
 for c in s:
  if unicodedata.category(c).startswith("P"): punct[c]+=1
def out(name,rows,fields):
 with (OUT/name).open("w",encoding="utf-8",newline="") as f:w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
out("mvy-syntactic-bigram-candidates.csv",[{"left":a,"right":b,"frequency":v} for (a,b),v in pairs.most_common(1000)],["left","right","frequency"])
out("mvy-sentence-token-length.csv",[{"tokens":k,"sentences":v} for k,v in sorted(lens.items())],["tokens","sentences"])
out("mvy-punctuation-patterns.csv",[{"punctuation":k,"frequency":v} for k,v in punct.most_common()],["punctuation","frequency"])
m={"milestone":"M4.4","title":"Morphology & Syntax","status":"exploratory_corpus_proxies","source_sha256":sha(SRC),"sentences":len(sents),"notes":["Frequent adjacent word pairs are candidate constructions, not validated syntax.","Word-form recurrence is not sufficient to establish morpheme boundaries.","Manual linguistic annotation is required for grammatical conclusions."]}
(OUT/"mvy-morphology-syntax-manifest.json").write_text(json.dumps(m,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(OUT/"milestone-4.4-morphology-syntax-report.md").write_text("# Mvy M4.4 — Morphology & Syntax\n\nExploratory corpus evidence is provided without automatic POS, morpheme, or dependency annotation.\n",encoding="utf-8")