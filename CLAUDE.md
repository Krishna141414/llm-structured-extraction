# Task 6: Structured LLM Extraction with Validation (VoidMain Internship)

## Goal
Brief: "Build an LLM application that converts unstructured information into validated structured information. Generate structured output such as JSON/schema-based responses, validate results and handle missing, malformed or unexpected model responses. Include retries/fallbacks where appropriate."
**Keep it SIMPLE: one small Python module + ONE Jupyter notebook + README. No web app, no API keys, no deployment, no test suite.**

## Setup
- Windows, Python 3.14, project in OneDrive. Keep `.venv` and model cache out of git. Empty `screenshots/.gitkeep`.
- Install the **CPU-only PyTorch build** (`pip install torch --index-url https://download.pytorch.org/whl/cpu`) - NOT the CUDA build. Plus `transformers`, `pydantic`, `jupyter`, `matplotlib`. Pin `requirements.txt`.
- A small instruct LLM was already downloaded for a previous project. First list the Hugging Face cache (`%USERPROFILE%\.cache\huggingface\hub`, folders named `models--...`) and reuse the small instruct model found there (e.g. Qwen2.5-0.5B-Instruct) so nothing big is downloaded again. Only if none is found, download Qwen2.5-0.5B-Instruct.

## Use case
Turn messy **hotel booking request emails** into a clean booking record.

## `extractor.py` (short, commented)
1. **Schema (Pydantic):** `guest_name` (str), `check_in` / `check_out` (dates, check_out after check_in), `num_guests` (int 1-10), `room_type` (enum: single/double/suite/unknown), `special_requests` (list[str], may be empty), `contact_email` (optional, valid email or null).
2. **Prompt:** system instruction + the schema + 1 example, ask for JSON only. Low temperature, small `max_new_tokens`.
3. **Parsing + repair:** strip code fences / extra text, extract the first `{...}` block, `json.loads`.
4. **Validation:** Pydantic; collect clear error messages.
5. **Retry:** up to 2 retries, feeding the validation error back to the model ("fix these errors, return only JSON").
6. **Fallback:** if still failing, a simple rule-based extractor (regex for email, dates, number of guests, room keywords) fills what it can; missing fields set to null/"unknown".
7. **Result object:** `data`, `status` (ok / ok_after_retry / fallback / failed), `attempts`, `errors`.

## Notebook `structured_extraction.ipynb` (run top to bottom, outputs saved)
1. Intro: use case, schema, pipeline diagram (simple text/markdown).
2. ~8 sample emails written in the notebook: clean ones, one missing dates, one with no guest count, one with weird date formats, one irrelevant/spam email.
3. Run the extractor on all of them -> show input, raw model output, final JSON, status.
4. **Failure handling demo (deterministic):** feed hand-made bad model outputs directly into the parser/validator: broken JSON, JSON wrapped in text, wrong types, check_out before check_in, unexpected room type -> show how each is repaired, retried or sent to fallback.
5. Summary table: status counts (first-try success / after retry / fallback / failed), avg attempts. One small bar chart in colors `#0B1020`, `#4F7CFF`, `#FF3D81`, `#FFB020`, `#22D3B6`.
6. 4-6 bullet observations + limitations.

## README
What it does, schema, pipeline (parse -> validate -> retry -> fallback), results table, observations, how to run.

## Rules
- Do everything in one go without asking. Keep code short and commented.
- Run the notebook fully once (`jupyter nbconvert --to notebook --execute --inplace structured_extraction.ipynb`) so outputs are saved, then commit and push.
- Finish with a SHORT summary of the results. Then stop.
