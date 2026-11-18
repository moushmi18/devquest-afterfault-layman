/* Chat with Vyapti, the game's AI mentor. Additive panel; story untouched.
   Brain: live AI via /api/mentor (Vercel AI Gateway, streamed) with an offline in-browser mentor as fallback. */
(function () {
const $ = s => document.querySelector(s);
const MC = { open:false, msgs:[], ai: null /* null=unknown, true, false */, busy:false, hints:{} };

/* ---------- where is the player? */
function screenKey() {
  const s = state.scene;
  return [s, state.dq && state.dq.step, state.xq && state.xq.beat, state.asStep, state.predI, state.predPhase, state.codeTier, state.bugI, state.bugPhase, state.bossPhase, state.p2i].join("|");
}
const SC_STAGE = {disc:0, explore:1, assign:2, pred:3, code:4, debug:5, boss:6};
function ctx() {
  const a = document.getElementById("app"), q = s => { const e = a.querySelector(s); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; };
  const st = SC_STAGE[state.scene];
  const lx = (typeof LX !== "undefined" && LEARN_ON) ? LX.ctx() : null;
  if (lx) return { scene: state.scene, stageIndex: st, where: lx.where, screen: lx.screen, kicker: "", objective: lx.objective, tip: lx.tip, learn: LM_STAGE_HINT[st], answer: lx.answer, hintsGiven: MC.hints[screenKey()] || 0, aiMentorOn: state.aiOn };
  const where = st != null ? `Stage ${st + 1} of 7 · ${STAGES[st]}` :
    ({map:"The world map (before the mission)", mapEnd:"The world map (mission finished)", avatar:"Choosing a character", intro:"The intro video", rewards:"Rewards screen (mission complete)", cliff:"Ending · teaser for mission 3.6"})[state.scene] || state.scene;
  return { scene: state.scene, stageIndex: st == null ? -1 : st, where, screen: q(".main .hd h2") || q(".hub-world h2"), kicker: q(".main .kick"),
    objective: q(".side .obj").replace(/^OBJECTIVE\s*/, ""), tip: q(".side .tip") || q(".hub-vy div"), learn: st != null ? LM_STAGE_HINT[st] : "",
    answer: answerFor(), hintsGiven: MC.hints[screenKey()] || 0, aiMentorOn: state.aiOn };
}
/* the answer for the current screen (only revealed after a hint has been given and the player asks again) */
function answerFor() {
  const s = state.scene, a = document.getElementById("app");
  try {
    const xc = a.querySelector(".xcheck:not(.locked)");
    if (s === "map") return "Walk to the glowing 3.5 tower (tap the map near it) and press Enter mission.";
    if (s === "avatar") return "Pick any of the four characters, then press Enter the Retry Storm. Your choice doesn't change the path.";
    if (s === "disc") return ["Press Send to both, then tap Bot B (the live one): it felt faster because it started talking 3 seconds sooner.",
      "Tap the phone until the words stop (5 taps), then tap the green \"Delivered ✓\" on the ops wall, because it's lying.",
      "Pick \"No finish signal\". Nothing crashed and the Wi-Fi was fine; nobody checked for the finish signal."][state.dq.step];
    if (s === "explore") {
      const beat = XBEATS[state.xq.beat].id;
      if (xc) { const key = xc.dataset.testid.replace("xcheck-", ""), ops = xc.querySelectorAll(".opt"); if (XCORRECT[key] != null && ops[XCORRECT[key]]) return `For the check, pick "${ops[XCORRECT[key]].textContent.replace(/^[A-C]/, "").trim()}".`; }
      return ({open:"Flip the stream lever so it reads stream=True.", chunks:"Tap the lens to zoom in, tap the stream value to try False, then set it back to True. The check answer is \"small chunks, as written\".",
        blank:"Tap the output buffer tank in the hallway.", flush:"Zoom in, then set end to \"\" and flush to True. The check answer is \"push to the screen now\".",
        r1:"Tap the moves in order: Open the stream, Stay on one line, Push it now.", basket:"Drag the parts basket onto the belt end on the desk.",
        join:"Zoom in, drag the chunks into slots 0–5 in sentence order (Your, order, is, on, the, way.), then tap the separator so it becomes \"\".",
        cut:"Tap the \"Delivered ✓\" board: it's lying, the reply isn't finished.", finish:"Zoom in and tap the finish value to try each option. For the check, pick \"partial\".",
        jam:"Tap the jammed gate (the IndexError) to see what got stuck.", guard:"Zoom in and drag the two guards into gate 1 and gate 2 (choices check first, then the piece check). The check answer is \"usage meter\".",
        r2:"Tap the seven moves in order, 1 to 7."})[beat];
    }
    if (s === "assign") return state.asStep <= 3 ? `Pick the "${ASSIGN_EVENTS[state.asStep].correct}" tile.` : state.asStep === 4 ? "Press Add range check, then See the board." : "Press Continue to Predictions.";
    if (s === "pred") { const p = PRED[state.predI]; return state.predPhase === "q" ? `Option ${"ABCD"[p.correct]}: "${p.ops[p.correct]}" ${p.why}` : "Press Next prediction (or Continue)."; }
    if (s === "code") return state.codeTier === "micro" ? "Order: for chunk in stream → inside it: if not chunk.get(\"choices\") → (inside) usage = chunk.get(\"usage\") and continue → choice = chunk[\"choices\"][0] → piece = choice[\"delta\"].get(\"content\") → if piece: → (inside) print(piece, end=\"\", flush=True) and parts.append(piece) → if choice.get(\"finish_reason\"): → (inside) finish = choice[\"finish_reason\"] → back outside the loop: text = \"\".join(parts). Leave out yield, plain print and the extra finish line."
      : state.codeTier === "guided" ? "Press \"Fix status after the loop\", then Check." : "Choose complete when: finish == \"stop\", then press Run / Check.";
    if (s === "debug") { const b = BUGS[state.bugI]; return state.bugPhase === "find" ? `Tap line ${b.badLines.join(" or ")} in the code.` : state.bugPhase === "choose" ? `Pick the fix: "${b.fixes.find(f => f.ok).t.replace(/`/g, "")}".` : "Press Next bug (or Continue)."; }
    if (s === "boss") { if (state.bossPhase === "p2" && P2_EVENTS[state.p2i]) { const e = P2_EVENTS[state.p2i]; return `Pick "${e.ops.find(o => o[0] === e.correct)[1]}", then Commit.`; } return "Press the big button to move to the next phase."; }
  } catch (e) {}
  return "";
}

/* ---------- offline brain */
const norm = s => s.toLowerCase().replace(/[_\-]/g, " ").replace(/[^a-z0-9.= ]/g, " ").replace(/\s+/g, " ").trim();
const words = s => norm(s).split(" ").filter(w => w.length > 2 && !STOP.has(w));
const STOP = new Set("the and what does mean means meaning this that whats what's is are why how can you for with about explain tell give word please".split(" "));
const QA = [
 [/\b(hi|hello|hey|namaste)\b/, "Hello. I'm Vyapti, your mentor on this mission. Ask me about this screen, any word you don't know, or say \"I'm stuck\"."],
 [/who are you|your name|what are you/, "I'm Vyapti, the amber orb in the side panel. I coach the squad. The AI Mentor switch in the top bar changes how I give tips."],
 [/thank/, "Anytime. Remember: a reply isn't done when it stops. It's done when it says it's done."],
 [/what is this|what.*game|what.*do here|how.*play|where.*start/, "This is DevQuest, a learning game. Dabba Dash's support bot stops mid-sentence (\"Your order is on the…\") while the dashboard says \"All good\". Over 7 stages you find out why and fix it. On the map, walk to the glowing 3.5 tower and press Enter mission."],
 [/why.*(stop|freeze|froze|cut|half)|what.*(bug|wrong|problem)/, "The reply arrives in pieces. Tonight the connection got cut halfway, so the words just stopped. That part happens. The real bug: nobody checked for the finish signal, so the board called half a sentence \"delivered\"."],
 [/all good|green tick|delivered/, "The green \"All good\" tick was a lie. It only checked whether some text arrived, not whether the reply sent its finish signal. Quiet isn't done."],
 [/why.*stream|point of stream|why not.*once/, "Streaming doesn't make the bot smarter. It just shows the reply while it's being written, so customers see words in 0.2 s instead of staring at a spinner. Like live commentary instead of tomorrow's match report."],
 [/\bthe line\b|progress bar.*side|side panel/, "\"The Line\" in the left panel is the reply you're fixing: \"Your order is on the way.\" It fills in as more of it arrives safely."],
 [/save|progress|refresh/, "Your progress saves on this device automatically. Restart in the bottom bar clears it."],
 [/lock/, "A lock means you haven't reached that stage yet. Tap it to see what it teaches, or Preview anyway if you want to peek."],
 [/phone|mobile|small/, "On a phone, turn it sideways for a bigger view. You can pinch to zoom, and the card below the game repeats the goal and my tip in bigger text."],
 [/real|actual (company|app)|dabba dash/, "Dabba Dash is made up, but the problem is real: many chat apps stream replies and must check for the finish signal."],
];
function gloss(q) {
  const n = " " + norm(q) + " ";
  let best = null, bs = 0;
  LM_GLOSS.forEach(g => {
    const names = [g[1], g[0]].map(norm);
    let sc = 0;
    names.forEach(nm => { nm.split(/[()\/,]/).map(x => x.trim()).filter(x => x.length > 1).forEach(p => { if (n.includes(" " + p + " ") || n.includes(" " + p)) sc = Math.max(sc, 5 + p.length); }); });
    if (!sc) words(q).forEach(w => names.forEach(nm => nm.split(" ").forEach(t => { if (t.length > 3 && (t.startsWith(w.slice(0, 5)) || w.startsWith(t.slice(0, 5)))) sc = Math.max(sc, 3); })));
    if (sc > bs) { bs = sc; best = g; }
  });
  return bs >= 3 ? best : null;
}
function cast(q) { const n = norm(q); const k = Object.keys(LM_CAST).find(k => n.includes(k)); return k ? LM_CAST[k] : null; }
function offline(q, c) {
  const n = norm(q), key = screenKey(), hints = MC.hints[key] || 0;
  const wantAns = /\b(answer|solution|just tell|tell me|which one|what.*pick|correct)\b/.test(n);
  const stuck = /stuck|hint|help me|what (do|should) i do|next|how do i|confused|lost/.test(n);
  if (wantAns && c.answer) {
    if (hints < 1) { MC.hints[key] = 1; return `Hint first, so your gut gets calibrated: ${c.tip || c.objective}\n\nStill stuck? Ask me for the answer again and I'll tell you.`; }
    MC.hints[key] = hints + 1; return `Alright, here it is: ${c.answer}`;
  }
  if (stuck) {
    MC.hints[key] = hints + 1;
    if (hints === 0) return `${c.objective ? "Your goal here: " + c.objective + "\n\n" : ""}Hint: ${c.tip || "Look for the glowing or pulsing thing on screen and tap it."}`;
    return `A bigger nudge: ${c.learn || c.tip}\n\nIf you'd like the exact move, ask \"what's the answer?\"`;
  }
  if (/(this|current) (stage|screen|step|level)|teach|learn|what am i doing|objective|goal/.test(n)) {
    const r = c.stageIndex >= 0 ? LM_RECAP[c.stageIndex] : null;
    return c.stageIndex >= 0 ? `You're on ${c.where}${c.screen ? " · " + c.screen : ""}. It teaches: ${c.learn}\n\nWant a nudge on this exact screen? Say "I'm stuck".` : `You're on ${c.where}. ${c.objective || "Walk to the glowing 3.5 tower on the map to begin the mission."}`;
  }
  const who = /who|character|cast/.test(n) && cast(q); if (who) return `${who[0]}: ${who[2]}`;
  for (const [re, a] of QA) if (re.test(n)) return a;
  const g = gloss(q); if (g) return `${g[1]}: ${g[3]}\n\nThink of it like this: ${g[4].replace(/^Like /, "")}`;
  const ch = cast(q); if (ch) return `${ch[0]}: ${ch[2]}`;
  return "I'm not sure about that one. Try the Glossary in the bottom bar, or ask me about this screen, a word you saw, or say \"I'm stuck\".";
}

/* ---------- AI brain (streamed, with an honest finish state) */
async function askAI(onText) {
  const c = ctx(), history = MC.msgs.filter(m => m.done !== false).slice(-8).map(m => ({role: m.role, content: m.text.slice(0, 600)}));
  const r = await fetch("api/mentor", {method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({messages: history, ctx: c})});
  if (!r.ok || !r.body || !(r.headers.get("content-type") || "").includes("event-stream")) throw new Error("ai " + r.status);
  const rd = r.body.getReader(), dec = new TextDecoder(); let buf = "", finish = null, got = "";
  for (;;) {
    const {value, done} = await rd.read(); if (done) break;
    buf += dec.decode(value, {stream:true});
    let i; while ((i = buf.indexOf("\n\n")) >= 0) {
      const ev = buf.slice(0, i); buf = buf.slice(i + 2);
      const line = ev.split("\n").find(l => l.startsWith("data: ")); if (!line) continue;
      const d = line.slice(6); if (d === "[DONE]") continue;
      try { const j = JSON.parse(d); if (j.t) { got += j.t; onText(got); } if (j.finish) finish = j.finish; if (j.error) throw new Error(j.error); } catch (e) { if (e.message && !e.message.startsWith("Unexpected")) throw e; }
    }
  }
  if (!got) throw new Error("empty");
  return {text: got, finish};
}

/* ---------- UI */
function chips() {
  const c = ctx();
  const base = c.stageIndex >= 0 ? ["What does this stage teach?", "I'm stuck, give me a hint", "Explain a word on this screen", "Why did the reply stop?"]
    : ["What is this game?", "How do I start?", "What is streaming?", "Who is Ila?"];
  return base.map(t => `<button type="button" class="chip mc-chip" data-mc-q="${esc(t)}">${esc(t)}</button>`).join("");
}
function msgHTML(m) {
  if (m.role === "user") return `<div class="mc-row me"><div class="b u">${esc(m.text)}</div></div>`;
  const st = m.done === false ? '<span class="chip">● streaming</span>' : m.finish === "stop" || m.offline ? '<span class="chip grn">finished ✓</span>' : '<span class="chip amb">partial · reply cut short</span>';
  return `<div class="mc-row"><img class="orb" src="${ART}vyapti-speak.jpg" alt="Vyapti"><div class="mc-bub"><b>VYAPTI</b><div class="mc-tx">${esc(m.text)}${m.done === false ? '<span class="caret"></span>' : ""}</div><div class="mc-st">${st}${m.offline ? '<span class="mini">offline mentor</span>' : ""}</div></div></div>`;
}
function draw() {
  const p = $("#mc-panel"); if (!p) return;
  const log = p.querySelector(".mc-log");
  log.innerHTML = msgHTML({role:"assistant", offline:true, text:"Hi, I'm Vyapti. Ask me anything about this mission in plain words. I'll give hints first, so you still get the fun of solving it."}) + MC.msgs.map(msgHTML).join("");
  p.querySelector(".mc-chips").innerHTML = chips();
  p.querySelector(".mc-mode").innerHTML = MC.ai === true ? '<span class="chip grn">live AI</span>' : MC.ai === false ? '<span class="chip gry">offline mentor</span>' : "";
  p.querySelector(".mc-where").textContent = ctx().where;
  log.scrollTop = log.scrollHeight;
}
async function ask(q) {
  q = q.trim().slice(0, 400); if (!q || MC.busy) return;
  if (/explain a word on this screen/i.test(q)) {
    const t = [...document.querySelectorAll("#app .lm-term")].map(e => e.dataset.lm).find(k => k[0] !== "@" && typeof LM_GLOSS !== "undefined");
    const g = t && LM_GLOSS.find(x => x[0] === t);
    if (g) q = "What does " + g[1] + " mean?";
  }
  MC.msgs.push({role:"user", text:q}); const m = {role:"assistant", text:"", done:false}; MC.msgs.push(m); MC.busy = true; draw();
  const c = ctx(), local = () => { m.text = offline(q, c); m.offline = true; m.done = true; };
  if (MC.ai !== false) {
    try {
      const r = await askAI(t => { m.text = t; const el = $("#mc-panel .mc-log .mc-row:last-child .mc-tx"); if (el) { el.innerHTML = esc(t) + '<span class="caret"></span>'; el.closest(".mc-log").scrollTop = 1e9; } });
      m.text = r.text; m.finish = r.finish; m.done = true; MC.ai = true;
      if (/\b(hint|stuck)\b/i.test(q)) MC.hints[screenKey()] = (MC.hints[screenKey()] || 0) + 1;
    } catch (e) { if (!m.text) { MC.ai = false; local(); } else { m.done = true; m.finish = null; } }
  } else local();
  MC.busy = false; draw();
}
function openPanel() {
  let p = $("#mc-panel");
  if (!p) {
    p = document.createElement("div"); p.id = "mc-panel"; p.className = "card"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Chat with Vyapti");
    p.innerHTML = `<div class="mc-hd"><img class="orb" src="${ART}vyapti-speak.jpg" alt="Vyapti"><div class="f1"><b class="lm-pt">Vyapti</b><span class="mini mc-where"></span></div><span class="mc-mode"></span><button type="button" class="btn g sm mc-x" data-mc="close" aria-label="Close chat" title="Close chat">✕</button></div>
      <div class="mc-log" aria-live="polite"></div><div class="mc-chips"></div>
      <form class="mc-in"><input type="text" maxlength="400" placeholder="Ask Vyapti… e.g. what is a token?" aria-label="Message Vyapti"><button type="submit" class="btn sm">Send</button></form>`;
    document.getElementById("lm-root").appendChild(p);
    p.querySelector("form").onsubmit = e => { e.preventDefault(); const i = p.querySelector("input"); ask(i.value); i.value = ""; };
  }
  p.hidden = false; MC.open = true; draw();
  setTimeout(() => { if (innerWidth > 700) p.querySelector("input").focus(); }, 50);
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-mc],[data-mc-q]"); if (!b) return;
  e.stopImmediatePropagation();
  if (b.dataset.mcQ) return ask(b.dataset.mcQ);
  if (b.dataset.mc === "open") return MC.open && !$("#mc-panel").hidden ? ($("#mc-panel").hidden = true, MC.open = false) : openPanel();
  if (b.dataset.mc === "close") { $("#mc-panel").hidden = true; MC.open = false; }
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && MC.open) { const p = $("#mc-panel"); if (p) p.hidden = true; MC.open = false; return; } if (e.target.closest && e.target.closest("#mc-panel")) e.stopPropagation(); }, true);
document.addEventListener("DOMContentLoaded", () => {
  const bar = document.querySelector("#demo-bar .lm-bar") || document.getElementById("demo-bar");
  const b = document.createElement("button"); b.type = "button"; b.className = "btn sm g mc-btn"; b.dataset.mc = "open"; b.title = "Chat with Vyapti, your mentor";
  b.innerHTML = `<img src="${ART}vyapti-speak.jpg" alt=""><span>Ask Vyapti</span>`;
  bar.insertBefore(b, bar.firstChild);
  // refresh "where am I" + chips when the screen changes
  let last = ""; setInterval(() => { if (!MC.open) return; const k = screenKey(); if (k !== last) { last = k; if (!MC.busy) draw(); } }, 800);
});
window.vyaptiMentor = { ask, offline: q => offline(q, ctx()), ctx };
})();
