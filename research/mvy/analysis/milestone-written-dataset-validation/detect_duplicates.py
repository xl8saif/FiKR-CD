from __future__ import annotations
import hashlib, json, re, tarfile, unicodedata
from collections import defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[4]
ARCHIVE=ROOT/"research/mvy/source/1765213289901-Mvy_text_corpus.tar.gz"
OUT_DIR=ROOT/"research/mvy/analysis/milestone-written-dataset-validation/output"
REPORT=OUT_DIR/"mvy-duplicate-audit.md"
MANIFEST=OUT_DIR/"mvy-duplicate-audit.json"
TOKEN_RE=re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z0-9]+")
SHINGLE_SIZE=5
MAX_EXACT_GROUPS=1000
MAX_NEAR_PAIRS=1000
HAMMING_THRESHOLD=6
MIN_TOKENS=8

def normalize(value):
    return re.sub(r"\s+"," ",unicodedata.normalize("NFC",value or "")).strip()

def decode(data):
    for enc in ("utf-8-sig","utf-8","utf-16"):
        try: return data.decode(enc)
        except UnicodeDecodeError: pass
    return data.decode("utf-8",errors="replace")

def iter_units():
    if not ARCHIVE.exists(): raise SystemExit("Missing corpus archive: {}".format(ARCHIVE))
    with tarfile.open(ARCHIVE,"r:gz") as archive:
        for member in archive.getmembers():
            if not member.isfile() or not member.name.lower().endswith((".txt",".tsv",".csv",".pdf")): continue
            handle=archive.extractfile(member)
            if handle is None: continue
            data=handle.read()
            if member.name.lower().endswith(".pdf"):
                import fitz
                pdf=fitz.open(stream=data,filetype="pdf")
                for page_number,page in enumerate(pdf,1):
                    text=normalize(page.get_text("text"))
                    if text: yield member.name,page_number,None,text
                pdf.close()
            else:
                for line_number,line in enumerate(decode(data).splitlines(),1):
                    text=normalize(line)
                    if text: yield member.name,None,line_number,text

def simhash(tokens):
    weights=[0]*64
    for token in tokens:
        value=int.from_bytes(hashlib.blake2b(token.encode("utf-8"),digest_size=8).digest(),"big")
        for bit in range(64): weights[bit]+=1 if value&(1<<bit) else -1
    return sum(1<<bit for bit,w in enumerate(weights) if w>=0)

def shingles(tokens):
    return {tuple(tokens[i:i+SHINGLE_SIZE]) for i in range(len(tokens)-SHINGLE_SIZE+1)} if len(tokens)>=SHINGLE_SIZE else set()

def jaccard(a,b):
    return len(a&b)/len(a|b) if a and b else 0.0

def main():
    OUT_DIR.mkdir(parents=True,exist_ok=True)
    exact=defaultdict(list); records=[]; documents=set()
    for idx,(source,page,line,text) in enumerate(iter_units()):
        tokens=TOKEN_RE.findall(text)
        record={"id":idx,"source":source,"page":page,"line":line,"text":text,
                "sha256":hashlib.sha256(text.encode("utf-8")).hexdigest(),"token_count":len(tokens)}
        exact[record["sha256"]].append(idx)
        records.append((record,tokens)); documents.add(source)

    groups=[]
    for digest,ids in exact.items():
        if len(ids)>1:
            groups.append({"sha256":digest,"count":len(ids),
                "locations":[{"id":records[i][0]["id"],"source":records[i][0]["source"],"page":records[i][0]["page"],"line":records[i][0]["line"]} for i in ids[:20]],
                "sample_text":records[ids[0]][0]["text"][:500]})
    groups.sort(key=lambda x:(-x["count"],x["sha256"]))

    buckets=[defaultdict(list) for _ in range(4)]; features={}
    for record,tokens in records:
        if len(tokens)<MIN_TOKENS: continue
        value=simhash(tokens); features[record["id"]]=(value,shingles(tokens))
        for band in range(4): buckets[band][(value>>(band*16))&0xFFFF].append(record["id"])

    candidates=set()
    for bucket in buckets:
        for ids in bucket.values():
            ids=ids[:200]
            for pos,left in enumerate(ids):
                for right in ids[pos+1:]: candidates.add((min(left,right),max(left,right)))

    near=[]
    for left_id,right_id in sorted(candidates):
        left,right=features[left_id],features[right_id]
        distance=(left[0]^right[0]).bit_count()
        if distance>HAMMING_THRESHOLD: continue
        similarity=jaccard(left[1],right[1])
        if similarity<0.55: continue
        a,b=records[left_id][0],records[right_id][0]
        near.append({"left":{"id":a["id"],"source":a["source"],"page":a["page"],"line":a["line"],"token_count":a["token_count"],"text":a["text"][:500]},
                     "right":{"id":b["id"],"source":b["source"],"page":b["page"],"line":b["line"],"token_count":b["token_count"],"text":b["text"][:500]},
                     "simhash_hamming_distance":distance,"token_shingle_jaccard":round(similarity,6)})
    near.sort(key=lambda x:(x["simhash_hamming_distance"],-x["token_shingle_jaccard"]))

    result={"dataset":"Mvy Written Corpus","language":"mvy","source_archive":str(ARCHIVE.relative_to(ROOT)).replace("\\","/"),
            "scope":"Non-destructive duplicate and near-duplicate detection over normalized non-empty text/page units.",
            "units_analyzed":len(records),"source_documents":len(documents),
            "exact_duplicates":{"groups":len(groups),"duplicate_units":sum(x["count"] for x in groups),"groups_returned":min(len(groups),MAX_EXACT_GROUPS),"truncated":len(groups)>MAX_EXACT_GROUPS,"groups":groups[:MAX_EXACT_GROUPS]},
            "near_duplicates":{"candidate_pairs":len(candidates),"pairs_returned":min(len(near),MAX_NEAR_PAIRS),"truncated":len(near)>MAX_NEAR_PAIRS,"pairs":near[:MAX_NEAR_PAIRS],
                               "method":"64-bit token SimHash; four 16-bit locality bands; Hamming <= 6; 5-token-shingle Jaccard >= 0.55."},
            "interpretation":{"exact_duplicate":"Identical after Unicode NFC and whitespace normalization.","near_duplicate":"High-overlap candidate requiring human review; never automatically removed.","source_preserved":True}}
    MANIFEST.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
    exact_units=sum(x["count"] for x in groups)
    lines=["# Mvy Written Dataset — Duplicate & Near-Duplicate Audit","","Non-destructive integrity analysis. No source material is deleted or rewritten.",
           "","## Scope","- Units analyzed: {:,}".format(len(records)),"- Source documents: {:,}".format(len(documents)),
           "","## Exact duplicates","- Duplicate groups: {:,}".format(len(groups)),"- Units in duplicate groups: {:,}".format(exact_units),
           "- Groups reported: {:,}".format(min(len(groups),MAX_EXACT_GROUPS)),"- Report truncated: {}".format("yes" if len(groups)>MAX_EXACT_GROUPS else "no"),
           "","Exact duplicates are identical after Unicode NFC normalization and whitespace collapsing.",
           "","## Near duplicates","- Candidate pairs: {:,}".format(len(candidates)),"- High-overlap pairs reported: {:,}".format(min(len(near),MAX_NEAR_PAIRS)),
           "- Report truncated: {}".format("yes" if len(near)>MAX_NEAR_PAIRS else "no"),
           "","Method: 64-bit token SimHash with four 16-bit locality bands, Hamming distance <= 6, followed by 5-token-shingle Jaccard >= 0.55.",
           "Near-duplicate matches are review flags, not automatic exclusions.",
           "","## Handling","- Preserve original source files.","- Review exact duplicates for provenance before dataset splitting.",
           "- Review near duplicates for copied passages, templates, OCR variants, or legitimate repetition.",
           "- Deduplicate only a derived training/evaluation manifest; never the archival source.",
           "","## Output","- JSON manifest: {}".format(MANIFEST.relative_to(ROOT).as_posix())]
    REPORT.write_text("\\n".join(lines)+"\\n",encoding="utf-8")
    print("Units analyzed: {:,}".format(len(records)))
    print("Exact duplicate groups: {:,}".format(len(groups)))
    print("Exact duplicate units: {:,}".format(exact_units))
    print("Near-duplicate candidate pairs: {:,}".format(len(candidates)))
    print("Near-duplicate matches: {:,}".format(len(near)))

if __name__=="__main__": main()
