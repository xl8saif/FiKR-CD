# *اباسیْن کوستَیں* &mdash; Indus Kohistani (`mvy`)

This datasheet is for cv-corpus-27.0-2026-09-11 of the Mozilla Common Voice *Scripted Speech* dataset for Indus Kohistani [اباسیْن کوستَیں - `mvy`]. The dataset contains 18485 clips representing 24.6 hours of recorded speech (22.1 hours validated) from 57 speakers, recorded from a text corpus of 6,856 sentences.

## Language

Indus Kohistani is an Indo-Aryan language spoken in District Lower Kohistan, Upper Kohistan, Gilgit Baltistan and other parts of Pakistan. There are few books written and published in this language. It is mainly a verbal language but currently young generation has started this language at social media platform and started to write in it.

### Accents

| Code | Accent | Clips | Speakers |
|---|---|---|---|
| - |  | 2,910 (15.7%) | 7 (12.3%) |

## Demographic information

The dataset includes the following self-declared age and gender distributions. A coverage summary is shown below each table.

### Gender

Self-declared gender information. The table shows clip and speaker counts with percentages. Speakers who did not declare a gender are listed as Unspecified. A dash (-) indicates zero.

| Code | Gender | Clips | Speakers |
|---|---|---|---|
| male_masculine | Male, masculine | - | - |
| female_feminine | Female, feminine | 21 (0.1%) | 2 (3.5%) |
| transgender | Transgender | - | - |
| non-binary | Non-binary | - | - |
| do_not_wish_to_say | Prefer not to say | - | - |
| - | Unspecified | 18,464 (99.9%) | 55 (96.5%) |

*Gender declared: 21 of 18,485 clips (0.1%), 2 of 57 speakers (3.5%)*

### Age

Self-declared age information. The table shows clip and speaker counts with percentages. Speakers who did not declare an age are listed as Unspecified. A dash (-) indicates zero.

| Code | Age | Clips | Speakers |
|---|---|---|---|
| teens | Teens | 64 (0.3%) | 1 (1.8%) |
| twenties | Twenties | 7,302 (39.5%) | 13 (22.8%) |
| thirties | Thirties | 8,716 (47.2%) | 11 (19.3%) |
| fourties | Fourties | 1,090 (5.9%) | 5 (8.8%) |
| fifties | Fifties | 586 (3.2%) | 1 (1.8%) |
| sixties | Sixties | - | - |
| seventies | Seventies | - | - |
| eighties | Eighties | - | - |
| nineties | Nineties | - | - |
| - | Unspecified | 727 (3.9%) | 45 (78.9%) |

*Age declared: 17,758 of 18,485 clips (96.1%), 12 of 57 speakers (21.1%)*

## Data splits for modelling

**Clip buckets**

| Bucket | Clips |
|---|---|
| Validated | 16,612 (89.9%) |
| Invalidated | 570 (3.1%) |
| Other | 1,303 (7.0%) |

**Training splits**

| Split | Clips |
|---|---|
| Train | 2,558 (15.4%) |
| Dev | 1,948 (11.7%) |
| Test | 2,076 (12.5%) |

*Training split coverage: 6,582 of 16,612 validated clips (39.6%)*

The dataset contains 16612 validated, 570 invalidated, and 1303 unresolved clips. The average clip duration is 4.791 seconds.

## Text corpus

Corpus contains more 6500 sentences from different open source documents or from published books of different authors with their permission and consent. Most of them were submitted to a local organisation which then forwarded to Common voice.

**Validated sentences:** 6,635

| Category | Count |
|---|---|
| Unvalidated sentences | 221 |
| Pending sentences | 218 |
| Rejected sentences | 3 |
| Reported sentences | 90 |

The corpus contains 6,856 sentences: 6,635 validated and 221 unvalidated (218 pending review, 3 rejected), with 90 reported for review.

### Writing system

Perso-Arabic script

#### Symbol table

```ا ب بھ پ پھ ت تھ ٹ ٹھ ث ج جھ چ جھ ڇ ڇھ ح خ څ څھ د دھ ڈ ڈھ ذ ر رھ ڑ ز زھ ژ ژھ ڙ ڙھ س ش ݜ ص ض ط ظ ع غ ف ق ک کھ گ گھ ل لھ م مھ ن نھ ݨ و ہ ء ی ې ے```

### Sample

There follows a randomly selected sample of five sentences from the corpus.

1. *معمولی لاپرواہی نہ ݜُو نُقصان ہُوندوۡچے ہِون٘داں گھاؤ دژِلوۡ*
2. *باٹ تئیں زَئے تل اُگُور ھُونٚت۔*
3. *بنہ، تی گے سو گِھن٘لوک کنار (لخکر/لشکر) یا طاقت تھی،*
4. *چِہ سَو دُنئ تھی ہار انسانوں کِراں امن تے انصافَئیں پاند پَشاݜَت*
5. *(ڈیُو لُوں) څاں دُویُوں (پېریۡ یی تے ماݜ) لا بے،*

### Sources

| Source | Sentences |
|---|---|
| Warya Usool e Fiqha | 1,203 (18.4%) |
| Column for Magazine Shaari(Draft) | 910 (13.9%) |
| Sawaat Paighambar | 740 (11.3%) |
| Desi Ilaaja (Draft) | 707 (10.8%) |
| Panj Surah Translation | 497 (7.6%) |
| Column for Social Media | 410 (6.3%) |
| Story (Draft) | 368 (5.6%) |
| self | 332 (5.1%) |
| Indus Kohistani Ilm e Balagha & Ilm e Bayan | 138 (2.1%) |
| Other | 1,221 (18.7%) |

### Text domains

General, Agriculture and Food, Automotive and Transport, Healthcare, History, Law and Governmant, Media and Entertainment, Nature and Environment, News and Current Affairs, Technology and Robotics, Language Fundamentals (e.g. Digits, Letters, Money)

| Code | Domain | Clips | Speakers |
|---|---|---|---|
| general | General | 108 (0.6%) | 16 (28.1%) |
| agriculture_food | Agriculture and Food | 33 (0.2%) | 14 (24.6%) |
| automotive_transport | Automotive and Transport | - | - |
| finance | Finance | - | - |
| service_retail | Service and Retail | - | - |
| healthcare | Healthcare | - | - |
| history_law_government | History, Law and Government | 78 (0.4%) | 18 (31.6%) |
| media_entertainment | Media and Entertainment | 11 (0.1%) | 9 (15.8%) |
| nature_environment | Nature and Environment | 7 (0.0%) | 7 (12.3%) |
| news_current_affairs | News and Current Affairs | - | - |
| technology_robotics | Technology and Robotics | 9 (0.0%) | 9 (15.8%) |
| language_fundamentals | Language Fundamentals | - | - |

### Fields

#### Clips

Each row of a `tsv` file represents a single audio clip, and contains the following information:

- `client_id` - hashed UUID of a given user
- `path` - relative path of the audio file
- `sentence` - the sentence to be read aloud
- `sentence_id` - unique identifier for the sentence
- `sentence_domain` - domain classification(s) of the sentence
- `up_votes` - number of people who said audio matches the text
- `down_votes` - number of people who said audio does not match text
- `age` - age of the speaker[^1]
- `gender` - gender of the speaker[^1]
- `accents` - accents of the speaker[^1]
- `variant` - variant of the language[^1]
- `locale` - locale code of the language
- `segment` - if sentence belongs to a custom dataset segment, it will be listed here

[^1]: For a full list of age, gender, and accent options, see the [demographics spec](https://github.com/common-voice/common-voice/blob/main/web/src/stores/demographics.ts). These will only be reported if the speaker opted in to provide that information.

#### `validated_sentences.tsv`

The `validated_sentences.tsv` file contains one row per validated sentence in the text corpus:

- `sentence_id` - unique identifier for the sentence
- `sentence` - the sentence text
- `variant` - the variant of the language
- `sentence_domain` - the domain(s) the sentence belongs to
- `source` - the source the sentence was collected from
- `is_used` - whether the sentence is still in circulation for recording
- `clips_count` - number of clips recorded for this sentence

#### `unvalidated_sentences.tsv`

The `unvalidated_sentences.tsv` file contains one row per unvalidated sentence in the text corpus:

- `sentence_id` - unique identifier for the sentence
- `sentence` - the sentence text
- `variant` - the variant of the language
- `sentence_domain` - the domain(s) the sentence belongs to
- `source` - the source the sentence was collected from
- `up_votes` - number of upvotes the sentence received
- `down_votes` - number of downvotes the sentence received
- `status` - current status of the sentence (`pending` or `rejected`)

## Get involved

### Community links

- [Common Voice translators on Pontoon](https://pontoon.mozilla.org/mvy/common-voice/contributors/)
- [Common Voice Communities](https://github.com/common-voice/common-voice/blob/main/docs/COMMUNITIES.md)

### Discussions

- [Common Voice on Matrix](https://chat.mozilla.org/#/room/#common-voice:mozilla.org)
- [Common Voice on Discourse](https://discourse.mozilla.org/t/about-common-voice-readme-first/17218)
- [Common Voice on Discord](https://discord.gg/9QTj9zwn)
- [Common Voice on Telegram](https://t.me/mozilla_common_voice)

### Contribute

- [Speak](https://commonvoice.mozilla.org/mvy/speak)
- [Write](https://commonvoice.mozilla.org/mvy/write)
- [Listen](https://commonvoice.mozilla.org/mvy/listen)
- [Review](https://commonvoice.mozilla.org/mvy/review)

## Acknowledgements

### Datasheet authors

Common Voice Community

### Funding

This dataset was partially funded by the *Open Multilingual Speech Fund* managed by Mozilla Common Voice.

## Licence

This dataset is released under the [Creative Commons Zero (CC-0)](https://creativecommons.org/public-domain/cc0/) licence. By downloading this data you agree to not determine the identity of speakers in the dataset.
