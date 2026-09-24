#!/usr/bin/env python3
"""Milestone 2.10 — Mvy Orthographic Inventory Validation."""
from __future__ import annotations
import csv,json,unicodedata
from collections import Counter,defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
SOURCE=ROOT/"research/mvy/source/common-voice-27/validated.tsv"
OUT=ROOT/"research/mvy/analysis/milestone-2.10"
CANONICAL="""ا ب بھ پ پھ ت تھ ٹ ٹھ ث ج جھ چ چھ ڇ ڇھ ح خ څ څھ د دھ ڈ ڈھ ذ ر رھ ڑ ڑھ ز ژ ژھ ڙ ڙھ س ش ݜ ص ض ط ظ ع غ ف ق ک کھ گ گھ ل لھ م مھ ن نھ ݨ و ہ ء ی ې ے""".split()
M29="""ا ب بھ پ پھ ت تھ ٹ ٹھ ث ج جھ چ چھ ڇ ڇھ ح خ څ څھ د دھ ڈ ڈھ ذ ر رھ ڑ ڑھ ز ژ ژھ ڙ ڙھ س ش ݜ ص ض ط ظ ع غ ف ق ک کھ گ گھ ل لھ م مہ ن نہ ݨ و ہ ء ی ې ے""".split()
CS,MS=set(CANONICAL),set(M29); MARKS={"Mn","Mc","Me"}
def gs(t):
    inv=sorted(CS|{"مہ","نہ","ݨھ"},key=len,reverse=True); out=[];i=0
    while i<len(t):
        if unicodedata.category(t[i]) in MARKS:
            if out: out[-1]+=t[i]
            else: out.append(t[i])
            i+=1;continue
        h=next((g for g in inv if t.startswith(g,i)),None)
        if h:
            x=h;j=i+len(h)
            while j<len(t) and unicodedata.category(t[j]) in MARKS:x+=t[j];j+=1
            out.append(x);i=j
        else:
            x=t[i];i+=1
            while i<len(t) and unicodedata.category(t[i]) in MARKS:x+=t[i];i+=1
            out.append(x)
    return out
def wc(p,fields,rows):
    with p.open("w",newline="",encoding="utf-8-sig") as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
def main():
    OUT.mkdir(parents=True,exist_ok=True)
    with SOURCE.open(encoding="utf-8-sig",newline="") as f:
        r=csv.DictReader(f,delimiter="\t"); s=[x["sentence"] or "" for x in r]
    fq=Counter(); ex=defaultdict(list); nf=Counter(); nd=Counter(); n=0
    for z in s:
        for g in gs(z):
            if g.isspace():continue
            n+=1;fq[g]+=1
            if len(ex[g])<5:ex[g].append(z[:160])
            if unicodedata.normalize("NFC",g)!=g:nf[g]+=1
            if unicodedata.normalize("NFD",g)!=g:nd[g]+=1
    obs=set(fq); non=sorted(obs-CS); un=sorted(CS-obs); anomaly=sum(fq[x] for x in non); cov=100*len(CS&obs)/len(CANONICAL)
    wc(OUT/"mvy-canonical-inventory.csv",["grapheme","frequency","observed","codepoints"],[{"grapheme":g,"frequency":fq[g],"observed":g in obs,"codepoints":" ".join(f"U+{ord(c):04X}" for c in g)} for g in CANONICAL])
    wc(OUT/"mvy-observed-inventory.csv",["grapheme","frequency","canonical","examples"],[{"grapheme":g,"frequency":fq[g],"canonical":g in CS,"examples":" || ".join(ex[g])} for g in sorted(obs,key=lambda x:(-fq[x],x))])
    wc(OUT/"mvy-unobserved-canonical.csv",["grapheme","codepoints"],[{"grapheme":g,"codepoints":" ".join(f"U+{ord(c):04X}" for c in g)} for g in un])
    wc(OUT/"mvy-noncanonical-observed.csv",["grapheme","frequency","candidate_reason","codepoints","examples"],[{"grapheme":g,"frequency":fq[g],"candidate_reason":"M2.9 inventory variant" if g in {"مہ","نہ"} else "Observed outside canonical M2.3 inventory","codepoints":" ".join(f"U+{ord(c):04X}" for c in g),"examples":" || ".join(ex[g])} for g in non])
    rr=[]
    for g in sorted(CS|MS):
        rr.append({"grapheme":g,"m2_3_canonical":g in CS,"m2_9_canonical":g in MS,"status":"canonical_in_both" if g in CS and g in MS else ("M2.3_canonical_but_missing_from_M2.9" if g in CS else "M2.9_only_variant")})
    wc(OUT/"mvy-inventory-reconciliation.csv",["grapheme","m2_3_canonical","m2_9_canonical","status"],rr)
    ur=[]
    for g in sorted(obs|CS):
        for i,c in enumerate(g,1):ur.append({"grapheme":g,"position":i,"character":c,"codepoint":f"U+{ord(c):04X}","name":unicodedata.name(c,"UNKNOWN"),"category":unicodedata.category(c),"combining":unicodedata.combining(c)})
    wc(OUT/"mvy-unicode-inventory.csv",["grapheme","position","character","codepoint","name","category","combining"],ur)
    wc(OUT/"mvy-normalization-variants.csv",["grapheme","frequency","nfc_changed_count","nfd_changed_count"],[{"grapheme":g,"frequency":fq[g],"nfc_changed_count":nf[g],"nfd_changed_count":nd[g]} for g in sorted(obs,key=lambda x:(-fq[x],x)) if nf[g] or nd[g]])
    wc(OUT/"mvy-inventory-coverage.csv",["metric","value"],[{"metric":"corpus_rows","value":len(s)},{"metric":"grapheme_tokens","value":n},{"metric":"canonical_inventory_size","value":len(CANONICAL)},{"metric":"canonical_graphemes_observed","value":len(CS&obs)},{"metric":"canonical_graphemes_unobserved","value":len(un)},{"metric":"canonical_inventory_coverage_percent","value":round(cov,4)},{"metric":"observed_grapheme_types","value":len(obs)},{"metric":"noncanonical_observed_types","value":len(non)},{"metric":"noncanonical_token_count","value":anomaly},{"metric":"noncanonical_token_rate_percent","value":round(100*anomaly/n,6) if n else 0},{"metric":"nfc_variant_types","value":len(nf)},{"metric":"nfd_variant_types","value":len(nd)}])
    man={"milestone":"2.10","title":"Orthographic Inventory Validation","language":"Indus-Kohistani","iso_639_3":"mvy","source":"research/mvy/source/common-voice-27/validated.tsv","method":"Deterministic comparison of canonical M2.3 inventory against observed corpus graphemes; anomalies are review candidates, not automatic corrections.","corpus_rows":len(s),"grapheme_tokens":n,"canonical_inventory":CANONICAL,"canonical_inventory_size":len(CANONICAL),"observed_grapheme_types":len(obs),"observed_canonical_types":len(CS&obs),"unobserved_canonical_graphemes":un,"noncanonical_observed_graphemes":non,"canonical_coverage_percent":round(cov,4),"noncanonical_token_count":anomaly,"noncanonical_token_rate_percent":round(100*anomaly/n,6) if n else 0,"m2_9_only_variants":sorted(MS-CS),"m2_9_missing_relative_to_m2_3":sorted(CS-MS)}
    (OUT/"mvy-inventory-validation-manifest.json").write_text(json.dumps(man,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    rep=f"""# Milestone 2.10 — Orthographic Inventory Validation

Source: research/mvy/source/common-voice-27/validated.tsv

- Corpus rows: {len(s):,}
- Grapheme tokens: {n:,}
- Canonical inventory size: {len(CANONICAL)}
- Observed canonical types: {len(CS&obs)}
- Canonical coverage: {cov:.4f}%
- Unobserved canonical types: {len(un)}
- Noncanonical observed types: {len(non)}
- Noncanonical tokens: {anomaly:,}
- Noncanonical token rate: {100*anomaly/n:.6f}%

## Inventory reconciliation
M2.9 introduced the forms مہ and نہ as inventory entries. M2.10 retains them as observed variant forms rather than promoting them to the canonical M2.3 inventory.

## Interpretation
Noncanonical forms are review candidates, not automatic corrections. Corpus spelling, dialectal variation, segmentation, annotation, and Unicode representation should be linguistically reviewed before changing the project inventory.
"""
    (OUT/"milestone-2.10-inventory-validation-report.md").write_text(rep,encoding="utf-8")
if __name__=="__main__":main()
