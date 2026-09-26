# Mvy Milestone 3.7 — Near-Duplicate Leakage Audit

M3.6 prevents source/document leakage. M3.7 adds a separate text-similarity audit.

It detects:
- exact normalized-text duplicates;
- high-overlap near duplicates using 5-token shingles and Jaccard similarity.

Default threshold: 0.85. Records with fewer than 5 tokens are excluded from fuzzy comparison.

The tool reports candidate pairs and connected components. It does not delete records, alter the split, or decide that two records are linguistically equivalent. Those decisions remain reviewable.

Command:

python research/mvy/analysis/milestone-3.7/audit_mvy_near_duplicates.py --input PATH/TO/written.jsonl --output-dir research/mvy/analysis/milestone-3.7/output
