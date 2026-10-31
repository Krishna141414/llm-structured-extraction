/* Data Refinery showcase - replays precomputed traces (web/demo_data.js) or live runs from app.py */
const D = window.DEMO_DATA;
const LABELS = D.labels;
const FIELDS = Object.keys(LABELS);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, reduced ? 0 : ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = v => v === null || v === undefined ? "null" : Array.isArray(v) ? (v.length ? v.join(", ") : "[ ]") : String(v);

/* ---------------- syntax highlighting ---------------- */
function hlPy(src) {
  const re = /(#[^\n]*)|((?:\b[rRfFbB]{1,2})?(?:"""[\s\S]*?"""|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'))|(@[\w.]+)|\b(def|class|return|if|elif|else|for|in|not|and|or|is|None|True|False|try|except|raise|as|with|import|from|while|lambda|pass|global)\b|\b(\d+)\b/g;
  let out = "", last = 0, m;
  while ((m = re.exec(src))) {
    const cls = m[1] ? "com" : m[2] ? "str" : m[3] ? "dec" : m[4] ? "kw" : "num";
    out += esc(src.slice(last, m.index)) + `<span class="tk-${cls}">${esc(m[0])}</span>`;
    last = re.lastIndex;
  }
  return out + esc(src.slice(last));
}
function hlJson(obj) {
  const src = JSON.stringify(obj, null, 2);
  return esc(src).replace(/(&quot;(?:\\.|[^&\\]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|(-?\b\d+(?:\.\d+)?\b)/g,
    (m, str, colon, lit, num) => str ? `<span class="tk-${colon ? "key" : "str"}">${str}</span>${colon || ""}`
      : lit ? `<span class="tk-null">${lit}</span>` : `<span class="tk-num">${num}</span>`);
}

/* ---------------- reveal on scroll ---------------- */
const revealObs = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add("in");
  if (e.target.id === "results") startResults();
  revealObs.unobserve(e.target);
}), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(s => revealObs.observe(s));

/* ---------------- hero: messy text assembling into a JSON card ---------------- */
const HERO = [
  ["guest_name", "my name is anna schmidt", '"Anna Schmidt"'],
  ["check_in", "from 10 Dec??", '"2026-12-10"'],
  ["check_out", "til the 14th", '"2026-12-14"'],
  ["num_guests", "2 of us", "2"],
  ["room_type", "DOUBLE room pls", '"double"'],
  ["special_requests", "sea view if poss!!", '["sea view"]'],
  ["contact_email", "anna.schmidt@example .com", '"anna.schmidt@example.com"'],
];
const NOISE = ["hi!!", "Thanks a lot", "sent from my phone", "??", "Regards,", "ps. is breakfast incl?", ":)"];
function initHero() {
  const stage = $("heroStage"), rows = $("heroRows"), card = $("heroCard");
  rows.innerHTML = `<div class="jc-row"><span class="jc-key">{</span></div>` + HERO.map(([k], i) =>
    `<div class="jc-row">&nbsp;&nbsp;<span class="jc-key">"${k}":</span><span class="jc-slot" data-i="${i}"></span></div>`).join("") +
    `<div class="jc-row"><span class="jc-key">}</span></div>`;
  const chips = [...HERO.map(([, messy, clean]) => ({ messy, clean })), ...NOISE.map(n => ({ messy: n, noise: true }))].map(c => {
    const el = document.createElement("span");
    el.className = "hero-chip" + (c.noise ? " noise" : "");
    el.textContent = c.messy;
    stage.appendChild(el);
    return { ...c, el };
  });
  const rnd = (a, b) => a + Math.random() * (b - a);
  function scatter() {
    card.classList.remove("lit");
    const W = stage.clientWidth, H = stage.clientHeight;
    chips.forEach(c => {
      c.el.textContent = c.messy;
      c.el.classList.remove("clean", "gone");
      const w = c.el.offsetWidth;
      c.el.style.transform = `translate(${rnd(0, Math.max(0, W - w))}px, ${rnd(0, H - 30)}px) rotate(${rnd(-14, 14)}deg)`;
    });
  }
  function assemble() {
    const s = stage.getBoundingClientRect();
    chips.forEach((c, i) => {
      if (c.noise) { c.el.classList.add("gone"); return; }
      const slot = rows.querySelector(`[data-i="${i}"]`).getBoundingClientRect();
      c.el.style.transitionDelay = reduced ? "0s" : `${i * 0.08}s`;
      c.el.style.transform = `translate(${slot.left - s.left}px, ${slot.top - s.top - 2}px) rotate(0deg)`;
      setTimeout(() => { c.el.textContent = c.clean; c.el.classList.add("clean"); }, reduced ? 0 : 1100 + i * 80);
    });
    setTimeout(() => card.classList.add("lit"), reduced ? 0 : 1500);
  }
  if (reduced) { assemble(); return; }
  scatter();
  const cycle = async () => {
    await sleep(1400); assemble();
    await sleep(4200); chips.forEach(c => c.el.style.transitionDelay = "0s"); scatter();
    setTimeout(cycle, 600);
  };
  setTimeout(cycle, 300);
}

/* ---------------- requirement cards ---------------- */
const ICON = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${p}"/></svg>`;
const REQS = [
  { title: "Unstructured → structured", how: "A messy email is scanned and its fields fly into a clean booking card.", target: "p1", icon: "M3 6h18v12H3z M3 6l9 7 9-7" },
  { title: "Schema-based JSON", how: "A Pydantic Booking model defines types, ranges and enums. The model must return matching JSON.", target: "p7", icon: "M8 4C6 4 5 5 5 7v2c0 1-1 2-2 2 1 0 2 1 2 2v2c0 2 1 3 3 3M16 4c2 0 3 1 3 3v2c0 1 1 2 2 2-1 0-2 1-2 2v2c0 2-1 3-3 3" },
  { title: "Validation", how: "Every field gets a pass / fail stamp, with errors explained in plain English.", target: "p4", icon: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M8.5 12l2.5 2.5 4.5-5" },
  { title: "Missing, malformed & unexpected", how: "Missing info gives nulls, spam is rejected, broken JSON is repaired.", target: "p3", icon: "M12 3l9 16H3z M12 10v4 M12 17v.5", sub: ["missing → nulls", "spam → rejected", "broken → repaired"] },
  { title: "Retries & fallbacks", how: "Errors are sent back for up to 2 retries. After that, a rule-based extractor takes over.", target: "p5", icon: "M4 12a8 8 0 0 1 14-5.3L20 9 M20 4v5h-5 M20 12a8 8 0 0 1-14 5.3L4 15 M4 20v-5h5" },
  { title: "Results", how: "Status table, charts and findings from the notebook run on 8 emails.", target: "results", icon: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2" },
];
function initReqs() {
  $("reqGrid").innerHTML = REQS.map((r, i) => `
    <button class="req" id="req${i}" data-target="${r.target}">
      <svg class="check" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12"/><path d="M8.5 14.5l3.5 3.5 7-8"/></svg>
      <div class="req-icon">${ICON(r.icon)}</div>
      <h3><span class="n">${i + 1}</span>${r.title}</h3><p>${r.how}</p>
      ${r.sub ? `<div class="subchecks">${r.sub.map((s, j) => `<span id="sub${j}">${s}</span>`).join("")}</div>` : ""}
    </button>`).join("");
  document.querySelectorAll(".req").forEach(b => b.onclick = () =>
    $(b.dataset.target).scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }));
}
const markReq = i => $("req" + i).classList.add("done");
const markSub = j => { $("sub" + j).classList.add("on"); markReq(3); };

/* ---------------- demo: static setup ---------------- */
let current = null, runId = 0;
function initDemo() {
  $("examples").innerHTML = D.examples.map(e =>
    `<button class="ex${e.simulate ? " bad" : ""}" data-id="${e.id}"><b>${esc(e.label)}</b><small>${esc(e.demo)}</small></button>`).join("");
  document.querySelectorAll(".ex").forEach(b => b.onclick = () => selectExample(b.dataset.id));
  $("bookingFields").innerHTML = FIELDS.map(f =>
    `<div class="bf${["special_requests", "contact_email"].includes(f) ? " full" : ""}"><label>${LABELS[f]}</label><div class="v" data-slot="${f}">—</div></div>`).join("");
  $("schemaCode").innerHTML = hlPy(D.code.Booking.trim());
  $("start").onclick = () => setTimeout(() => !current && selectExample("clean"), reduced ? 0 : 700);
}

function selectExample(id) {
  current = D.examples.find(e => e.id === id);
  document.querySelectorAll(".ex").forEach(b => b.classList.toggle("active", b.dataset.id === id));
  if ($("liveToggle").checked) {          // live mode: load the email, user presses "Run live"
    showInput(true);
    $("emailInput").value = current.email;
    return;
  }
  animate(current);
}

/* ---------------- demo: helpers ---------------- */
function setStep(n, state) {
  document.querySelectorAll("#stepbar li").forEach(li => {
    const s = +li.dataset.step;
    if (s === n) li.className = state;
    else if (state === "active" && li.classList.contains("active")) li.classList.remove("active");
  });
  if (state === "active") $("flowFill").style.width = ((n - 1) / 5 * 100) + "%";
}
function panel(id, state, chip = "") {
  const p = $(id);
  p.classList.remove("active", "ok", "fail", "warn");
  if (state) p.classList.add(state);
  p.querySelector(".chip-state").textContent = chip;
  if (state === "active" && !reduced) p.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function reset() {
  document.querySelectorAll("#stepbar li").forEach(li => li.className = "");
  $("flowFill").style.width = "0";
  ["p1", "p2", "p3", "p4", "p5", "p6", "p7"].forEach(p => panel(p, null));
  $("llmOut").innerHTML = ""; $("parseOut").innerHTML = ""; $("validateOut").innerHTML = "";
  $("crates").innerHTML = ""; $("attemptCount").textContent = "0 / 3";
  $("loopNote").className = "loop-note muted"; $("loopNote").textContent = "";
  $("conveyor").classList.remove("moving"); $("loopback").classList.remove("on");
  $("bookingStatus").className = "booking-status"; $("bookingStatus").textContent = "waiting";
  $("bookingStamp").classList.add("hidden");
  document.querySelectorAll("[data-slot]").forEach(s => { s.className = "v"; s.textContent = "—"; });
  $("finalJson").innerHTML = '<span class="muted">waiting...</span>';
  document.querySelectorAll(".fly").forEach(f => f.remove());
}
function showInput(edit) {
  $("emailInput").classList.toggle("hidden", !edit);
  $("emailText").classList.toggle("hidden", edit);
}

/* Find where each extracted value came from in the email, to highlight + fly it */
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const NUMWORDS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
function findSpans(text, data) {
  const spans = [], low = text.toLowerCase();
  if (!data) return spans;
  const add = (f, s, len) => {
    if (s >= 0 && !spans.some(o => s < o.e && s + len > o.s)) spans.push({ f, s, e: s + len });
  };
  const addRe = (f, re) => { const m = re.exec(text); if (m) add(f, m.index, m[0].length); };
  const plainStr = v => typeof v === "string" && v && v !== "unknown";
  if (plainStr(data.guest_name)) add("guest_name", low.indexOf(data.guest_name.toLowerCase()), data.guest_name.length);
  if (plainStr(data.contact_email)) add("contact_email", low.indexOf(data.contact_email.toLowerCase()), data.contact_email.length);
  for (const f of ["check_in", "check_out"]) {
    if (!data[f]) continue;
    const [y, m, d] = data[f].split("-").map(Number), mon = MONTHS[m - 1];
    const pats = [data[f], `\\b0?${d}[/.]0?${m}[/.]${y}`, `\\b0?${d}(?:st|nd|rd|th)?(?: of)? ${mon}[a-z]*\\.?(?:,? ${y})?`,
      `\\b${mon}[a-z]* 0?${d}(?:st|nd|rd|th)?(?:,? ${y})?`];
    for (const p of pats) { const before = spans.length; addRe(f, new RegExp(p, "i")); if (spans.length > before) break; }
  }
  if (data.num_guests) addRe("num_guests", new RegExp(`\\b(${data.num_guests}|${NUMWORDS[data.num_guests] || "x"})\\s+(guests?|people|persons?|adults?|of us)`, "i"));
  if (plainStr(data.room_type)) addRe("room_type", new RegExp(`\\b${data.room_type}\\b`, "i"));
  for (const r of data.special_requests || []) {
    const i = low.indexOf(r.toLowerCase());
    if (i >= 0) add("special_requests", i, r.length);
    else { const w = r.split(" ").find(x => x.length > 3); if (w) addRe("special_requests", new RegExp(`\\b${w}`, "i")); }
  }
  return spans.sort((a, b) => a.s - b.s);
}
function renderEmail(text, data) {
  let html = "", last = 0;
  for (const s of findSpans(text, data)) {
    html += esc(text.slice(last, s.s)) + `<mark data-f="${s.f}">${esc(text.slice(s.s, s.e))}</mark>`;
    last = s.e;
  }
  $("emailText").innerHTML = html + esc(text.slice(last));
}

async function typeInto(pre, text, alive) {
  if (reduced) { pre.textContent = text; return; }
  pre.classList.add("caret");
  const step = Math.max(1, Math.ceil(text.length / 70));
  for (let i = 0; i <= text.length; i += step) {
    if (!alive()) return;
    pre.textContent = text.slice(0, i);
    pre.scrollTop = pre.scrollHeight;
    await sleep(18);
  }
  pre.textContent = text;
  pre.classList.remove("caret");
}

/* ---------------- demo: the animated run ---------------- */
async function animate(t) {
  const my = ++runId, alive = () => my === runId;
  reset();
  showInput(false);
  const n = t.attempt_trace.length, simulated = i => t.simulate === "fallback" || (t.simulate === "retry" && i === 0);

  // 1. scan the email
  setStep(1, "active"); panel("p1", "active", "scanning...");
  renderEmail(t.email, t.data);
  const scan = $("emailBox").querySelector(".scanline");
  scan.classList.remove("run"); void scan.offsetWidth; scan.classList.add("run");
  const box = $("emailText"), marks = [...box.querySelectorAll("mark")];
  marks.forEach(m => setTimeout(() => alive() && m.classList.add("lit"), reduced ? 0 : 1300 * m.offsetTop / Math.max(1, box.offsetHeight)));
  await sleep(1500); if (!alive()) return;
  setStep(1, "ok"); panel("p1", "ok", marks.length ? `${marks.length} values found` : "no booking details");

  // 2-5. one pass per model attempt
  for (let i = 0; i < n; i++) {
    const a = t.attempt_trace[i], last = i === n - 1;
    $("loopback").classList.remove("on");

    // 2. LLM output (typed)
    setStep(2, "active"); panel("p2", "active", `attempt ${a.n}`);
    $("llmOut").querySelectorAll(".attempt-tag, pre.raw").forEach(e => e.classList.add("old"));
    const tag = document.createElement("div");
    tag.className = "attempt-tag fade-in";
    tag.innerHTML = `Attempt ${a.n}<span class="t">${simulated(i) ? "simulated broken answer" : `Qwen2.5-0.5B · ${a.seconds} s`}</span>`;
    const pre = document.createElement("pre"); pre.className = "raw";
    $("llmOut").append(tag, pre);
    await typeInto(pre, a.raw, alive); if (!alive()) return;
    setStep(2, "ok"); panel("p2", "ok", `attempt ${a.n}`);
    await sleep(350);

    // 3. parse & repair
    setStep(3, "active"); panel("p3", "active", "parsing...");
    const po = $("parseOut");
    po.innerHTML = `<div class="attempt-tag">Attempt ${a.n}</div><div class="repairs" id="repairs"></div>`;
    for (const r of a.repairs) { $("repairs").insertAdjacentHTML("beforeend", `<span class="tag fix fade-in">🔧 ${esc(r)}</span>`); await sleep(260); }
    if (!alive()) return;
    if (a.parse_error) {
      $("repairs").insertAdjacentHTML("beforeend", `<span class="tag bad fade-in">✗ ${esc(a.parse_error)}</span>`);
      setStep(3, "fail"); panel("p3", "fail", "no JSON");
    } else {
      const keys = Object.keys(a.parsed).length;
      $("repairs").insertAdjacentHTML("beforeend", `<span class="tag ok fade-in">✓ ${a.repairs.length ? "Repaired - " : "Clean JSON - "}parsed ${keys} key${keys > 1 ? "s" : ""}</span>`);
      po.insertAdjacentHTML("beforeend", `<pre class="raw fade-in">${hlJson(a.parsed)}</pre>`);
      setStep(3, a.repairs.length ? "ok" : "ok"); panel("p3", a.repairs.length ? "warn" : "ok", a.repairs.length ? `${a.repairs.length} repairs` : "clean");
      if (a.repairs.length) markSub(2);
    }
    await sleep(500); if (!alive()) return;

    // 4. validate
    setStep(4, "active"); panel("p4", "active", "checking...");
    const vo = $("validateOut");
    let passed = false;
    if (a.parse_error) {
      vo.innerHTML = `<div class="reject-box fade-in"><span class="stamp fail">NO JSON</span><p class="muted">Nothing to validate - the model must try again.</p></div>`;
    } else if (a.rejected) {
      vo.innerHTML = `<div class="reject-box"><span class="stamp fail">REJECTED</span><p>${esc(a.errors[0])}</p></div>`;
    } else {
      vo.innerHTML = "";
      for (const f of FIELDS) {
        const r = a.fields[f], val = f in a.parsed ? fmt(a.parsed[f]) : "(missing → default)";
        vo.insertAdjacentHTML("beforeend", `<div class="vrow fade-in"><span class="k">${LABELS[f]}</span><span class="val">${esc(val)}</span>
          <span class="stamp ${r.ok ? "pass" : "fail"}">${r.ok ? "PASS" : "FAIL"}</span>${r.ok ? "" : `<span class="msg">${esc(r.msg)}</span>`}</div>`);
        await sleep(140); if (!alive()) return;
      }
      passed = !a.errors.length;
    }
    markReq(2);
    setStep(4, passed ? "ok" : "fail");
    panel("p4", passed ? "ok" : "fail", passed ? "all fields pass" : a.rejected ? "not a booking" : `${a.errors.length} error${a.errors.length > 1 ? "s" : ""}`);
    await sleep(500); if (!alive()) return;

    // 5. conveyor: this attempt's crate (+ loop back or fallback)
    setStep(5, "active"); panel("p5", "active");
    $("conveyor").classList.add("moving");
    $("attemptCount").textContent = `${a.n} / 3`;
    const first = a.errors[0] || "";
    $("crates").insertAdjacentHTML("beforeend", `<div class="crate ${passed ? "ok" : "fail"}">Attempt ${a.n} ${passed ? "✓" : "✗"}<small>${passed ? "valid" : esc(a.rejected ? "rejected" : first.length > 34 ? first.slice(0, 32) + "…" : first)}</small></div>`);
    await sleep(700); if (!alive()) return;
    if (!last) {
      $("crates").insertAdjacentHTML("beforeend", `<span class="crate-arrow">↩ errors sent back →</span>`);
      $("loopback").classList.add("on");
      const note = $("loopNote");
      note.className = "loop-note";
      note.innerHTML = `<b>Sent back to the model:</b><div class="feedback fade-in">${esc(a.feedback)}</div>`;
      panel("p5", "warn", "retrying");
      await sleep(1600); if (!alive()) return;
      ["p2", "p3", "p4"].forEach(p => panel(p, null));
      [2, 3, 4].forEach(s => setStep(s, ""));
    }
  }

  // fallback crate
  if (t.fallback) {
    $("crates").insertAdjacentHTML("beforeend", `<span class="crate-arrow">→ rules</span>`);
    await sleep(400);
    $("crates").insertAdjacentHTML("beforeend", `<div class="crate ${t.data ? "rules" : "fail"}">Rule-based fallback ${t.data ? "⚙" : "✗"}<small>${t.data ? "regex: dates, email, guests, room" : "found nothing booking-like"}</small></div>`);
    await sleep(600); if (!alive()) return;
  }
  $("conveyor").classList.remove("moving");
  const note = $("loopNote");
  note.className = "loop-note";
  note.innerHTML = t.status === "ok" ? "✓ Passed on attempt 1, so no retry was needed."
    : t.status === "ok_after_retry" ? `✓ Fixed on attempt ${t.attempts} after the errors were sent back.`
    : t.status === "fallback" ? `⚙ All ${t.attempts} model attempts failed, so the rule-based extractor filled the record.`
    : t.attempt_trace[0].rejected ? "✗ Not a booking. Retrying would not help, so there is no retry and no fallback."
    : "✗ The model and the rules both failed.";
  setStep(5, t.status === "failed" ? "fail" : "ok");
  panel("p5", t.status === "ok" ? "ok" : t.status === "failed" ? "fail" : "warn", t.status.replace(/_/g, " "));
  if (t.attempts > 1 || t.fallback) markReq(4);
  await sleep(500); if (!alive()) return;

  // 6. booking card: fields fly from the email into the form
  setStep(6, "active"); panel("p6", "active", "filling...");
  if (!reduced) { $("p6").scrollIntoView({ behavior: "smooth", block: "center" }); await sleep(650); }
  if (!alive()) return;
  if (!t.data) {
    $("bookingStamp").classList.remove("hidden");
  } else {
    for (const f of FIELDS) {
      const slot = document.querySelector(`[data-slot="${f}"]`), v = t.data[f];
      const fill = () => {
        slot.textContent = v === null ? "null - not in email" : fmt(v);
        slot.className = "v fade-in " + (v === null || (Array.isArray(v) && !v.length) ? "null" : "filled") + (t.fallback ? " rules" : "");
      };
      const mark = box.querySelector(`mark[data-f="${f}"]`);
      if (mark && !reduced) { flyChip(mark, slot, fill, alive); await sleep(170); }
      else { fill(); await sleep(90); }
      if (!alive()) return;
    }
    box.querySelectorAll("mark").forEach(m => m.classList.add("sent"));
    await sleep(900);
  }
  if (!alive()) return;
  $("bookingStatus").textContent = t.status.replace(/_/g, " ");
  $("bookingStatus").className = "booking-status " + t.status;
  setStep(6, t.data ? "ok" : "fail");
  panel("p6", t.data ? "ok" : "fail", t.data ? `${t.attempts} attempt${t.attempts > 1 ? "s" : ""}` : "rejected");
  $("flowFill").style.width = "100%";

  // schema -> JSON produced
  $("finalJson").innerHTML = t.data ? hlJson(t.data) : '<span class="tk-null">null</span>  <span class="tk-com"># rejected - no booking produced</span>';
  panel("p7", t.data ? "ok" : "fail", t.data ? "valid Booking" : "null");

  // requirement ticks
  if (t.data) { markReq(0); markReq(1); }
  if (t.data && FIELDS.some(f => t.data[f] === null)) markSub(0);
  if (t.attempt_trace.some(a => a.rejected)) markSub(1);
  renderTech(t);
}

function flyChip(mark, slot, done, alive) {
  const m = mark.getBoundingClientRect(), s = slot.getBoundingClientRect();
  const chip = document.createElement("span");
  chip.className = "fly";
  chip.textContent = mark.textContent;
  chip.style.left = m.left + "px"; chip.style.top = m.top + "px";
  document.body.appendChild(chip);
  mark.classList.add("sent");
  requestAnimationFrame(() => requestAnimationFrame(() => {
    chip.style.transform = `translate(${s.left + 8 - m.left}px, ${s.top + 4 - m.top}px)`;
  }));
  setTimeout(() => chip.classList.add("landed"), 700);
  setTimeout(() => { chip.remove(); if (alive()) done(); }, 950);
}

function renderTech(t) {
  let h = `<h4>System prompt</h4><pre class="raw">${esc(t.prompt)}</pre>`;
  for (const a of t.attempt_trace) {
    h += `<h4>Attempt ${a.n} - raw model output</h4><pre class="raw">${esc(a.raw)}</pre>`;
    if (a.feedback) h += `<h4>Feedback sent back after attempt ${a.n}</h4><pre class="raw">${esc(a.feedback)}</pre>`;
  }
  if (t.fallback) h += `<h4>Rule-based extractor output</h4><pre class="raw">${hlJson(t.fallback.rules)}</pre>`;
  h += `<h4>Final result (status: ${t.status}, attempts: ${t.attempts})</h4><pre class="raw">${hlJson({ data: t.data, errors: t.errors })}</pre>`;
  $("techBody").innerHTML = h;
}

/* ---------------- live mode (only when app.py is running) ---------------- */
async function initLive() {
  if (!location.protocol.startsWith("http")) return;
  try {
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 2000);
    const r = await fetch("api/health", { cache: "no-store", signal: ctl.signal });
    if (!r.ok || !(await r.json()).ok) return;
  } catch { return; }
  $("liveRow").classList.remove("hidden");
  $("liveToggle").onchange = () => {
    const on = $("liveToggle").checked;
    $("liveRun").classList.toggle("hidden", !on);
    showInput(on);
    if (on) $("emailInput").value = current ? current.email : D.examples[0].email;
  };
  $("emailBox").onclick = () => { if ($("liveToggle").checked && $("emailInput").classList.contains("hidden")) { showInput(true); $("emailInput").focus(); } };
  $("liveRun").onclick = runLive;
}
async function runLive() {
  const email = $("emailInput").value.trim();
  if (!email) return;
  const btn = $("liveRun"), w = $("working");
  btn.disabled = true; $("examples").classList.add("busy");
  w.classList.remove("hidden"); w.style.color = ""; w.innerHTML = '<span class="spinner"></span>Working... (CPU model, ~10-30 s per attempt)';
  runId++; reset();
  try {
    const res = await fetch("api/run", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, simulate: current ? current.simulate : null }) });
    const t = await res.json();
    if (!res.ok) throw new Error(t.error || res.statusText);
    w.classList.add("hidden");
    animate(t);
  } catch (e) {
    w.style.color = "var(--red)"; w.textContent = "Live run failed: " + e.message;
  }
  btn.disabled = false; $("examples").classList.remove("busy");
}

/* ---------------- results ---------------- */
let resultsStarted = false;
function countUp(el, to, dec = 0) {
  if (reduced) { el.textContent = to.toFixed(dec); return; }
  const t0 = performance.now();
  const tick = now => {
    const p = Math.min(1, (now - t0) / 1200), e = 1 - Math.pow(1 - p, 3);
    el.textContent = (to * e).toFixed(dec);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function startResults() {
  if (resultsStarted) return;
  resultsStarted = true;
  markReq(5);
  const rows = D.results.table, by = s => rows.filter(r => r.status === s).length;
  const calls = rows.reduce((a, r) => a + r.attempts, 0);
  const tiles = [[rows.length, "test emails", ""], [by("ok"), "valid on the 1st try", "ok"], [by("ok_after_retry"), "valid after a retry", "warn"],
    [by("fallback"), "needed the fallback", "warn"], [by("failed"), "rejected (spam)", "bad"], [calls, `model calls for ${rows.length} emails`, ""]];
  $("stats").innerHTML = tiles.map(([, l, c]) => `<div class="stat ${c}"><b>0</b><span>${l}</span></div>`).join("");
  $("stats").querySelectorAll("b").forEach((b, i) => countUp(b, tiles[i][0]));

  $("resultTable").innerHTML = `<tr><th>email</th><th>status</th><th>attempts</th><th>guest</th><th>check-in</th><th>check-out</th><th>guests</th><th>room</th></tr>` +
    rows.map(r => `<tr><td class="mono">${esc(r.email)}</td><td><span class="pill ${r.status}">${r.status}</span></td><td>${r.attempts}</td>
      <td>${esc(fmt(r.guest_name))}</td><td class="mono">${esc(fmt(r.check_in))}</td><td class="mono">${esc(fmt(r.check_out))}</td>
      <td>${esc(fmt(r.num_guests))}</td><td>${esc(fmt(r.room_type))}</td></tr>`).join("");
  $("parserTable").innerHTML = `<tr><th>broken output</th><th>outcome</th><th>what happened</th></tr>` +
    D.results.parser_demo.map(p => `<tr><td>${esc(p.case)}</td>
      <td><span class="pill ${p.valid ? "ok" : "failed"}">${p.valid ? "repaired" : "caught → retry"}</span></td>
      <td>${esc((p.valid ? p.repairs : p.errors).join(" · ") || "-")}</td></tr>`).join("");

  if (!window.Chart) return;   // offline: tables still work
  Chart.defaults.color = "#8C94A6";
  Chart.defaults.font.family = "Inter, system-ui, sans-serif";
  Chart.defaults.borderColor = "rgba(255,255,255,.07)";
  const anim = reduced ? false : { duration: 1400, easing: "easeOutQuart" };
  new Chart($("chartStatus"), {
    type: "bar",
    data: { labels: ["first try", "after retry", "fallback", "failed / rejected"],
      datasets: [{ data: [by("ok"), by("ok_after_retry"), by("fallback"), by("failed")], borderRadius: 8,
        backgroundColor: ["#10B981", "#F59E0B", "rgba(245,158,11,.35)", "#EF4444"] }] },
    options: { animation: anim, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
  });
  const colour = { ok: "#10B981", ok_after_retry: "#F59E0B", fallback: "rgba(245,158,11,.35)", failed: "#EF4444" };
  new Chart($("chartAttempts"), {
    type: "bar",
    data: { labels: rows.map(r => r.email), datasets: [{ data: rows.map(r => r.attempts), borderRadius: 6, backgroundColor: rows.map(r => colour[r.status]) }] },
    options: { indexAxis: "y", animation: anim, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, max: 3, ticks: { stepSize: 1 } } } },
  });
}

/* ---------------- how it works: code snippets ---------------- */
function initCode() {
  const snippets = [["parse_json", "parse + repair"], ["extract", "retry loop"], ["fallback", "rule-based fallback"]];
  $("codeGrid").innerHTML = snippets.map(([fn, what], i) =>
    `<div class="${i === 1 ? "panel wide" : "panel"}"${i === 1 ? ' style="grid-column:1/-1"' : ""}><div class="file-tag">extractor.py · ${fn}() - ${what}</div><pre class="code">${hlPy(D.code[fn].trim())}</pre></div>`).join("");
}

initHero(); initReqs(); initDemo(); initCode(); initLive();
