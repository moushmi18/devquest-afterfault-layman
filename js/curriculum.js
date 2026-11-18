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

/* ---------- Code walkthrough (OpenAI-style consumer)
   Each Brief step has authored Mentor (≠ body), Coach self-check, tip, Ask chips.
   Mentor uses markdown **bold** and `code` (rendered via md()). */
const CODE_WALK = [
  {
    t: "What we’re building",
    d: "A Line Keeper: a Python function that reads a streamed chat reply, shows words live, keeps the full text, returns an honest status, and cleans up the stream.",
    tip: "Read what a stream consumer must do before you write a line of code.",
    mentor: "**Why this exists:** Chat UIs feel fast only if your code can show words while they arrive — and still know when the reply is truly finished.\n**In plain words:** You are building one function that does four jobs: show live, save the full string, label honestly, then close the connection.\n**Misconception:** “Streaming” is not a smarter model. Same words; earlier first paint.\n**Explore link:** Discovery’s frozen reply is what happens when that function is missing or dishonest.",
    coach: ["Self-check: which four jobs must one consumer do?", "Nudge: live show + save text + honest status + cleanup.", "Near: show → assemble → finish_reason/error → close()."],
    chips: ["What is a Line Keeper?", "Why not just wait for the full reply?", "What does honest status mean?"],
  },
  {
    t: "Expected behaviour",
    d: "Progressive rendering, stable order, full assembly with \"\".join(parts), complete only on finish_reason \"stop\", partial/truncated/error otherwise. Displayed live text should match the assembled string.",
    tip: "Picture the finished behaviour: live words, matching history string, honest labels.",
    mentor: "**Why we pin behaviour first:** Tests and bugs only make sense against a clear contract.\n**Walk-through:** Words appear in arrival order; `\"\".join(parts)` builds the same sentence for history; status is **complete** only on `finish_reason \"stop\"`, **truncated** on `\"length\"`, **partial** if quiet/cut, **error** on connection failure.\n**Misconception:** “There is some text” ≠ complete (Assign Scenario D).\n**Explore link:** join lab’s assemble-vs-display compare.",
    coach: ["Self-check: when is status complete?", "Nudge: only finish_reason \"stop\" — not quiet text.", "Near: stop→complete · length→truncated · else partial · error if ConnectionError."],
    chips: ["When is status complete?", "What is truncated?", "Why must display match assembled text?"],
  },
  {
    t: "Imports & client",
    d: "import sys (and your SDK client). Create a client once; reuse it. Keys stay in environment variables — never in source.",
    tip: "Set up the client once. Secrets stay in the environment — never in the file.",
    mentor: "**Why:** Creating a client on every message is slow and leaks keys into git if you hard-code them.\n**What the lines do:** `import sys` lets you print to a file-like object in tests; the SDK client holds auth from `os.environ`.\n**Misconception:** Putting the API key in the .py “just for class” still ends up in screenshots and repos.\n**Explore link:** same OpenAI-style shape you saw in Discovery’s sketch.",
    coach: ["Self-check: where should the API key live?", "Nudge: environment variable — not a string literal.", "Near: client = OpenAI() once; key from env."],
    chips: ["Why import sys?", "Where do API keys go?", "Create client once or every call?"],
  },
  {
    t: "Request with streaming",
    d: "client.chat.completions.create(..., stream=True) returns an iterator of chunks — not one final object. Under the hood this is often SSE parsed for you.",
    tip: "stream=True changes the return type: you get chunks one by one, not one big JSON.",
    mentor: "**Why the line exists:** Without `stream=True` you wait for the whole reply (spinner). With it, the server pushes pieces as they are ready.\n**What it returns:** An **iterator** — something you can loop with `for chunk in stream`. Each **chunk** is a small dict, e.g. `{\"choices\":[{\"delta\":{\"content\":\"Your \"},\"finish_reason\":null}]}`.\n**Misconception:** Thinking create() still returns one final message object when streaming.\n**Explore link:** SSE beat — those `data:` lines become these chunk dicts.",
    coach: ["Self-check: what does create(..., stream=True) return?", "Nudge: an iterator of chunk dicts — not one final reply object.", "Near: for chunk in stream: …  # not reply = create(...)[\"choices\"][0]"],
    chips: ["What is an iterator?", "What does a chunk look like?", "How does this relate to SSE?"],
  },
  {
    t: "Iterate chunks",
    d: "for chunk in stream:  # read once; do not loop over stream twice",
    tip: "One for-loop over the stream. A second loop sees nothing.",
    mentor: "**Why:** A stream iterator is consumed as you read it — like a live commentary feed, not a saved file.\n**What the line does:** `for chunk in stream:` pulls the next event each time. After the loop, the iterator is empty.\n**Misconception:** Looping twice — once to print, once to join — leaves history blank (Bug 3 / Predict P4).\n**Explore link:** basket lab: catch crates in the same pass they appear.",
    coach: ["Self-check: can you for-loop the stream twice?", "Nudge: no — second pass is empty.", "Near: print and append inside the same for chunk in stream."],
    chips: ["Why only one pass?", "What happens on a second loop?", "Where do print and append go?"],
  },
  {
    t: "Extract content",
    d: "piece = choice[\"delta\"].get(\"content\")  # .get avoids KeyError on role-only chunks",
    tip: "New words live under delta.content. Use .get so missing keys don’t crash.",
    mentor: "**Why:** Early chunks often set `role` only — no `content` key yet.\n**Walk-through:** `choice = chunk[\"choices\"][0]`, then `piece = choice[\"delta\"].get(\"content\")`. `.get` returns `None` instead of raising KeyError.\n**Tiny example:** role-only → `piece is None`; content chunk → `piece == \"order \"`.\n**Misconception:** `delta[\"content\"]` always works (Predict P2).\n**Explore link:** chunks/delta lab.",
    coach: ["Self-check: why .get(\"content\") not [\"content\"]?", "Nudge: role-only chunks have no content key.", "Near: piece = choice[\"delta\"].get(\"content\")"],
    chips: ["What is delta?", "When is content missing?", "Why not delta[\"content\"]?"],
  },
  {
    t: "Skip empties",
    d: "if piece:  # skips None and \"\" — keeps order of real words",
    tip: "Only print and keep real text. Skip None and empty strings.",
    mentor: "**Why:** Printing `None` paints the word “None” or crashes when you concatenate.\n**What it does:** `if piece:` is false for `None` and `\"\"`, so those events are skipped without reordering later words.\n**Misconception:** Casting with `str(piece)` “fixes” it — it only hides the bug (Debug Bug 1).\n**Explore link:** empty / usage-only chunks and guards.",
    coach: ["Self-check: what does if piece: skip?", "Nudge: None and \"\" — not real customer words.", "Near: if piece: print(...); parts.append(piece)"],
    chips: ["Why skip None?", "Does skipping reorder words?", "Guard vs str(piece)?"],
  },
  {
    t: "Render + accumulate",
    d: "print(piece, end=\"\", flush=True); parts.append(piece)  # live UI + history in one pass",
    tip: "Same pass: show the piece now and append it to parts.",
    mentor: "**Why both lines:** The screen needs live text; chat history needs the full string later.\n**Walk-through:** `end=\"\"` keeps one line (Explore endline). `flush=True` pushes now (Explore flush). `parts.append(piece)` stores order for join.\n**Misconception:** Flush only at the end — recreates the Discovery spinner-then-dump feel.\n**Explore link:** flush + basket labs.",
    coach: ["Self-check: why flush=True and parts.append together?", "Nudge: live UI + history — stream is one-pass.", "Near: print(piece, end=\"\", flush=True); parts.append(piece)"],
    chips: ["What does end=\"\" do?", "What does flush=True do?", "Why append in the same loop?"],
  },
  {
    t: "Completion",
    d: "When choice.get(\"finish_reason\") is set, store it. After the loop: stop→complete, length→truncated, else partial.",
    tip: "Store finish_reason when it appears. Decide status only after the loop ends.",
    mentor: "**Why after the loop:** You don’t know the final reason until the stream stops sending content events.\n**Meanings:** **stop** = natural end → complete; **length** = hit token budget → truncated; **None/missing** = never finished → partial.\n**Misconception:** Setting `status=\"complete\"` before the loop (All-good lie).\n**Explore link:** finish_reason lab + Assign A/B.",
    coach: ["Self-check: finish_reason \"length\" → which status?", "Nudge: truncated — not complete.", "Near: if finish==\"stop\": complete; elif finish==\"length\": truncated; else: partial"],
    chips: ["What does stop mean?", "What does length mean?", "Why decide after the loop?"],
  },
  {
    t: "Errors",
    d: "Wrap the loop in try/except ConnectionError. If error and no text → careful retry; if text exists → status error, keep text.",
    tip: "Catch connection errors. Retry once only if nothing was shown yet.",
    mentor: "**Why:** Networks drop. Your consumer must not pretend the reply finished.\n**Walk-through:** `try/except ConnectionError` stores the error. No text yet → one retry after a pause (Assign C). Text already on screen → status **error**, keep the words (don’t invent complete).\n**Misconception:** Retry forever / retry immediately (retry storm).\n**Explore link:** interrupted stream + Assign C.",
    coach: ["Self-check: error before any text — safe move?", "Nudge: retry once after a short pause.", "Near: except ConnectionError as e: error=str(e); then honest_status(error, finish)"],
    chips: ["When is a retry safe?", "What is a retry storm?", "Keep text on error?"],
  },
  {
    t: "Close the stream",
    d: "When the iterator ends (or you finish early), close/cleanup so sockets and SDK resources are released — e.g. call close() if the stream object provides it, or use a context manager when the SDK supports with stream:.",
    tip: "Always release the stream in finally — even when an error happened.",
    mentor: "**Why:** Open streams hold sockets. Leaving them open leaks connections under load.\n**What the code does:** A `finally:` block runs after success or failure. Call `stream.close()` if it exists (or use `with stream:` when the SDK supports it).\n**Misconception:** “The for-loop ended, so we’re done” — the socket may still be open.\n**Explore link:** DONE ends the HTTP SSE stream; your code should mirror that cleanup.",
    coach: ["Self-check: where should close() live?", "Nudge: in finally — runs on success and on error.", "Near: finally: close = getattr(stream,\"close\",None); …"],
    chips: ["Why close the stream?", "Why use finally?", "What if close() is missing?"],
  },
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

/* Dual Mentor + Coach — Brief/Micro (inline under content) */
function mentorCoachPanel(mentorTip, coachLines, coachLevel, chips) {
  const lvl = coachLevel != null ? coachLevel : (state.coachLevel || 0);
  const lines = (coachLines || []).map((t, i) => {
    const open = lvl > i;
    const label = i === 0 ? "Self-check / Nudge" : i === 1 ? "Narrower" : "Near-solution";
    return `<div class="mc-step ${open?"open":"locked"}" data-testid="coach-step-${i}" data-hint="${esc(String(t||""))}"><b>Coach ${i+1} · ${label}</b><span class="coach-txt">${open?md(t):ic("lock",12,"#9CA3AF")+" tap Hint"}</span></div>`;
  }).join("");
  const chipRow = (chips && chips.length)
    ? `<div class="aid-chips" data-testid="mentor-chips">${chips.map(c => `<button type="button" class="chip mc-chip" data-mc-q="${esc(c)}" data-testid="mentor-chip">${esc(c)}</button>`).join("")}</div>`
    : "";
  return `<div class="dual-aid" data-testid="mentor-coach">
    <div class="aid mentor"><div class="aid-h">${ic("hex",14,"#7C3AED")}<b>AI Mentor</b><span class="mini">why · walk-through · misconception</span></div>
      <div class="aid-b" data-testid="mentor-body">${md(mentorTip||"").replace(/\n/g,"<br>")}</div>
      ${chipRow}
      <button type="button" class="btn g sm" data-mc="open" data-testid="open-mentor">Ask Vyapti</button></div>
    <div class="aid coach" data-testid="coach-panel"><div class="aid-h">${ic("bulb",14,"#B45309")}<b>AI Coach</b><span class="mini">graded hints · never the full answer</span></div>
      <div class="aid-b" data-testid="coach-body">${lines || "<span class=\"mini\">Hints unlock as you work.</span>"}</div>
      <button type="button" class="btn g sm" data-act="coach-hint" data-testid="coach-hint">Hint</button></div>
  </div>`;
}

/* Single assistant side panel (Mentor | Coach [| Checks]) — Guided / Indep / Debug */
function assistantPanel({ mentor, coach, chips, coachLevel, checksHtml, revealHtml }) {
  const tab = state.aidTab || "mentor";
  const collapsed = !!state.aidCollapsed;
  const lvl = coachLevel != null ? coachLevel : (state.coachLevel || 0);
  const lines = (coach || []).map((t, i) => {
    const open = lvl > i;
    const label = i === 0 ? "Self-check / Nudge" : i === 1 ? "Narrower" : "Near-solution";
    return `<div class="mc-step ${open?"open":"locked"}" data-testid="coach-step-${i}" data-hint="${esc(String(t||""))}"><b>Coach ${i+1} · ${label}</b><span class="coach-txt">${open?md(t):ic("lock",12,"#9CA3AF")+" tap Hint"}</span></div>`;
  }).join("");
  const chipRow = (chips && chips.length)
    ? `<div class="aid-chips" data-testid="mentor-chips">${chips.map(c => `<button type="button" class="chip mc-chip" data-mc-q="${esc(c)}" data-testid="mentor-chip">${esc(c)}</button>`).join("")}</div>`
    : "";
  const tabs = [
    ["mentor", "Mentor"],
    ["coach", "Coach"],
    checksHtml ? ["checks", "Checks"] : null,
  ].filter(Boolean).map(([id, label]) =>
    `<button type="button" class="aid-tab ${tab===id?"on":""}" data-act="aid-tab" data-tab="${id}" data-testid="aid-tab-${id}">${label}</button>`
  ).join("");
  const mentorPane = `<div class="aid-pane ${tab==="mentor"?"":"hidden"}" data-testid="mentor-pane"><div class="mini" style="margin-bottom:6px">why · walk-through · misconception</div>
      <div data-testid="mentor-body">${md(mentor||"").replace(/\n/g,"<br>")}</div>
      ${chipRow}
      <button type="button" class="btn g sm" data-mc="open" data-testid="open-mentor" style="margin-top:8px">Ask Vyapti</button></div>`;
  const coachPane = `<div class="aid-pane ${tab==="coach"?"":"hidden"}" data-testid="coach-panel"><div class="mini" style="margin-bottom:6px">Graded hints · never the full answer</div>
      <div data-testid="coach-body">${lines || "<span class=\"mini\">Hints unlock as you work.</span>"}</div>
      <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">${btn("Hint","coach-hint","data-testid='coach-hint'","g sm")}${revealHtml||""}</div></div>`;
  const checksPane = checksHtml
    ? `<div class="aid-pane ${tab==="checks"?"":"hidden"}" data-testid="checks-pane">${checksHtml}</div>`
    : "";
  return `<aside class="assistant ${collapsed?"collapsed":""}" data-testid="mentor-coach" data-aid-tab="${tab}">
    <div class="assistant-hd">
      <div class="aid-tabs" data-testid="aid-tabs">${tabs}</div>
      <button type="button" class="btn g sm aid-toggle" data-act="aid-toggle" data-testid="aid-toggle" aria-expanded="${collapsed?"false":"true"}">${collapsed?"Show help":"Hide"}</button>
    </div>
    ${collapsed?"":`<div class="assistant-body">${mentorPane}${coachPane}${checksPane}</div>`}
  </aside>`;
}

const MICRO_AID = {
  mentor: "**Why blocks:** You’ve already met each idea in Explore — now assemble them in order without typing syntax yet.\n**Walk-through:** Outer `for chunk in stream` → guard empty `choices` → read `delta.content` → `if piece` print+append → store finish → `\"\".join(parts)` after the loop.\n**Misconception:** This is not an open assignment dump — it’s a guided rebuild of the Brief skeleton.\n**Explore link:** same guards, flush, and join you placed in the labs.",
  coach: [
    "Nudge: start with the for-loop block — everything nests under it.",
    "Narrower: place the usage-only guard before choices[0], or empty choices crash.",
    "Near: inside if piece: both print(..., flush=True) and parts.append(piece) — then join outside the loop.",
  ],
  chips: ["Where does join go?", "What does the usage guard do?", "Why flush=True on print?"],
  tip: "Drag blocks under the loop in Explore order. Nest with a rightward drag.",
};

const GUIDED_AID = {
  mentor: "**Why this edit:** The starter hard-codes `status = \"complete\"` — the Discovery “All good” lie.\n**Walk-through:** After the loop, call `honest_status(error, finish)` so quiet→partial, stop→complete, length→truncated, ConnectionError→error.\n**Misconception:** “If text exists, it’s complete.” Assign D proved that wrong.\n**Explore link:** finish_reason lab + Assign scenarios.",
  coachDefault: [
    "Nudge: look at the status = line — it ignores finish_reason today.",
    "Narrower: decide status after the loop from error and finish (not before).",
    "Near: status = honest_status(error, finish)  # not \"complete\"",
  ],
  failHints: {
    G4: [
      "Nudge: G4 failed — a quiet/cut stream was labelled complete.",
      "Narrower: hard-coded \"complete\" never checks finish_reason.",
      "Near: replace status = \"complete\" with honest_status(error, finish).",
    ],
    G3: [
      "Nudge: G3 failed — truncated (finish_reason length) wasn’t labelled truncated.",
      "Narrower: map finish == \"length\" → status \"truncated\".",
      "Near: honest_status should treat length separately from stop.",
    ],
    G5: [
      "Nudge: G5 failed — connection error path isn’t honest.",
      "Narrower: if error is set, status should be \"error\" (keep any text).",
      "Near: honest_status(error, finish) checks error first.",
    ],
  },
  chips: ["Why is hard-coded complete wrong?", "What does honest_status return?", "Which Assign scenario matches this?"],
  tip: "Edit the status = line in the editor so it uses error and finish_reason. Then Run.",
};

const INDEP_AID = {
  mentor: "**Why Independent:** You type the full consumer — same contract as Brief, now under real Pyodide checks.\n**Walk-through:** Iterate once; .get(\"content\"); skip empties; print+append; store finish_reason; try/except; finally close; then honest status.\n**Misconception:** Fixing only the happy path — T3/T4/T5 catch quiet, error, and length.\n**Explore link:** whole consumer recap.",
  coachDefault: [
    "Nudge: run once and read which assertion id failed (T1–T5).",
    "Narrower: status must come from error + finish_reason after the loop.",
    "Near: if error: \"error\"; elif finish==\"length\": \"truncated\"; elif finish==\"stop\": \"complete\"; else: \"partial\".",
  ],
  failHints: {
    T3: [
      "Nudge: T3 failed — quiet stream expected partial, got complete.",
      "Narrower: when finish_reason is missing, do not return complete.",
      "Near: else: status = \"partial\" after checking stop/length/error.",
    ],
    T4: [
      "Nudge: T4 failed — connection error should yield status error.",
      "Narrower: catch ConnectionError, set error=, then decide status.",
      "Near: if error: status = \"error\" (keep text if any).",
    ],
    T5: [
      "Nudge: T5 failed — finish_reason length must be truncated.",
      "Narrower: branch on finish == \"length\" before treating as complete.",
      "Near: elif finish == \"length\": status = \"truncated\".",
    ],
    T1: [
      "Nudge: T1 failed — live print / assembly path broke on a happy stream.",
      "Narrower: check end=\"\", flush=True, and \"\".join(parts) in one pass.",
      "Near: print+append inside if piece; join after the loop.",
    ],
    T2: [
      "Nudge: T2 failed — finish_reason stop should be complete with full text.",
      "Narrower: store finish when choice.get(\"finish_reason\") is set.",
      "Near: elif finish == \"stop\": status = \"complete\".",
    ],
  },
  chips: ["Which test failed?", "Where does close() go?", "How do I map finish_reason?"],
  tip: "Edit consume() so status follows error and finish_reason. Then Run real Python.",
};

const DEBUG_AID = [
  {
    mentor: {
      observe: "**Bug 1 · None crash:** Run the broken code. You’ll see TypeError concatenating None — a role-only or empty delta reached `text += piece`.\n**Explore link:** skip-empties / guards labs.",
      find: "**Find:** The crashing line is where None is treated as a string. Prefer `if piece:` over casting.",
      choose: "**Fix:** Guard once — only append/concat when piece is real text. Reject `str(piece)` (hides the bug).",
      fixed: "**Re-test:** Run again — live text should print and no TypeError.",
    },
    coach: {
      observe: ["Nudge: press Run broken code and read the TypeError.", "Narrower: NoneType means piece was None on a concatenate.", "Near: the bad line does text += piece without if piece."],
      find: ["Nudge: tap the line that concatenates piece into text.", "Narrower: look for text += piece without a guard.", "Near: badLines around the += / append without if piece."],
      choose: ["Nudge: prefer a guard, not a cast.", "Narrower: if piece: then append/concat.", "Near: pick “Guard once: if piece: then append to parts”."],
      fixed: ["Nudge: re-run the fixed code.", "Narrower: confirm no TypeError and words appear.", "Near: both crash and “None” on screen should be gone."],
    },
    chips: ["Why did None appear?", "Guard vs str(piece)?", "Which Explore lab covers this?"],
  },
  {
    mentor: {
      observe: "**Bug 2 · frozen screen:** Words arrive but the terminal holds them until the end — missing `flush=True`.\n**Explore link:** flush lab.",
      find: "**Find:** print without flush — same as Discovery’s late dump.",
      choose: "**Fix:** `print(piece, end=\"\", flush=True)`. Sleep is not “more live”.",
      fixed: "**Re-test:** Words should appear immediately.",
    },
    coach: {
      observe: ["Nudge: run and notice the long pause then dump.", "Narrower: buffering — not a slow model.", "Near: print is missing flush=True."],
      find: ["Nudge: tap the print line.", "Narrower: end=\"\" alone doesn’t push the buffer.", "Near: add flush=True to print."],
      choose: ["Nudge: remember Explore flush.", "Narrower: flush every piece, not sleep.", "Near: pick print(..., flush=True)."],
      fixed: ["Nudge: re-run — first word should appear quickly.", "Narrower: no multi-second blank.", "Near: live caret behaviour restored."],
    },
    chips: ["What does flush do?", "Why is sleep wrong?", "Which Explore beat?"],
  },
  {
    mentor: {
      observe: "**Bug 3 · empty history:** Live print works, but a second pass over stream to build text sees nothing.\n**Explore link:** basket / single-pass.",
      find: "**Find:** The second pass that re-reads `stream` after printing.",
      choose: "**Fix:** `parts.append(piece)` in the same loop, then `\"\".join(parts)`.",
      fixed: "**Re-test:** History should equal the live sentence.",
    },
    coach: {
      observe: ["Nudge: history content is \"\" after a live print.", "Narrower: stream already consumed.", "Near: second loop/generator over stream."],
      find: ["Nudge: find the join that re-reads stream.", "Narrower: generator expression over stream after the for-loop.", "Near: lines that iterate stream twice."],
      choose: ["Nudge: one pass for print and history.", "Narrower: parts.append inside the print loop.", "Near: pick collect parts.append then \"\".join(parts)."],
      fixed: ["Nudge: re-run — history should match live text.", "Narrower: no second stream iteration.", "Near: assembled == displayed."],
    },
    chips: ["Why is stream empty?", "Where to append?", "Predict P4 link?"],
  },
  {
    mentor: {
      observe: "**Bug 4 · All-good lie:** status is set to complete before the loop — Discovery’s green tick on half a line.\n**Assign link:** Scenario D.",
      find: "**Find:** status = \"complete\" before you know finish_reason/error.",
      choose: "**Fix:** Catch errors, then honest_status(error, finish) after the loop.",
      fixed: "**Re-test:** Quiet mid-line should show partial, not Delivered ✓.",
    },
    coach: {
      observe: ["Nudge: board says Delivered on a cut line.", "Narrower: status was decided too early.", "Near: status = \"complete\" before the loop."],
      find: ["Nudge: tap the premature complete assignment.", "Narrower: also note empty except that swallows errors.", "Near: bad lines at status= and bare except."],
      choose: ["Nudge: decide after the loop.", "Narrower: honest_status(error, finish).", "Near: reject endswith(\".\") punctuation trap."],
      fixed: ["Nudge: re-run — expect partial on cut stream.", "Narrower: no fake Delivered.", "Near: status from finish_reason/error."],
    },
    chips: ["Why not complete before the loop?", "What is honest_status?", "Assign D?"],
  },
  {
    mentor: {
      observe: "**Bug 5 · missing usage:** Breaking when finish_reason appears skips the later usage-only chunk.\n**Explore link:** usage meter / guards.",
      find: "**Find:** the break after finish_reason.",
      choose: "**Fix:** No break — let the stream end so usage can arrive.",
      fixed: "**Re-test:** Usage totals should populate.",
    },
    coach: {
      observe: ["Nudge: usage still shows ? after a “done” reply.", "Narrower: loop stopped early.", "Near: break on finish_reason."],
      find: ["Nudge: tap the break.", "Narrower: usage chunk comes after finish.", "Near: remove break; let iterator end."],
      choose: ["Nudge: don’t invent token counts.", "Narrower: no break; wait for usage event.", "Near: pick “No break: let the stream end”."],
      fixed: ["Nudge: re-run — usage numbers appear.", "Narrower: finish still recorded without break.", "Near: prompt/completion totals filled."],
    },
    chips: ["When does usage arrive?", "Why is break wrong?", "Explore usage lab?"],
  },
];

const MASTERY_AID = {
  before: { mentor: "", coach: [], chips: [] },
  after: {
    mentor: "**After your attempt:** Mastery checks the same contract as Code — live render, one-pass assembly, honest status, errors, close.\n**Walk failed asserts:** Match the red test id to Brief steps (extract, join, completion, errors).\n**Misconception:** Requesting help before running once skips the real assessment.",
    coach: [
      "Nudge: open the first failing assertion id and restate what it expected.",
      "Narrower: status and join bugs are the usual failures — compare to honest_status + \"\".join(parts).",
      "Near: mirror the Brief skeleton control flow; don’t paste a full solution from memory without understanding.",
    ],
    chips: ["What does this failing test mean?", "Where should I look first?", "Remind me finish_reason map"],
  },
};

function guidedCoachLines() {
  const states = state.guidedStates || [];
  const failIdx = states.findIndex(s => s === "fail");
  if (failIdx >= 0) {
    const id = GUIDED_TESTS_REAL[failIdx] && GUIDED_TESTS_REAL[failIdx].id;
    if (id && GUIDED_AID.failHints[id]) return GUIDED_AID.failHints[id];
  }
  return GUIDED_AID.coachDefault;
}

function indepCoachLines() {
  const states = state.testStates || [];
  const failIdx = states.findIndex(s => s === "fail");
  if (failIdx >= 0) {
    const id = INDEP_TESTS_REAL[failIdx] && INDEP_TESTS_REAL[failIdx].id;
    if (id && INDEP_AID.failHints[id]) return INDEP_AID.failHints[id];
  }
  if (state.pyErr) {
    return [
      "Nudge: read the Python error text above the tests.",
      "Narrower: KeyError/TypeError → check .get(\"content\") and if piece:.",
      "Near: align with Brief extract + skip-empties steps.",
    ];
  }
  return INDEP_AID.coachDefault;
}

function debugAidFor(phase) {
  const aid = DEBUG_AID[state.bugI] || DEBUG_AID[0];
  const p = phase === "observe" ? "observe" : phase === "find" ? "find" : phase === "fixed" ? "fixed" : "choose";
  return { mentor: aid.mentor[p], coach: aid.coach[p], chips: aid.chips };
}

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
