"""Minimal local web demo for extractor.py. Run: python app.py -> http://127.0.0.1:5000"""
from flask import Flask, jsonify, render_template, request

from extractor import extract, llm_generate

app = Flask(__name__)

SAMPLES = {
    "Clean": "Hello, my name is Anna Schmidt. I would like to book a double room from 2026-12-10 to 2026-12-14 "
             "for 2 guests.\nWe would appreciate a sea view and breakfast included. Contact: anna.schmidt@example.com",
    "Missing info": "Hi, I'm Carlos Diaz. We want a suite sometime next spring, not sure about dates yet.\n"
                    "Is parking available? carlos.diaz@gmail.com",
    "Weird dates": "hey this is Mark Olsen, need a room 3rd of Dec to 7th of Dec 2026, two adults, double bed pls.\n"
                   "also a crib for the baby. mark.olsen@outlook.com",
    "Spam": "CONGRATULATIONS!!! You have been selected to receive a FREE iPhone. Click the link below to claim "
            "your prize before it expires.",
}

# Hand-made bad responses. The retry one has no values on purpose: the 0.5B model tends to copy
# values from a broken previous answer (e.g. "penthouse") instead of fixing them.
BAD_FIRST = "Sure! I have noted the booking details for the guest and will get back to you shortly."
BAD_OUTPUT = ('Here is the booking:\n{"guest_name": "", "check_in": "2026-12-14", "check_out": "2026-12-10", '
              '"num_guests": "a couple", "room_type": "penthouse", "special_requests": "none"}')


def simulated_llm(mode):
    """'retry': first answer is broken, then the real model retries. 'fallback': every answer is broken."""
    calls = {"n": 0}

    def llm(messages):
        calls["n"] += 1
        if mode == "fallback":
            return BAD_OUTPUT
        return BAD_FIRST if calls["n"] == 1 else llm_generate(messages)
    return llm


@app.get("/")
def index():
    return render_template("index.html", samples=SAMPLES)


@app.post("/extract")
def run_extract():
    body = request.get_json()
    email, simulate = body.get("email", "").strip(), body.get("simulate")
    if not email:
        return jsonify(error="Paste an email first."), 400
    r = extract(email, llm=simulated_llm(simulate) if simulate else llm_generate)
    return jsonify(data=r.data, status=r.status, attempts=r.attempts, errors=r.errors, raw_outputs=r.raw_outputs)


if __name__ == "__main__":
    app.run(debug=False)
