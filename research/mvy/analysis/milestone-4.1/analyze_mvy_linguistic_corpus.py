#!/usr/bin/env python3
"""Mvy M4.1 — reproducible descriptive linguistic corpus analysis."""
from __future__ import annotations
import csv,hashlib,json,math,re,unicodedata\ntry:\n import regex as rx\nexcept ImportError:\n rx=None
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
TSV=ROOT/"research/mvy/source/common-voice-27/validated.tsv"
OUT=ROOT/"research/mvy/analysis/milestone-4.1/output"; OUT.mkdir(parents=True,exist_ok=True)
SPECIAL=set("ݜ ڇ څ ڙ ݨ".split())
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b):h.update(b)
 return h.hexdigest()
def graphemes(s):
 return re.findall(r"\X",unicodedata.normalize("NFC",s))
def words(s): return re.findall(r"[^\W\d_]+(?:[’'\-][^\W\d_]+)*",s,flags=re.UNICODE)
def csvout(name,rows,fields):
 with (OUT/name).open("w",encoding="utf-8",newline="") as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
def main():
 if not TSV.is_file():raise SystemExit(f"Missing source: {TSV}")
 with TSV.open(encoding="utf-8-sig",newline="") as f: rows=list(csv.DictReader(f,delimiter="\t"))
 sentences=[(r.get("sentence") or "").strip() for r in rows if (r.get("sentence") or "").strip()]
 toks=[]; sentence_stats=[]; g=Counter(); initial=Counter(); final=Counter(); lengths=Counter()
 special_context=Counter(); punctuation=Counter(); mark=Counter(); big=Counter(); tri=Counter()
 for s in sentences:
  ws=words(s); toks.extend(ws); gs=graphemes(s)
  sentence_stats.append((len(ws),len(gs)))
  for x in gs:g[x]+=1
  for w in ws:
   wg=graphemes(w)
   if wg: initial[wg[0]]+=1;final[wg[-1]]+=1;lengths[len(wg)]+=1
   for x in SPECIAL:
    if x in wg:
     i=wg.index(x); special_context[(x,wg[i-1] if i else "∅",wg[i+1] if i+1<len(wg) else "∅")]+=1
  for ch in s:
   if unicodedata.category(ch).startswith("P"):punctuation[ch]+=1
   if unicodedata.category(ch).startswith("M"):mark[ch]+=1
  for i in range(len(gs)-1):big[(gs[i],gs[i+1])]+=1
  for i in range(len(gs)-2):tri[(gs[i],gs[i+1],gs[i+2])]+=1
types=Counter(toks)
 def rows_counter(c,names):
  return [{**dict(zip(names,k if isinstance(k,tuple) else (k,))),"frequency":v} for k,v in c.most_common()]
 csvout("mvy-linguistic-grapheme-frequency.csv",[{"grapheme":k,"frequency":v} for k,v in g.most_common()],["grapheme","frequency"])
 csvout("mvy-linguistic-word-frequency.csv",[{"word":k,"frequency":v} for k,v in types.most_common()],["word","frequency"])
 csvout("mvy-word-initial-distribution.csv",[{"grapheme":k,"words":v} for k,v in initial.most_common()],["grapheme","words"])
 csvout("mvy-word-final-distribution.csv",[{"grapheme":k,"words":v} for k,v in final.most_common()],["grapheme","words"])
 csvout("mvy-word-length-distribution.csv",[{"grapheme_length":k,"word_count":v} for k,v in sorted(lengths.items())],["grapheme_length","word_count"])
 csvout("mvy-special-letter-contexts.csv",[{"special":a,"left":b,"right":c,"frequency":v} for (a,b,c),v in special_context.most_common()],["special","left","right","frequency"])
 csvout("mvy-grapheme-bigrams.csv",[{"left":a,"right":b,"frequency":v} for (a,b),v in big.most_common()],["left","right","frequency"])
 csvout("mvy-grapheme-trigrams.csv",[{"first":a,"second":b,"third":c,"frequency":v} for (a,b,c),v in tri.most_common()],["first","second","third","frequency"])
 csvout("mvy-punctuation-frequency.csv",[{"character":k,"frequency":v} for k,v in punctuation.most_common()],["character","frequency"])
 csvout("mvy-combining-mark-frequency.csv",[{"mark":k,"frequency":v} for k,v in mark.most_common()],["mark","frequency"])
 lens=[x[1] for x in sentence_stats]; tl=sum(len(x) for x in toks)
 summary={"milestone":"M4.1","title":"Linguistic Corpus Research","status":"descriptive_corpus_analysis",
 "source":"research/mvy/source/common-voice-27/validated.tsv","source_sha256":sha(TSV),
 "sentences":len(sentences),"tokens":len(toks),"types":len(types),
 "type_token_ratio":round(len(types)/len(toks),6) if toks else 0,
 "mean_tokens_per_sentence":round(sum(x[0] for x in sentence_stats)/len(sentence_stats),6) if sentences else 0,
 "mean_graphemes_per_sentence":round(sum(lens)/len(lens),6) if lens else 0,
 "special_letters":{k:g.get(k,0) for k in sorted(SPECIAL)},
 "method":["Unicode NFC grapheme segmentation with Python regex \\X.",
 "Descriptive lexical, graphemic, positional, n-gram, punctuation, and combining-mark analysis.",
 "No claims of validated phonological, morphological, or syntactic categories are made.",
 "Corpus frequencies describe this source corpus and should not be generalized without further sampling."],
 "next_milestone":"M4.2 Comparative Dardic Analysis"}
 (OUT/"mvy-linguistic-corpus-manifest.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2,sort_keys=True)+"\n",encoding="utf-8")
 (OUT/"milestone-4.1-linguistic-corpus-report.md").write_text(
 "# Mvy Milestone 4.1 — Linguistic Corpus Research\n\n"
 f"Sentences: **{len(sentences):,}**\n\nTokens: **{len(toks):,}**\n\nTypes: **{len(types):,}**\n\n"
 f"Type-token ratio: **{summary['type_token_ratio']}**\n\n"
 "This is a descriptive corpus analysis covering grapheme, lexical, positional, n-gram, punctuation, "
 "and combining-mark patterns. It does not by itself establish phonological, morphological, or syntactic categories.\n",
 encoding="utf-8")
if __name__=="__main__":main()
