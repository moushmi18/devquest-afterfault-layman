/* Educational curriculum layer for Mission 3.5 — teach-before-test helpers.
   Additive: stages call these; existing interactions stay the engine. */

const SIM_BADGE = `<span class="sim-badge" title="This demo runs in the browser. It is not executing real Python or calling a live AI API.">Simulated</span>`;

function simLabel(text) {
  return `<span class="sim-row">${SIM_BADGE}<span class="mini">${esc(text || "Browser demo — not a live API call")}</span></span>`;
}

/* ---------- Discovery teach copy ---------- */
const DISC_TEACH = {
  title: "What you’ll learn",
  lead: "Support bots often send a reply <b>while it is still being written</b>. That is called <b>streaming</b>. This mission teaches how that works — and how to tell when a reply is truly finished.",
  what: "Streaming means the AI sends small pieces of text (chunks) as soon as each piece is ready. Non-streaming waits until the whole reply is done, then sends everything at once.",
  why: "Customers see the first words almost immediately instead of staring at a spinner. The model is not “smarter” — the same words just start showing sooner.",
  how: "Your app opens a stream, reads each chunk, shows new words on screen, keeps them in memory, and only marks the reply complete when a <b>finish signal</b> arrives.",
  real: "Like a chat that types word by word (ChatGPT-style), or live match commentary — not waiting for tomorrow’s full match report.",
  tech: `stream = client.chat.completions.create(
    model=MODEL, messages=msgs, stream=True
)
for chunk in stream:
    piece = chunk["choices"][0]["delta"].get("content")
    if piece:
        print(piece, end="", flush=True)`,
  terms: [
    ["Streaming", "Send the reply in pieces while it is written."],
    ["Chunk", "One small piece of the reply (often a word or part of a word)."],
    ["Token", "The unit the model counts for length and cost — related to, but not the same as, a chunk on the wire."],
    ["Delta", "The “new bit” in a chunk — usually under delta.content."],
    ["Finish signal", "finish_reason (e.g. stop or length) saying why the reply ended. Quiet is not done."],
    ["Interruption", "The connection stops mid-reply. Text may exist, but no finish signal — treat as unfinished."],
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
    title: "Lab · stream=True",
    what: "This switch asks the AI service to send the reply in chunks as it is written.",
    why: "With stream=False the phone waits for the whole reply. With stream=True the first words can appear in fractions of a second.",
    test: "Flip the lever to stream=True and watch crates (chunks) leave the server.",
  },
  chunks: {
    title: "Lab · Chunks and delta",
    what: "Each incoming piece is a chunk. The new text lives in delta.content.",
    why: "Your app must read only the new words and append them — not replace the whole message with each chunk.",
    test: "Zoom in, toggle stream False/True, and see one big reply vs many small chunks.",
  },
  blank: {
    title: "Lab · Buffering",
    what: "Printed text can sit in an output buffer before it appears on screen.",
    why: "If the buffer holds everything until the end, streaming looks frozen — even though chunks already arrived.",
    test: "Find the output buffer tank and open it to see words held back from the phone.",
  },
  flush: {
    title: "Lab · end=\"\" and flush=True",
    what: "end=\"\" keeps words on one line. flush=True pushes each piece to the screen immediately.",
    why: "Without flush, the terminal (or some UIs) wait — customers see nothing, then a dump.",
    test: "Zoom behind the dials. Set end to \"\" and flush to True, then answer the check.",
  },
  r1: {
    title: "Recap · Live line",
    what: "You need three moves for a live one-line reply: open the stream, stay on one line, flush each piece.",
    why: "Order matters — streaming without flush still looks broken.",
    test: "Replay the three moves in order (optional muscle memory), then continue.",
  },
  basket: {
    title: "Lab · parts.append",
    what: "While you show each piece, also store it in a list called parts.",
    why: "The UI needs live text; chat history needs the full assembled string. Do both in the same pass.",
    test: "Drag the parts basket onto the belt end so every crate is kept.",
  },
  join: {
    title: "Lab · \"\".join(parts)",
    what: "Glue the list into one string with an empty separator.",
    why: "Chunks already include their spaces. Joining with a space doubles spaces.",
    test: "Place chunks in order, set the join separator to \"\", then answer the check.",
  },
  cut: {
    title: "Lab · Interrupted stream",
    what: "Sometimes chunks stop and no finish signal arrives — the line was cut.",
    why: "If the app still shows Delivered ✓, customers get the All-good lie from Discovery.",
    test: "Flag the fake Delivered tick. Quiet is not done.",
  },
  finish: {
    title: "Lab · finish_reason",
    what: "The finish signal says why the reply ended: stop (natural), length (hit limit), or missing (unfinished).",
    why: "Honest status: stop→complete, length→truncated, missing→partial.",
    test: "Try each finish_reason value and watch the honest status change.",
  },
  jam: {
    title: "Lab · Empty / usage chunks",
    what: "Some chunks have no words — role-only, empty content, or usage-only (choices: []).",
    why: "Blindly reading choices[0] or content crashes or prints None.",
    test: "Tap the jam to see a usage-only chunk with an empty choices list.",
  },
  guard: {
    title: "Lab · Guards",
    what: "Gate 1: skip usage-only chunks (no choices). Gate 2: only print when piece is real text.",
    why: "Guards keep the stream alive, avoid crashes, and still log usage at the end.",
    test: "Place the two correct guards, then answer where usage goes.",
  },
  r2: {
    title: "Recap · Whole machine",
    what: "Stream → live print → collect → join → finish signal → guards.",
    why: "This is ~70% of a production consumer. Assign will practice the rainy-night decisions.",
    test: "Confirm the seven moves, then continue to Assign.",
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
      { t: "Mark all good without checking finish_reason", ok: false },
      { t: "Retry forever to be safe", ok: false },
    ],
    why: "finish_reason \"stop\" means the model finished its thought. That is the only green “complete”.",
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
      { t: "Retry immediately in a tight loop", ok: false },
      { t: "Retry once after a short pause", ok: true },
      { t: "Mark complete with empty text", ok: false },
      { t: "Mark partial with empty text", ok: false },
    ],
    why: "No text on screen yet → one patient retry is safe. Instant endless retries become a storm.",
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
  },
];

/* ---------- Code walkthrough (OpenAI-style consumer) ---------- */
const CODE_WALK = [
  { t: "What we’re building", d: "A Line Keeper: a Python function that reads a streamed chat reply, shows words live, keeps the full text, and returns an honest status." },
  { t: "Expected behaviour", d: "Progressive rendering, stable order, full assembly with \"\".join(parts), complete only on finish_reason \"stop\", partial/truncated/error otherwise." },
  { t: "Imports & client", d: "import sys (and your SDK client). Create a client once; reuse it." },
  { t: "Request with streaming", d: "client.chat.completions.create(..., stream=True) returns an iterator of chunks — not one final object." },
  { t: "Iterate chunks", d: "for chunk in stream:  # read once; do not loop over stream twice" },
  { t: "Extract content", d: "piece = choice[\"delta\"].get(\"content\")  # .get avoids KeyError on role-only chunks" },
  { t: "Skip empties", d: "if piece:  # skips None and \"\"" },
  { t: "Render + accumulate", d: "print(piece, end=\"\", flush=True); parts.append(piece)" },
  { t: "Completion", d: "When choice.get(\"finish_reason\") is set, store it. After the loop, map stop→complete, length→truncated, else partial." },
  { t: "Errors", d: "Wrap the loop in try/except ConnectionError. If error and no text → careful retry policy; if text exists → status error, keep text." },
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
    if error:            status = "error"
    elif finish == "length": status = "truncated"
    elif finish == "stop":   status = "complete"
    else:                    status = "partial"
    return {"text": "".join(parts), "finish_reason": finish,
            "usage": usage, "status": status, "error": error}`;

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
