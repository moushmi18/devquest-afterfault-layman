/* Stage 5 Code, Stage 6 Debug, Stage 7 Mastery. Real Python (Pyodide) against a practice API. */
const LX_REF = `from openai import OpenAI
client = OpenAI()
stream = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Where is my order?"}],
    stream=True,
)
parts = []
finish = None
error = None
try:
    for chunk in stream:
        if not chunk.choices:
            continue
        choice = chunk.choices[0]
        piece = choice.delta.content
        if piece:
            print(piece, end="", flush=True)
            parts.append(piece)
        if choice.finish_reason:
            finish = choice.finish_reason
except Exception as err:
    error = err
finally:
    stream.close()
reply = "".join(parts)
print()
if error:
    status = "error"
elif finish == "stop":
    status = "complete"
elif finish == "length":
    status = "truncated"
else:
    status = "partial"
print("status:", status)`;
const LX_REF_NOTES = {
  1: ["Bring in the client", "Imports the OpenAI Python library's client class. (Here it's a practice version: no key, no internet.)"],
  2: ["Make a client", "Creates the object you use to talk to the API. It reads your API key from the environment in real projects."],
  3: ["Send the request", "`create(...)` sends the chat request. Because of `stream=True` it returns a **stream** you can loop over, not a finished reply."],
  4: ["Pick the model", "Which AI model should answer."], 5: ["The conversation", "A list of messages. Here, one user message."],
  6: ["Ask for a stream", "**The switch that turns streaming on.** Without it you'd wait and get one big reply."],
  8: ["A list for the pieces", "Empty list. Every piece of text will be appended here, in order."], 9: ["No finish signal yet", "Will hold `\"stop\"` or `\"length\"` when the last chunk says so."],
  10: ["No error yet", "Will hold the exception if the connection breaks."], 11: ["Start a safety net", "`try:` lets us catch a broken connection instead of crashing."],
  12: ["Loop over chunks", "Each time round, `chunk` is the next delivery from the server. The loop waits for each one as it arrives."],
  13: ["Guard 1", "The optional usage chunk has an empty `choices` list. Skip it, or `choices[0]` would crash."], 14: ["Skip it", "`continue` jumps to the next chunk."],
  15: ["The first choice", "Shortcut so we don't repeat `chunk.choices[0]`."], 16: ["The new text", "`delta.content` is the new text in this chunk, or `None`."],
  17: ["Guard 2", "Only continue if there is real text (not `None`, not `\"\"`)."],
  18: ["Show it live", "`end=\"\"` keeps one line; `flush=True` pushes it to the screen now."],
  19: ["Keep it", "Append the piece so we can assemble the full reply later."],
  20: ["Finish signal?", "Only the last chunk sets `finish_reason`."], 21: ["Remember it", "Store `\"stop\"` or `\"length\"`."],
  22: ["Connection broke", "If the network drops mid-stream, Python jumps here instead of crashing."], 23: ["Note the error", "Keep it so the status can be honest."],
  24: ["Always runs", "`finally:` runs whether the loop finished or broke."], 25: ["Hang up", "Close the stream to release the connection."],
  26: ["Assemble", "Glue the pieces into one string. Empty-string join because pieces carry their own spaces."],
  27: ["End the line", "Move the cursor to a new line after the reply."],
  28: ["Honest status", "Check the error first…"], 30: ["Complete?", "Only `\"stop\"` means finished normally."], 32: ["Cut off?", "`\"length\"` means it hit max_tokens."],
  34: ["Anything else", "No finish signal at all: the stream ended early."], 35: ["Partial", "Keep the text, but don't call it complete."], 36: ["Report it", "Print the status for the board."],
};
/* simulate the reference program on a stream, producing a line-by-line trace */
function lxTrace(events) {
  const T = []; const v = { chunk: "—", piece: "—", parts: [], finish: null, error: null, screen: "", reply: "—", status: "—" };
  const snap = (ln, note) => T.push({ ln, note, v: JSON.parse(JSON.stringify(v)) });
  snap(3, "Request sent with stream=True. A stream object comes back immediately."); snap(8, "parts = []"); snap(9, "finish = None"); snap(10, "error = None");
  for (const e of events) {
    if (e.t === "error") { snap(12, "Waiting for the next chunk… the connection drops!"); v.error = "APIConnectionError"; snap(22, "Exception caught."); snap(23, "error is set."); break; }
    v.chunk = e.label; v.piece = "—"; snap(12, `Next chunk arrives: ${e.label}`);
    if (e.t === "usage") { snap(13, "choices is empty → guard 1 is True"); snap(14, "continue: skip to the next chunk"); continue; }
    snap(13, "choices has one item → keep going"); snap(15, "choice = chunk.choices[0]");
    v.piece = e.t === "text" ? JSON.stringify(e.c) : "None"; snap(16, `piece = ${v.piece}`);
    if (e.t === "text") { snap(17, "piece has text → show and keep it"); v.screen += e.c; snap(18, "Printed live on the same line."); v.parts.push(e.c); snap(19, `parts now has ${v.parts.length} piece(s).`); }
    else snap(17, "piece is None → skip the print and append");
    if (e.t === "finish") { snap(20, `finish_reason = "${e.r}"`); v.finish = e.r; snap(21, `finish = "${e.r}"`); } else snap(20, "finish_reason is None → still going");
  }
  snap(24, "finally: always runs"); snap(25, "stream.close()");
  v.reply = JSON.stringify(v.parts.join("")); snap(26, `reply = ${v.reply}`);
  v.status = v.error ? "error" : v.finish === "stop" ? "complete" : v.finish === "length" ? "truncated" : "partial";
  snap(v.error ? 29 : v.finish === "stop" ? 31 : v.finish === "length" ? 33 : 35, `status = "${v.status}"`); snap(36, `Prints status: ${v.status}`);
  return T;
}
const LX_TRACE_STREAMS = {
  normal: [{ t: "role", label: "role only" }, { t: "text", c: "Your order ", label: '"Your order "' }, { t: "text", c: "is on the way.", label: '"is on the way."' }, { t: "finish", r: "stop", label: 'finish "stop"' }, { t: "usage", label: "usage only (choices=[])" }],
  quiet: [{ t: "role", label: "role only" }, { t: "text", c: "Your order ", label: '"Your order "' }, { t: "text", c: "is on the", label: '"is on the"' }],
  error: [{ t: "role", label: "role only" }, { t: "text", c: "Your refund ", label: '"Your refund "' }, { t: "error" }],
};

const LX_MICRO = `from openai import OpenAI
client = OpenAI()
stream = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Where is my order?"}],
    stream=___1___,
)
parts = []
finish = None
for chunk in stream:
    if not chunk.choices:
        continue
    choice = chunk.choices[0]
    piece = choice.delta.___2___
    if piece:
        print(piece, end=___3___, flush=___4___)
        parts.append(piece)
    if choice.finish_reason:
        finish = choice.finish_reason
reply = ___5___.join(parts)
print()`;
const LX_BLANKS = [
  { n: 1, ops: ["True", "False", '"yes"'], ok: "True", why: "`stream=True` asks the server to send chunks as they're written.", bad: "Only the boolean `True` turns streaming on." },
  { n: 2, ops: ["content", "text", "message"], ok: "content", why: "The new text in a chunk lives in `delta.content`.", bad: "In a streaming chunk the field is `delta.content` (not text or message)." },
  { n: 3, ops: ['""', '"\\n"', '" "'], ok: '""', why: "`end=\"\"` keeps everything on one line.", bad: "Anything other than \"\" adds extra characters after every piece." },
  { n: 4, ops: ["True", "False"], ok: "True", why: "`flush=True` pushes each piece to the screen now.", bad: "Without flush the text waits in the buffer." },
  { n: 5, ops: ['""', '" "', '"\\n"'], ok: '""', why: "Pieces carry their own spaces, so join with nothing.", bad: "Pieces already contain their spaces; this adds extra." },
];
const LX_GUIDED = `from openai import OpenAI
client = OpenAI()
stream = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Where is my order?"}],
    stream=True,
)
parts = []
finish = None
for chunk in stream:
    # 1. skip chunks that have no choices
    # 2. read the new text from the first choice
    # 3. if there is text: print it live and append it to parts
    # 4. if the choice has a finish_reason, store it in finish
    pass
reply = "".join(parts)
print()`;
const LX_INDEP = `def consume(stream):
    """Show a streamed reply live and report honestly how it ended.

    Return (text, status) where status is one of:
      "complete"  - finish_reason was "stop"
      "truncated" - finish_reason was "length"
      "partial"   - the stream ended with no finish signal
      "error"     - the connection broke (APIConnectionError); keep the text so far
    Always close the stream.
    """
    # your code here
    return "", "partial"
`;
function lxRunBox(id, a, suite, opts = {}) {
  return `<div class="lx-runrow">${lxBtn(ic("play", 13, "#fff") + " " + (opts.label || "Run checks"), "lx-run", `data-ed="${id}" data-suite="${suite}" data-testid="run-${id}" ${a.busy ? "disabled" : ""}`, a.busy ? "dis" : "p")}${lxPyBadge()}</div>
    ${a.err ? lxFb("bad", "Couldn't run.", a.err) : ""}
    <div class="lx-grid2 lx-results"><div class="lx-col"><div class="lbl">Terminal (what the user sees)</div>${lxTerm(`<span class="lx-out">${a.demo ? esc(a.demo.screen) + (a.demo.error ? `\n<span class="er">${esc(a.demo.error)}</span>` : "") : '<span class="dim">Press Run to execute your code for real.</span>'}</span>`, { id: "term-" + id, file: "my_code.py" })}</div>
    <div class="lx-col">${a.results ? lxTests(a.results) : `<div class="lx-card mini">Checks run your code against several practice streams: normal, messy, cut off, quiet${suite !== "script" ? ", and broken connections" : ""}.</div>`}</div></div>`;
}
async function lxRun(el, a, step) {
  const id = el.dataset.ed, suite = el.dataset.suite;
  let code = step.prepare ? step.prepare(a) : lxCodeOf(id);
  if (code == null) return;
  a.busy = true; a.err = null; render();
  const r = await PY.suite(suite, code);
  a.busy = false;
  if (!r.ok) { a.err = r.error; a.react = { kind: "bad", text: r.timeout ? "Your code didn't finish. Check for a loop that never ends." : "Python couldn't run. Check your connection and press Run again." }; render(); return; }
  a.results = r.data.results; a.demo = r.data.demo; a.runs = (a.runs || 0) + 1;
  const fails = a.results.filter(x => !x.pass);
  if (!fails.length) { a.passed = true; a.react = { kind: "ok", text: step.okText || "Every check passes. That's working streaming code." }; if (step.onPass) step.onPass(a); }
  else { const f = fails[0]; a.react = { kind: "bad", text: `**${f.id} failed** (${f.name}). ` + ((step.coachMap || {})[f.id] || f.why || "Read the red note under the check.") }; }
  render();
  if (a.demo && a.demo.frames && a.demo.frames.length) lxPlayFrames("term-" + id, a.demo);
}

LX_STAGES[4] = {
  goal: "Understand a complete Python stream consumer line by line, then write one yourself and prove it works with real Python.",
  sumTitle: "You wrote a working stream consumer", sumWho: "tanvi", sumSay: "Not just stream=True, flush, join and finish_reason one at a time: a whole program that uses them together and passes real checks.",
  learned: [["The full loop", "create(stream=True) → for chunk → guards → print live → append → finish_reason → join."], ["Errors", "try/except keeps the text and an honest status; finally closes the stream."], ["Testing", "Your code ran against normal, messy, cut-off, quiet and broken streams."]],
  steps: [
    { id: "c1", short: "Walkthrough", title: "A complete stream consumer, line by line", section: "6 · Practical implementation", concept: "python",
      task: "Tap any line to see what it does, then press **Step** to run the program on a real stream and watch the variables change. Run it on all three streams.",
      who: "tanvi", say: "Here's the whole thing working. Before you write anything, let's understand every line, and watch it run one step at a time.",
      mentor: "Watch `parts`, `finish` and the screen in the panel. Try the *quiet* stream: the loop ends normally, but finish stays None, so the status is partial.",
      need: "Step through all three streams to the end.",
      hints: ["Press Step repeatedly (or Run to end).", "Switch the stream with the three buttons and step again."],
      isDone: a => ["normal", "quiet", "error"].every(s => (a.seen || {})[s]),
      body(a) {
        const s = a.s || "normal", T = lxTrace(LX_TRACE_STREAMS[s]), k = Math.min(a.k || 0, T.length - 1), cur = a.k != null ? T[k] : null;
        const ln = a.ln || (cur && cur.ln) || 6, note = LX_REF_NOTES[ln];
        const v = cur ? cur.v : null;
        return `<div class="lx-grid2 lx-walk"><div class="lx-col">${lxCode(LX_REF, { title: "support_bot.py", clickable: "lx-c1-ln", marks: Object.assign({}, cur ? { [cur.ln]: "foc" } : {}, a.ln ? { [a.ln]: "good" } : {}), cls: "sm" })}</div>
          <div class="lx-col lx-sticky">
            ${note ? lxCard(`<div class="kick">Line ${ln}</div><b>${md(note[0])}</b><p>${md(note[1])}</p>`, "lx-note") : lxCard(`<p class="mini">Tap a line to explain it.</p>`)}
            <div class="lx-row lx-wrap"><span class="lbl">Stream</span>${["normal", "quiet", "error"].map(x => `<button type="button" class="lx-pill ${s === x ? "on" : ""}" data-act="lx-c1-s" data-s="${x}">${x === "normal" ? "normal" : x === "quiet" ? "goes quiet" : "connection drops"} ${(a.seen || {})[x] ? "✓" : ""}</button>`).join("")}</div>
            <div class="lx-row">${lxBtn("Step " + ic("step", 12, "#fff"), "lx-c1-step", 'data-testid="c1-step"', "p sm")}${lxBtn("Run to end", "lx-c1-end", "", "g sm")}${lxBtn("Restart", "lx-c1-reset", "", "g sm")}<span class="mini">${cur ? `step ${k + 1}/${T.length}` : ""}</span></div>
            ${cur ? `<div class="lx-trace-note">${ic("bulb", 14, "#7C3AED")} ${md(cur.note)}</div>
            <div class="lx-vars" data-testid="vars">${[["chunk", v.chunk], ["piece", v.piece], ["parts", JSON.stringify(v.parts)], ["finish", v.finish == null ? "None" : `"${v.finish}"`], ["error", v.error || "None"], ["reply", v.reply], ["status", v.status]].map(([n, x]) => `<div><span>${n}</span><code>${esc(x)}</code></div>`).join("")}</div>
            ${lxTerm(esc(v.screen) + '<span class="caret"></span>' + (k === T.length - 1 ? `\nstatus: ${v.status}` : ""))}` : ""}
          </div></div>`;
      },
      act: {
        "lx-c1-ln"(el, a) { a.ln = +el.dataset.ln; },
        "lx-c1-s"(el, a) { a.s = el.dataset.s; a.k = null; a.ln = null; },
        "lx-c1-step"(el, a) { const T = lxTrace(LX_TRACE_STREAMS[a.s || "normal"]); a.ln = null; a.k = a.k == null ? 0 : Math.min(T.length - 1, a.k + 1); if (a.k === T.length - 1) { (a.seen = a.seen || {})[a.s || "normal"] = 1; if (["normal", "quiet", "error"].every(x => a.seen[x])) lxAward("c-walk", 6, "traced all streams"); } },
        "lx-c1-end"(el, a) { const T = lxTrace(LX_TRACE_STREAMS[a.s || "normal"]); a.ln = null; a.k = T.length - 1; (a.seen = a.seen || {})[a.s || "normal"] = 1; if (["normal", "quiet", "error"].every(x => a.seen[x])) lxAward("c-walk", 6, "traced all streams"); },
        "lx-c1-reset"(el, a) { a.k = null; a.ln = null; },
      } },

    { id: "c2", short: "Micro: key parts", title: "Micro: fill in the five key parts", section: "6 · Practical implementation", concept: "python",
      task: "Fill each blank one at a time (each has a short explanation), then press **Run my code** to run it for real.",
      who: "tanvi", say: "Small first. The program is written; five key parts are missing. Each one is something you used in Explore.",
      mentor: "Every blank maps to a concept: 1 = asking for a stream, 2 = where the text is, 3 & 4 = showing it live, 5 = joining.",
      need: "Fill all five blanks correctly and run the code.",
      hints: ["Blank 1 turns streaming on. Blank 2 is the field inside delta.", "Blanks 3 and 4 are the two print switches from Explore.", "True · content · \"\" · True · \"\""],
      isDone: a => a.passed,
      prepare(a) { const f = a.f || {}; if (LX_BLANKS.some(b => f[b.n] !== b.ok)) { a.react = { kind: "bad", text: "Fill every blank correctly first; each wrong pick shows why." }; render(); return null; } let c = LX_MICRO; LX_BLANKS.forEach(b => { c = c.replace(`___${b.n}___`, b.ok); }); return c; },
      body(a) {
        const f = a.f || {};
        let src = LX_MICRO;
        const html = lxCode(src.replace(/___(\d)___/g, (m, n) => `{{${n}|${f[n] === LX_BLANKS[n - 1].ok ? "f" : (f[n] ? "w" : "")}|${f[n] || "[" + n + "]"}}}`), { title: "micro.py", cls: "sm" });
        const next = LX_BLANKS.find(b => f[b.n] !== b.ok);
        return `<div class="lx-grid2"><div class="lx-col">${html}</div><div class="lx-col">
          ${next ? lxCard(`<div class="kick">Blank ${next.n} of 5</div><div class="lx-row lx-wrap">${next.ops.map(o => `<button type="button" class="lx-pill mono ${f[next.n] === o ? "bad" : ""}" data-act="lx-c2" data-n="${next.n}" data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div>${a.fb || ""}`) : lxFb("ok", "All five filled.", "Now run it for real against the practice API.")}
          ${LX_BLANKS.filter(b => f[b.n] === b.ok).map(b => `<div class="mini">✓ <b>${b.n}</b> ${md(b.why)}</div>`).join("")}
        </div></div>${lxRunBox("c2", a, "script", { label: "Run my code" })}`;
      },
      act: {
        "lx-c2"(el, a) { const n = +el.dataset.n, o = el.dataset.o, b = LX_BLANKS[n - 1]; a.f = a.f || {}; a.f[n] = o; if (o === b.ok) { a.fb = null; a.react = { kind: "ok", text: b.why }; } else { a.fb = lxFb("bad", "Not this one.", b.bad); a.react = { kind: "bad", text: b.bad }; } },
        "lx-run"(el, a, step) { lxRun(el, a, step); return false; },
      },
      okText: "Your filled-in program streamed, skipped empty chunks, joined and recorded finish_reason. All checks pass.",
      onPass() { lxAward("c-micro", 8, "micro program runs"); } },

    { id: "c3", short: "Guided: the loop", title: "Guided: write the loop body yourself", section: "6 · Practical implementation", concept: "python",
      task: "Replace `pass` with the loop body (follow the four comments), then **Run checks**. Fix whatever fails and run again.",
      who: "tanvi", say: "Now you type the heart of it. The comments are your plan. I'll check it on a normal stream, a messy one, a cut-off one and a quiet one.",
      mentor: "Indentation matters: the four steps go inside the `for` loop (4 spaces), and the print/append go inside `if piece:` (8 spaces).",
      need: "Make all checks pass.", hintGate: a => (a.runs || 0) > 0, hintGateText: "Run your code once first. Hints open after your first attempt.",
      hints: ["Step 1: `if not chunk.choices:` then `continue` on the next line.", "Step 2–3: `choice = chunk.choices[0]`, `piece = choice.delta.content`, then `if piece:` with print(piece, end=\"\", flush=True) and parts.append(piece) inside.", "Step 4: `if choice.finish_reason:` then `finish = choice.finish_reason`."],
      coachMap: { C3: "print inside the loop with end=\"\" and flush=True.", C5: "Put parts.append(piece) inside `if piece:`.", C7: "Store choice.finish_reason when it isn't None.", C2: "Read the error line number in the terminal." },
      isDone: a => a.passed,
      body(a) { return `${lxEditor("c3", LX_GUIDED, { file: "guided.py", rows: 18 })}${lxRunBox("c3", a, "script")}`; },
      act: { "lx-run"(el, a, step) { lxRun(el, a, step); return false; } },
      onPass(a) { lxAward("c-guided", a.runs === 1 ? 14 : 10, "loop written"); } },

    { id: "c4", short: "Independent", title: "Independent: write consume(stream)", section: "6 · Errors & closing the stream", concept: "errors",
      task: "Write the whole `consume(stream)` function from the docstring. It must handle normal, cut-off, quiet and broken streams, and always close the stream.",
      who: "sana", say: "This is the version that would have saved Rohan's chat. No blanks, no comments inside: just the spec. It has to be honest in every failure case.",
      mentor: "Combine the loop you wrote with `try / except APIConnectionError / finally: stream.close()`, then turn finish into a status. `APIConnectionError` is already available.",
      need: "Make all 8 checks pass.", hintGate: a => (a.runs || 0) > 0, hintGateText: "Run it once first. Hints open after your first attempt.",
      hints: ["Start with parts = [] and finish = None, then wrap your loop from the last step in `try:`.", "`except APIConnectionError: return \"\".join(parts), \"error\"` and `finally: stream.close()`.", "After the try: return (text, \"complete\") if finish == \"stop\", (text, \"truncated\") if \"length\", else (text, \"partial\")."],
      coachMap: { F4: "No finish_reason means \"partial\", even though the loop ended normally.", F5: "Catch APIConnectionError and return what you have with \"error\".", F6: "An error before any text still returns (\"\", \"error\").", F8: "Put stream.close() in a finally: block." },
      isDone: a => a.passed,
      body(a) { return `${lxEditor("c4", LX_INDEP, { file: "consume.py", rows: 24 })}${lxRunBox("c4", a, "consume")}`; },
      act: { "lx-run"(el, a, step) { lxRun(el, a, step); return false; } },
      okText: "Honest in every case: complete, truncated, partial and error, and the stream is always closed.",
      onPass(a) { lxAward("c-indep", a.runs === 1 ? 24 : 18, "consume() works"); lxBadge("keeper"); } },
  ],
  onFinish() { lxAward("stage-4", 4, "Code complete"); },
};

/* ------------------------------ DEBUG ------------------------------ */
const LX_BUGS = [
  { title: "The reply appears all at once", stream: "normal", line: 15, from: '        print(piece, end="", flush=True)', to: '        print(piece, end="")',
    symptom: "Customers stare at a blank screen, then the whole reply pops in at once.",
    explain: { prompt: "Why does line 15 cause it?", options: [{ t: "Without flush, the text waits in the buffer until the program ends.", ok: true, why: "No new line and no flush → buffered. `flush=True` pushes each piece now." }, { t: "end=\"\" deletes the text.", ok: false, why: "end=\"\" only stops the extra new line." }, { t: "print can't print strings with spaces.", ok: false, why: "print handles spaces fine." }] } },
  { title: "Double spaces in saved replies", stream: "normal", line: 19, from: 'reply = "".join(parts)', to: 'reply = " ".join(parts)',
    symptom: "The screen looks fine, but the saved reply has double spaces: \"Your order  is on  the way.\"",
    explain: { prompt: "Why does line 19 cause it?", options: [{ t: "Pieces already carry their own spaces, so a space join adds extras.", ok: true, why: "Join with \"\" so the saved text matches the screen." }, { t: "join always adds two spaces.", ok: false, why: "join adds exactly the separator string you give it." }, { t: "The model sent double spaces.", ok: false, why: "The screen was fine, so the chunks were fine." }] } },
  { title: "Crash at the very end", stream: "normal", line: 16, from: "        parts.append(piece)", to: "    parts.append(piece)", fromAt: 16,
    symptom: "The reply shows on screen, then the program crashes with a TypeError.",
    explain: { prompt: "Why does line 16 cause it?", options: [{ t: "append runs for every chunk, so None (from role/finish chunks) lands in parts and join fails.", ok: true, why: "Move it back inside `if piece:`." }, { t: "append can't add strings to a list.", ok: false, why: "It can; the problem is the None values." }, { t: "The list is too long.", ok: false, why: "Length isn't the issue: join fails on None." }] } },
  { title: "IndexError on the last chunk", stream: "normal", line: 11, remove: ["    if not chunk.choices:", "        continue"],
    symptom: "Everything prints, then IndexError: list index out of range.",
    explain: { prompt: "Which chunk breaks it, and why?", options: [{ t: "The usage-only chunk has an empty choices list, so choices[0] doesn't exist.", ok: true, why: "Put guard 1 back: `if not chunk.choices: continue`." }, { t: "The first role-only chunk has no text.", ok: false, why: "That chunk still has one choice; its content is just None." }, { t: "finish_reason is \"stop\".", ok: false, why: "That's a normal value, not a crash." }] } },
  { title: "Half a sentence, green tick", stream: "quiet", line: 20, statusLie: true,
    symptom: "Rohan's quiet stream gets status \"complete\" on a half sentence.",
    explain: { prompt: "Why does line 20 cause it?", options: [{ t: "It sets complete without checking finish_reason, so a quiet stream looks finished.", ok: true, why: "Only finish == \"stop\" is complete; length → truncated; otherwise partial." }, { t: "The loop crashed silently.", ok: false, why: "Nothing crashed. The loop simply ran out of chunks." }, { t: "print() marks the reply complete.", ok: false, why: "print just shows text; the status line decides." }] } },
];
const LX_BUG_BASE = `from openai import OpenAI
client = OpenAI()
stream = client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": "Where is my order?"}], stream=True)
parts = []
finish = None
for chunk in stream:
    # the usage-only chunk has no choices
    # so skip it before reading choices[0]
    # (guard 1)
    #
    if not chunk.choices:
        continue
    choice = chunk.choices[0]
    piece = choice.delta.content
    if piece:
        print(piece, end="", flush=True)
        parts.append(piece)
    if choice.finish_reason:
        finish = choice.finish_reason
reply = "".join(parts)
print()
STATUS`;
function lxBugCode(b) {
  let lines = LX_BUG_BASE.split("\n");
  const status = 'status = "complete" if finish == "stop" else ("truncated" if finish == "length" else "partial")';
  lines = lines.map(l => l === "STATUS" ? (b.statusLie ? 'status = "complete"   # hotfix: loop ended, so we are done' : status) : l);
  // strip filler comment lines to keep numbers tidy
  lines = lines.filter(l => !/^    #( |$)|^    #$/.test(l) || false);
  if (b.from) { const i = lines.indexOf(b.from.trimEnd()); if (i >= 0) lines[i] = b.to; }
  if (b.remove) lines = lines.filter(l => !b.remove.includes(l));
  return lines.join("\n");
}
function lxBugLine(b) { const lines = lxBugCode(b).split("\n"); const key = b.from ? b.to : b.remove ? "    choice = chunk.choices[0]" : 'status = "complete"   # hotfix: loop ended, so we are done'; return lines.indexOf(key) + 1; }
LX_STAGES[5] = {
  goal: "Debug Ila's night-shift hotfixes like an engineer: reproduce, locate, explain, fix, re-test.",
  sumTitle: "Five bugs found, explained and fixed", sumWho: "ila", sumSay: "Okay. Maybe I'll run the checks before my next hotfix.",
  learned: [["Reproduce", "Run it first; see the symptom yourself."], ["Locate", "Use the error message and line number, or the wrong output."], ["Explain", "Say why the line is wrong before touching it."], ["Fix & re-test", "Change the cause, then run the checks again."]],
  steps: [
    { id: "g0", short: "How to debug", title: "How engineers debug: five moves", section: "Debugging process", concept: "debug",
      task: "Put the five debugging moves in the right order by tapping them.",
      who: "sana", say: "Ila shipped five 'small improvements' overnight. Before we touch any code, here's the method we'll use on every bug.",
      mentor: "You can't fix what you haven't seen. Always start by making the bug happen.",
      need: "Order the five moves.", hints: ["You can't locate a bug before you've seen it happen.", "Reproduce → Locate → Explain → Fix → Re-test."],
      isDone: a => a.win,
      body(a) {
        const M = ["Reproduce: run it and watch the symptom", "Locate: find the line from the error or wrong output", "Explain: say why that line is wrong", "Fix: change the cause", "Re-test: run the checks again"];
        const order = a.order || [], shuffled = [2, 4, 0, 3, 1];
        return `<div class="lx-order"><div class="lbl">Your order</div><ol>${order.map(i => `<li>${esc(M[i])}</li>`).join("")}${order.length < 5 ? `<li class="mini">tap the next move…</li>` : ""}</ol></div>
          <div class="lx-row lx-wrap">${shuffled.filter(i => !order.includes(i)).map(i => `<button type="button" class="lx-pill" data-act="lx-g0" data-i="${i}">${esc(M[i])}</button>`).join("")}</div>
          ${a.fb || ""}${order.length ? lxBtn("Start over", "lx-g0-reset", "", "g sm") : ""}`;
      },
      act: {
        "lx-g0"(el, a) { const i = +el.dataset.i; a.order = a.order || []; if (i === a.order.length) { a.order.push(i); a.fb = null; if (a.order.length === 5) { a.win = true; a.react = { kind: "ok", text: "That's the loop we'll use on all five bugs." }; lxAward("g-method", 4, "debug method"); } } else { a.fb = lxFb("bad", "Not next.", "Which move needs the previous one done first? You need to see a bug before you can locate it, and understand it before fixing it."); a.react = { kind: "bad", text: "Think: what do you need in hand before this move makes sense?" }; } },
        "lx-g0-reset"(el, a) { a.order = []; a.fb = null; },
      } },
    ...LX_BUGS.map((b, k) => ({
      id: "g" + (k + 1), short: `Bug ${k + 1}`, title: `Bug ${k + 1} · ${b.title}`, section: "Debug", concept: "debug",
      task: "Follow the five moves: **Run** it, **tap** the guilty line, **explain** why, **fix** it in the editor, and **re-test**.",
      who: k % 2 ? "rohan" : "ila", say: k % 2 ? `Customer report: ${b.symptom}` : `Hotfix ${k + 1}: "minor stream polish". ${b.symptom}`,
      mentor: "Move by move. The panel on the left shows where you are in the process.",
      need: "Fix the bug and pass the checks.",
      hints: ["Run it, then compare the terminal with what a correct consumer would show.", `Look at line ${lxBugLine(b)}.`, b.explain.options.find(o => o.ok).why],
      isDone: a => a.passed,
      body(a) {
        const code = lxBugCode(b), phase = a.passed ? 5 : a.explained ? 4 : a.found ? 3 : a.ran ? 2 : 1, bl = lxBugLine(b);
        const P = ["Reproduce", "Locate", "Explain", "Fix", "Re-test"];
        return `<div class="lx-phases">${P.map((p, i) => `<span class="${i + 1 < phase ? "done" : i + 1 === phase ? "cur" : ""}">${i + 1 < phase ? "✓" : i + 1} ${p}</span>`).join("")}</div>
          ${phase === 1 ? `${lxCode(code, { title: "ila_hotfix.py", cls: "sm" })}<div class="lx-row">${lxBtn(ic("play", 13, "#fff") + " Run Ila's code", "lx-g-run", `data-testid="g-run"`, "p")}${lxPyBadge()}</div>${a.err ? lxFb("bad", "Couldn't run.", a.err) : ""}` : ""}
          ${phase >= 2 && phase < 4 ? `<div class="lx-grid2"><div class="lx-col">${lxCode(code, { title: "ila_hotfix.py — tap the guilty line", cls: "sm", clickable: phase === 2 ? "lx-g-line" : null, marks: Object.assign({}, a.miss ? { [a.miss]: "bad" } : {}, a.found ? { [bl]: "foc" } : {}) })}</div>
            <div class="lx-col"><div class="lbl">What happened (${b.stream} stream)</div>${lxTerm(esc(a.demo ? a.demo.screen : "") + (a.demo && a.demo.error ? `\n<span class="er">${esc(a.demo.error)}</span>` : "") + (b.statusLie ? '\n<span class="er">status = "complete"   ← on half a sentence</span>' : "") + (k === 1 ? '\n<span class="dim">>>> reply</span>\n\'Your order  is on   the way.\'' : ""), { file: "ila_hotfix.py" })}
            ${phase === 2 ? (a.missFb || lxCard(`<p class="mini">${k === 0 ? "The terminal stayed blank while chunks arrived, then showed everything. Which line shows the text?" : "Use the error line or the wrong value to find the line."} Tap it in the code.</p>`)) : lxQ("gx-" + k, b.explain)}</div></div>` : ""}
          ${phase >= 4 ? `${lxEditor("g" + (k + 1), code, { file: "ila_hotfix.py", rows: 22 })}${lxRunBox("g" + (k + 1), a, "debug", { label: "Re-test my fix" })}` : ""}`;
      },
      act: {
        async "lx-g-run"(el, a) { a.err = null; a.busy = true; render(); const r = await PY.free(lxBugCode(b), b.stream); a.busy = false; if (!r.ok) { a.err = r.error; render(); return; } a.demo = r.data.demo; a.ran = true; a.react = { kind: "ok", text: "Symptom reproduced. Now find the line responsible." }; render(); lxPlayFrames("lx-dummy", null); return false; },
        "lx-g-line"(el, a) { const n = +el.dataset.ln, bl = lxBugLine(b); if (n === bl || (b.remove && Math.abs(n - bl) <= 1)) { a.found = true; a.miss = null; a.missFb = null; a.react = { kind: "ok", text: "That's the line. Now explain why before fixing it." }; } else { a.miss = n; a.missFb = lxFb("bad", `Line ${n} is fine.`, "Look for the line connected to the symptom: " + b.symptom); a.react = { kind: "bad", text: "Match the symptom to the job each line does." }; } },
        "lx-run"(el, a, step) { lxRun(el, a, step); return false; },
      },
      isExplained: true,
      okText: "Fixed and re-tested. Every check passes.",
      onPass(a) { lxAward("g-bug" + k, 8, `bug ${k + 1} fixed`); },
      mount(a) { if (!a.explained && lxA("gx-" + k).solved) { a.explained = true; render(); } },
    })),
  ],
  onFinish() { lxBadge("hunter"); lxAward("stage-5", 4, "Debug complete"); },
};

/* ------------------------------ MASTERY ------------------------------ */
const LX_M_EVENTS = [
  { chat: 1, ev: 'Content piece arrives: `"Arjun is "`', raw: 'delta.content = "Arjun is "', ok: "show + keep", why: "Real text: show it and keep it.", text: "Your order is with Arjun is", st: "live", bad: {} },
  { chat: 2, ev: "Usage-only chunk", raw: "choices = [] , usage = 40 tokens", ok: "log usage", why: "Feed the meter; no text.", st: "live", bad: {} },
  { chat: 3, ev: "Error before any text, second time in a row (you already retried once)", raw: "APIConnectionError · 0 words · retries used: 1", ok: "mark error", why: "You already used your one retry. Show an honest error; don't retry forever.", text: "", st: "error", bad: { "retry once after pause": "You already used the one retry.", "retry forever": "That's how a retry storm starts." } },
  { chat: 1, ev: "Stream goes quiet after \"near the gate\". No finish signal.", raw: "(no more chunks · finish_reason never set)", ok: "mark partial", why: "Keep the text, label it partial.", text: "Arjun is near the gate", st: "partial", bad: {} },
  { chat: 2, ev: 'Last chunk: `finish_reason = "length"`', raw: 'finish_reason = "length"', ok: "mark truncated", why: "Cut off by the token limit.", text: "Your table for four is booked for 8 PM and", st: "truncated", bad: {} },
];
const LX_CHAT = `def chat_turn(client, history, user_msg):
    """One turn of the Restaurant Support Assistant.

    1. Add {"role": "user", "content": user_msg} to history.
    2. Call client.chat.completions.create(model="gpt-4o-mini",
       messages=history, stream=True) and show the reply live.
    3. If APIConnectionError happens BEFORE any text: call pause(1)
       and retry ONCE. Never retry after text was shown.
    4. Status: "complete" (stop), "truncated" (length),
       "partial" (no finish signal) or "error" (connection broke).
    5. If any text arrived, append {"role": "assistant", "content": text}
       to history. Never save an empty assistant message.
    6. After the reply print a new line, and if status isn't
       "complete" print "(" + status + ")", e.g. "(truncated)".
    7. Always close every stream. Return the status.
    """
    # your code here
`;
LX_STAGES[6] = {
  goal: "Prove mastery by applying everything on your own: handle a fresh incident, build a streaming chatbot turn, and diagnose a raw stream.",
  sumTitle: "Mission complete: the line is whole again", sumWho: "rohan", sumSay: "My reply arrived whole this time. And when it didn't, the app told me honestly.",
  learned: [["Streaming", "Show replies while they're written, and know when they're really finished."], ["Your consumer", "Live printing, guards, join, finish_reason, errors, close."], ["Your chatbot", "History, streaming, one safe retry, honest status."]],
  steps: [
    lxEventStep("m1", LX_M_EVENTS, { short: "Incident", title: "Incident: the Saturday rush", section: "Mastery · scenario reasoning", task: "Handle five new events on your own. Hints open only after a first attempt.",
      who: "ila", say: "New night, new board. No coaching from me this time.", mentor: "Same three questions: text? finish signal? already shown? Plus one new one: have you already used your retry?",
      hints: ["Check the raw line for retries already used.", "Quiet = partial, length = truncated, usage = log."], gate: true, xpKey: "m-board", xpLabel: "incident handled" }),
    { id: "m2", short: "Build the chatbot", title: "Build: a streaming chatbot turn", section: "7 · Practical application", concept: "chatbot",
      task: "Write `chat_turn(client, history, user_msg)` from the spec, then **Run checks**. Nine checks cover normal, cut-off, broken and retry cases.",
      who: "tanvi", say: "This is the real Restaurant Support Assistant. Everything you've learned in one function. You can start from your consume() if you like.",
      mentor: "Reuse your loop from Code. The new parts are history, the single retry before any text, and printing an honest status after the reply.",
      need: "Make all 9 checks pass.", hintGate: a => (a.runs || 0) > 0, hintGateText: "Mastery is independent: hints open after your first run.",
      hints: ["Structure: append user msg → `for attempt in range(2):` create a stream and loop it inside try/except/finally → if it failed with no text on attempt 0, pause(1) and continue; else break.", "Track `failed`, `parts`, `finish`. Status = error if failed, else from finish.", "After: if text, append assistant message. print(); if status != \"complete\": print(\"(\" + status + \")\"). return status."],
      coachMap: { M1: "history.append the user message before calling create(messages=history, stream=True).", M5: "Errors after text: no retry, status \"error\", print \"(error)\".", M6: "Error before text: pause(1), then one retry.", M7: "Limit attempts to 2 in total.", M8: "Close each stream in finally." },
      isDone: a => a.passed,
      body(a) {
        const mine = LS_().code.c4;
        return `${lxEditor("m2", LX_CHAT, { file: "support_assistant.py", rows: 30 })}<div class="lx-row">${mine && lxA("c4").passed ? lxBtn("Insert my consume() from Code above", "lx-m2-ins", "", "g sm") : ""}</div>${lxRunBox("m2", a, "chat")}`;
      },
      act: {
        "lx-m2-ins"(el, a) { const c = LS_().code; c.m2 = c.c4.trim() + "\n\n\n" + (c.m2 || LX_CHAT); },
        "lx-run"(el, a, step) { lxRun(el, a, step); return false; },
      },
      okText: "A complete streaming chatbot turn: live, honest, safe retries, clean history.",
      onPass(a) { lxAward("m-chat", a.runs === 1 ? 40 : 32, "chatbot turn built"); } },
    { id: "m3", short: "Diagnose", title: "Diagnose a raw stream", section: "Mastery · reading the wire", concept: "event",
      task: "Read the captured stream. Type exactly what the user saw, then pick its honest status.",
      who: "sana", say: "Last one. A customer complained; this is the captured stream. Tell me exactly what they saw and how it should be labelled.",
      mentor: "Use only `content` values, in order, joined with nothing. Then look for a finish_reason.",
      need: "Type the exact text and pick the status.", hintGate: a => (a.tries || 0) > 0,
      hints: ["Skip role-only, empty and usage chunks.", "The last data line with choices has finish_reason \"length\"."],
      isDone: a => a.win,
      body(a) {
        const lines = ['data: {"choices":[{"delta":{"role":"assistant"},"finish_reason":null}]}', ": keep-alive", 'data: {"choices":[{"delta":{"content":"Your biryani "},"finish_reason":null}]}', 'data: {"choices":[{"delta":{"content":""},"finish_reason":null}]}', 'data: {"choices":[{"delta":{"content":"left the kitchen "},"finish_reason":null}]}', 'data: {"choices":[{"delta":{"content":"at 9:20 and"},"finish_reason":null}]}', 'data: {"choices":[{"delta":{},"finish_reason":"length"}]}', 'data: {"choices":[],"usage":{"total_tokens":64}}', "data: [DONE]"];
        return `<div class="lx-wire"><div class="lx-wire-b">${lines.map(l => `<div class="lx-wl"><code>${esc(l)}</code></div>`).join("")}</div></div>
          <label class="lbl" for="m3-text">What the user saw (exact text)</label><input id="m3-text" class="lx-input" data-testid="m3-text" value="${esc(a.text || "")}" autocomplete="off" spellcheck="false">
          <div class="lx-row lx-wrap"><span class="lbl">Status</span>${["complete", "truncated", "partial", "error"].map(s => `<button type="button" class="lx-pill ${a.st === s ? "on" : ""}" data-act="lx-m3-st" data-s="${s}">${s}</button>`).join("")}</div>
          <div class="lx-row">${lxBtn("Check", "lx-m3-check", 'data-testid="m3-check"', "p")}</div>${a.fb || ""}`;
      },
      act: {
        "lx-m3-st"(el, a) { a.text = (document.getElementById("m3-text") || {}).value || a.text; a.st = el.dataset.s; },
        "lx-m3-check"(el, a) {
          a.text = (document.getElementById("m3-text") || {}).value || ""; a.tries = (a.tries || 0) + 1;
          const want = "Your biryani left the kitchen at 9:20 and";
          const tOk = a.text === want, sOk = a.st === "truncated";
          if (tOk && sOk) { a.win = true; a.fb = lxFb("ok", "Exactly right.", "Content pieces joined with \"\" and `finish_reason: \"length\"` → truncated."); a.react = { kind: "ok", text: "You read the wire like an engineer." }; lxAward("m-diag", a.tries === 1 ? 12 : 8, "diagnosed the stream"); lxBadge("last"); }
          else { const w = !tOk ? (a.text.replace(/\s+/g, " ").trim() === want ? "Close: check the spaces. Each piece keeps its own spaces, joined with nothing." : `Not quite the text. Expected the content values in order, joined with "". You typed: "${a.text}".`) : "The text is right; check the finish_reason in the last chunk that has choices."; a.fb = lxFb("bad", "Not yet.", w); a.react = { kind: "bad", text: w }; }
        },
      } },
  ],
  onFinish() { lxAward("stage-6", 4, "Mastery complete"); },
};
