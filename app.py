"""Showcase page + live backend. Run: python app.py -> http://127.0.0.1:5000

The page (web/) replays precomputed traces from web/demo_data.js; "Run live" posts to /api/run,
which sends the email through the real pipeline (extractor.py via showcase.run_example).
"""
from flask import Flask, jsonify, request

from showcase import run_example

app = Flask(__name__, static_folder="web", static_url_path="")


@app.get("/")
def index():
    return app.send_static_file("index.html")


@app.get("/api/health")
def health():
    return jsonify(ok=True)


@app.post("/api/run")
def run():
    body = request.get_json(silent=True) or {}
    email, simulate = (body.get("email") or "").strip(), body.get("simulate")
    if not email:
        return jsonify(error="Paste an email first."), 400
    if simulate not in (None, "retry", "fallback"):
        return jsonify(error="simulate must be null, 'retry' or 'fallback'."), 400
    return jsonify(run_example(email[:4000], simulate))


if __name__ == "__main__":
    app.run(debug=False)
