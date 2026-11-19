/* Stage 3 Assign (apply to live chats) and Stage 4 Predict (predict real code, then run it). */
const LX_ACTIONS = ["show + keep", "skip", "mark complete", "mark partial", "mark truncated", "mark error", "retry once after pause", "log usage", "mark all good", "retry now", "retry forever", "hide error"];
const LX_EVENTS = [
  { chat: 1, ev: 'Content piece arrives: `"is"`', raw: 'delta.content = "is"', ok: "show + keep", why: "Shown and kept. The piece goes on screen and into `parts`; the reply is still open.", text: "Your order is", st: "live",
    bad: { "mark complete": "One word isn't a finished reply. No finish signal yet.", skip: "That's real text. Skipping it loses a word." } },
  { chat: 2, ev: "Empty piece arrives: `\"\"`", raw: 'delta.content = ""', ok: "skip", why: "Nothing to show. `if piece:` skips it, and the chat stays open.", st: "live",
    bad: { "show + keep": "Keeping `\"\"` adds nothing and can break code that expects real text." } },
  { chat: 1, ev: "Usage-only chunk arrives (`choices` is empty)", raw: "choices = [] , usage = 12 + 6 tokens", ok: "log usage", why: "It carries token counts for the meter, not text. Log it; never read `choices[0]` here.", st: "live",
    bad: { "show + keep": "There's no text in it, and reading `choices[0]` would crash with IndexError.", "mark complete": "Usage isn't the finish signal. Look for `finish_reason`." } },
  { chat: 2, ev: "Stream goes quiet. No finish signal.", raw: "(no more chunks · finish_reason never set)", ok: "mark partial", why: "Honest label: the text is kept, but we don't call it complete. No green tick on half a sentence.", text: "Your order is on", st: "partial",
    bad: { "mark complete": "That's exactly Rohan's bug: quiet isn't done.", "mark all good": "A fake green tick. The customer has half a sentence.", "retry now": "Text is already on screen; a new reply would repeat it." } },
  { chat: 3, ev: "Error before any text", raw: "APIConnectionError · 0 words shown", ok: "retry once after pause", why: "One careful retry. Nothing was shown yet, so one retry can't duplicate text.", st: "wait",
    bad: { "retry now": "Instant retries from thousands of apps = a retry storm. Pause first.", "retry forever": "Retrying forever floods the server. Once is enough.", "hide error": "Hiding it leaves the customer waiting with no answer." } },
  { chat: 1, ev: 'Last chunk: `finish_reason = "stop"`', raw: 'delta = {} , finish_reason = "stop"', ok: "mark complete", why: "`\"stop\"` is the server saying the reply finished normally. Now the tick is earned.", text: "Your refund is approved.", st: "complete",
    bad: { "mark truncated": "`\"stop\"` is a normal finish. Truncated is `\"length\"`." } },
  { chat: 3, ev: 'Last chunk: `finish_reason = "length"`', raw: 'delta = {} , finish_reason = "length"', ok: "mark truncated", why: "It hit the token limit mid-thought. Show the text, label it cut off.", text: "Your new order from Spice Route includes", st: "truncated",
    bad: { "mark complete": "`\"length\"` means it ran out of room, not that it finished." } },
  { chat: 2, ev: 'Connection drops after "Your table is"', raw: "APIConnectionError · 3 words already shown", ok: "mark error", why: "Keep the text, show *connection lost*. Don't retry into the same bubble (it would repeat) and don't hide it.", text: "Your table is", st: "error",
    bad: { "retry now": "Words are already on screen; a retry would duplicate them.", "hide error": "Hiding the error is the green-tick lie again.", "retry once after pause": "The one-retry rule is only for errors *before* any text." } },
];
function lxBoard(evs, upto, cur) {
  const chats = { 1: { t: "Refund · priority", text: "Your refund ", st: "live" }, 2: { t: "Late order", text: "Your order ", st: "live" }, 3: { t: "New order", text: "", st: "wait" } };
  evs.slice(0, upto).forEach(e => { const c = chats[e.chat]; if (e.text) c.text = e.text; c.st = e.st; });
  return `<div class="lx-board">${[1, 2, 3].map(n => `<div class="lx-chatcol ${cur && cur.chat === n ? "cur" : ""}"><div class="lbl">Chat ${n} · ${chats[n].t}</div>${lxPhone(chats[n].text || null, chats[n].st, { caret: chats[n].st === "live", q: n === 1 ? "Where is my refund?" : n === 2 ? "Where is my order?" : "Can I add a drink?", spinner: !chats[n].text })}</div>`).join("")}</div>`;
}
function lxEventStep(id, evs, opts) {
  return {
    id, short: opts.short, title: opts.title, section: opts.section, concept: "errors", task: opts.task, who: opts.who, say: opts.say,
    mentor: opts.mentor, need: `Handle all ${evs.length} events.`, hints: opts.hints, hintGate: opts.gate ? (a => (a.tries || 0) > 0) : null,
    isDone: a => (a.i || 0) >= evs.length,
    body(a) {
      const i = a.i || 0, e = evs[i];
      const head = lxBoard(evs, i, e);
      if (!e) return head + lxFb("ok", "Board is honest.", `${evs.length}/${evs.length} handled${a.miss ? ` · ${a.miss} retr${a.miss > 1 ? "ies" : "y"}` : " · no mistakes"}.`);
      return `${head}<div class="lx-event" data-testid="event-${i}"><div class="lx-ev-h"><span class="chip dk">Event ${i + 1} of ${evs.length} · Chat ${e.chat}</span><b>${md(e.ev)}</b></div><code class="lx-mono lx-raw">${esc(e.raw)}</code>
        <div class="lx-qp">Your move?</div>
        <div class="lx-acts">${LX_ACTIONS.map(x => `<button type="button" class="lx-pill ${a.bad && a.bad.includes(x) ? "bad" : ""}" data-act="lx-ev" data-x="${x}">${x}</button>`).join("")}</div>
        ${a.fb ? a.fb : ""}</div>`;
    },
    act: {
      "lx-ev"(el, a) {
        const e = evs[a.i || 0]; if (!e) return; const x = el.dataset.x; a.tries = (a.tries || 0) + 1;
        if (x === e.ok) { a.fb = null; a.bad = []; a.i = (a.i || 0) + 1; a.react = { kind: "ok", text: e.why }; lxToast("✓ " + e.why.split(".")[0]);
          if (a.i >= evs.length) { lxAward(opts.xpKey, a.miss ? 14 : 20, opts.xpLabel); if (opts.onDone) opts.onDone(a); } }
        else { a.miss = (a.miss || 0) + 1; a.bad = [...(a.bad || []), x]; const w = e.bad[x] || "Check the raw line: text? finish signal? error? text already shown?"; a.fb = lxFb("bad", `"${x}" isn't right here.`, w); a.react = { kind: "bad", text: w }; }
      },
    },
  };
}
LX_STAGES[2] = {
  goal: "Run a live board: handle every event honestly.",
  sumTitle: "You ran an honest board", sumWho: "ila", sumSay: "Amber where it's amber. Customers trusted it more.",
  learned: [["Show + keep", "Real text → screen + `parts`."], ["Skip / log", "Skip empty pieces; log usage chunks."], ["Honest endings", "stop ✓ · length ✂ · quiet ◐"], ["Errors", "No text yet: retry once. Text shown: mark error."]],
  steps: [
    { id: "a0", short: "Your shift", title: "Dinner rush: you run the status board tonight", section: "Applying sections 2–4", concept: "streaming",
      task: "Check tonight's rules, then tap I'm ready.",
      who: "ila", say: "Three live chats. You call every event. I used to just make it green.",
      mentor: "No new facts here. Apply Explore.",
      need: "Press I'm ready.", hints: ["Press the I'm ready button."],
      body(a) { return `${lxTeach("Tonight's rules", [["1", "Show and keep real text, in order."], ["2", "A reply is complete only on `finish_reason=\"stop\"`."], ["3", "Errors: honest label. Retry once after a pause only if nothing was shown."]])}${lxBoard(LX_EVENTS, 0)}<div class="lx-row">${a.done ? `<span class="chip grn">Ready</span>` : lxBtn("I'm ready", "lx-a0", 'data-testid="a0-ready"', "p")}</div>`; },
      act: { "lx-a0"(el, a) { a.done = true; } } },
    lxEventStep("a1", LX_EVENTS, { short: "Incoming events", title: "Incoming Event Chat", section: "Applying sections 2–4", task: "Pick the right move for each event.",
      who: "samar", say: "One event at a time. Only one move is right.",
      mentor: "Text? Finish signal? Words already seen?",
      hints: ["Is there real text in the raw line? Then show + keep.", "No finish signal and silence = partial. `stop` = complete. `length` = truncated.", "Error before text → retry once after pause. Error after text → mark error."],
      xpKey: "a-board", xpLabel: "honest board", onDone() { lxBadge("board"); } }),
  ],
  onFinish() { lxAward("stage-2", 4, "Assign complete"); },
};

/* ------------------------------ PREDICT ------------------------------ */
const LX_BASE_LOOP = (printLine, appendLine = "        parts.append(piece)", guard = "    if piece:", joinLine = 'reply = "".join(parts)') => `parts = []
for chunk in stream:
    if not chunk.choices:
        continue
    piece = chunk.choices[0].delta.content
${guard}
${printLine}
${appendLine}
${joinLine}`;
const LX_PRED = [
  { id: "P1", title: "Ila removed flush=True", concept: "render", stream: '"Your order " · "is on " · "the way."', streamKey: "p12",
    code: LX_BASE_LOOP('        print(piece, end="")'), explain: "`end=\"\"`, but **no flush**.",
    q: "What does Rohan see in the terminal while the reply streams?", options: [
      { t: "The words appear one by one on one line.", ok: false, why: "Without a new line or a flush, the text waits in the buffer." },
      { t: "Nothing for a while, then the whole sentence at once.", ok: true, why: "No new line + no flush = buffered till the end. Looks non-streaming." },
      { t: "Each piece on its own line.", ok: false, why: "`end=\"\"` means no new lines are added." }],
    outcome: () => lxTerm('<span class="dim">… 2.4 s of nothing …</span>\nYour order is on the way.') },
  { id: "P2", title: "Ila removed end=\"\"", concept: "render", stream: '"Your order " · "is on " · "the way."', streamKey: "p12",
    code: LX_BASE_LOOP("        print(piece, flush=True)"), explain: "Default `end=\"\\n\"` is back.",
    q: "What does the terminal look like?", options: [
      { t: "Your order is on the way.  (one line)", ok: false, why: "Default `end` adds a new line after every print." },
      { t: "Three lines: \"Your order\" / \"is on\" / \"the way.\"", ok: true, why: "Each print ends with a new line, so every chunk lands on its own line." },
      { t: "Nothing until the end.", ok: false, why: "New lines (and flush) push text out immediately." }],
    outcome: () => lxTerm("Your order \nis on \nthe way.") },
  { id: "P3", title: "Ila changed the join", concept: "join", stream: '"Your" · " order" · " is" · " on" · " the" · " way."', streamKey: "p3",
    code: LX_BASE_LOOP('        print(piece, end="", flush=True)', "        parts.append(piece)", "    if piece:", 'reply = " ".join(parts)'), explain: "Last line joins with a space.",
    tail: "\nprint()\nprint(repr(reply))",
    q: "What is `reply`?", options: [
      { t: '"Your order is on the way."', ok: false, why: "That's what `\"\".join` gives. A space join adds extra spaces." },
      { t: '"Your  order  is  on  the  way."  (double spaces)', ok: true, why: "Each piece already starts with a space; `\" \".join` adds another between them." },
      { t: '"Yourorderisontheway."', ok: false, why: "The pieces carry their own spaces, so they never run together." }],
    outcome: () => lxTerm('Your order is on the way.\n<span class="dim">>>> reply</span>\n\'Your  order  is  on  the  way.\'') },
  { id: "P4", title: "Ila \"simplified\" the guard", concept: "skip", stream: 'role-only (content=None) · "Your order " · "is on the way." · finish', streamKey: "p4",
    code: LX_BASE_LOOP('        print(piece, end="", flush=True)', "    parts.append(piece)", "    if piece:"), explain: "`append` moved **outside** `if piece:`.",
    q: "What happens at the last line?", options: [
      { t: "reply is \"Your order is on the way.\"", ok: false, why: "`parts` now contains `None` values too." },
      { t: "TypeError: sequence item 0: expected str instance, NoneType found", ok: true, why: "`None` got into `parts`, and `join` only glues strings." },
      { t: "reply is \"NoneYour order is on the way.None\"", ok: false, why: "`join` doesn't convert None to text; it raises an error." }],
    outcome: () => lxTerm('Your order is on the way.<span class="er">\nTraceback (most recent call last):\n  File "support_bot.py", line 9\nTypeError: sequence item 0: expected str instance, NoneType found</span>') },
  { id: "P5", title: "The labeller meets a long reply", concept: "finish", stream: '… "near the main" · finish_reason="length"', streamKey: "length",
    code: `status = "partial"
if finish == "stop":
    status = "complete"
elif finish == "length":
    status = "truncated"
print(status)`, explain: "`finish` = last `finish_reason`. Reply hit `max_tokens`.",
    q: "What gets printed?", options: [
      { t: "complete", ok: false, why: "Only `\"stop\"` gives complete." },
      { t: "truncated", ok: true, why: "`finish == \"length\"` → truncated. The reply was cut off by the token limit." },
      { t: "partial", ok: false, why: "We did get a finish signal; it was `\"length\"`." }],
    outcome: () => lxTerm("truncated") },
  { id: "P6", title: "Ila's \"always green\" patch", concept: "finish", stream: '"Your order " · "is on " · "the" · (stream ends, no finish chunk)', streamKey: "quiet",
    code: `for chunk in stream:
    ...                  # shows and keeps text correctly
status = "complete"      # Ila: "if the loop ended, we're done"
print(status)`, explain: "Status set without checking `finish_reason`.",
    run: `parts = []
for chunk in stream:
    if not chunk.choices:
        continue
    piece = chunk.choices[0].delta.content
    if piece:
        print(piece, end="", flush=True)
        parts.append(piece)
status = "complete"      # Ila: "if the loop ended, we're done"
print()
print(status)`,
    q: "What does the board show for Rohan's chat?", options: [
      { t: "partial", ok: false, why: "That's the honest answer, but this code never checks. It always says complete." },
      { t: "complete, on half a sentence", ok: true, why: "The original bug. Loop ended ≠ finished." },
      { t: "An error", ok: false, why: "Nothing crashes. That's what makes this bug dangerous." }],
    outcome: () => lxPhone("Your order is on the", "lie", { caret: true }), phone: true },
];
function lxPredSource(p) { return (p.run || p.code) + (p.tail || ""); }
function lxPredResult(p, a) {
  if (a.fallback || !a.demo) {
    return `<div class="lx-outcome" data-testid="p-result">${a.fallback ? `<p class="mini">Python didn't load, so here's the expected result.</p>` : ""}<div class="lbl">Result</div>${p.outcome()}</div>`;
  }
  const term = lxTerm(`<span class="lx-out">${a.demo.screen ? esc(a.demo.screen) : (a.busy ? '<span class="dim">Running…</span>' : '<span class="dim">Press Run.</span>')}${a.demo.error ? `\n<span class="er">${esc(a.demo.error)}</span>` : ""}</span>`, { id: "term-p-" + p.id, file: "ila_patch.py" });
  const extra = p.phone ? lxPhone((a.demo.screen || "").split("\n")[0], "lie", { caret: true }) : "";
  return `<div class="lx-outcome" data-testid="p-result"><div class="lbl">Real Python · result</div>${term}${extra}${a.demo.reply != null ? `<pre class="mini lx-mono">reply = ${esc(JSON.stringify(a.demo.reply))}</pre>` : ""}</div>`;
}
async function lxPredRun(el, a, p) {
  a.busy = true; a.err = null; a.fallback = false; render();
  const r = await PY.free(lxPredSource(p), p.streamKey || "normal");
  a.busy = false;
  if (!r.ok) { a.err = r.error; a.fallback = true; a.ran = true; a.react = { kind: "am", text: "Python didn't run, so we showed the expected result." }; }
  else { a.demo = r.data.demo; a.ran = true; a.react = { kind: "ok", text: "That's the real output of this code." }; }
  const q = lxA("pq-" + p.id); lxAward("p-" + p.id, q.tries === 1 ? 6 : 3, q.tries === 1 ? "predicted first time" : "predicted");
  render();
  if (a.demo && (a.demo.frames || a.demo.screen)) lxPlayFrames("term-p-" + p.id, a.demo);
}
LX_STAGES[3] = {
  goal: "Predict real code, then run it.",
  sumTitle: "You can read streaming code and predict it", sumWho: "tanvi", sumSay: "You read the code, not guessed. That's debugging.",
  learned: [["flush", "No flush = all at the end."], ["end", "Default end = one chunk per line."], ["join", "Use `\"\".join`."], ["Guards", "`None` in parts → TypeError."], ["finish_reason", "Loop ended ≠ finished."]],
  steps: LX_PRED.map((p, k) => ({
    id: "p" + (k + 1), short: p.id, title: `${p.id} · ${p.title}`, section: "Predict", concept: p.concept,
    task: "Predict, then **Run it** in real Python.",
    who: k % 2 ? "tanvi" : "ila", say: k % 2 ? "Which line changed? What does it do?" : "Small improvement. What will customers see?",
    mentor: p.explain, need: "Predict, then run.",
    hints: ["Find the one line that differs from the loop you learned in Explore.", LX_CONCEPTS[p.concept].how],
    isDone: a => a.ran,
    body(a) {
      const q = lxA("pq-" + p.id);
      return `<div class="lx-grid2"><div class="lx-col">${`<div class="lx-flow"><span class="am">🔧 ${md(p.explain)}</span></div><div class="lx-flow"><span>📡 ${md(p.stream)}</span></div>`}${lxCode(p.code, { title: "ila_patch.py" })}</div>
        <div class="lx-col">${lxQ("pq-" + p.id, { prompt: p.q, one: true, options: p.options })}
        ${q.solved ? `<div class="lx-row">${lxBtn(ic("play", 13, "#fff") + (a.busy ? " Running…" : a.ran ? " Run again" : " Run it"), "lx-p-run", `data-p="${k}" data-testid="p-run" ${a.busy ? "disabled" : ""}`, a.busy ? "dis" : "p")}${lxPyBadge()}</div>` : `<p class="mini">Predict right to unlock Run.</p>`}
        ${a.err && a.fallback ? lxFb("am", "Couldn't run Python.", a.err) : ""}
        ${a.ran || a.busy ? lxPredResult(p, a) : ""}</div></div>`;
    },
    act: { "lx-p-run"(el, a) { lxPredRun(el, a, p); return false; } },
  })),
  onFinish() { lxBadge("seer"); lxAward("stage-3", 4, "Predict complete"); },
};
