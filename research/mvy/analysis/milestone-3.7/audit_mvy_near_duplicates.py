#!/usr/bin/env python3
"""Mvy M3.7: detect near-duplicate text that can cause evaluation leakage.

This audit is intentionally independent of the train/validation/test assignment.
It produces candidate pairs/components for review rather than silently deleting
or moving records.
"""
from __future__ import annotations
import argparse, csv, hashlib, json, re, unicodedata
from collections import defaultdict
from pathlib import Path

def norm(s):
    s = unicodedata.normalize("NFC", str(s or "")).casefold()
    return re.sub(r"\s+", " ", s).strip()

def tokens(s):
    return re.findall(r"\w+", norm(s), flags=re.UNICODE)

def signature(s, n=5):
    t = tokens(s)
    return set(" ".join(t[i:i+n]) for i in range(max(0, len(t)-n+1)))

def jaccard(a,b):
    if not a and not b: return 1.0
    if not a or not b: return 0.0
    return len(a & b) / len(a | b)

def load(path):
    if path.suffix.lower()==".jsonl":
        return [json.loads(x) for x in path.read_text(encoding="utf-8").splitlines() if x.strip()]
    delim="\t" if path.suffix.lower()==".tsv" else ","
    with path.open(encoding="utf-8-sig",newline="") as f: return list(csv.DictReader(f,delimiter=delim))

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--input",required=True,type=Path)
    ap.add_argument("--output-dir",required=True,type=Path)
    ap.add_argument("--threshold",type=float,default=.85)
    ap.add_argument("--min-tokens",type=int,default=5)
    args=ap.parse_args()
    rows=load(args.input)
    if any("text" not in r for r in rows): raise SystemExit("Every record needs text")

    exact=defaultdict(list); sig=defaultdict(set)
    signatures=[]
    for i,r in enumerate(rows):
        n=norm(r["text"])
        if not n: signatures.append(set()); continue
        exact[n].append(i)
        signatures.append(signature(n))
        for sh in signatures[-1]: sig[sh].add(i)

    parent=list(range(len(rows)))
    def find(x):
        while parent[x]!=x:
            parent[x]=parent[parent[x]]; x=parent[x]
        return x
    def union(a,b):
        a,b=find(a),find(b)
        if a!=b: parent[b]=a

    pairs=[]
    for indices in exact.values():
        for a in indices:
            for b in indices:
                if a<b: union(a,b)

    seen=set()
    for i,r in enumerate(rows):
        if len(tokens(r["text"])) < args.min_tokens: continue
        candidates=set()
        for sh in signatures[i]: candidates |= sig[sh]
        candidates.discard(i)
        for j in candidates:
            if j<=i or len(tokens(rows[j]["text"])) < args.min_tokens: continue
            score=jaccard(signatures[i],signatures[j])
            if score >= args.threshold:
                key=(i,j)
                if key not in seen:
                    seen.add(key); pairs.append((i,j,score)); union(i,j)

    components=defaultdict(list)
    for i in range(len(rows)): components[find(i)].append(i)
    suspicious=[v for v in components.values() if len(v)>1]

    out=args.output_dir; out.mkdir(parents=True,exist_ok=True)
    with (out/"near_duplicate_pairs.jsonl").open("w",encoding="utf-8") as f:
        for i,j,score in sorted(pairs,key=lambda x:-x[2]):
            f.write(json.dumps({
                "row_a":i,"row_b":j,"similarity":round(score,6),
                "source_a":rows[i].get("source") or rows[i].get("source_id"),
                "source_b":rows[j].get("source") or rows[j].get("source_id"),
                "document_a":rows[i].get("document") or rows[i].get("document_id"),
                "document_b":rows[j].get("document") or rows[j].get("document_id")
            },ensure_ascii=False)+"\n")
    manifest=[]
    for root,indices in sorted(components.items(),key=lambda x:(-len(x[1]),x[0])):
        if len(indices)<2: continue
        manifest.append({
            "component_id":hashlib.sha256(",".join(map(str,indices)).encode()).hexdigest()[:24],
            "records":indices,
            "size":len(indices)
        })
    (out/"near_duplicate_components.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    summary={
        "milestone":"M3.7","records":len(rows),
        "exact_duplicate_groups":sum(1 for v in exact.values() if len(v)>1),
        "near_duplicate_pairs":len(pairs),
        "near_duplicate_components":len(suspicious),
        "records_in_multi_record_components":sum(map(len,suspicious)),
        "threshold":args.threshold,"min_tokens":args.min_tokens,
        "policy":"Candidates are flagged for review; no records are deleted or reassigned automatically."
    }
    (out/"near_duplicate_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(summary,ensure_ascii=False,indent=2))

if __name__=="__main__": main()
