/* Educational curriculum layer for Mission 3.5 — teach-before-test helpers.
   Additive: stages call these; existing interactions stay the engine. */

const SIM_BADGE = `<span class="sim-badge" title="This demo runs in the browser. It is not executing real Python or calling a live AI API.">Simulated</span>`;

function simLabel(text) {
  return `<span class="sim-row">${SIM_BADGE}<span class="mini">${esc(text || "Browser demo — not a live API call")}</span></span>`;
}

/* ---------- Discovery teach copy ---------- */
const DISC_TEACH = {
  title: "Streaming Responses — what you’ll learn",
  lead: "This mission is about <b>Streaming Responses</b>: how a support assistant can send a reply <b>while it is still being written</b>, and how your app knows when that reply is truly finished.",
  what: "Streaming means the server sends small pieces of text (chunks) as soon as each piece is ready. Non-streaming waits until the whole reply is done, then sends everything at once.",
  why: "People feel the product is faster because the first words appear almost immediately — not because the model is smarter. Same words; earlier first paint. That is perceived speed.",
  how: "Your app opens a stream (often over Server-Sent Events / an SDK iterator), reads each event, extracts new words, shows them, stores them in order, and only marks the reply complete when a <b>finish signal</b> arrives. Then it closes the stream cleanly.",
  real: "Like a chat that types word by word, or live match commentary — not waiting for tomorrow’s full match report.",
  tech: `stream = client.chat.completions.create(
    model=MODEL, messages=msgs, stream=True
)
for chunk in stream:
    piece = chunk["choices"][0]["delta"].get("content")
    if piece:
        print(piece, end="", flush=True)
# when the loop ends: decide status, then close/cleanup`,
  terms: [
    ["Streaming Responses", "The topic of this mission: send/show a reply in pieces, then assemble and finish honestly."],
    ["Chunk", "One small piece of the reply on the wire (often a word or part of a word)."],
    ["Token", "What the model counts for length and cost. Related to chunks, but not the same thing."],
    ["SSE", "Server-Sent Events: a common wire format (data: … lines) for streaming from server to browser."],
    ["Delta", "The “new bit” in a chunk — usually under delta.content."],
    ["Finish signal", "finish_reason (stop, length, or missing/None) saying why the reply ended. Quiet is not done."],
    ["Interruption", "The connection stops mid-reply. Text may exist, but no finish signal — treat as unfinished."],
  ],
  sections: [
    ["1 · Intro", "What streaming is, vs non-streaming, and why chat UIs use it for perceived speed."],
    ["2 · Chunks & SSE", "How the server sends events, event structure, content per chunk, tokens vs chunks."],
    ["3 · Rendering", "Show words as they arrive; skip empty pieces; keep order."],
    ["4 · Completion", "finish_reason stop / length / None; interrupted streams; connection errors."],
    ["5 · Assembly", "Collect, append, join; compare assembled string vs what’s on screen."],
    ["6 · Python", "Iterate events, extract, print live, build a consumer, handle errors, close the stream."],
    ["7 · Apply", "A simple streaming assistant, interrupted replies, streaming vs non-streaming."],
  ],
};

const DISC_CHECK = {
  q: "A customer sees half a sentence. The dashboard shows Delivered ✓. What is actually wrong?",
  ops: [
    "The Wi-Fi was slow, so we should wait longer.",
    "Text stopped and no finish signal arrived — the green tick is a lie.",
    "Streaming always means the reply is complete.",
  ],
  correct: 1,
  ok: "Right. A reply is finished only when the finish signal says so — not when the text goes quiet.",
  bad: "Not quite. Quiet text is not a finish signal. The dashboard should not say Delivered without one.",
};

/* ---------- Explore: teach-before-interact per beat ---------- */
const XTEACH = {
  open: {
    title: "Lab · stream=True (open the stream)",
    what: "<b>What:</b> <code class=\"inline\">stream=True</code> tells the API to send the reply as a sequence of events instead of one final JSON object.",
    why: "<b>Why:</b> Non-streaming waits for the whole reply (spinner). Streaming lets the first words appear in ~0.2s — perceived speed, same model.",
    test: "<b>How you’ll try it:</b> Flip the control to stream=True and watch pieces leave the server one by one.",
  },
  sse: {
    title: "Lab · Server-Sent Events (SSE) & event structure",
    what: "<b>What:</b> On the wire, many chat UIs use SSE: lines like <code class=\"inline\">data: {…}</code>, blank separators, optional <code class=\"inline\">: keep-alive</code>, and <code class=\"inline\">data: [DONE]</code> when the HTTP stream ends. Your Python SDK usually parses those into chunk objects for you.",
    why: "<b>Why:</b> Knowing the event shape stops you from confusing a keep-alive, a role-only delta, a content delta, and the final DONE.",
    test: "<b>How:</b> Read the sample SSE transcript, then answer which line means the HTTP stream is over.",
  },
  chunks: {
    title: "Lab · Chunks, tokens, and delta.content",
    what: "<b>What:</b> A <b>chunk</b> is one parsed event. New text usually lives in <code class=\"inline\">choices[0].delta.content</code>. A <b>token</b> is what the model bills/counts — one chunk may hold one or more tokens (or none).",
    why: "<b>Why:</b> You append only the new words. Replacing the whole message with each chunk would scramble order.",
    test: "<b>How:</b> Compare stream=False (one big reply) vs stream=True (many small chunks).",
  },
  blank: {
    title: "Lab · Why the screen can look frozen (buffering)",
    what: "<b>What:</b> Printed text can sit in an output buffer before the UI shows it — even after chunks already arrived.",
    why: "<b>Why:</b> Students think “streaming is broken” when the real issue is buffering, not the API.",
    test: "<b>How:</b> Open the buffer visual and see words held back from the phone.",
  },
  endline: {
    title: "Lab · end=\"\" (stay on one line)",
    what: "<b>What:</b> <code class=\"inline\">print(..., end=\"\")</code> means “don’t add a newline after this piece.” Default <code class=\"inline\">end=\"\\n\"</code> puts every chunk on its own line.",
    why: "<b>Why:</b> A chat reply is one sentence on one line. Newlines would make “Your\\norder\\nis…” look broken.",
    test: "<b>How:</b> You’ll set end to \"\" in the next lab before turning flush on.",
  },
  flush: {
    title: "Lab · flush=True (push now)",
    what: "<b>What:</b> <code class=\"inline\">flush=True</code> forces each piece out of the buffer to the screen immediately.",
    why: "<b>Why:</b> Without flush, a terminal (and some UIs) wait — customers see nothing, then a dump. That recreates the Discovery “spinner then dump” feel.",
    test: "<b>How:</b> Set end=\"\" and flush=True, then answer what students see without flush.",
  },
  r1: {
    title: "Concept check · Live one-line reply",
    what: "<b>What you need:</b> (1) open with stream=True, (2) stay on one line with end=\"\", (3) push each piece with flush=True.",
    why: "<b>Why:</b> Streaming without flush still looks frozen. Flush without end=\"\" breaks the line into many lines.",
    test: "<b>Check:</b> Confirm the three ideas (order matters), then continue — this is understanding, not busywork.",
  },
  basket: {
    title: "Lab · parts.append (collect while you show)",
    what: "<b>What:</b> As each content piece appears, also <code class=\"inline\">parts.append(piece)</code> so you keep a list in arrival order.",
    why: "<b>Why:</b> The screen needs live text; chat history needs the full string later. Do both in the same pass — a stream can be read only once.",
    test: "<b>How:</b> Attach the collector so every content piece is kept.",
  },
  join: {
    title: "Lab · \"\".join(parts) (assemble vs display)",
    what: "<b>What:</b> <code class=\"inline\">text = \"\".join(parts)</code> glues the list into one string. The phone may already show the same words live; <code class=\"inline\">text</code> is the assembled copy for history/API.",
    why: "<b>Why:</b> Chunks already include their spaces. Joining with <code class=\"inline\">\" \"</code> doubles spaces. Displayed live text and assembled <code class=\"inline\">text</code> should match when you join correctly.",
    test: "<b>How:</b> Place chunks in order, join with \"\", compare the assembled string to the on-screen line.",
  },
  cut: {
    title: "Lab · Interrupted stream (no finish signal)",
    what: "<b>What:</b> Chunks stop and no finish_reason arrives — the connection was cut. Text may exist on screen.",
    why: "<b>Why:</b> If the status board still shows Delivered ✓, customers get the All-good lie from Discovery.",
    test: "<b>How:</b> Flag the fake Delivered tick. Quiet is not done.",
  },
  finish: {
    title: "Lab · finish_reason (stop · length · None)",
    what: "<b>What:</b> <code class=\"inline\">finish_reason</code> explains why the model stopped sending content:<br>• <b>stop</b> — natural end of the reply → status <b>complete</b><br>• <b>length</b> — hit the token limit → status <b>truncated</b><br>• <b>None / missing</b> — never finished (quiet or cut) → status <b>partial</b><br>Connection errors are separate: catch them and use status <b>error</b>.",
    why: "<b>Why:</b> Having text is not finishing. Honest labels come from this signal (and errors), after the loop.",
    test: "<b>How:</b> Try each finish_reason and watch the honest status change, then answer the quiet-stream check.",
  },
  jam: {
    title: "Lab · Empty / non-content chunks",
    what: "<b>What:</b> Some events have no customer-facing words — role-only deltas, empty content, or usage-only chunks (<code class=\"inline\">choices: []</code>).",
    why: "<b>Why:</b> Blindly reading <code class=\"inline\">choices[0]</code> or printing <code class=\"inline\">None</code> crashes or paints “None” on screen.",
    test: "<b>How:</b> Inspect a usage-only event with an empty choices list.",
  },
  guard: {
    title: "Lab · Guards (skip safely, keep order)",
    what: "<b>What:</b> Gate 1: if there are no choices, store usage and continue. Gate 2: only print/append when <code class=\"inline\">piece</code> is real text. Skipping empties does not reorder later words.",
    why: "<b>Why:</b> Guards keep the stream alive, avoid crashes, preserve order, and still log usage at the end.",
    test: "<b>How:</b> Place both guards, then answer where the usage-only chunk should go.",
  },
  r2: {
    title: "Concept check · Whole consumer",
    what: "<b>What:</b> Stream → extract → live print → collect → join → finish signal → guards → close/cleanup.",
    why: "<b>Why:</b> This is most of a production consumer. Assign practices decisions; Code builds it in Python.",
    test: "<b>Check:</b> Confirm the machine, then continue to Assign.",
  },
};

function teachCard(beatId) {
  const t = XTEACH[beatId];
  if (!t) return "";
  const unlocked = !!(state.xq && state.xq.taught && state.xq.taught[beatId]);
  if (unlocked) {
    return `<div class="teach-strip done" data-testid="teach-strip"><b>${esc(t.title)}</b><span class="mini">${md(t.what)}</span></div>`;
  }
  return `<div class="teach-card" data-testid="teach-card">
    <div class="teach-kicker">${ic("bulb",16,"#B45309")} Learn first · then try</div>
    <h3>${esc(t.title)}</h3>
    <div class="teach-grid">
      <div><i>What</i><p>${md(t.what)}</p></div>
      <div><i>Why</i><p>${md(t.why)}</p></div>
      <div><i>What you’re testing</i><p>${md(t.test)}</p></div>
    </div>
    <div class="row" style="justify-content:flex-end;margin-top:10px">${btn("Got it — try it "+ic("play",14,"#fff"),"x-taught","data-testid='x-taught'")}</div>
  </div>`;
}

/* ---------- Assign scenarios A–D ---------- */
const ASSIGN_SCENARIOS = [
  {
    id: "A",
    title: "Finishes normally",
    situation: "Chat 1 streams “Your order is on the way.” The last chunk includes finish_reason: \"stop\".",
    problem: "The app must decide the final status for a healthy stream.",
    objective: "Choose the honest status and what to keep.",
    constraints: "Do not invent finish signals. Keep the assembled text.",
    expected: "Status complete. Full text kept. Usage may still arrive after.",
    task: "What should the app do?",
    ops: [
      { t: "Mark complete · keep full text", ok: true },
      { t: "Mark partial · text might change", ok: false },
      { t: "Mark “all good” without checking finish_reason (trap)", ok: false },
      { t: "Retry forever (trap — causes a retry storm)", ok: false },
    ],
    why: "finish_reason \"stop\" means the model finished its thought. That is the only honest “complete”. Retry forever would hammer the API for no reason.",
    vocab: [
      ["Mark complete", "Only when finish_reason is stop — reply finished naturally."],
      ["Mark partial", "Text exists but no finish signal — keep text, don’t green-tick."],
      ["Retry forever", "Trap: endless retries overload the service (retry storm)."],
      ["Mark all good", "Trap: fake success from “there is some text”."],
    ],
  },
  {
    id: "B",
    title: "Partial, then silence",
    situation: "Chat 2 shows “Your order is on the ” then goes quiet. No finish_reason. No error object.",
    problem: "Text exists, but the stream never said it finished.",
    objective: "Label honestly without deleting what the customer already saw.",
    constraints: "No green Delivered tick. Offer a way to continue (Regenerate).",
    expected: "Status partial. Text kept. Not complete.",
    task: "What should the app do?",
    ops: [
      { t: "Mark complete because there is text", ok: false },
      { t: "Mark partial · keep text · offer Regenerate", ok: true },
      { t: "Delete the half sentence", ok: false },
      { t: "Hide the chat until more arrives", ok: false },
    ],
    why: "Quiet ≠ done. Keep the words, mark partial, never “all good” on half a line.",
    vocab: [
      ["Mark partial · keep text", "Honest when the stream goes quiet with no finish_reason."],
      ["Mark complete because there is text", "Trap: text ≠ finished."],
      ["Delete / hide", "Trap: removes what the customer already saw."],
    ],
  },
  {
    id: "C",
    title: "Fails before any content",
    situation: "Chat 3 errors (connection drop) before a single content chunk. The customer still sees a spinner.",
    problem: "Nothing was shown yet, so a careful retry cannot duplicate text.",
    objective: "Recover without starting a retry storm.",
    constraints: "At most one retry, after a short pause. Cap retries.",
    expected: "Retry once after ~1s, or mark error if that fails.",
    task: "What should the app do?",
    ops: [
      { t: "Retry immediately in a tight loop (trap)", ok: false },
      { t: "Retry once after a short pause (safe)", ok: true },
      { t: "Mark complete with empty text (trap)", ok: false },
      { t: "Mark partial with empty text (misleading)", ok: false },
    ],
    why: "No text on screen yet → one patient retry is safe. Instant endless retries become a storm.",
    vocab: [
      ["Retry once after pause", "Safe when nothing was shown yet — one careful attempt."],
      ["Retry immediately / forever", "Trap: retry storm."],
      ["Mark complete empty", "Trap: invents success with no words."],
    ],
  },
  {
    id: "D",
    title: "Incomplete marked completed",
    situation: "An engineer wrote: status = \"complete\" if text else \"failed\". The stream died mid-sentence. The board shows Delivered ✓.",
    problem: "The rule never checked finish_reason or errors — the Discovery bug.",
    objective: "Name the mistake and choose the fix.",
    constraints: "Status is decided after the loop, from error + finish_reason.",
    expected: "Treat as partial (or error if ConnectionError). Remove the fake complete.",
    task: "What should the app do?",
    ops: [
      { t: "Keep Delivered ✓ — customers like ticks", ok: false },
      { t: "Mark partial/error from finish_reason & error · never fake complete", ok: true },
      { t: "If the text ends with a period, call it complete", ok: false },
      { t: "Clear the text so the dashboard looks clean", ok: false },
    ],
    why: "Having text is not finishing. Honest status comes from the finish signal and any error — after the loop.",
    vocab: [
      ["Mark partial/error from finish_reason & error", "Correct: decide after the loop."],
      ["Keep Delivered ✓", "Trap: fake complete."],
      ["Ends with a period → complete", "Trap: punctuation is not a protocol."],
    ],
  },
];

/* ---------- Predict: teach how the code path works BEFORE predicting ---------- */
const PRED_TEACH = [
  { title: "How flush works in code", body: "print(piece, end=\"\", flush=True) pushes each piece to the screen now. Without flush=True, many terminals buffer until a newline or the program ends — so the student sees a long pause, then the whole line." },
  { title: "How .get(\"content\") works", body: "delta.get(\"content\") returns None when the key is missing (role-only chunks). Using delta[\"content\"] raises KeyError. Always guard with if piece: before print/append." },
  { title: "How honest status works", body: "After the loop: if error → error; elif finish_reason == \"length\" → truncated; elif finish_reason == \"stop\" → complete; else → partial. Never status=\"complete\" just because text exists." },
  { title: "How single-pass assembly works", body: "A stream iterator is consumed once. Print and parts.append in the same for-loop, then text = \"\".join(parts). A second for chunk in stream: sees nothing." },
  { title: "How retry discipline works", body: "If an error happens before any content, one retry after a short pause is safe. Retrying immediately forever creates a retry storm and rate limits." },
  { title: "How finish_reason length works", body: "finish_reason \"length\" means the model hit max_tokens. Label truncated (not complete). The text is real but cut short by the budget." },
];

/* ---------- Code walkthrough (OpenAI-style consumer) ---------- */
const CODE_WALK = [
  { t: "What we’re building", d: "A Line Keeper: a Python function that reads a streamed chat reply, shows words live, keeps the full text, returns an honest status, and cleans up the stream." },
  { t: "Expected behaviour", d: "Progressive rendering, stable order, full assembly with \"\".join(parts), complete only on finish_reason \"stop\", partial/truncated/error otherwise. Displayed live text should match the assembled string." },
  { t: "Imports & client", d: "import sys (and your SDK client). Create a client once; reuse it. Keys stay in environment variables — never in source." },
  { t: "Request with streaming", d: "client.chat.completions.create(..., stream=True) returns an iterator of chunks — not one final object. Under the hood this is often SSE parsed for you." },
  { t: "Iterate chunks", d: "for chunk in stream:  # read once; do not loop over stream twice" },
  { t: "Extract content", d: "piece = choice[\"delta\"].get(\"content\")  # .get avoids KeyError on role-only chunks" },
  { t: "Skip empties", d: "if piece:  # skips None and \"\" — keeps order of real words" },
  { t: "Render + accumulate", d: "print(piece, end=\"\", flush=True); parts.append(piece)  # live UI + history in one pass" },
  { t: "Completion", d: "When choice.get(\"finish_reason\") is set, store it. After the loop: stop→complete, length→truncated, else partial." },
  { t: "Errors", d: "Wrap the loop in try/except ConnectionError. If error and no text → careful retry; if text exists → status error, keep text." },
  { t: "Close the stream", d: "When the iterator ends (or you finish early), close/cleanup so sockets and SDK resources are released — e.g. call close() if the stream object provides it, or use a context manager when the SDK supports with stream:." },
];

const CODE_SKELETON = `def consume(stream, out=sys.stdout):
    parts, finish, usage, error = [], None, None, None
    try:
        for chunk in stream:
            if not chunk.get("choices"):
                usage = chunk.get("usage")
                continue
            choice = chunk["choices"][0]
            piece = choice["delta"].get("content")
            if piece:
                print(piece, end="", flush=True, file=out)
                parts.append(piece)
            if choice.get("finish_reason"):
                finish = choice["finish_reason"]
    except ConnectionError as exc:
        error = str(exc)
    finally:
        close = getattr(stream, "close", None)
        if callable(close):
            try: close()
            except Exception: pass
    if error:            status = "error"
    elif finish == "length": status = "truncated"
    elif finish == "stop":   status = "complete"
    else:                    status = "partial"
    return {"text": "".join(parts), "finish_reason": finish,
            "usage": usage, "status": status, "error": error}`;

/* Dual Mentor + Coach panels for Code / Debug */
function mentorCoachPanel(mentorTip, coachLines, coachLevel) {
  const lvl = coachLevel != null ? coachLevel : (state.coachLevel || 0);
  const lines = (coachLines || []).map((t, i) => {
    const open = lvl > i;
    return `<div class="mc-step ${open?"open":"locked"}" data-testid="coach-step-${i}"><b>Coach ${i+1}</b><span>${open?md(t):ic("lock",12,"#9CA3AF")+" tap Hint"}</span></div>`;
  }).join("");
  return `<div class="dual-aid" data-testid="mentor-coach">
    <div class="aid mentor"><div class="aid-h">${ic("hex",14,"#7C3AED")}<b>AI Mentor</b><span class="mini">explains the idea / line</span></div><div class="aid-b">${md(mentorTip||"")}</div>
      <button type="button" class="btn g sm" data-mc="open" data-testid="open-mentor">Ask Vyapti</button></div>
    <div class="aid coach"><div class="aid-h">${ic("bulb",14,"#B45309")}<b>AI Coach</b><span class="mini">graded hints · no spoilers first</span></div>
      <div class="aid-b">${lines || "<span class=\"mini\">Hints unlock as you work.</span>"}</div>
      <button type="button" class="btn g sm" data-act="coach-hint" data-testid="coach-hint">Hint</button></div>
  </div>`;
}

const MICRO_COACH = [
  "Start with the loop: for chunk in stream: — everything else hangs off that.",
  "Guard usage-only chunks before choices[0], or you’ll crash on empty choices.",
  "Inside if piece: both print(..., flush=True) and parts.append(piece) — same pass.",
];
const DEBUG_COACH = [
  "Reproduce first: run the broken code and read the symptom.",
  "Find the line that causes the symptom — prefer a guard over a cast.",
  "Re-test after the fix. A patch that only hides the error is rejected.",
];

/* ---------- Mastery challenge + report ---------- */
const MASTERY_CHALLENGE = {
  brief: "Build a working streaming consumer checklist. No step-by-step hints until you try.",
  checks: [
    { id: "stream", q: "How do you ask for a streamed reply?", ops: ["stream=False", "stream=True", "flush=True"], correct: 1 },
    { id: "get", q: "Safe way to read new text from a chunk?", ops: ['delta["content"]', 'delta.get("content")', "chunk.text"], correct: 1 },
    { id: "accum", q: "How do you keep order and collect the reply?", ops: ["parts.append(piece) then \"\".join(parts) in one pass", "loop stream twice — once to print, once to join", "text += chunk"], correct: 0 },
    { id: "done", q: "When is status \"complete\"?", ops: ["When any text exists", 'When finish_reason == "stop"', "When the screen goes quiet"], correct: 1 },
    { id: "fail", q: "Stream dies after “Your order is on the ” with no finish_reason. Status?", ops: ["complete", "partial", "truncated"], correct: 1 },
  ],
};

function masteryReportData() {
  const predOk = (state.predResults || []).filter(Boolean).length;
  const predN = Math.max((state.predResults || []).length, 1);
  const bugs = state.bugsFixed || 0;
  const asOk = state.asScore || 0;
  const codeOk = !!(state.dd && state.dd.solved) && !!state.guidedFixed && !!state.pyReal && (state.realPass || 0) >= 5;
  const chal = state.masteryChal || {};
  const chalOk = MASTERY_CHALLENGE.checks.filter(c => chal[c.id] === c.correct).length;
  const chalN = MASTERY_CHALLENGE.checks.length;
  const masteryCode = !!state.masteryCodeOk;

  const rows = [
    {
      k: "Streaming concepts",
      v: predOk >= 4 && asOk >= 3 ? "understands" : predOk >= 2 ? "did well" : "needs improvement",
      note: `${predOk}/6 predictions · ${asOk}/4 assign scenarios`,
    },
    {
      k: "Writing a consumer",
      v: codeOk ? "understands" : state.dd && state.dd.solved ? "did well" : "needs improvement",
      note: codeOk ? "Micro + guided + real Python checks" : "Revisit Code · walkthrough and Line Keeper",
    },
    {
      k: "Debugging",
      v: bugs >= 5 ? "understands" : bugs >= 3 ? "did well" : "needs improvement",
      note: `${bugs}/5 bugs fixed with real fixes (not patches)`,
    },
    {
      k: "Independent application",
      v: masteryCode ? "understands" : chalOk >= 3 ? "did well" : "needs improvement",
      note: masteryCode ? `Mastery consumer passed · concepts ${chalOk}/${chalN}` : `Mastery code pending · concepts ${chalOk}/${chalN}`,
    },
    {
      k: "Honest status & errors",
      v: asOk >= 3 && (chal.fail === 1 || masteryCode) ? "understands" : "did well",
      note: "partial vs complete vs retry discipline",
    },
  ];
  return rows;
}

function renderMasteryReport(rows) {
  const icon = { understands: "check", "did well": "star", "needs improvement": "bulb" };
  const cls = { understands: "grn", "did well": "amb", "needs improvement": "red" };
  return `<div class="mastery-report" data-testid="mastery-report">
    <div class="hd"><div><div class="kick">Mastery report</div><h2>What you can do now</h2></div>${typeof REAL_BADGE!=="undefined"?REAL_BADGE:SIM_BADGE}</div>
    <p class="mini" style="margin:0 0 8px">Based on Assign, Predict, Code, Debug, and this challenge — soft scores for learning, not a high-stakes exam.</p>
    <div class="mr-grid">${rows.map(r => `<div class="mr-row ${cls[r.v]}">
      <b>${esc(r.k)}</b>${chip(r.v, cls[r.v])}<span class="mini">${esc(r.note)}</span>
    </div>`).join("")}</div>
  </div>`;
}
