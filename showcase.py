"""Showcase helpers: run one email through extractor.extract() and record a step-by-step trace for the
web page (raw output, JSON repairs, per-field validation, retries, fallback).

`python showcase.py` precomputes every demo example + the notebook results into web/demo_data.js,
so the page works instantly without the model.
"""
import inspect
import json
import re
import threading
import time
from pathlib import Path

import extractor as ex

LABELS = {"guest_name": "Guest name", "check_in": "Check-in", "check_out": "Check-out",
          "num_guests": "Guests", "room_type": "Room type", "special_requests": "Special requests",
          "contact_email": "Contact email"}

# Hand-made bad answers for the "broken output -> fallback" example (a different failure each attempt)
FALLBACK_BAD = [
    "I'm sorry, I can only answer questions about the hotel.",
    '{"guest_name": "", "check_in": "first of December", "num_guests": "a couple", '
    '"special_requests": "none", "contact_email": "guest-at-mail"}',
    '{"guest_name": "The guest", "check_in": "2026-12-05", "check_out": "2026-12-01", "num_guests": 2, '
    '"room_type": "double", "special_requests": [], "contact_email": null}',
]

# Pydantic / parser messages -> plain English (matched as substrings)
PLAIN = [("check_out must be after", "Check-out is before (or on) check-in."),
         ("valid date", "{f} is not a real date (expected YYYY-MM-DD)."),
         ("valid integer", "{f} must be a whole number."),
         ("greater than or equal", "{f} must be at least 1."),
         ("less than or equal", "{f} must be 10 or fewer."),
         ("'single', 'double'", "{f} must be single, double, suite or unknown."),
         ("valid list", "{f} must be a list."),
         ("at least 1 character", "{f} is empty."),
         ("valid email", "{f} is not a valid email address."),
         ("valid string", "{f} must be text."),
         ("Field required", "{f} is missing."),
         ("no JSON object", "The reply contains no JSON at all."),
         ("invalid JSON", "The JSON is broken beyond repair."),
         ("not an object", "The JSON is not an object.")]


def plain(err: str) -> str:
    field = LABELS.get(err.split(":")[0].split(".")[0], "A field")
    return next((msg.format(f=field) for key, msg in PLAIN if key in err), err)


def describe_repairs(raw: str) -> list[str]:
    """What parse_json() had to fix in this raw output (for display only)."""
    notes = ["Removed ``` code fences"] if "```" in raw else []
    text = re.sub(r"```(?:json)?", "", raw).strip()
    if "{" not in text:
        return notes
    if text.index("{") > 0:
        notes.append("Dropped text before the JSON")
    if text.count("{") > text.count("}"):
        notes.append("Closed truncated JSON")
    elif not text.endswith("}"):
        notes.append("Dropped text after the JSON")
    if re.search(r",\s*[}\]]", text):
        notes.append("Removed trailing comma")
    if re.search(r"\b(None|True|False)\b", text):
        notes.append("Converted Python None/True/False to JSON")
    return notes


def corrupt(raw: str) -> str:
    """Break the model's real answer: chatter + fences, trailing comma, Python None, and an invalid email.
    (Swapped dates or an odd room type are NOT used: the 0.5B model copies those back on every retry.)"""
    try:
        obj = ex.parse_json(raw)
    except ex.ParseError:
        obj = {}
    if obj.get("contact_email"):
        obj["contact_email"] = obj["contact_email"].replace("@", " at ")
    else:
        obj["num_guests"] = "two guests"  # no email to break -> break the guest count instead
    body = json.dumps(obj).replace("null", "None")[:-1] + ", }"
    return f"Sure! Here is the booking you asked for:\n```json\n{body}\n```\nLet me know if you need anything else."


def trace_attempt(raw: str) -> dict:
    """Re-run the parser and validator on one raw output to get repairs + per-field pass/fail."""
    t = {"repairs": describe_repairs(raw), "parsed": None, "parse_error": None,
         "rejected": False, "fields": {}, "errors": []}
    try:
        obj = ex.parse_json(raw)
    except ex.ParseError as e:
        t["parse_error"] = plain(str(e))
        t["errors"] = [t["parse_error"]]
        return t
    t["parsed"] = obj
    try:
        _, errs = ex.validate(obj)
    except ex.NotBooking:
        t["rejected"] = True
        t["errors"] = ["Not a booking request - the model refused to invent one."]
        return t
    t["fields"] = {f: {"ok": True, "msg": ""} for f in LABELS}
    for e in errs:
        loc = e.split(":")[0].split(".")[0]
        for f in (["check_in", "check_out"] if loc == "booking" else [loc]):
            if f in t["fields"]:
                t["fields"][f] = {"ok": False, "msg": plain(e)}
    t["errors"] = list(dict.fromkeys(plain(e) for e in errs))
    return t


_lock = threading.Lock()  # one model run at a time


def run_example(email: str, simulate: str | None = None) -> dict:
    """simulate=None: real model. 'retry': attempt 1 is a corrupted copy of the real answer.
    'fallback': every attempt returns a hand-made bad answer."""
    calls = []

    def llm(messages):
        start = time.time()
        if simulate == "fallback":
            raw = FALLBACK_BAD[min(len(calls), len(FALLBACK_BAD) - 1)]
        else:
            raw = ex.llm_generate(messages)
            if simulate == "retry" and not calls:
                raw = corrupt(raw)
        calls.append({"messages": messages, "raw": raw, "seconds": round(time.time() - start, 1)})
        return raw

    with _lock:
        r = ex.extract(email, llm=llm)
    attempts = []
    for i, c in enumerate(calls):
        nxt = calls[i + 1]["messages"][-1]["content"] if i + 1 < len(calls) else None
        attempts.append({"n": i + 1, "raw": c["raw"], "seconds": c["seconds"], "feedback": nxt,
                         **trace_attempt(c["raw"])})
    used_fallback = len(calls) == ex.MAX_RETRIES + 1 and not any(a["rejected"] for a in attempts) \
        and r.status in ("fallback", "failed")
    return {"email": email, "simulate": simulate, "status": r.status, "attempts": r.attempts,
            "data": r.data, "errors": [plain(e.split(": ", 1)[-1]) if e.startswith("attempt") else plain(e)
                                       for e in r.errors],
            "fallback": {"rules": ex.rule_based_extract(email)} if used_fallback else None,
            "attempt_trace": attempts, "prompt": ex.SYSTEM_PROMPT}


# ---------------------------------------------------------------- precompute
EXAMPLES = [  # (id, button label, what it demonstrates, notebook email key, simulate)
    ("clean", "Clean email", "Clean input → success first try", "clean_1", None),
    ("missing", "Missing info", "No dates in the email → nulls", "missing_dates", None),
    ("weird", "Weird dates", "“3rd of Dec” → ISO dates", "weird_dates", None),
    ("spam", "Spam", "Not a booking → rejected", "spam", None),
    ("retry", "Broken output → retry", "Broken JSON repaired, bad dates → retry", "clean_1", "retry"),
    ("fallback", "Broken output → fallback", "3 bad answers → rule-based fallback", "messy_slash_dates", "fallback"),
]


def notebook_vars() -> dict:
    """Load EMAILS and BAD_OUTPUTS from the notebook so the page uses exactly the same data."""
    import pandas as pd
    ns = {"pd": pd, "parse_and_validate": ex.parse_and_validate}
    cells = json.loads(Path("structured_extraction.ipynb").read_text(encoding="utf-8"))["cells"]
    for c in cells:
        src = "".join(c["source"])
        if src.startswith(("EMAILS = ", "BAD_OUTPUTS = ")):
            exec(src, ns)
    return ns


if __name__ == "__main__":
    nb = notebook_vars()
    runs = {}
    for key, email in nb["EMAILS"].items():  # same 8 emails as the notebook
        runs[key] = run_example(email)
        print(f"{key:18s} {runs[key]['status']:15s} attempts={runs[key]['attempts']}")
    examples = []
    for eid, label, demo, key, sim in EXAMPLES:
        trace = runs[key] if sim is None else run_example(nb["EMAILS"][key], sim)
        print(f"example {eid:9s} {trace['status']:15s} attempts={trace['attempts']}")
        examples.append({"id": eid, "label": label, "demo": demo, **trace})
    table = [{"email": k, "status": r["status"], "attempts": r["attempts"], **{f: (r["data"] or {}).get(f) for f in
              ("guest_name", "check_in", "check_out", "num_guests", "room_type")}} for k, r in runs.items()]
    parser_demo = []
    for case, raw in nb["BAD_OUTPUTS"].items():
        data, errs = ex.parse_and_validate(raw)
        parser_demo.append({"case": case, "valid": data is not None, "repairs": describe_repairs(raw),
                            "errors": list(dict.fromkeys(map(plain, errs)))})
    code = {name: inspect.getsource(obj) for name, obj in
            [("Booking", ex.Booking), ("parse_json", ex.parse_json), ("extract", ex.extract), ("fallback", ex.fallback)]}
    data = {"examples": examples, "results": {"table": table, "parser_demo": parser_demo}, "code": code,
            "labels": LABELS}
    Path("web").mkdir(exist_ok=True)
    Path("web/demo_data.js").write_text("window.DEMO_DATA = " + json.dumps(data, indent=1, ensure_ascii=False) + ";\n",
                                        encoding="utf-8")
    print("wrote web/demo_data.js")
