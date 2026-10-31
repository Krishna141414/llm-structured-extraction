# Structured LLM Extraction with Validation

Turns messy **hotel booking request emails** into clean, validated booking records with a small local LLM
(`Qwen/Qwen2.5-0.5B-Instruct`, CPU only, no API keys). The output is checked against a Pydantic schema. Malformed or invalid responses are repaired, retried with the error messages fed back, and finally handed to a rule-based fallback.

- `extractor.py`: the schema, prompt, parser, validator, retry loop and fallback
- `structured_extraction.ipynb`: demo on 8 sample emails, a deterministic failure-handling demo, and a summary (outputs saved)
- `app.py` + `web/`: animated showcase page with a live backend (Flask), `showcase.py`: trace recorder + demo-data precompute

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

## Showcase page

An animated one-page walkthrough of the task (for demos): requirement cards, a step-by-step pipeline replay,
results with charts, how it works, and limitations. Plain HTML/CSS/JS in `web/` with Chart.js from a CDN.

```bash
python app.py        # then open http://127.0.0.1:5000
```

- **Instant mode (default):** six examples (clean email, missing info, weird dates, spam, broken output → retry,
  broken output → fallback) replay from `web/demo_data.js`. The traces were precomputed with the real model, so no
  waiting is needed. You can also open `web/index.html` directly, or host `web/` as a static site.
- **Run live:** this toggle only appears when `app.py` is running. It sends the (editable) email to `POST /api/run`,
  which runs the real pipeline (~10-30 s per model attempt on CPU).
- **Regenerate the demo data** after changing the pipeline: `python showcase.py`. It runs the notebook's 8 emails
  plus the two simulated-failure examples and records every attempt, repair and validation error.

`showcase.py` wraps the LLM call around the unchanged `extractor.extract()` to record the trace.
"Broken output → retry" corrupts the model's real first answer: it adds chatter and code fences, a trailing comma and
`None`, and an invalid email. "Broken output → fallback" returns three hand-made bad answers.
During testing, the 0.5B model could fix an invalid email after seeing the error. Swapped check-in/check-out dates or
an odd room type it simply copied back on every retry, so the demo uses the email break.

The model (~1 GB) is loaded from the Hugging Face cache, or downloaded on the first run.
