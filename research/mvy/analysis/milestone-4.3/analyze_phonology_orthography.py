#!/usr/bin/env python3
import regex as rx
"""M4.3 descriptive phonology/orthography evidence from orthographic corpus."""
from pathlib import Path
import csv,json,re,unicodedata,hashlib
from collections import Counter
ROOT=Path(__file__).resolve().parents[4]; SRC=ROOT/"research/mvy/source/common-voice-27/validated.tsv"; OUT=ROOT/"research/mvy/analysis/milestone-4.3/output"; OUT.mkdir(parents=True,exist_ok=True)
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda: f.read(1048576), b''): h.update(b)
 return h.hexdigest()
def gs(s): return re.findall(r"\X",unicodedata.normalize("NFC",s))
with SRC.open(encoding="utf-8-sig",newline="") as f: rs=list(csv.DictReader(f,delimiter="\t"))
sent=[r.get("sentence","").strip() for r in rs if r.get("sentence","").strip()]; freq=Counter(); init=Counter(); final=Counter(); positions=Counter()
for s in sent:
 for w in re.findall(r"[^\W\d_]+",s,re.UNICODE):
  x=gs(w)
  if x:
   init[x[0]]+=1; final[x[-1]]+=1
   for i,g in enumerate(x): freq[g]+=1; positions[(g,"initial" if i==0 else "final" if i==len(x)-1 else "medial")] += 1
def write(n,rows,fields):
 with (OUT/n).open("w",encoding="utf-8",newline="") as f: w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
write("mvy-phonology-orthography-graphemes.csv",[{"grapheme":k,"frequency":v} for k,v in freq.most_common()],["grapheme","frequency"])
write("mvy-phonology-orthography-positions.csv",[{"grapheme":a,"position":b,"frequency":v} for (a,b),v in positions.most_common()],["grapheme","position","frequency"])
write("mvy-phonology-orthography-initial-final.csv",[{"grapheme":k,"initial":init[k],"final":final[k]} for k in sorted(set(init)|set(final))],["grapheme","initial","final"])
m={"milestone":"M4.3","title":"Phonology & Orthography","status":"orthographic_evidence_not_phonological_inference","source_sha256":sha(SRC),"sentences":len(sent),"method":["Grapheme segmentation and positional distribution.","No phoneme inventory is inferred solely from spelling frequency.","Phonetic validation requires recordings and expert annotation."]}
(OUT/"mvy-phonology-orthography-manifest.json").write_text(json.dumps(m,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(OUT/"milestone-4.3-phonology-orthography-report.md").write_text("# Mvy M4.3 — Phonology & Orthography\n\nThis milestone documents orthographic evidence and explicitly avoids equating graphemes with phonemes without phonetic evidence.\n",encoding="utf-8")