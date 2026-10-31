# Structured LLM Extraction with Validation

Turns messy **hotel booking request emails** into clean, validated booking records with a small local LLM
(`Qwen/Qwen2.5-0.5B-Instruct`, CPU only, no API keys). The output is checked against a Pydantic schema. Malformed or invalid responses are repaired, retried with the error messages fed back, and finally handed to a rule-based fallback.

- `extractor.py`: the schema, prompt, parser, validator, retry loop and fallback
- `structured_extraction.ipynb`: demo on 8 sample emails, a deterministic failure-handling demo, and a summary (outputs saved)
- `app.py` + `templates/index.html`: minimal local web demo (Flask)

## Schema

| field | rule |
|---|---|
| `guest_name` | non-empty string |
| `check_in`, `check_out` | ISO date or null; `check_out` must be after `check_in` |
| `num_guests` | integer 1-10 or null |
| `room_type` | `single` / `double` / `suite` / `unknown` |
| `special_requests` | list of strings (may be empty) |
| `contact_email` | valid email or null |

## Pipeline

```
email -> prompt (system + schema + 1 example, greedy decoding, max 200 tokens)
      -> parse/repair: strip code fences and extra text, take the first {...}, fix trailing commas / None / truncation
      -> Pydantic validation --ok--> status "ok" (or "ok_after_retry")
      -> retry up to 2x: "Your JSON had these errors: ... return only the corrected JSON"
      -> fallback: regex for email, dates, guest count, room keywords -> status "fallback" (or "failed")
```

`extract(email)` returns a `Result` with `data`, `status`, `attempts`, `errors` and `raw_outputs`.
If the model answers `{"not_booking": true}` (e.g. spam), the status is `failed`.

## Results (8 sample emails)

| status | count |
|---|---|
| ok (first try) | 6 |
| ok_after_retry | 1 |
| fallback | 0 |
| failed | 1 (spam, correctly rejected) |

Average attempts: **1.12**. In the deterministic demo, the parser repaired broken JSON, JSON wrapped in text and truncated JSON.
Wrong types, `check_out` before `check_in` and an unknown room type were caught by validation, and these cases led to a retry or to the fallback.

## Observations

- Clean emails were all extracted on the first try. Greedy decoding plus one example keeps the format stable.
- `"SUITE"` (upper case) failed the enum check. The retry produced valid JSON but changed the value to `"unknown"`. Validation guarantees the structure is correct, but not the content.
- For the email with no guest count, the model guessed `num_guests: 2` instead of null. A plausible value like this passes validation.
- The model correctly returned null for missing dates. It dropped a parking question from `special_requests`.
- The model rejected the spam email explicitly with `not_booking`, so no booking was invented.
- The fallback regexes alone recover most fields on these emails. They are useful as a safety net but brittle on other phrasings.

**Limitations:** the data set is tiny and hand-written; the fallback regexes are English-only and assume DD/MM/YYYY; dates without a year are resolved against a fixed reference date (2026-10-31); each call takes about 5-20 s on CPU; there is no check that extracted values actually appear in the email.

## How to run

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt   # CPU-only torch via the extra index URL
jupyter nbconvert --to notebook --execute --inplace structured_extraction.ipynb
```

## Web demo

```bash
python app.py        # then open http://127.0.0.1:5000
```

Paste an email or pick a sample (clean, missing info, weird dates, spam) and press **Extract**. The page shows a status badge, the number of attempts, the final JSON, any validation errors, and the raw model output for each attempt.
**Simulate broken output** replaces the model's answers with hand-made bad ones so you can see the error paths:
- *first answer broken → retry*: the first answer contains no JSON, then the real model retries (`ok_after_retry`).
- *all answers broken → fallback*: every answer is invalid JSON with wrong types, an unknown room type and an empty name, so the regex fallback fills the record (`fallback`).

During testing, a broken answer that already contained wrong values (e.g. `"penthouse"`) was repeated by the 0.5B model on every retry. So the retry mode uses an answer with no values in it.
On the "Missing info" sample, the retry also invented dates and a guest count.

The model (~1 GB) is loaded from the Hugging Face cache, or downloaded on the first run.
