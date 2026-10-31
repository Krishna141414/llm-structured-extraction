"""Structured extraction of hotel booking requests with a small local LLM.

Pipeline: prompt -> parse/repair JSON -> Pydantic validation -> retry with errors -> rule-based fallback.
"""
import json
import re
from dataclasses import dataclass, field
from datetime import date
from enum import Enum
from typing import Callable, Optional

from pydantic import BaseModel, EmailStr, Field, ValidationError, model_validator

MODEL_ID = "Qwen/Qwen2.5-0.5B-Instruct"
TODAY = date(2026, 10, 31)  # fixed reference date so relative/yearless dates are reproducible
MAX_RETRIES = 2


# ---------------------------------------------------------------- 1. Schema
class RoomType(str, Enum):
    single = "single"
    double = "double"
    suite = "suite"
    unknown = "unknown"


class Booking(BaseModel):
    guest_name: str = Field(min_length=1)
    check_in: Optional[date] = None   # null when the email gives no date
    check_out: Optional[date] = None
    num_guests: Optional[int] = Field(default=None, ge=1, le=10)
    room_type: RoomType = RoomType.unknown
    special_requests: list[str] = Field(default_factory=list)
    contact_email: Optional[EmailStr] = None

    @model_validator(mode="after")
    def check_dates(self):
        if self.check_in and self.check_out and self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self


@dataclass
class Result:
    data: Optional[dict]
    status: str                      # ok / ok_after_retry / fallback / failed
    attempts: int                    # number of LLM calls
    errors: list[str] = field(default_factory=list)
    raw_outputs: list[str] = field(default_factory=list)


# ---------------------------------------------------------------- 2. Prompt
SCHEMA_TEXT = """{
  "guest_name": string,
  "check_in": "YYYY-MM-DD" or null,
  "check_out": "YYYY-MM-DD" or null (must be after check_in),
  "num_guests": integer 1-10 or null,
  "room_type": "single" | "double" | "suite" | "unknown",
  "special_requests": [string, ...] (may be empty),
  "contact_email": valid email or null
}"""

EXAMPLE_EMAIL = ("Hi, I'm Tom Weber. I'd like a double room from 2026-05-02 to 2026-05-05 "
                 "for 2 people. Could we get a quiet room? Reach me at tom.weber@mail.com")
EXAMPLE_JSON = json.dumps({
    "guest_name": "Tom Weber", "check_in": "2026-05-02", "check_out": "2026-05-05",
    "num_guests": 2, "room_type": "double", "special_requests": ["quiet room"],
    "contact_email": "tom.weber@mail.com"})

SYSTEM_PROMPT = f"""You extract hotel booking requests into JSON.
Today is {TODAY.isoformat()}; if a date has no year, use the next future occurrence.
Return ONLY one JSON object with exactly these keys:
{SCHEMA_TEXT}
Use null for anything not mentioned. If the email is not a booking request, return {{"not_booking": true}}.

Example email: {EXAMPLE_EMAIL}
Example JSON: {EXAMPLE_JSON}"""


def build_messages(email: str) -> list[dict]:
    return [{"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Email:\n{email}\n\nJSON:"}]


# ---------------------------------------------------------------- LLM (loaded lazily, CPU)
_model = _tok = None


def llm_generate(messages: list[dict], max_new_tokens: int = 200) -> str:
    """Greedy decoding (= temperature 0) with the local Qwen model from the HF cache."""
    global _model, _tok
    if _model is None:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        _tok = AutoTokenizer.from_pretrained(MODEL_ID)
        _model = AutoModelForCausalLM.from_pretrained(MODEL_ID)
        _model.eval()
    import torch
    enc = _tok.apply_chat_template(messages, add_generation_prompt=True, return_tensors="pt", return_dict=True)
    with torch.no_grad():
        out = _model.generate(**enc, max_new_tokens=max_new_tokens, do_sample=False,
                              pad_token_id=_tok.eos_token_id)
    return _tok.decode(out[0, enc["input_ids"].shape[1]:], skip_special_tokens=True).strip()


# ---------------------------------------------------------------- 3. Parsing + repair
class ParseError(Exception):
    pass


def parse_json(text: str) -> dict:
    """Strip code fences / chatter, take the first balanced {...} block, light repair, json.loads."""
    text = re.sub(r"```(?:json)?", "", text)
    start = text.find("{")
    if start == -1:
        raise ParseError("no JSON object found in model output")
    depth, end = 0, None
    for i, ch in enumerate(text[start:], start):
        depth += ch == "{"
        depth -= ch == "}"
        if depth == 0:
            end = i + 1
            break
    block = text[start:end] if end else text[start:] + "}" * depth  # close truncated output
    block = re.sub(r",\s*([}\]])", r"\1", block)                     # trailing commas
    block = re.sub(r"\bNone\b", "null", block)                        # Python-isms
    block = re.sub(r"\bTrue\b", "true", re.sub(r"\bFalse\b", "false", block))
    try:
        obj = json.loads(block)
    except json.JSONDecodeError as e:
        raise ParseError(f"invalid JSON: {e.msg} (char {e.pos})")
    if not isinstance(obj, dict):
        raise ParseError("JSON is not an object")
    return obj


# ---------------------------------------------------------------- 4. Validation
class NotBooking(Exception):
    pass


def validate(obj: dict) -> tuple[Optional[dict], list[str]]:
    """Return (clean_data, []) or (None, [readable error messages])."""
    if obj.get("not_booking"):
        raise NotBooking("model says this is not a booking request")
    try:
        return Booking(**obj).model_dump(mode="json"), []
    except ValidationError as e:
        return None, [f"{'.'.join(map(str, err['loc'])) or 'booking'}: {err['msg']}" for err in e.errors()]


def parse_and_validate(text: str) -> tuple[Optional[dict], list[str]]:
    try:
        return validate(parse_json(text))
    except ParseError as e:
        return None, [str(e)]


# ---------------------------------------------------------------- 6. Rule-based fallback
MONTHS = {m: i for i, m in enumerate(["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug",
                                      "sep", "oct", "nov", "dec"], 1)}
WORDS = {w: i for i, w in enumerate(["one", "two", "three", "four", "five", "six", "seven",
                                     "eight", "nine", "ten"], 1)}
REQUEST_KEYWORDS = ["late check-in", "early check-in", "late checkout", "airport transfer", "parking",
                    "breakfast", "sea view", "crib", "cot", "quiet", "high floor", "wheelchair",
                    "extra bed", "vegetarian", "pet"]


def _find_dates(text: str) -> list[date]:
    found = []  # (position, date) so we keep the order of appearance
    for m in re.finditer(r"\b(\d{4})-(\d{1,2})-(\d{1,2})\b", text):
        found.append((m.start(), int(m[1]), int(m[2]), int(m[3])))
    for m in re.finditer(r"\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b", text):  # assume DD/MM/YYYY
        found.append((m.start(), int(m[3]), int(m[2]), int(m[1])))
    mon = r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?"
    for m in re.finditer(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?(?: of)? {mon},? ?(\d{{4}})?", text, re.I):
        found.append((m.start(), int(m[3] or 0), MONTHS[m[2].lower()], int(m[1])))
    for m in re.finditer(rf"\b{mon} (\d{{1,2}})(?:st|nd|rd|th)?,? ?(\d{{4}})?", text, re.I):
        found.append((m.start(), int(m[3] or 0), MONTHS[m[1].lower()], int(m[2])))
    dates = []
    for _, y, mo, d in sorted(found):
        try:
            dt = date(y or TODAY.year, mo, d)
            if not y and dt < TODAY:
                dt = dt.replace(year=dt.year + 1)
            dates.append(dt)
        except ValueError:
            pass
    return dates


def rule_based_extract(text: str) -> dict:
    low = text.lower()
    email = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
    name = re.search(r"(?i:my name is|i am|i'm|this is|name:)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)+)", text)
    if not name:  # sign-off like "Regards,\nAnna Schmidt"
        name = re.search(r"(?:regards|thanks|thank you|cheers|best),?\s*\n\s*([A-Z][a-z]+(?: [A-Z][a-z]+)*)", text, re.I)
    guests = re.search(r"\b(\d+|" + "|".join(WORDS) + r")\s+(?:guests?|people|persons?|adults?|of us)", low)
    n = None
    if guests:
        n = int(guests[1]) if guests[1].isdigit() else WORDS[guests[1]]
    dates = _find_dates(text)
    check_in, check_out = (dates[0], dates[1]) if len(dates) >= 2 and dates[1] > dates[0] else (None, None)
    room = next((r for r in ["suite", "double", "single"] if r in low), "unknown")
    return {"guest_name": name[1] if name else "unknown",
            "check_in": check_in and check_in.isoformat(), "check_out": check_out and check_out.isoformat(),
            "num_guests": n if n and 1 <= n <= 10 else None, "room_type": room,
            "special_requests": [k for k in REQUEST_KEYWORDS if re.search(rf"\b{k}\b", low)],
            "contact_email": email[0].rstrip(".") if email else None}


# ---------------------------------------------------------------- 5 + 7. Main loop
def extract(email: str, llm: Callable[[list[dict]], str] = llm_generate) -> Result:
    """Ask the LLM, validate, retry with the errors fed back, then fall back to rules."""
    messages = build_messages(email)
    errors, raws = [], []
    for attempt in range(1, MAX_RETRIES + 2):
        raw = llm(messages)
        raws.append(raw)
        try:
            data, errs = parse_and_validate(raw)
        except NotBooking as e:
            return Result(None, "failed", attempt, errors + [str(e)], raws)
        if data:
            return Result(data, "ok" if attempt == 1 else "ok_after_retry", attempt, errors, raws)
        errors += [f"attempt {attempt}: {e}" for e in errs]
        # Feed the errors back so the model can correct itself
        messages = messages + [
            {"role": "assistant", "content": raw},
            {"role": "user", "content": "Your JSON had these errors:\n- " + "\n- ".join(errs)
                                        + "\nFix these errors and return only the corrected JSON."}]
    return fallback(email, attempt, errors, raws)


def fallback(email: str, attempts: int, errors: list[str], raws: list[str]) -> Result:
    data = rule_based_extract(email)
    found = [k for k in ("check_in", "num_guests", "contact_email") if data[k]] + \
            (["room_type"] if data["room_type"] != "unknown" else [])
    if not found:  # nothing booking-like in the text
        return Result(None, "failed", attempts, errors + ["fallback found no booking information"], raws)
    clean, errs = validate(data)
    if not clean:  # e.g. an invalid email -> drop the offending fields and keep the rest
        for e in errs:
            data[e.split(":")[0].split(".")[0]] = None
        clean, _ = validate({k: v for k, v in data.items() if v is not None})
    return Result(clean, "fallback" if clean else "failed", attempts, errors, raws)
