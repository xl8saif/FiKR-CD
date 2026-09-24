#!/usr/bin/env python3
from __future__ import annotations
import csv,json,re,unicodedata
from collections import Counter,defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[4]
SOURCE=ROOT/"research/mvy/source/common-voice-27/validated.tsv"
OUT=ROOT/"research/mvy/analysis/milestone-2.11"
PREFIX_CANDIDATES="ب با بہ بے بد بر در دو نا نہ ان کہ کو".split()
SUFFIX_CANDIDATES="ان ون ین ېن یں وں کی کے کو نے ں ہا گی گیا گے تان دان وال والا والی والے پن گر یت".split()

def words(text):
    return [x for x in re.split(r"[\s\u200c\u200d]+",text.strip()) if x]

def clean(w):
    return "".join(c for c in w if not unicodedata.category(c).startswith("P"))

def write_csv(p,fields,rows):
    with p.open("w",newline="",encoding="utf-8-sig") as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    with SOURCE.open(encoding="utf-8-sig",newline="") as f:
        r=csv.DictReader(f,delimiter="\t")
        if "sentence" not in (r.fieldnames or []): raise ValueError("validated.tsv must contain sentence")
        sentences=[x["sentence"] or "" for x in r]
    wf=Counter(); sentfreq=Counter(); lengths=Counter(); initial=Counter(); final=Counter(); shapes=Counter()
    prefix=Counter(); suffix=Counter(); examples=defaultdict(list)
    for s in sentences:
        seen=set()
        for raw in words(s):
            w=clean(raw)
            if not w: continue
            wf[w]+=1; lengths[len(w)]+=1; initial[w[0]]+=1; final[w[-1]]+=1
            shapes["".join("V" if c in "اےییوے" else "C" for c in w)]+=1; seen.add(w)
            for a in PREFIX_CANDIDATES:
                if len(w)>len(a)+1 and w.startswith(a):
                    prefix[a]+=1
                    if len(examples[("P",a)])<5: examples[("P",a)].append(w)
            for a in SUFFIX_CANDIDATES:
                if len(w)>len(a)+1 and w.endswith(a):
                    suffix[a]+=1
                    if len(examples[("S",a)])<5: examples[("S",a)].append(w)
        sentfreq.update(seen)
    total=sum(wf.values()); types=len(wf); hapax=sum(v==1 for v in wf.values())
    write_csv(OUT/"mvy-word-form-frequency.csv",["word","frequency","sentence_frequency","length"],[{"word":x,"frequency":wf[x],"sentence_frequency":sentfreq[x],"length":len(x)} for x in sorted(wf,key=lambda x:(-wf[x],x))])
    write_csv(OUT/"mvy-morpheme-candidate-prefixes.csv",["candidate","frequency","examples"],[{"candidate":x,"frequency":prefix[x],"examples":" | ".join(examples[("P",x)])} for x in sorted(prefix,key=lambda x:(-prefix[x],x))])
    write_csv(OUT/"mvy-morpheme-candidate-suffixes.csv",["candidate","frequency","examples"],[{"candidate":x,"frequency":suffix[x],"examples":" | ".join(examples[("S",x)])} for x in sorted(suffix,key=lambda x:(-suffix[x],x))])
    write_csv(OUT/"mvy-word-initial-distribution.csv",["grapheme","token_frequency"],[{"grapheme":x,"token_frequency":initial[x]} for x in sorted(initial,key=lambda x:(-initial[x],x))])
    write_csv(OUT/"mvy-word-final-distribution.csv",["grapheme","token_frequency"],[{"grapheme":x,"token_frequency":final[x]} for x in sorted(final,key=lambda x:(-final[x],x))])
    write_csv(OUT/"mvy-word-length-morphology.csv",["length","token_frequency"],[{"length":x,"token_frequency":lengths[x]} for x in sorted(lengths)])
    write_csv(OUT/"mvy-word-shape-distribution.csv",["shape","frequency"],[{"shape":x,"frequency":shapes[x]} for x in sorted(shapes,key=lambda x:(-shapes[x],x))])
    prod=[]
    for typ,c in (("prefix",prefix),("suffix",suffix)):
        for a in c:
            stems=set()
            for w in wf:
                if typ=="prefix" and w.startswith(a) and len(w)>len(a)+1: stems.add(w[len(a):])
                if typ=="suffix" and w.endswith(a) and len(w)>len(a)+1: stems.add(w[:-len(a)])
            prod.append({"type":typ,"candidate":a,"token_frequency":c[a],"distinct_residuals":len(stems)})
    write_csv(OUT/"mvy-morphological-productivity-candidates.csv",["type","candidate","token_frequency","distinct_residuals"],prod)
    roots=Counter()
    for w in wf:
        if len(w)>=4: roots[w[:3]]+=wf[w]
    write_csv(OUT/"mvy-three-grapheme-stem-clusters.csv",["stem_prefix","token_frequency","type_count"],[{"stem_prefix":x,"token_frequency":roots[x],"type_count":sum(w.startswith(x) for w in wf)} for x in sorted(roots,key=lambda x:(-roots[x],x))])
    manifest={"milestone":"2.11","title":"Lexical & Morphological Analysis","language":"Indus-Kohistani","iso_639_3":"mvy","source":"research/mvy/source/common-voice-27/validated.tsv","corpus_rows":len(sentences),"word_tokens":total,"word_types":types,"type_token_ratio":round(types/total,8) if total else 0,"hapax_types":hapax,"candidate_prefixes":len(prefix),"candidate_suffixes":len(suffix),"method":"Exploratory lexical and morphology-oriented corpus analysis; candidate affixes are not linguistically validated morpheme segmentations."}
    (OUT/"mvy-lexical-morphology-manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    report="# Milestone 2.11 — Lexical & Morphological Analysis\n\nCorpus rows: %d\nWord tokens: %d\nWord types: %d\nType-token ratio: %.6f\nHapax types: %d\n\nCandidate prefixes/suffixes are exploratory corpus evidence, not validated grammatical segmentation. Recurring substrings may reflect orthography, clitics, borrowing, dialectal variation, or accidental sequences. Linguistic validation is required before grammatical claims."%(len(sentences),total,types,types/total if total else 0,hapax)
    (OUT/"milestone-2.11-lexical-morphology-report.md").write_text(report,encoding="utf-8")

if __name__=="__main__": main()
