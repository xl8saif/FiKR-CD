from pathlib import Path
import csv, json, re, unicodedata
from collections import Counter, defaultdict

root = Path(__file__).resolve().parents[4]
src = root / "research/mvy/source/common-voice-27/validated.tsv"
out = root / "research/mvy/analysis/milestone-2.3/output"
out.mkdir(parents=True, exist_ok=True)
if not src.exists(): raise SystemExit(f"Missing source: {src}")

established = set("""ا ب بھ پ پھ ت تھ ٹ ٹھ ث ج جھ چ چھ ڇ ڇھ ح خ څ څھ د دھ ڈ ڈھ ذ ر رھ ڑ ڑھ ز ژ ژھ ڙ ڙھ س ش ݜ ص ض ط ظ ع غ ف ق ک کھ گ گھ ل لھ م مھ ن نھ ݨ و ہ ء ی ې ے""".split())
special = ["ݜ","ڇ","څ","ڙ","ݨ"]
aspbase = set("ب پ ت ٹ ج چ ڇ څ د ڈ ر ڑ ژ ڙ ک گ ل م ن ݨ".split())
token_re = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z0-9]+")

def ismark(c): return unicodedata.combining(c) != 0 or unicodedata.category(c).startswith("M")
def clusters(s):
    a=[]; cur=""
    for c in s:
        if ismark(c):
            if cur: cur += c
            else: a.append(c)
        else:
            if cur: a.append(cur)
            cur=c
    if cur: a.append(cur)
    return a
def base(g): return next((c for c in g if not ismark(c)), g)
def ucs(s): return " ".join(f"U+{ord(c):04X}" for c in s)
def isarabic(c): return ("\u0600" <= c <= "\u06FF" or "\u0750" <= c <= "\u077F" or "\u08A0" <= c <= "\u08FF" or "\uFB50" <= c <= "\uFDFF" or "\uFE70" <= c <= "\uFEFF")
def write(path, fields, rows):
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        w=csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)

with src.open("r", encoding="utf-8-sig", newline="") as f:
    reader=csv.DictReader(f, delimiter="\t")
    if "sentence" not in reader.fieldnames: raise SystemExit(f"No sentence column: {reader.fieldnames}")
    sentences=[r.get("sentence") or "" for r in reader]

gf=Counter(); words=defaultdict(set); pos=defaultdict(Counter); asp=Counter(); aspwords=defaultdict(set); contexts=defaultdict(Counter); marks=Counter(); unattached=Counter(); lexical=Counter(); anomalies=Counter(); cp=Counter()
token_total=cluster_total=codepoint_total=0
for sentence in sentences:
    cp.update(sentence); codepoint_total += len(sentence)
    for word in token_re.findall(sentence):
        lexical[word]+=1; token_total+=1; gs=clusters(word); cluster_total+=len(gs)
        for i,g in enumerate(gs):
            gf[g]+=1; words[g].add(word)
            p="isolated" if len(gs)==1 else ("initial" if i==0 else ("final" if i==len(gs)-1 else "medial")); pos[g][p]+=1
            if any(ismark(c) for c in g):
                pos[g]["diacritic_bearing"]+=1
                for c in g:
                    if ismark(c): marks[c]+=1
            if all(ismark(c) for c in g):
                for c in g: unattached[c]+=1
            b=base(g)
            if isarabic(b) and b not in established: anomalies[g]+=1
            if i+1<len(gs) and len(g)==1 and gs[i+1]=="ھ" and g in aspbase:
                s=g+"ھ"; asp[s]+=1; aspwords[s].add(word)
            if b in special:
                left=gs[i-1] if i else "<WORD_START>"; right=gs[i+1] if i+1<len(gs) else "<WORD_END>"
                contexts[b][(left,right,p)]+=1

inv=[]
for g,n in gf.most_common():
    p=pos[g]; inv.append({"grapheme":g,"unicode_sequence":ucs(g),"frequency":n,"unique_words":len(words[g]),"initial":p["initial"],"medial":p["medial"],"final":p["final"],"isolated":p["isolated"],"diacritic_bearing":p["diacritic_bearing"],"aspirated":g in {b+"ھ" for b in aspbase},"rare":n<=2,"anomaly":g in anomalies})
fields=list(inv[0]) if inv else ["grapheme"]
write(out/"mvy-grapheme-frequency.csv", ["grapheme","unicode_sequence","frequency","unique_words","diacritic_bearing","aspirated","rare","anomaly"], [{"grapheme":g,"unicode_sequence":ucs(g),"frequency":n,"unique_words":len(words[g]),"diacritic_bearing":pos[g]["diacritic_bearing"],"aspirated":g in {b+"ھ" for b in aspbase},"rare":n<=2,"anomaly":g in anomalies} for g,n in gf.most_common()])
write(out/"mvy-grapheme-positional.csv", fields, inv)
write(out/"mvy-grapheme-inventory.csv", fields, inv)
(out/"mvy-grapheme-inventory.json").write_text(json.dumps({"project":"FiKR&CD","language":"Indus-Kohistani","iso_639_3":"mvy","milestone":"2.3","source":str(src),"corpus_rows":len(sentences),"grapheme_count":len(gf),"inventory":inv},ensure_ascii=False,indent=2),encoding="utf-8")
write(out/"mvy-aspirated-sequences.csv", ["sequence","unicode_sequence","frequency","unique_words"], [{"sequence":s,"unicode_sequence":ucs(s),"frequency":n,"unique_words":len(aspwords[s])} for s,n in asp.most_common()])
crow=[]
for letter in special:
    for (left,right,p),n in sorted(contexts[letter].items(), key=lambda x:(-x[1],x[0])): crow.append({"special_letter":letter,"left_context":left,"right_context":right,"position":p,"frequency":n})
write(out/"mvy-special-letter-contexts.csv", ["special_letter","left_context","right_context","position","frequency"], crow)
mrows=[{"mark":m,"unicode":f"U+{ord(m):04X}","unicode_name":unicodedata.name(m,"UNKNOWN"),"category":unicodedata.category(m),"combining_class":unicodedata.combining(m),"frequency":n,"attached_frequency":n,"unattached_frequency":unattached[m]} for m,n in sorted(marks.items(),key=lambda x:(-x[1],ord(x[0])))]
write(out/"mvy-combining-mark-statistics.csv", ["mark","unicode","unicode_name","category","combining_class","frequency","attached_frequency","unattached_frequency"], mrows)
rare=sorted(set(g for g,n in gf.items() if n<=2)|set(anomalies), key=lambda g:(-gf[g],g))
write(out/"mvy-rare-anomalous-sequences.csv", ["grapheme","unicode_sequence","frequency","unique_words","rare","anomaly","unicode_names"], [{"grapheme":g,"unicode_sequence":ucs(g),"frequency":gf[g],"unique_words":len(words[g]),"rare":gf[g]<=2,"anomaly":g in anomalies,"unicode_names":" | ".join(unicodedata.name(c,"UNKNOWN") for c in g)} for g in rare])

types=len(lexical); hapax=sum(n==1 for n in lexical.values())
report=["# Milestone 2.3 — Grapheme Frequency & Positional Distribution","","## Corpus",f"- Common Voice 27.0 validated TSV: {src}",f"- Validated rows: **{len(sentences):,}**","", "## Statistics",f"- Lexical token occurrences: **{token_total:,}**",f"- Unique lexical types: **{types:,}**",f"- Hapax legomena: **{hapax:,}**",f"- Unicode code-point occurrences: **{codepoint_total:,}**",f"- Grapheme-cluster occurrences: **{cluster_total:,}**",f"- Distinct observed grapheme clusters: **{len(gf):,}**",f"- Distinct combining marks: **{len(marks):,}**",f"- Consonant+ھ sequence types: **{len(asp):,}**",f"- Rare grapheme clusters (frequency <= 2): **{len(rare):,}**",f"- Diagnostic anomalous Arabic-script clusters: **{len(anomalies):,}**","","## Special letters",""]
report += ["| Letter | Occurrences |","|---|---:|"] + [f"| {x} | {sum(n for g,n in gf.items() if base(g)==x):,} |" for x in special]
report += ["","## Method","Raw corpus text is never modified. Grapheme clusters attach Unicode combining marks to their preceding base character. Recurrent consonant+ھ sequences are reported as graphemic patterns, without automatic phonological interpretation. Anomalies are review flags, not corrections.","","## Outputs"] + [f"- {p.name}" for p in sorted(out.glob("*")) if p.name!="milestone-2.3-summary.txt"]
(out/"milestone-2.3-grapheme-frequency-report.md").write_text("\n".join(report)+"\n",encoding="utf-8")
(out/"milestone-2.3-summary.txt").write_text("\n".join(report[:25])+"\n",encoding="utf-8")
print("\n".join(report[:25]))
print(f"Outputs written to {out}")
