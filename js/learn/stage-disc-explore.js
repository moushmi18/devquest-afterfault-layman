/* Stage 1 Discovery (topic section 1) and Stage 2 Explore (sections 2–5). Teach first, then do. */
function lxTimer(fn, ms) { const t = setTimeout(fn, (typeof REDUCED !== "undefined" && REDUCED) ? 30 : ms); (lxTimer.all || (lxTimer.all = [])).push(t); return t; }
function lxTimersClear() { (lxTimer.all || []).forEach(clearTimeout); lxTimer.all = []; }
function lxSet(sel, html) { const el = document.querySelector(sel); if (el) el.innerHTML = html; return el; }
const LX_REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============================== STAGE 1 · DISCOVERY ============================== */
const LX_ROADMAP = [
  ["1", "What streaming is", "Discovery"], ["2", "Chunks & Server-Sent Events", "Explore"], ["3", "Showing text as it arrives", "Explore"],
  ["4", "Knowing when it's finished", "Explore"], ["5", "Assembling the final reply", "Explore"], ["6", "Writing a Python stream consumer", "Code · Debug"], ["7", "A streaming chatbot", "Mastery"],
];
LX_STAGES[0] = {
  goal: "Understand what a streaming response is, how it differs from a normal reply, and why chat apps use it.",
  sumTitle: "You know what streaming is, and its catch",
  sumSay: "Streaming shows a reply while it's being written. It doesn't make the answer faster to finish; it lets people start reading sooner. The catch: your app must check that the reply really finished.",
  learned: [
    ["What", "A streaming response arrives in small pieces while the AI is still writing it."],
    ["Normal vs streaming", "Normal: wait, then the whole reply at once. Streaming: words appear as they're written. Total time is about the same."],
    ["Why chat apps stream", "Long AI answers take seconds. Streaming lets people start reading almost immediately."],
    ["The catch", "Stopping isn't finishing. Rohan's reply stopped halfway and still got a green tick, because nobody checked the finish signal."],
  ],
  steps: [
    { id: "d1", short: "The reply that stopped", title: "Rohan's reply stopped halfway", section: "Mission brief", concept: "streaming",
      task: "Press **Replay Rohan's chat** and watch what happens to his reply and to the status board.",
      who: "rohan", say: "Friday night, I ordered dinner and asked the restaurant's support assistant where it was. Watch what came back.",
      mentor: "Don't worry about the words *stream* or *chunk* yet. Just notice two things: the reply stops in the middle, and the board still says Delivered.",
      need: "Replay Rohan's chat to continue.",
      hints: ["Press the purple Replay button under the phone."],
      body(a) {
        return `<div class="lx-grid2">
          <div class="lx-col">${lxPhone(a.done ? "Your order is on the" : "", a.done ? "lie" : "idle", { id: "d1-phone", caret: true })}
            <div class="lx-row">${lxBtn(ic("play", 13, "#fff") + (a.done ? " Replay again" : " Replay Rohan's chat"), "lx-d1-play", 'data-testid="d1-play"', "p")}</div></div>
          <div class="lx-col">
            ${a.done ? `${lxSay("ila", "Board says **Delivered ✓** for that chat. All good on my side.")}${lxSay("me", "All good? He got half a sentence.")}` : lxCard(`<b>What to watch</b><p class="mini">1. Does the reply finish its sentence?<br>2. What does the status label say?</p>`)}
            ${a.done ? lxCard(`<div class="kick">This mission teaches</div><b class="lx-big">Streaming Responses</b><p>How AI replies arrive piece by piece, how to show them as they arrive, how to tell when a reply is <b>really</b> finished, and how to write Python that does all of it correctly.</p>
              <ol class="lx-road">${LX_ROADMAP.map(r => `<li><span>${r[0]}</span><b>${r[1]}</b><em>${r[2]}</em></li>`).join("")}</ol>`, "lx-brief") : ""}
            <button type="button" class="lx-link" data-act="lx-trailer">Optional: watch the 40-second story trailer</button>
          </div></div>`;
      },
      act: {
        "lx-d1-play"(el, a) {
          a.done = false; render();
          const words = ["Your", "order", "is", "on", "the"];
          lxSet("#d1-phone .lx-pst", "● typing…"); document.querySelector("#d1-phone .lx-pst").className = "lx-pst st-ok";
          let k = 0;
          const tick = () => {
            const t = document.querySelector("#d1-phone .lx-ptext"); if (!t) return;
            if (k < words.length) { t.textContent = words.slice(0, ++k).join(" "); lxTimer(tick, 380); }
            else lxTimer(() => { a.done = true; lxAward("d-watch", 2, "spotted the freeze"); render(); }, 1300);
          };
          lxTimer(tick, 300);
          return false;
        },
      } },

    { id: "d2", short: "Normal vs streaming", title: "Two ways to send the same reply", section: "1 · Introduction to streaming", concept: "streaming",
      task: "Press **Ask both** for a short and a long reply, and compare when you could start reading and when each reply finished.",
      who: "vyapti", say: "An AI writes its answer a little at a time. The app can either wait for the whole answer, or show it while it's being written. That second way is called **streaming**.",
      mentor: "Watch the two clocks: *first words seen* and *whole reply done*. Streaming changes one of them, not both.",
      need: "Run both reply lengths, then answer the question.",
      hints: ["Run the Short reply, then switch to Long and run again.", "Compare the two clocks under each phone. Which number is different, and which is the same?", "Both replies finish at the same moment. Streaming only lets you start reading sooner."],
      isDone: a => lxA("d-speed").solved,
      body(a) {
        const long = a.len === "long";
        const ran = a.ran || {};
        return `${lxTeach("Normal reply vs streaming reply", [["Normal (non-streaming)", "The server waits until the whole answer is written, then sends it in one go. You see a spinner until then."], ["Streaming", "The server sends each new piece as soon as it's written. You see the reply grow word by word."]])}
          ${lxAnalogy("A **normal reply** is the next-day match report. A **streaming reply** is live commentary: same match, but you follow it ball by ball.")}
          <div class="lx-row lx-wrap"><span class="lbl">Reply length</span>
            <button type="button" class="lx-pill ${!long ? "on" : ""}" data-act="lx-d2-len" data-l="short">Short · 6 words ${ran.short ? "✓" : ""}</button>
            <button type="button" class="lx-pill ${long ? "on" : ""}" data-act="lx-d2-len" data-l="long">Long · 40 words ${ran.long ? "✓" : ""}</button>
            <span class="sp"></span>${lxBtn(ic("play", 13, "#fff") + " Ask both", "lx-d2-run", 'data-testid="d2-run"', "p sm")}</div>
          <div class="lx-grid2 lx-race">
            <div class="lx-col"><div class="lbl">A · Normal reply</div>${lxPhone(null, "idle", { id: "d2-a" })}<div class="lx-clock" id="d2-ca">First words seen: — · Whole reply done: —</div></div>
            <div class="lx-col"><div class="lbl">B · Streaming reply</div>${lxPhone(null, "idle", { id: "d2-b" })}<div class="lx-clock" id="d2-cb">First words seen: — · Whole reply done: —</div></div>
          </div>
          ${ran.short && ran.long ? lxQ("d-speed", { prompt: "What did streaming actually change?", one: true, options: [
            { t: "The whole reply finished sooner.", ok: false, why: "Look at *Whole reply done*: both phones finished at the same moment. The AI writes at the same speed either way.", coach: "Compare the second clock under each phone. Is it different?" },
            { t: "You could start reading much sooner, but the whole reply finished at the same time.", ok: true, why: "Streaming improves **perceived** speed: the wait *feels* shorter because you're reading while it's written. For long replies that's the difference between staring at a spinner and reading along." },
            { t: "The AI wrote a better answer.", ok: false, why: "Same model, same words. Streaming changes how the reply is delivered, not what it says." },
          ] }) : `<p class="mini">Run both lengths to unlock the question.</p>`}`;
      },
      act: {
        "lx-d2-len"(el, a) { a.len = el.dataset.l; },
        "lx-d2-run"(el, a) {
          lxTimersClear();
          const long = a.len === "long";
          const words = long ? "Your order is on the way. Arjun picked it up at 9:12 PM from Spice Route and is riding through light rain, so it may take a few extra minutes. He is about 2 km away and should reach you by 9:41 PM. Thanks for waiting!".split(" ") : "Your order is on the way.".split(" ");
          const total = long ? 4200 : 1300, per = total / words.length, first = 250;
          const A = document.querySelector("#d2-a"), B = document.querySelector("#d2-b"); if (!A || !B) return false;
          const bubble = (ph, html) => { let b = ph.querySelector(".b.bot"); if (!b) { b = document.createElement("div"); b.className = "b bot"; ph.insertBefore(b, ph.querySelector(".lx-pst")); } b.innerHTML = html; };
          bubble(A, `${ic("spin", 16)} <span class="mini">waiting for the whole reply…</span>`); A.querySelector(".lx-pst").textContent = "… waiting";
          bubble(B, ""); B.querySelector(".lx-pst").textContent = "● streaming";
          const t0 = performance.now(); let k = 0;
          const sec = ms => (ms / 1000).toFixed(1) + " s";
          const tick = () => {
            if (!document.body.contains(B)) return;
            k++; bubble(B, esc(words.slice(0, k).join(" ")) + '<span class="caret"></span>');
            if (k === 1) lxSet("#d2-cb", `First words seen: <b>${sec(first)}</b> · Whole reply done: …`);
            if (k < words.length) lxTimer(tick, per);
            else {
              const done = first + total;
              bubble(B, esc(words.join(" "))); B.querySelector(".lx-pst").textContent = "✓ complete";
              bubble(A, esc(words.join(" "))); A.querySelector(".lx-pst").textContent = "✓ complete";
              lxSet("#d2-cb", `First words seen: <b>${sec(first)}</b> · Whole reply done: <b>${sec(done)}</b>`);
              lxSet("#d2-ca", `First words seen: <b>${sec(done)}</b> · Whole reply done: <b>${sec(done)}</b>`);
              a.ran = a.ran || {}; a.ran[long ? "long" : "short"] = 1;
              lxTimer(render, 900);
            }
          };
          lxTimer(tick, first);
          return false;
        },
      } },

    { id: "d3", short: "Why stream?", title: "Why AI chat apps stream, and the catch", section: "1 · Introduction to streaming", concept: "streaming",
      task: "Sort each statement into **True** or **False**, then press Check.",
      who: "tanvi", say: "Almost every AI chat app streams. Let's be precise about what it does and doesn't do, because one wrong belief is what broke Rohan's chat.",
      mentor: "Use what you just saw in the race. If a card claims streaming changes the model or the token count, ask yourself what actually changed on screen.",
      need: "Sort all six statements correctly.",
      hints: ["Streaming only changes *delivery*. Anything about the model itself is false.", "Think about what the app needs to know at the end of a stream.", "False: smarter model, fewer tokens. True: shows while written, same total time, must check it's finished, normal shows nothing until ready."],
      isDone: a => lxA("d-truth").solved,
      body() {
        return `${lxTeach("Why streaming is used", ["AI models produce a reply one small piece (token) at a time. A long answer can take 5–10 seconds.", "Streaming sends each piece as soon as it exists, so people start reading in a fraction of a second instead of watching a spinner.", "**The catch:** with streaming, text arrives bit by bit, so the app must also check whether the reply actually **finished**."])}
        ${lxSort("d-truth", { buckets: ["True", "False"], items: [
          { t: "Streaming shows the reply while the AI is still writing it.", b: 0, why: "That's the definition of streaming." },
          { t: "Streaming makes the AI model smarter.", b: 1, why: "Same model, same answer. Only delivery changes.", wrong: "The model doesn't change at all: streaming is about delivery.", clue: "Does the model change when you switch delivery?" },
          { t: "A streamed reply and a normal reply take about the same total time to finish.", b: 0, why: "Exactly what the race showed: both finished together." },
          { t: "Streaming uses fewer tokens.", b: 1, why: "The same words are written either way, so the token count is the same.", wrong: "Same words → same tokens. Streaming doesn't shorten anything.", clue: "Same words means same tokens." },
          { t: "With streaming, the app must check whether the reply really finished.", b: 0, why: "Text arrives bit by bit; stopping isn't the same as finishing. That's Rohan's bug." },
          { t: "A normal (non-streaming) reply shows nothing until the whole answer is ready.", b: 0, why: "That's why phone A showed a spinner the whole time." },
        ] })}`;
      } },

    { id: "d4", short: "What went wrong?", title: "Back to Rohan: what went wrong?", section: "1 · Introduction to streaming", concept: "finish",
      task: "Use what you now know about streaming to pick the most likely cause, and read why the others don't fit.",
      who: "sana", say: "Here's the evidence. The reply was streaming in: *Your order is on the*. Then nothing else arrived. No error appeared. The board marked it Delivered.",
      mentor: "A stream sends pieces and, at the very end, a signal that says *I'm done*. Ask yourself: did Rohan's chat ever get that signal?",
      need: "Pick the cause that fits all the evidence.",
      hints: ["A crash or a network error usually shows an error. Did anything show one?", "The board decided the reply was delivered. What should it have waited for?"],
      happyWhenDone: true,
      isDone: a => lxA("d-hyp").solved,
      body() {
        return `<div class="lx-grid2"><div class="lx-col">${lxPhone("Your order is on the", "lie", { caret: true })}</div>
          <div class="lx-col">${lxCard(`<b>Evidence</b><ul class="lx-ul"><li>Words arrived one by one, so it <b>was</b> streaming.</li><li>It stopped after "the". Nothing else came.</li><li>No error message appeared.</li><li>The board marked it <b>Delivered ✓</b>.</li></ul>`)}
          ${lxQ("d-hyp", { prompt: "What's the most likely cause?", one: true, options: [
            { t: "The chatbot crashed.", ok: false, why: "A crash would end with an error, and the board would notice a failure, not show Delivered.", coach: "Is there any error in the evidence?" },
            { t: "Rohan's internet was slow.", ok: false, why: "Slow internet makes words arrive *later*, not stop forever. And the board wouldn't call a slow reply Delivered.", coach: "Slow means late, not stopped." },
            { t: "The stream stopped before its finish signal, and the app called it complete anyway.", ok: true, why: "The stream went quiet before the server ever said *finished*. The app treated \"no more words\" as \"done\" and showed a green tick on half a sentence. In Explore you'll open a stream and see that finish signal for yourself." },
          ] })}</div></div>`;
      } },
  ],
  onFinish() { lxAward("stage-0", 4, "Discovery complete"); },
};

/* ============================== STAGE 2 · EXPLORE ============================== */
const LX_SSE = [
  ['data: {"choices":[{"delta":{"role":"assistant"},"finish_reason":null}]}', 0],
  ["", 1],
  [": keep-alive", 2],
  ['data: {"choices":[{"delta":{"content":"Your order "},"finish_reason":null}]}', 3],
  ["", 1],
  ['data: {"choices":[{"delta":{"content":"is on the way."},"finish_reason":null}]}', 3],
  ["", 1],
  ['data: {"choices":[{"delta":{},"finish_reason":"stop"}]}', 4],
  ["", 1],
  ["data: [DONE]", 5],
];
const LX_TOK = ["Your", " order", " is", " on", " the", " way", "."];
LX_STAGES[1] = {
  goal: "See what a stream is made of (chunks, events, the finish signal) and how code shows, keeps and joins the pieces.",
  sumTitle: "You can read a stream like an engineer",
  sumSay: "You've opened a real stream: SSE lines, chunk fields, empty chunks, live printing, joining and the finish signal. Next you'll use all of it on live chats.",
  sumWho: "rohan",
  learned: [
    ["Chunks & tokens", "Tokens are what the model writes; chunks are the deliveries. Use each chunk's text exactly as it comes."],
    ["Server-Sent Events", "`data:` lines separated by blank lines over one open connection; `: keep-alive` is ignored; `data: [DONE]` ends it."],
    ["Chunk fields", "New text: `choices[0].delta.content`. Finish signal: `choices[0].finish_reason`. Guard empty chunks."],
    ["Showing text live", "`print(piece, end=\"\", flush=True)` keeps one line and pushes each piece to the screen now."],
    ["Assembling", "`parts.append(piece)` in order, then `\"\".join(parts)`. The joined text must match the screen."],
    ["Completion", "`\"stop\"` = complete, `\"length\"` = truncated, no signal = partial. Errors: keep text, be honest, retry once only if nothing was shown."],
  ],
  steps: [
    { id: "e1", short: "Chunks & tokens", title: "Tokens and chunks: what actually travels", section: "2 · Server-sent chunks", concept: "chunks",
      task: "Try at least two ways of packing the tokens into chunks, then answer the question.",
      who: "rohan", say: "I work on signals. Here's the thing: the server never sends a reply in one piece when it streams. It sends little parcels called **chunks**.",
      mentor: "Change *tokens per chunk* and watch the parcels change. Then look at the line at the bottom: does the joined text ever change?",
      need: "Try two groupings and answer the question.",
      hints: ["Tap 1, 2 and 3 tokens per chunk.", "Notice each piece keeps its own leading space, like \" order\"."],
      isDone: a => (a.tried || []).length >= 2 && lxA("e-tok").solved,
      body(a) {
        const n = a.n || 1, groups = [];
        for (let i = 0; i < LX_TOK.length; i += n) groups.push(LX_TOK.slice(i, i + n));
        return `${lxTeach("Two words to know", [["Token", "The small unit a model writes: a word or part of a word, often with its leading space, like `Your`, ` order`, `.`"], ["Chunk", "One delivery from the server while streaming. It can carry one token or several."]])}
          <div class="lx-row lx-wrap"><span class="lbl">Tokens per chunk</span>${[1, 2, 3].map(k => `<button type="button" class="lx-pill ${n === k ? "on" : ""}" data-act="lx-e1-n" data-n="${k}">${k}</button>`).join("")}</div>
          <div class="lx-tokrow"><span class="lbl">Model writes tokens</span><div>${LX_TOK.map(t => `<span class="lx-tok">${esc(t).replace(/ /g, "·")}</span>`).join("")}</div></div>
          <div class="lx-tokrow"><span class="lbl">Server sends ${groups.length} chunks</span><div>${groups.map((g, i) => `<span class="lx-parcel"><i>chunk ${i + 1}</i>"${esc(g.join("")).replace(/ /g, "·")}"</span>`).join("")}</div></div>
          <div class="lx-tokrow"><span class="lbl">Joined text</span><div><b class="lx-mono">${esc(LX_TOK.join(""))}</b> <span class="chip grn">same every time</span></div></div>
          ${(a.tried || []).length >= 2 ? lxQ("e-tok", { prompt: "A chunk arrives carrying `\" is on\"`. What should your code assume?", one: true, options: [
            { t: "It's exactly one word.", ok: false, why: "A chunk can carry several tokens. This one carries two: ` is` and ` on`." },
            { t: "It may hold one or more tokens; use its text exactly as it is, leading space included.", ok: true, why: "Chunks are just deliveries. Keep the text as-is and the pieces line up perfectly when joined." },
            { t: "Wait for more chunks before showing it, so you can fix the spacing.", ok: false, why: "That throws away the point of streaming. The spacing is already correct inside the chunk." },
          ] }) : ""}`;
      },
      act: { "lx-e1-n"(el, a) { a.n = +el.dataset.n; a.tried = [...new Set([...(a.tried || []), a.n])]; } } },

    { id: "e2", short: "Server-Sent Events", title: "How the server sends chunks: Server-Sent Events", section: "2 · Server-sent chunks", concept: "sse",
      task: "Receive the stream line by line, then sort each kind of line by what your code should do with it.",
      who: "rohan", say: "Streaming APIs keep one connection open and write short text lines down it. The format is called **Server-Sent Events**, or SSE. Let's tap the wire.",
      mentor: "Every event starts with `data:` and ends with a blank line. Lines starting with `:` are just *I'm still here* pings. The last line says the stream is over.",
      need: "Receive all lines, then sort the six line types.",
      hints: ["A blank line only separates events; it carries nothing.", "`: keep-alive` has no data. `data: [DONE]` means the stream is over.", "The event with `\"finish_reason\":\"stop\"` is the finish signal; the role-only event has no text."],
      isDone: a => lxA("e-sse").solved,
      body(a) {
        const k = a.k || 0;
        const kinds = ["role only", "separator", "keep-alive", "text", "finish", "end"];
        return `${lxTeach("Server-Sent Events in 3 rules", ["One open connection. The server writes events as they happen.", "Each event is a line starting with `data:` followed by a blank line.", "`: comment` lines keep the connection alive. OpenAI-style APIs end with `data: [DONE]`."])}
          <div class="lx-wire" data-testid="wire"><div class="lx-wire-h"><b>The wire</b><span class="mini">${k} / ${LX_SSE.length} lines</span><span class="sp"></span>${k < LX_SSE.length ? lxBtn("Receive next line", "lx-e2-next", 'data-testid="e2-next"', "p sm") + lxBtn("Receive all", "lx-e2-all", "", "g sm") : `<span class="chip grn">stream ended</span>`}</div>
          <div class="lx-wire-b">${LX_SSE.slice(0, k).map(([t, kind]) => `<div class="lx-wl k${kind}"><code>${t ? esc(t) : "<i>(blank line)</i>"}</code><span>${kinds[kind]}</span></div>`).join("") || `<p class="mini">Nothing yet. Press Receive.</p>`}</div></div>
          ${k >= LX_SSE.length ? lxSort("e-sse", { prompt: "What should your code do with each kind of line?", buckets: ["Has new text", "No text: skip", "Finish signal", "Stream over"], items: [
            { html: `<code>data: {"choices":[{"delta":{"role":"assistant"},…}]}</code>`, b: 1, why: "The first event only says who's speaking. No text yet.", clue: "Look for a `content` field. Is there one?" },
            { html: `<i>(blank line)</i>`, b: 1, why: "A blank line just marks the end of one event." },
            { html: `<code>: keep-alive</code>`, b: 1, why: "A comment that keeps the connection open. Ignore it." },
            { html: `<code>data: {"choices":[{"delta":{"content":"Your order "},…}]}</code>`, b: 0, why: "`content` holds the new words to show." },
            { html: `<code>data: {"choices":[{"delta":{},"finish_reason":"stop"}]}</code>`, b: 2, why: "`finish_reason: \"stop\"` is the server saying the reply is complete.", clue: "Find `finish_reason`." },
            { html: `<code>data: [DONE]</code>`, b: 3, why: "The marker that the stream is over. Nothing else will come." },
          ] }) : ""}`;
      },
      act: { "lx-e2-next"(el, a) { a.k = Math.min(LX_SSE.length, (a.k || 0) + 1); }, "lx-e2-all"(el, a) { a.k = LX_SSE.length; } } },

    { id: "e3", short: "Inside a chunk", title: "Inside one chunk: where are the words?", section: "2 · Structure of a streaming event", concept: "event",
      task: "In the chunk below, tap the field that holds the **new words**, then the field that says **whether the reply is over**.",
      who: "tanvi", say: "The Python SDK reads those `data:` lines for you and gives you a `chunk` object for each one. Let's find the two fields we care about.",
      mentor: "`delta` means *what's new since the last chunk*. You never get the whole reply in one chunk, only the latest piece.",
      need: "Find both fields.",
      hints: ["The words are inside `delta`.", "The field that says why the reply stopped has *finish* in its name."],
      isDone: a => a.content && a.finish,
      body(a) {
        const key = (k, label) => `<button type="button" class="lx-key ${a[k] ? "ok" : ""} ${a.miss === k ? "bad" : ""}" data-act="lx-e3-key" data-k="${k}">${label}</button>`;
        const why = { choices: "`choices` is the list of answers. Usually one, so we use `choices[0]`. The words are deeper inside.", index: "`index` says which choice this is (0). No words here.", delta: "Close! `delta` holds what's new, but the words are in a field inside it.", role: "`role` says who is speaking (the assistant). It only appears in the first chunk.", usage: "`usage` counts tokens. It's `None` here; an optional final chunk carries it." };
        return `<div class="lx-grid2"><div class="lx-col"><div class="lx-json" data-testid="chunk-json">
<span class="p">chunk = {</span>
  ${key("choices", '"choices"')}: [ {
      ${key("index", '"index"')}: 0,
      ${key("delta", '"delta"')}: { ${key("role", '"role"')}: null, ${key("content", '"content"')}: <span class="s">"is on the way."</span> },
      ${key("finish", '"finish_reason"')}: <span class="k">null</span>
  } ],
  ${key("usage", '"usage"')}: <span class="k">null</span>
<span class="p">}</span></div>
          ${a.miss && why[a.miss] ? lxFb("am", "Not that one.", why[a.miss]) : ""}
          ${a.content ? lxFb("ok", "Words found.", "`delta.content` is the new text in this chunk: `\"is on the way.\"`") : ""}
          ${a.finish ? lxFb("ok", "Finish signal found.", "`finish_reason` is `null` (Python: `None`) while the reply is still coming. Only the last chunk sets it.") : ""}</div>
          <div class="lx-col">${a.content && a.finish ? lxCard(`<b>The same path in Python</b>${lxCode(`piece  = chunk.choices[0].delta.content    # "is on the way."
finish = chunk.choices[0].finish_reason    # None until the end`)}
            <p class="mini">Read it left to right: the chunk → its first choice → what's new → the text.</p>`) : lxCard(`<b>Why two fields?</b><p class="mini">Every chunk answers two questions: <i>what's new?</i> and <i>is it over?</i> Your code needs both.</p>`)}</div></div>`;
      },
      act: { "lx-e3-key"(el, a) { const k = el.dataset.k; if (k === "content" || k === "finish") { a[k] = true; a.miss = null; if (a.content && a.finish) { lxAward("e-fields", 5, "found both fields"); lxA("e3").react = { kind: "ok", text: "That's the map of every chunk you'll ever loop over." }; } } else { a.miss = k; a.react = { kind: "bad", text: "Words live inside `delta`. Follow choices → [0] → delta → …" }; } } } },

    { id: "e4", short: "Empty chunks", title: "Not every chunk has words", section: "3 · Handling empty or non-content chunks", concept: "skip",
      task: "Decide what your code should do with each of these six real chunks.",
      who: "samar", say: "On an assembly line, not every box on the belt has a part in it. Some are empty, some are just labels. You check before you grab.",
      mentor: "`None` and `\"\"` both mean *no text*. And if `choices` is an empty list, `choices[0]` doesn't exist at all: reading it crashes with an IndexError.",
      need: "Sort all six chunks correctly.",
      hints: ["Only chunks whose `content` is a non-empty string get shown and kept.", "The chunk with `finish_reason=\"stop\"` has no text, but it's important.", "`choices=[]` is the optional usage chunk: skip it (and never read `choices[0]` on it)."],
      isDone: a => lxA("e-chunks").solved,
      body() {
        const c = (s) => `<code class="lx-mono">${esc(s)}</code>`;
        return `${lxSort("e-chunks", { buckets: ["Show + keep", "Skip: no text", "Note the finish"], items: [
          { html: c('delta(role="assistant", content=None)'), b: 1, why: "First chunk: just the role. `content` is None.", clue: "`content=None` means no text." },
          { html: c('delta(content="Your order ")'), b: 0, why: "Real text: show it and keep it." },
          { html: c('delta(content="")'), b: 1, why: "An empty string has nothing to show. Skip it.", clue: "Is there anything to show in `\"\"`?" },
          { html: c('delta(content="is on the way.")'), b: 0, why: "Real text: show it and keep it." },
          { html: c('delta(content=None), finish_reason="stop"'), b: 2, why: "No text, but this is the finish signal. Remember it!", clue: "Look past the content: what else does it carry?" },
          { html: c("choices=[], usage=(…12 + 6 tokens)"), b: 1, why: "The optional usage chunk has **no choices**. Skip it; reading `choices[0]` here would crash.", clue: "Can you read item 0 of an empty list?" },
        ] })}
        ${lxCard(`<b>So the loop needs two guards</b>${lxCode(`for chunk in stream:
    if not chunk.choices:      # guard 1: no choices (usage chunk) → skip
        continue
    piece = chunk.choices[0].delta.content
    if piece:                  # guard 2: None or "" → nothing to show
        ...show and keep it...`)}`)}`;
      } },

    { id: "e5", short: "Show it live", title: "Showing text as it arrives: end and flush", section: "3 · Rendering tokens as they arrive", concept: "render",
      task: "Set **end** and **flush**, press Run, and get the terminal to look like a real chat: one line, words appearing live.",
      who: "tanvi", say: "Python's `print` has two habits that ruin streaming. First learn what they are, then fix them with the two switches.",
      mentor: "Try the defaults first so you see the problem, then change one switch at a time. That's how you'll remember what each one does.",
      need: "Find the setting that shows one live line (try at least two settings).",
      hints: ["Start with the defaults and press Run. What's wrong?", "`end=\"\"` fixes the new lines. Now what's still wrong?", "Use `end=\"\"` and `flush=True` together."],
      isDone: a => a.win && (a.tried || []).length >= 2,
      body(a) {
        const end = a.end == null ? "nl" : a.end, fl = !!a.flush;
        return `${lxTeach("Two habits of print()", [["Habit 1 · new line", "After printing, `print` adds a new line (`end=\"\\n\"`). Each piece lands on its own line. **Fix:** `end=\"\"` adds nothing, so pieces stay on one line."], ["Habit 2 · waiting buffer", "Text without a new line waits in a hidden buffer and appears later, all at once. **Fix:** `flush=True` pushes it to the screen right now."]])}
          ${lxAnalogy("The buffer is a waiter collecting plates in the kitchen and bringing them all at once. `flush=True` says: bring each plate the moment it's ready.")}
          <div class="lx-grid2"><div class="lx-col">
            <div class="lx-switch"><span class="lbl">end =</span><button type="button" class="lx-pill ${end === "nl" ? "on" : ""}" data-act="lx-e5" data-k="end" data-v="nl">"\\n" (default)</button><button type="button" class="lx-pill ${end === "" ? "on" : ""}" data-act="lx-e5" data-k="end" data-v="">""</button></div>
            <div class="lx-switch"><span class="lbl">flush =</span><button type="button" class="lx-pill ${!fl ? "on" : ""}" data-act="lx-e5" data-k="flush" data-v="0">False (default)</button><button type="button" class="lx-pill ${fl ? "on" : ""}" data-act="lx-e5" data-k="flush" data-v="1">True</button></div>
            ${lxCode(`for piece in ["Your ", "order ", "is ", "on ", "the ", "way."]:
    print(piece, end=${end === "nl" ? '"\\n"' : '""'}, flush=${fl ? "True" : "False"})`)}
            <div class="lx-row">${lxBtn(ic("play", 13, "#fff") + " Run", "lx-e5-run", 'data-testid="e5-run"', "p")}<span class="mini">Tried: ${(a.tried || []).length ? (a.tried || []).map(t => `<code class="inline">${t}</code>`).join(" ") : "none yet"}</span></div></div>
          <div class="lx-col">${lxTerm(`<span class="lx-out" id="e5-out">${esc(a.out || "")}</span>`, { id: "e5-term" })}<div id="e5-fb">${a.fbHtml || ""}</div></div></div>
          ${a.win ? lxCard(`<b>In a chat app it's the same idea</b><p class="mini">Instead of printing, you add each piece to the message bubble the moment it arrives: <code class="inline">bubble.text += piece</code>. Pieces go on screen in the order they arrive. Never sort or re-order them.</p>`) : ""}`;
      },
      act: {
        "lx-e5"(el, a) { if (el.dataset.k === "end") a.end = el.dataset.v; else a.flush = el.dataset.v === "1"; },
        "lx-e5-run"(el, a) {
          lxTimersClear();
          const end = a.end == null ? "nl" : a.end, fl = !!a.flush, label = `end=${end === "nl" ? '"\\n"' : '""'} flush=${fl}`;
          a.tried = [...new Set([...(a.tried || []), label])];
          const P = ["Your ", "order ", "is ", "on ", "the ", "way."]; let k = 0, shown = "";
          const out = document.getElementById("e5-out"); if (!out) return false;
          out.innerHTML = '<span class="dim">running…</span>';
          const fin = () => {
            let kind, title, text;
            if (end === "nl") { kind = "bad"; title = "Each piece on its own line."; text = "`print` added a new line after every piece. Real chat text flows on one line. Try `end=\"\"`."; a.react = { kind: "bad", text: "Words stacked vertically: that's habit 1, the automatic new line." }; }
            else if (!fl) { kind = "bad"; title = "Nothing… then everything at once."; text = "No new line means the text waited in the buffer until the program ended. Same experience as a non-streaming reply! Add `flush=True`."; a.react = { kind: "bad", text: "One line now, but it all appeared at the end. That's habit 2, the buffer." }; }
            else { kind = "ok"; title = "That's a live line."; text = "`end=\"\"` keeps one line and `flush=True` pushes each piece to the screen the moment it arrives."; a.win = true; a.react = { kind: "ok", text: "Both habits fixed. You'll type exactly this line in Code." }; lxAward("e-render", 6, "live rendering"); }
            a.fbHtml = lxFb(kind, title, text); render();
          };
          const tick = () => {
            if (!document.body.contains(out)) return;
            if (k < P.length) {
              shown += P[k] + (end === "nl" ? "\n" : ""); k++;
              const visible = (end === "nl" || fl) ? shown : "";
              out.innerHTML = esc(visible) + '<span class="caret"></span>' + (!fl && end !== "nl" ? `\n<span class="dim">(buffer is holding: "${esc(shown)}")</span>` : "");
              lxTimer(tick, 420);
            } else { out.innerHTML = esc(shown); a.out = shown; lxTimer(fin, 500); }
          };
          lxTimer(tick, 300);
          return false;
        },
      } },

    { id: "e6", short: "Append & join", title: "Keep every piece, then join them", section: "5 · Assembling the final response", concept: "join",
      task: "Receive all six chunks into `parts`, then pick the join that rebuilds exactly what's on screen.",
      who: "samar", say: "The screen shows the reply, but your program also needs it as **one string**: to save in chat history, to log, to check. So we collect the pieces in order and assemble them at the end.",
      mentor: "Look carefully at the pieces: they already carry their own spaces (`\" order\"`). So what should go *between* them when you join?",
      need: "Receive all chunks and find the join that matches the screen.",
      hints: ["Press Receive until all six chunks are in `parts`.", "Try each join and compare with the screen text above it.", "Use `\"\".join(parts)`: the pieces already contain the spaces."],
      isDone: a => a.win,
      body(a) {
        const n = a.n || 0, P = ["Your", " order", " is", " on", " the", " way."], parts = P.slice(0, n);
        const J = { "": "\"\".join(parts)", " ": "\" \".join(parts)", "\n": "\"\\n\".join(parts)" };
        const res = a.sep != null ? parts.join(a.sep) : null, screen = P.join("");
        const vis = s => esc(s).replace(/ /g, '<i class="sp">·</i>').replace(/\n/g, '<i class="nl">↵</i><br>');
        return `${lxTeach("Assembling in three moves", [["1 · Start empty", "`parts = []` before the loop."], ["2 · Append in order", "Inside the loop: `parts.append(piece)`, in the order chunks arrive."], ["3 · Join once", "After the loop: `reply = \"\".join(parts)` glues them into one string."]])}
          <div class="lx-grid2"><div class="lx-col">
            ${lxPhone(parts.join(""), n === 6 ? "live" : (n ? "live" : "idle"), { caret: n < 6 })}
            <div class="lx-row">${n < 6 ? lxBtn(`Receive chunk ${n + 1} of 6`, "lx-e6-recv", 'data-testid="e6-recv"', "p sm") : `<span class="chip grn">all 6 chunks received</span>`}</div>
            <div class="lx-parts" data-testid="parts"><span class="lbl">parts =</span> [${parts.map(p => `<span class="lx-parcel sm">"${vis(p)}"</span>`).join(", ")}]</div></div>
          <div class="lx-col">${n === 6 ? `<div class="lbl">Pick the join</div><div class="lx-row lx-wrap">${Object.entries(J).map(([s, l]) => `<button type="button" class="lx-pill mono ${a.sep === s ? "on" : ""}" data-act="lx-e6-join" data-s="${encodeURIComponent(s)}">${esc(l)}</button>`).join("")}</div>
            ${res != null ? `<div class="lx-cmp"><div><span class="lbl">On screen</span><b class="lx-mono">${vis(screen)}</b></div><div><span class="lbl">reply</span><b class="lx-mono">${vis(res)}</b></div>${res === screen ? lxFb("ok", "They match.", "`\"\".join` adds nothing between pieces, and the pieces already carry their spaces. What you saved is exactly what the user saw.") : lxFb("bad", "They don't match.", a.sep === " " ? "Double spaces! Each piece already starts with a space, and the join added another." : "Every piece ended up on its own line. The reply was one sentence.")}</div>` : `<p class="mini">Pick a join to compare it with the screen.</p>`}` : lxCard(`<b>Why not just use the screen?</b><p class="mini">The screen is for people. Your code needs the text in a variable to save it in history, send it on, or check it. That's why we keep a list as we go.</p>`)}</div></div>`;
      },
      act: {
        "lx-e6-recv"(el, a) { a.n = Math.min(6, (a.n || 0) + 1); },
        "lx-e6-join"(el, a) { a.sep = decodeURIComponent(el.dataset.s); a.tries = (a.tries || 0) + 1; if (a.sep === "") { a.win = true; a.react = { kind: "ok", text: "Exactly. Empty-string join, because chunks bring their own spaces." }; lxAward("e-join", a.tries === 1 ? 7 : 5, "assembled the reply"); } else a.react = { kind: "bad", text: "Compare the dots (spaces) in both lines. Where did the extra ones come from?" }; },
      } },

    { id: "e7", short: "finish_reason", title: "Is it finished? Reading finish_reason", section: "4 · Handling stream completion", concept: "finish",
      task: "Look at the last chunks of three replies and label each one honestly.",
      who: "sana", say: "My job is spotting failures before they hurt someone. In streaming, the dangerous failure is quiet: a reply that just stops. The **finish signal** tells us the truth.",
      mentor: "Only the very last chunk sets `finish_reason`. If the stream ends and you never saw one, you don't know it finished, so don't say it did.",
      need: "Label all three replies correctly.",
      hints: ["`\"stop\"` means the model finished its thought.", "`\"length\"` means it hit the max-token limit mid-thought.", "If no chunk ever had a finish_reason, the stream ended early: partial."],
      isDone: a => lxA("e-finish").solved,
      body() {
        const raw = (lines) => `<div class="lx-mini-raw">${lines.map(l => `<code>${esc(l)}</code>`).join("")}</div>`;
        return `${lxTeach("The three values you'll meet", [["`None`", "Still coming. Every chunk except the last one has this."], ["`\"stop\"`", "The model finished normally → **complete**."], ["`\"length\"`", "The reply hit the `max_tokens` limit → **truncated** (cut off)."], ["Never set", "The stream ended or went quiet without a finish chunk → **partial**. Don't call it complete."]])}
        ${lxSort("e-finish", { buckets: ["Complete", "Truncated", "Partial"], items: [
          { html: `<b>Reply A</b> "Your table for two is ready."${raw(['… content="is ready."  finish_reason=None', '… content=None        finish_reason="stop"'])}`, b: 0, why: "`\"stop\"`: the model finished. Green tick earned." },
          { html: `<b>Reply B</b> "Your order is with Arjun, near the main"${raw(['… content="near the main"  finish_reason=None', '… content=None           finish_reason="length"'])}`, b: 1, why: "`\"length\"`: it ran out of its token budget mid-sentence. Show it, but label it cut off.", clue: "Which value means *hit the limit*?" },
          { html: `<b>Reply C</b> "Your order is on the"${raw(['… content="the"  finish_reason=None', "(stream ends, nothing more)"])}`, b: 2, why: "No finish signal ever came. This is Rohan's reply. Honest label: partial.", clue: "Did any chunk set finish_reason?" },
        ] })}`;
      } },

    { id: "e8", short: "When it breaks", title: "When the line breaks: interruptions and errors", section: "4 · Interrupted streams & connection errors", concept: "errors",
      task: "Answer both situations. Read the explanation for every choice.",
      who: "sana", say: "Two ways a stream breaks: the connection drops **in the middle**, or the request fails **before any words** arrive. They need different handling.",
      mentor: "The key question is always: *has the user already seen some text?* If yes, retrying would repeat it. If no, one careful retry is safe.",
      need: "Answer both questions.",
      hints: ["If text is already on screen, retrying repeats it.", "If nothing was shown, a single retry after a short pause can't duplicate anything. Retrying forever causes a retry storm."],
      isDone: () => lxA("e-err").solved && lxA("e-err2").solved,
      body() {
        return `${lxTeach("Handling a broken stream", [["Keep", "Leave the text that already arrived on screen."], ["Be honest", "Mark it: *connection lost*, *partial*. Never a green tick, never hide the error."], ["Retry wisely", "Only if nothing was shown yet, and only once, after a short pause."], ["Close", "Always close the stream (`finally: stream.close()`) to release the connection."]])}
          ${lxQ("e-err", { prompt: "Chat 1 streamed *\"Your refund will be\"*, then the connection dropped (an `APIConnectionError` while looping). What should the app do?", one: true, options: [
            { t: "Retry right away and stream the reply again into the same bubble.", ok: false, why: "The user already saw \"Your refund will be\". A fresh reply would repeat it: *Your refund will be Your refund will be…*" },
            { t: "Keep the text, label it *connection lost*, and let the user ask again.", ok: true, why: "Honest and safe: nothing is hidden or duplicated, and the user decides." },
            { t: "Hide the half message and show *All good*.", ok: false, why: "That's the green-tick lie that started this mission." },
          ] })}
          ${lxQ("e-err2", { prompt: "Chat 3's request failed **before a single word** arrived. What now?", one: true, options: [
            { t: "Retry immediately, and keep retrying until it works.", ok: false, why: "Thousands of apps hammering a struggling server at once is a **retry storm**. It makes the outage worse." },
            { t: "Pause briefly, then retry once. If it fails again, show an honest error.", ok: true, why: "Nothing was shown, so one retry can't duplicate text. One retry, not forever." },
            { t: "Mark the chat complete. There's nothing to show anyway.", ok: false, why: "An empty reply isn't a complete reply. The user is still waiting for an answer." },
          ] })}`;
      } },
  ],
  onFinish() { lxBadge("reader"); lxAward("stage-1", 4, "Explore complete"); },
};
