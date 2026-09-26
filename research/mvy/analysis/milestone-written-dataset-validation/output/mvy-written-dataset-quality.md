# Mvy Written Dataset — Quality Flags

Conservative record-level review flags for the written corpus. Flags are not automatic rejection decisions.

## Summary
- Text/page units examined: **7,540**
- Units flagged for review: **209**
- Units without these flags: **7,331 (97.2281%)**

## Flag counts
- very_long — **151**
- very_short — **43**
- latin_only — **14**
- digit_heavy — **7**
- repeated_character_sequence — **1**
- punctuation_heavy — **1**

## Review policy
- very_short: fewer than 5 characters or fewer than 2 lexical tokens.
- very_long: more than 2,000 characters.
- replacement_character: Unicode replacement character detected.
- control_character: unexpected control character detected.
- repeated_character_sequence: six or more repeated identical characters.
- digit_heavy: more than 35% digits by character count.
- punctuation_heavy: more than 45% punctuation by character count.
- latin_only: lexical content contains Latin letters but no Arabic-script characters.
- non_lexical: no token recognized by the documented tokenizer.
- low_letter_content: low proportion of letters/numbers in a longer unit.

These heuristics are deliberately conservative and should not be interpreted as proof that a record is erroneous, non-Mvy, or unusable. Human linguistic review remains authoritative.

Raw source text is preserved.
