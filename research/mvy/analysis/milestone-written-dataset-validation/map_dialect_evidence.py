from __future__ import annotations
import hashlib, json, re, tarfile, unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[4]
ARCHIVE=ROOT/"research/mvy/source/1765213289901-Mvy_text_corpus.tar.gz"
OUT=ROOT/"research/mvy/analysis/milestone-written-dataset-validation/output"
REPORT=OUT/"mvy-dialect-evidence.json"
MD=OUT/"mvy-dialect-evidence.md"
ALIASES={"duber-kandia":["duber","dubair","kandia"],"seo-patan":["seo","patan","seopatan"],"jijal-kayal":["jijal","kayal","jijal-kayal"],"ranolia":["ranolia"],"bankad":["bankad"]}

def norm(s): return re.sub(r"[^a-z0-9]+","-",unicodedata.normalize("NFKC",s).casefold()).strip("-")
def classify(source):
    n=norm(source); hits=[d for d,a in ALIASES.items() if any(x in n for x in a)]
    if len(hits)==1: return hits[0],"source_name","high"
    if len(hits)>1: return "mixed_or_ambiguous","source_name","low"
    return "unknown","no_explicit_source_metadata","none"

def main():
    if not ARCHIVE.exists(): raise SystemExit(f"Missing corpus archive: {ARCHIVE}")
    OUT.mkdir(parents=True,exist_ok=True); evidence=[]; units=Counter()
    with tarfile.open(ARCHIVE,"r:gz") as ar:
        for m in ar.getmembers():
            if not m.isfile() or not m.name.lower().endswith((".txt",".tsv",".csv",".pdf")): continue
            h=ar.extractfile(m)
            if h is None: continue
            data=h.read(); source=m.name; dialect,basis,confidence=classify(source)
            if source.lower().endswith(".pdf"):
                import fitz
                pdf=fitz.open(stream=data,filetype="pdf"); count=sum(1 for p in pdf if p.get_text("text").strip()); pdf.close()
            else:
                try: text=data.decode("utf-8-sig")
                except UnicodeDecodeError: text=data.decode("utf-8",errors="replace")
                count=sum(1 for line in text.splitlines() if line.strip())
            units[dialect]+=count
            evidence.append({"source":source,"source_sha256":hashlib.sha256(data).hexdigest(),"assigned_dialect":dialect,"evidence_basis":basis,"confidence":confidence,"text_units":count})
    counts=Counter(x["assigned_dialect"] for x in evidence)
    report={"dataset":"Mvy Written Corpus","language":"mvy","iso_639_3":"mvy","stage":"dialect-variety-evidence-mapping","policy":{"inference":False,"description":"Dialect labels are assigned only from explicit source-name evidence; otherwise the source remains unknown.","recognized_varieties":sorted(ALIASES)},"summary":{"source_documents":len(evidence),"sources_with_explicit_dialect_evidence":sum(x["assigned_dialect"] not in ("unknown","mixed_or_ambiguous") for x in evidence),"unknown_sources":counts["unknown"],"ambiguous_sources":counts["mixed_or_ambiguous"],"text_units_by_dialect":dict(units)},"sources":sorted(evidence,key=lambda x:x["source"].casefold())}
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    lines=["# Mvy Written Dataset — Dialect/Variety Evidence Mapping","","Dialect labels are assigned only from explicit source filename/path evidence. No lexical or model-based dialect inference is performed.","","## Summary",f"- Source documents: **{len(evidence):,}**",f"- Sources with explicit evidence: **{report["summary"]["sources_with_explicit_dialect_evidence"]:,}**",f"- Unknown sources: **{counts["unknown"]:,}**",f"- Ambiguous sources: **{counts["mixed_or_ambiguous"]:,}**","","## Units by variety"]
    lines += [f"- `{k}` — **{v:,}**" for k,v in sorted(units.items())]
    lines += ["","## Method","- Recognized varieties: Duber-Kandia, Seo-Patan, Jijal-Kayal, Ranolia, Bankad.","- Matching is case-insensitive and Unicode-normalized.","- Ambiguous matches remain `mixed_or_ambiguous`.","- Sources without explicit evidence remain `unknown`.","- Source SHA-256 values provide provenance."]
    MD.write_text("\n".join(lines)+"\n",encoding="utf-8"); print("Sources:",len(evidence)); print("Explicit:",report["summary"]["sources_with_explicit_dialect_evidence"]); print("Unknown:",counts["unknown"])
if __name__=="__main__": main()
