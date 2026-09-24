#!/usr/bin/env python3
"""Mvy M3.2 audio–text quality control.

Performs conservative, reproducible checks on audio files referenced by
Common Voice validated.tsv. No transcription correction is performed.
"""
from __future__ import annotations
import csv, hashlib, json, math, os, re, struct, subprocess, wave
from pathlib import Path

ROOT=Path(__file__).resolve().parents[4]
SOURCE=ROOT/"research/mvy/source/common-voice-27"
TSV=SOURCE/"validated.tsv"
OUT=ROOT/"research/mvy/analysis/milestone-3.2/output"
OUT.mkdir(parents=True,exist_ok=True)

def sha256(v): return hashlib.sha256(v.encode("utf-8")).hexdigest()
def resolve_audio(p):
    c=(SOURCE/p.replace("\\","/")).resolve()
    try: c.relative_to(SOURCE.resolve())
    except ValueError: return None
    return c if c.is_file() else None

def wav_info(p):
    try:
        with wave.open(str(p),"rb") as w:
            ch,sw,sr,n=w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getnframes()
            dur=n/sr if sr else 0
            return {"format":"wav","channels":ch,"sample_width_bytes":sw,"sample_rate_hz":sr,
                    "frames":n,"duration_seconds":round(dur,6),
                    "zero_length":n==0,"readable":True,"error":""}
    except Exception as e:
        return {"format":"wav","channels":"","sample_width_bytes":"","sample_rate_hz":"",
                "frames":"","duration_seconds":0,"zero_length":False,"readable":False,
                "error":str(e)[:300]}

def main():
    if not TSV.is_file(): raise SystemExit(f"Missing {TSV}")
    with TSV.open("r",encoding="utf-8-sig",newline="") as f:
        reader=csv.DictReader(f,delimiter="\t")
        if not {"path","sentence"} <= set(reader.fieldnames or []): raise SystemExit("TSV lacks path/sentence")
        rows=list(reader)

    results=[]; missing=[]; unreadable=[]; duration=[]; duplicate_audio={}
    for i,row in enumerate(rows,start=2):
        path=(row.get("path") or "").strip()
        sentence=row.get("sentence") or ""
        audio=resolve_audio(path) if path else None
        base={"row":i,"path":path,"text":sentence}
        if not audio:
            results.append({**base,"status":"missing_audio","readable":False,"duration_seconds":"","sample_rate_hz":"","channels":"","bytes":""})
            missing.append({"row":i,"path":path,"reason":"audio file not present or path escapes source tree"})
            continue
        duplicate_audio.setdefault(str(audio),[]).append(i)
        b=audio.stat().st_size
        ext=audio.suffix.lower()
        info=wav_info(audio) if ext==".wav" else {"format":ext.lstrip(".") or "unknown","readable":"","duration_seconds":"","sample_rate_hz":"","channels":"","zero_length":b==0,"error":"Detailed metadata not evaluated for non-WAV format"}
        status="pass"
        issues=[]
        if b==0: status="fail"; issues.append("zero_byte_file")
        if info.get("readable") is False: status="fail"; issues.append("unreadable_wav")
        if info.get("duration_seconds","") != "" and info.get("duration_seconds",0) <= 0: status="fail"; issues.append("zero_duration")
        if info.get("duration_seconds","") != "" and info.get("duration_seconds",0) > 30: issues.append("long_duration_review")
        if info.get("sample_rate_hz","") not in ("",None) and info["sample_rate_hz"] < 8000: issues.append("low_sample_rate_review")
        rec={**base,"status":status,"readable":info.get("readable",""),"duration_seconds":info.get("duration_seconds",""),
             "sample_rate_hz":info.get("sample_rate_hz",""),"channels":info.get("channels",""),"bytes":b,
             "format":info.get("format",""),"issues":";".join(issues)}
        results.append(rec)
        if status=="fail": unreadable.append(rec)
        if info.get("duration_seconds","") not in ("",None): duration.append(float(info["duration_seconds"]))

    # Detect duplicate references without declaring them erroneous.
    dup=[{"audio_path":p,"row_count":len(rs),"rows":",".join(map(str,rs))} for p,rs in duplicate_audio.items() if len(rs)>1]
    def write(name,rows):
        p=OUT/name
        fields=list(rows[0]) if rows else ["status"]
        with p.open("w",encoding="utf-8",newline="") as f:
            w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows(rows)
    write("mvy-audio-text-qc.csv",results)
    write("mvy-audio-missing.csv",missing)
    write("mvy-audio-failures.csv",unreadable)
    write("mvy-audio-duplicate-references.csv",dup)
    duration_rows=[{"metric":"available_duration_seconds","value":round(sum(duration),3)},
                   {"metric":"duration_records","value":len(duration)},
                   {"metric":"duration_min_seconds","value":min(duration) if duration else ""},
                   {"metric":"duration_max_seconds","value":max(duration) if duration else ""},
                   {"metric":"duration_mean_seconds","value":round(sum(duration)/len(duration),6) if duration else ""}]
    write("mvy-audio-duration-summary.csv",duration_rows)

    counts={}
    for x in results: counts[x["status"]]=counts.get(x["status"],0)+1
    summary={"milestone":"M3.2","title":"Audio–Text Quality Control","source":"research/mvy/source/common-voice-27/validated.tsv",
             "source_sha256":sha256(TSV.read_text(encoding="utf-8-sig")),"records":len(results),
             "status_counts":counts,"duplicate_audio_paths":len(dup),
             "audio_formats":sorted({x.get("format","") for x in results if x.get("format")}),
             "duration_records":len(duration),
             "method":["Check referenced audio presence and safe path resolution.",
                        "Perform detailed metadata/readability checks for WAV using Python standard library.",
                        "Flag zero-byte/zero-duration/unreadable WAV files as failures.",
                        "Flag unusually long or low-sample-rate WAVs for review, not automatic rejection.",
                        "Do not modify or correct transcriptions.",
                        "Non-WAV files are retained and reported without fabricated duration metadata."],
             "next_milestone":"M3.3 Speaker & Recording Metadata"}
    (OUT/"mvy-audio-text-qc-manifest.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    report=f"""# Mvy Milestone 3.2 — Audio–Text Quality Control

Records inspected: **{len(results):,}**

Status counts: **{json.dumps(counts,ensure_ascii=False)}**

Duplicate audio-path references: **{len(dup):,}**

This milestone performs conservative audio availability and technical checks. WAV files receive
readability, channel, sample-rate, frame-count, and duration inspection. Long or low-sample-rate
files are review flags rather than automatic exclusions. Transcriptions are not corrected.
Non-WAV formats are reported without inventing metadata.

## Next
M3.3 — Speaker & Recording Metadata.
"""
    (OUT/"milestone-3.2-audio-text-qc-report.md").write_text(report,encoding="utf-8")
if __name__=="__main__": main()
