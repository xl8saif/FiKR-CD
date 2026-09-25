from __future__ import annotations
import json, re, tarfile, unicodedata
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[4]
ARCHIVE=ROOT/"research/mvy/source/1765213289901-Mvy_text_corpus.tar.gz"
OUT=ROOT/"research/mvy/analysis/milestone-written-dataset-validation/output"
REPORT=OUT/"mvy-orthographic-audit.json"
MD=OUT/"mvy-orthographic-audit.md"
TOKEN_RE=re.compile(r"[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFFA-Za-z0-9]+")
TARGETS=set("ڇڅݜړڕڙݨ")

def iter_text():
    with tarfile.open(ARCHIVE,"r:gz") as archive:
        for m in archive.getmembers():
            if not m.isfile() or not m.name.lower().endswith((".txt",".tsv",".csv",".pdf")): continue
            h=archive.extractfile(m)
            if h is None: continue
            data=h.read()
            if m.name.lower().endswith(".pdf"):
                import fitz
                pdf=fitz.open(stream=data,filetype="pdf")
                for pno,p in enumerate(pdf,1): yield m.name,pno,p.get_text("text")
                pdf.close()
            else:
                try: text=data.decode("utf-8-sig")
                except UnicodeDecodeError: text=data.decode("utf-8",errors="replace")
                for lno,line in enumerate(text.splitlines(),1): yield m.name,lno,line

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    chars=Counter(); combining=Counter(); nfc_changes=0; units=0; docs=set(); target_counts=Counter(); token_count=0
    for source,loc,text in iter_text():
        docs.add(source); units+=1
        if unicodedata.normalize("NFC",text)!=text: nfc_changes+=1
        for ch in text:
            chars[ch]+=1
            if unicodedata.combining(ch): combining[unicodedata.name(ch,"UNKNOWN")]+=1
            if ch in TARGETS: target_counts[ch]+=1
        token_count+=len(TOKEN_RE.findall(text))
    report={"dataset":"Mvy Written Corpus","language":"mvy","iso_639_3":"mvy","source_documents":len(docs),"text_units":units,"token_occurrences_estimate":token_count,"nfc_normalization":{"units_changed":nfc_changes,"units_total":units,"percent":round(nfc_changes/units*100,4) if units else 0},"target_grapheme_counts":dict(sorted(target_counts.items())),"combining_marks":dict(combining.most_common(100)),"unicode_character_inventory":[{"char":ch,"codepoint":"U+%04X"%ord(ch),"name":unicodedata.name(ch,"UNKNOWN"),"count":n} for ch,n in chars.most_common()]}
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    md=["# Mvy Orthographic Audit","","- Documents: %s"%len(docs),"- Text/page units: %s"%units,"- Estimated tokens: %s"%token_count,"- NFC-changed units: %s (%.4f%%)"%(nfc_changes,report["nfc_normalization"]["percent"]),"","## Research grapheme markers"]
    md += ["- `%s` — %s"%(ch,n) for ch,n in sorted(target_counts.items())]
    md += ["","## Top combining marks"]+["- %s — %s"%(name,n) for name,n in combining.most_common(30)]
    MD.write_text("\n".join(md)+"\n",encoding="utf-8")
    print("Orthographic audit:",REPORT)

if __name__=="__main__": main()