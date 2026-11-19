/* DevQuest · Afterfault 3.5 · Streaming Responses — learning layer.
   A teach-first, step-by-step version of the seven stages. Each stage is a list of steps;
   each step = a character introduces it → plain explanation → something to do → feedback → Continue.
   Rendered fluid (not the fixed 1280×720 canvas) so it reads well on phones.
   Old stage screens stay available with ?classic=1. */
const LEARN_ON = !/[?&]classic=1/.test(location.search);
const LX_STAGES = [];          // filled by stage files
const LX_TOTAL_XP = 400;

function lxInit() {
  return { step: [0, 0, 0, 0, 0, 0, 0], done: {}, a: {}, hint: {}, xp: {}, badges: [], tab: "mentor", mq: {}, code: {}, stageDone: [0, 0, 0, 0, 0, 0, 0], summary: -1, helpOpen: false };
}
function LS_() { if (!state.L || !state.L.step) state.L = lxInit(); return state.L; }
function lxA(id) { const L = LS_(); return L.a[id] || (L.a[id] = {}); }
const lxIsStage = (s) => ["disc", "explore", "assign", "pred", "code", "debug", "boss"].includes(s);
const LX_SCENE = ["disc", "explore", "assign", "pred", "code", "debug", "boss"];
function lxStageIdx() { return LX_SCENE.indexOf(state.scene); }
function lxCurStep() { const i = lxStageIdx(); if (i < 0) return null; const st = LX_STAGES[i]; return st && st.steps[Math.min(LS_().step[i], st.steps.length - 1)]; }

/* ---------- characters: who teaches what (existing Afterfault cast) */
const LX_WHO = {
  vyapti: { n: "Vyapti", r: "AI Mentor", img: "vyapti-speak" },
  rohan: { n: "Rohan", r: "Comms engineer · the customer whose reply froze", img: "rohan-face", happy: "rohan-happy" },
  tanvi: { n: "Tanvi", r: "Lead analyst · Python", img: "tanvi-face", happy: "tanvi-happy" },
  samar: { n: "Samar", r: "Mechanical · assembly lines", img: "samar-face", happy: "samar-happy" },
  sana: { n: "Sana", r: "Civil · failure & risk", img: "sana-face", happy: "sana-happy" },
  ila: { n: "Ila", r: "Runs the status board", img: "ila-face", happy: "ila-happy" },
};
const LX_SUB = { sana: "samar", samar: "sana", tanvi: "sana", rohan: "samar" };
function lxWho(k) { if (k === state.avatar && LX_SUB[k]) return LX_SUB[k]; return k; }
function lxCoachKey() { return state.avatar === "tanvi" ? "sana" : "tanvi"; }

/* ---------- XP & badges (earned for applying ideas, not for clicking Next) */
const LX_BADGES = {
  reader: { n: "Stream Reader", d: "Read a raw stream: chunks, events, the finish signal.", ic: "eye" },
  board: { n: "Honest Board", d: "Handled every live event without a fake green tick.", ic: "shield" },
  seer: { n: "Stream Seer", d: "Predicted what real streaming code does.", ic: "star" },
  keeper: { n: "Line Keeper", d: "Wrote a stream consumer that passes real Python checks.", ic: "code" },
  hunter: { n: "Bug Hunter", d: "Found, explained and fixed five streaming bugs.", ic: "bug" },
  last: { n: "Last Word", d: "Built a streaming chatbot turn that handles every failure honestly.", ic: "crown" },
};
function lxXP() { return Object.values(LS_().xp).reduce((a, b) => a + b, 0); }
function lxAward(key, n, label) {
  const L = LS_(); if (L.xp[key] != null) return;
  L.xp[key] = n; setXP(lxXP()); lxToast(`+${n} XP · ${label}`);
}
function lxBadge(k) { const L = LS_(); if (L.badges.includes(k)) return; L.badges.push(k); lxToast(`Badge earned · ${LX_BADGES[k].n}`, "badge"); }
function lxToast(msg, kind = "") {
  let box = document.getElementById("lx-toasts");
  if (!box) { box = document.createElement("div"); box.id = "lx-toasts"; document.body.appendChild(box); }
  const t = document.createElement("div"); t.className = "lx-toast " + kind; t.textContent = msg; box.appendChild(t);
  setTimeout(() => t.classList.add("out"), 2200); setTimeout(() => t.remove(), 2700);
}

/* ---------- small view helpers */
function lxSay(who, text, opts = {}) {
  const k = who === "me" ? state.avatar : lxWho(who);
  const w = LX_WHO[k] || { n: CHAR[k] ? CHAR[k].first : k, img: k + "-face" };
  const img = opts.happy && w.happy ? w.happy : w.img;
  const name = who === "me" ? `${(CHAR[state.avatar] || {}).first || "You"} · you` : w.n;
  return `<div class="lx-say ${who === "me" ? "me" : ""} ${k === "vyapti" ? "vy" : ""}"><img src="${ART}${img}.jpg" alt="${esc(w.n)}"><div><b>${esc(name)}</b><p>${md(text)}</p></div></div>`;
}
function lxBtn(label, act, extra = "", cls = "") { return `<button type="button" class="btn ${cls}" data-act="${act}" ${extra}>${label}</button>`; }
function lxCard(inner, cls = "") { return `<div class="lx-card ${cls}">${inner}</div>`; }
/* progressive disclosure: long text sits behind a tap */
function lxSplit(t) { t = String(t || ""); const m = t.match(/^([\s\S]+?[.!?])(\*{0,2})\s+(?=[A-Z*`"“(])/); if (!m || m[0].length >= t.length - 2) return [t, ""]; return [m[1] + m[2], t.slice(m[0].length)]; }
function lxFlow(items, cls = "") { return `<div class="lx-flow ${cls}">${items.map((x, k) => (k ? "<i>→</i>" : "") + (Array.isArray(x) ? `<span class="${x[1]}">${md(x[0])}</span>` : `<span>${md(x)}</span>`)).join("")}</div>`; }
function lxMore(label, inner, cls = "") { return `<details class="lx-more ${cls}"><summary>${label}</summary><div>${inner}</div></details>`; }
function lxWhy(t) { const [a, b] = lxSplit(t); return md(a) + (b ? ` ${lxMore("Why?", md(b), "inl")}` : ""); }
/* lesson cards: same look as the Welcome guide modal (lm-veil / lm-modal / lm-dots) */
let LX_DECK = null; const LX_DECKS = {};
function lxTeach(title, rows, opts = {}) {
  if (LX_DECK && !opts.open) {
    rows.forEach((r, k) => LX_DECK.push(Array.isArray(r) ? { t: r[0], b: r[1] } : { t: k ? "" : title, b: r }));
    return `<button type="button" class="lx-lessonbtn" data-act="lx-deck" data-testid="lesson-btn">${ic("bulb", 15, "#B45309")}<b>${md(title)}</b><em>Lesson cards ▸</em></button>`;
  }
  const inner = rows.map(r => Array.isArray(r) ? `<div class="lx-tr"><span>${md(r[0])}</span><p>${md(r[1])}</p></div>` : `<p>${md(r)}</p>`).join("");
  if (!opts.open) return `<details class="lx-teach lx-fold"><summary>${ic("bulb", 15, "#7C3AED")}<b>${md(title)}</b><em>Explain</em></summary>${inner}</details>`;
  return `<div class="lx-teach"><div class="lx-teach-h">${ic("bulb", 16, "#7C3AED")}<b>${md(title)}</b></div>${rows.map(r => Array.isArray(r) ? `<div class="lx-tr"><span>${md(r[0])}</span><p>${md(r[1])}</p></div>` : `<p>${md(r)}</p>`).join("")}</div>`;
}
function lxAnalogy(text) { if (LX_DECK) { LX_DECK.push({ t: "Think of it like this", b: text, ana: 1 }); return ""; } return `<details class="lx-ana lx-fold"><summary>💡 <i>Think of it like this</i></summary>${md(text)}</details>`; }
function lxFb(kind, title, text, clue) { const icn = { ok: "check", bad: "x", am: "bulb", pu: "bulb" }[kind]; return `<div class="fb ${kind} lx-fb" role="status"><span class="ico">${ic(icn, 17, "#fff")}</span><div><b>${md(title)}</b> ${lxWhy(text)}${clue ? `<div class="lx-clue">🔎 ${md(clue)}</div>` : ""}</div></div>`; }
function lxPhone(text, status, opts = {}) {
  const st = { live: ["st-ok", "● streaming"], wait: ["st-am", "… waiting"], complete: ["st-ok", "✓ complete"], partial: ["st-am", "◐ partial · not finished"], truncated: ["st-am", "✂ truncated · hit the length limit"], error: ["st-rd", "⚠ error · connection lost"], lie: ["st-ok lx-lie", "Delivered ✓"], idle: ["mini", ""] }[status || "idle"];
  return `<div class="phone lx-phone ${opts.cls || ""}" ${opts.id ? `id="${opts.id}"` : ""}><div class="ph-h"><span class="logo-dd">RS</span>${esc(opts.title || "Restaurant Support Assistant")}</div>
    <div class="b u">${esc(opts.q || "Where is my order?")}</div>
    ${text != null ? `<div class="b bot"><span class="lx-ptext">${esc(text)}</span>${opts.caret ? '<span class="caret"></span>' : ""}</div>` : (opts.spinner ? `<div class="b bot lx-spin">${ic("spin", 16)} thinking…</div>` : "")}
    <div class="lx-pst ${st[0]}">${st[1]}</div></div>`;
}
function lxCode(src, opts = {}) {
  const lines = src.replace(/^\n/, "").replace(/\n$/, "").split("\n");
  return `<div class="code lx-code ${opts.cls || ""}" ${opts.id ? `id="${opts.id}"` : ""}>${opts.title ? `<div class="codehd"><span class="dots"><i></i><i></i><i></i></span>${esc(opts.title)}</div>` : ""}${lines.map((l, i) => {
    const n = i + 1, mk = (opts.marks || {})[n] || "";
    const click = opts.clickable ? ` data-act="${opts.clickable}" data-ln="${n}" role="button" tabindex="0"` : ` data-ln="${n}"`;
    const tip = (opts.tips || {})[n];
    return `<div class="ln ${mk}"${click}><span class="n">${n}</span><span>${hlLine(l) || " "}${tip ? `<span class="lx-tip">← ${esc(tip)}</span>` : ""}</span></div>`;
  }).join("")}</div>`;
}
function lxTerm(text, opts = {}) { return `<div class="term lx-term ${opts.cls || ""}" ${opts.id ? `id="${opts.id}"` : ""}><span class="dim">$ python ${esc(opts.file || "support_bot.py")}</span>\n${text}</div>`; }
function lxTag(t, cls = "") { return `<span class="chip ${cls}">${md(t)}</span>`; }

/* ---------- choice question: explanation on every option, retry on a wrong pick */
function lxQuiz(id, q) {
  const a = lxA(id);
  const solved = a.solved;
  const ops = q.options.map((o, i) => {
    let st = "";
    if (a.picked && a.picked.includes(i)) st = o.ok ? "ok" : "bad";
    if (solved && !o.ok && !(a.picked || []).includes(i)) st = "dim";
    return `<button type="button" class="opt ${st}" data-act="lx-quiz" data-q="${id}" data-i="${i}" ${solved ? "disabled" : ""}><span class="L">${"ABCDEF"[i]}</span><span>${md(o.t)}</span></button>`;
  }).join("");
  const last = a.last != null ? q.options[a.last] : null;
  const fbh = last ? (last.ok ? lxFb("ok", q.okTitle || "Right.", last.why) : lxFb("bad", "Not quite.", last.why, q.clue ? q.clue + " Try again." : "Try another option.")) : "";
  return `<div class="lx-quiz" data-testid="quiz-${id}"><div class="lx-qp">${md(q.prompt)}</div><div class="opts ${q.one ? "one" : ""}">${ops}</div>${fbh}</div>`;
}
function lxQuizAct(el) {
  const id = el.dataset.q, i = +el.dataset.i, q = LX_QUIZ[id]; if (!q) return;
  const a = lxA(id); if (a.solved) return;
  a.picked = a.picked || []; if (!a.picked.includes(i)) a.picked.push(i);
  a.last = i; a.tries = (a.tries || 0) + 1;
  const step = lxCurStep(); const sa = step ? lxA(step.id) : null;
  if (q.options[i].ok) {
    a.solved = true;
    lxAward("q-" + id, a.tries === 1 ? (q.xp || 4) + 2 : (q.xp || 4), a.tries === 1 ? "first try" : "worked it out");
    if (sa) sa.react = { kind: "ok", text: q.coachOk || "That's the reasoning. Hold on to the why, not just the answer." };
  } else if (sa) sa.react = { kind: "bad", text: q.options[i].coach || q.clue || "Read the explanation under your pick, then try again." };
  if (q.onSolve && a.solved) q.onSolve();
}
const LX_QUIZ = {};
function lxQ(id, q) { LX_QUIZ[id] = q; return lxQuiz(id, q); }

/* ---------- sort-into-buckets: tap a bucket for each card, then Check */
const LX_SORT = {};
function lxSort(id, cfg) {
  LX_SORT[id] = cfg;
  const a = lxA(id); a.pick = a.pick || {};
  const rows = cfg.items.map((it, i) => {
    const p = a.pick[i]; const checked = a.checked; const ok = checked && p === it.b;
    const bad = checked && p != null && p !== it.b;
    return `<div class="lx-sort-row ${ok ? "ok" : ""} ${bad ? "bad" : ""}" data-testid="sort-${id}-${i}">
      <div class="lx-sort-item">${it.html || md(it.t)}</div>
      <div class="lx-sort-bs">${cfg.buckets.map((b, j) => `<button type="button" class="lx-pill ${p === j ? "on" : ""}" data-act="lx-sort" data-s="${id}" data-i="${i}" data-j="${j}" ${a.solved ? "disabled" : ""}>${md(b)}</button>`).join("")}</div>
      ${checked && (ok || bad) ? `<div class="lx-sort-why ${ok ? "ok" : "bad"}">${ok ? ic("check", 14, "#10B981") : ic("x", 14, "#EF4444")} <span>${lxWhy(ok ? it.why : (it.wrong || it.why))}</span></div>` : ""}
    </div>`;
  }).join("");
  const all = cfg.items.every((_, i) => a.pick[i] != null);
  const nBad = a.checked ? cfg.items.filter((it, i) => a.pick[i] !== it.b).length : 0;
  const foot = a.solved ? lxFb("ok", cfg.okTitle || "All sorted.", cfg.okText || "Every card is in the right place.")
    : `<div class="lx-row">${lxBtn("Check", "lx-sort-check", `data-s="${id}" ${all ? "" : "disabled"}`, all ? "p" : "dis")}${a.checked && nBad ? `<span class="lx-need bad">${nBad} to fix. See the red notes.</span>` : `<span class="lx-need">${all ? "Ready." : "Tap a box for each card."}</span>`}</div>`;
  return `<div class="lx-sort" data-testid="sort-${id}">${cfg.prompt ? `<div class="lx-qp">${md(cfg.prompt)}</div>` : ""}${rows}${foot}</div>`;
}
function lxSortAct(act, el) {
  const id = el.dataset.s, cfg = LX_SORT[id], a = lxA(id); if (!cfg) return;
  if (act === "lx-sort") { a.pick[+el.dataset.i] = +el.dataset.j; if (a.checked) a.checked = false; return; }
  a.checked = true; a.tries = (a.tries || 0) + 1;
  const bad = cfg.items.filter((it, i) => a.pick[i] !== it.b);
  const sa = lxA(lxCurStep().id);
  if (!bad.length) { a.solved = true; lxAward("s-" + id, a.tries === 1 ? (cfg.xp || 6) + 2 : (cfg.xp || 6), a.tries === 1 ? "sorted first try" : "sorted"); sa.react = { kind: "ok", text: cfg.coachOk || "Clean sort. You can explain each card now." }; if (cfg.onSolve) cfg.onSolve(); }
  else sa.react = { kind: "bad", text: `${bad.length} card${bad.length > 1 ? "s are" : " is"} in the wrong box. ${bad[0].clue || "Read the red note under it."}` };
}

/* ---------- shell */
function lxRender() {
  const i = lxStageIdx(), st = LX_STAGES[i], L = LS_();
  if (L.summary === i) return lxRenderSummary(i);
  const si = Math.min(L.step[i], st.steps.length - 1), step = st.steps[si], a = lxA(step.id);
  const done = lxStepDone(step);
  const app = document.getElementById("app");
  const doneStages = L.stageDone.findIndex(x => !x); const nDone = doneStages < 0 ? 7 : doneStages;
  setXP(lxXP());
  const stepsNav = st.steps.map((s, k) => {
    const cls = k === si ? "cur" : (L.done[s.id] ? "done" : (k <= lxMaxReach(i) ? "open" : "lock"));
    return `<button type="button" class="lx-sn ${cls}" data-act="lx-goto" data-k="${k}" ${cls === "lock" ? "disabled" : ""} title="${esc(s.title)}"><span>${L.done[s.id] ? ic("check", 11, "#fff") : k + 1}</span><em>${esc(s.short || s.title)}</em></button>`;
  }).join("");
  LX_DECK = []; let body; try { body = step.body(a, step); } finally { LX_DECKS[step.id] = LX_DECK; LX_DECK = null; }
  L.seen = L.seen || {};
  if (!L.deck) {
    if (si === 0 && st.intro && !L.seen["S" + i]) { L.seen["S" + i] = 1; L.seen[step.id] = 1; L.deck = { k: "S" + i, i: 0 }; }
    else if (LX_DECKS[step.id].length && !L.seen[step.id]) { L.seen[step.id] = 1; L.deck = { k: step.id, i: 0 }; }
  }
  const helpOpen = L.helpOpen;
  const html = topbar(null, `Mission 3.5 · Streaming Responses`) + rail(i, nDone, nDone < 7 ? nDone : null) + `
  <div class="lx" data-step="${step.id}" data-testid="lx-step-${step.id}">
    <aside class="lx-side">
      <div class="lx-mission" title="${esc(st.goal)}"><b>Streaming Responses</b></div>
      <div class="lx-steps">${stepsNav}</div>
      <div class="lx-xpbox">${ic("bolt", 14, "#F59E0B")} <b>${lxXP()}</b> / ${LX_TOTAL_XP} XP <span class="sp"></span>${L.badges.map(b => `<span class="lx-bdg" title="${esc(LX_BADGES[b].n)}">${ic(LX_BADGES[b].ic, 13, "#fff")}</span>`).join("")}</div>
    </aside>
    <main class="lx-main">
      <header class="lx-hd"><div class="kick">${STAGES[i]} · ${si + 1}/${st.steps.length}</div>
        <h2 class="lx-title">${md(step.title)}</h2>
        <div class="lx-now">${ic("flag", 14, "#B45309")}<span>${md(step.task)}</span></div></header>
      ${step.who ? lxSay(step.who, step.say, { happy: done && step.happyWhenDone }) : ""}
      <div class="lx-body">${body}</div>
      <footer class="lx-foot">
        ${si > 0 ? lxBtn(ic("play", 12, "currentColor", "transform:scaleX(-1)") + " Back", "lx-back", "", "g sm") : `<span></span>`}
        <span class="lx-need ${done ? "ok" : ""}" data-testid="lx-need">${done ? ic("check", 14, "#10B981") + " " + esc(step.doneText || "Nice!") : esc(step.need || "Finish the task to continue.")}</span>
        ${lxBtn((si === st.steps.length - 1 ? (i === 6 ? "Finish mission" : "Finish stage") : "Continue") + " " + ic("play", 12, "#fff"), "lx-next", done ? "" : "disabled aria-disabled=true", done ? "" : "dis")}
      </footer>
    </main>
    <aside class="lx-help ${helpOpen ? "open" : ""}">${lxHelpPanel(step, a)}</aside>
  </div>` + tagEl(`${STAGES[i]} · ${step.id}`);
  app.innerHTML = html;
  if (step.mount) setTimeout(() => step.mount(a, step), 0);
  lxMountEditors();
  lxDeckDraw();
}
function lxDeckCards(k) {
  if (k.startsWith("C:")) { const c = LX_CONCEPTS[k.slice(2)]; return c ? LX_6Q.map(([q, l]) => ({ t: l, b: c[q], kick: "Ask Vyapti · " + c.name, f: q === "use" ? "" : " " })) : []; }
  if (k[0] === "S") { const i = +k.slice(1), st = LX_STAGES[i]; return (st.intro || []).map(c => Object.assign({ stage: 1 }, c)).concat(LX_DECKS[st.steps[0].id] || []); }
  return LX_DECKS[k] || [];
}
function lxDeckDraw() {
  document.querySelectorAll(".lx-deckv").forEach(v => v.remove());
  const L = LS_(), d = L.deck; if (!d || lxStageIdx() < 0 || L.summary >= 0) return;
  const cards = lxDeckCards(d.k); if (!cards.length) { L.deck = null; return; }
  const n = cards.length, i = Math.min(d.i, n - 1), c = cards[i], last = i === n - 1, si = lxStageIdx();
  let t = c.t; if (!t) for (let j = i; j >= 0 && !t; j--) t = cards[j].t;
  const kick = c.kick ? c.kick : c.stage ? `Stage ${si + 1} · ${STAGES[si]}` : (c.ana ? "Picture it" : "Lesson");
  const foot = c.f != null ? c.f.trim() : (last ? "Next: try it yourself on this screen." : "");
  const v = document.createElement("div"); v.className = "lm-veil lx-deckv";
  v.innerHTML = `<div class="lm-modal card lm-welcome lx-deck" role="dialog" aria-modal="true" data-testid="lesson-card">
    <div class="kick">${kick} · ${i + 1} of ${n}</div><h2>${md(t)}</h2>
    <div class="lm-body">${(Array.isArray(c.b) ? c.b : [c.b]).map(p => `<p>${md(p)}</p>`).join("")}${c.flow ? lxFlow(c.flow, "anim") : ""}${foot ? `<p class="lm-soft">${md(foot)}</p>` : ""}</div>
    <div class="lm-dots">${cards.map((_, j) => `<i class="${j === i ? "on" : ""}"></i>`).join("")}</div>
    <div class="row lm-foot"><button type="button" class="btn g sm" data-act="lx-deck-skip">${last ? "Close" : "Skip"}</button><span class="sp"></span>${i ? `<button type="button" class="btn g sm" data-act="lx-deck-prev">Back</button>` : ""}<button type="button" class="btn sm" data-act="${last ? "lx-deck-skip" : "lx-deck-next"}" data-testid="lesson-next">${last ? "Let's try it" : "Next"}</button></div></div>`;
  v.addEventListener("click", e => { if (e.target === v) { L.deck = null; v.remove(); } });
  (document.getElementById("lm-root") || document.body).appendChild(v);
}
function lxStepDone(step) { const a = lxA(step.id); return step.isDone ? !!step.isDone(a) : !!a.done; }
function lxMaxReach(i) { const st = LX_STAGES[i], L = LS_(); let k = 0; while (k < st.steps.length - 1 && L.done[st.steps[k].id]) k++; return Math.max(k, L.step[i]); }

/* ---------- AI Mentor (Vyapti) + AI Coach (crew) */
const LX_6Q = [["what", "What is it?"], ["simple", "In plain words"], ["why", "Why it matters"], ["how", "How it works"], ["real", "Real life"], ["use", "Can I use it?"]];
function lxHelpPanel(step, a) {
  const L = LS_(), tab = L.tab, coach = LX_WHO[lxCoachKey()], ai = state.aiOn;
  const c = LX_CONCEPTS[step.concept];
  const q = L.mq[step.id] || null;
  let mentor = `<div class="lx-mentor">${lxSay("vyapti", step.mentor || (c ? c.simple : "Ask me anything about this step."))}`;
  if (c) {
    mentor += `<div class="lx-6q"><button type="button" class="lx-asktog" data-act="lx-askv" data-testid="ask-vyapti">${ic("bulb", 13, "#7C3AED")} Ask Vyapti: <b>${esc(c.name)}</b> <span>6 cards ▸</span></button></div>`;
  }
  mentor += `</div>`;
  const hints = step.hints || [];
  const shown = L.hint[step.id] || 0;
  const gate = step.hintGate && !step.hintGate(a);
  const react = a.react;
  let coachH = `<div class="lx-coach">`;
  coachH += react ? `<div class="lx-say ${react.kind === "ok" ? "ok" : "bad"}"><img src="${ART}${react.kind === "ok" ? coach.happy : coach.img}.jpg" alt="${coach.n}"><div><b>${coach.n} · Coach</b><p>${md(react.text)}</p></div></div>`
    : `<div class="lx-say"><img src="${ART}${coach.img}.jpg" alt="${coach.n}"><div><b>${coach.n} · Coach</b><p>${md(step.coachIntro || "Have a go. I'll react to what you try.")}</p></div></div>`;
  if (hints.length) {
    coachH += `<div class="lx-hints"><i>Hints ${shown}/${hints.length}</i>${hints.slice(0, shown).map((h, k) => `<div class="lx-hint"><b>${["Nudge", "Closer", "Almost the answer"][k] || "Hint " + (k + 1)}</b><p>${md(h)}</p></div>`).join("")}
      ${shown < hints.length ? (gate ? `<div class="mini">${esc(step.hintGateText || "Try once first, then hints unlock.")}</div>` : lxBtn(`${ic("bulb", 12)} ${shown ? "Next hint" : "Hint"}`, "lx-hint", "", "g sm")) : ""}</div>`;
  }
  coachH += `</div>`;
  return `<div class="lx-tabs" role="tablist"><button type="button" class="lx-tab ${tab === "mentor" ? "on" : ""}" data-act="lx-tab" data-t="mentor" role="tab"><img src="${ART}${ai ? "vyapti-idle" : "vyapti-off"}.jpg" alt="">AI Mentor</button><button type="button" class="lx-tab ${tab === "coach" ? "on" : ""}" data-act="lx-tab" data-t="coach" role="tab"><img src="${ART}${coach.img}.jpg" alt="">AI Coach${react && react.kind === "bad" ? '<i class="lx-dot"></i>' : ""}</button>
    <button type="button" class="lx-helptog" data-act="lx-helptog" aria-label="Show or hide help">${helpOpenLabel()}</button></div>
    <div class="lx-tabbody">${tab === "mentor" ? mentor : coachH}</div>`;
}
function helpOpenLabel() { return LS_().helpOpen ? "Hide" : "Help"; }

/* ---------- navigation */
function lxNext() {
  const i = lxStageIdx(), st = LX_STAGES[i], L = LS_(), si = L.step[i], step = st.steps[si];
  if (!lxStepDone(step)) return;
  L.done[step.id] = true; L.deck = null;
  if (si < st.steps.length - 1) { L.step[i] = si + 1; lxScrollTop(); return render(); }
  L.stageDone[i] = 1; if (st.onFinish) st.onFinish();
  L.summary = i; lxScrollTop(); render();
}
function lxScrollTop() { const vp = document.getElementById("viewport"); if (vp) vp.scrollTop = 0; window.scrollTo(0, 0); }
function lxJump(i) {
  clearT(); if (typeof xClear === "function") xClear(); if (state.intro) introStop();
  const L = LS_(); L.summary = -1; L.deck = null;
  state.scene = LX_SCENE[i]; state.curStage = i; state.stagesDone = Math.max(state.stagesDone || 0, i);
  lxScrollTop(); render();
}
function lxRenderSummary(i) {
  const st = LX_STAGES[i], L = LS_(), app = document.getElementById("app");
  const doneStages = L.stageDone.findIndex(x => !x); const nDone = doneStages < 0 ? 7 : doneStages;
  const last = i === 6;
  app.innerHTML = topbar(null, "Mission 3.5 · Streaming Responses") + rail(null, nDone, nDone < 7 ? nDone : null) + `
  <div class="lx lx-sum" data-testid="lx-summary-${i}"><main class="lx-main">
    <header class="lx-hd"><div class="kick">${last ? "Mission complete" : `Stage ${i + 1} complete · ${STAGES[i]}`}</div><h2 class="lx-title">${md(st.sumTitle || "What you just learned")}</h2></header>
    ${lxSay(st.sumWho || "vyapti", st.sumSay || "Here's what you can do now.", { happy: true })}
    <div class="lx-sumgrid">${st.learned.map(x => `<div class="lx-card"><b>✓ ${md(x[0])}</b><p>${md(x[1])}</p></div>`).join("")}</div>
    ${last ? lxMasteryReport() : ""}
    ${lxDeckDraw() || ""}<div class="lx-row lx-end">${lxBtn("Review this stage", "lx-review", `data-i="${i}"`, "g")}${last ? lxBtn("Back to the city map " + ic("play", 12, "#fff"), "lx-to-map") : lxBtn(`Start Stage ${i + 2} · ${STAGES[i + 1]} ` + ic("play", 12, "#fff"), "lx-stage-next", `data-i="${i + 1}"`)}</div>
  </main></div>`;
}
function lxMasteryReport() {
  const L = LS_();
  const skills = [
    ["Explain streaming", ["q-d-hyp", "s-d-truth"], 0, 0],
    ["Read chunks & SSE events", ["s-e-sse", "s-e-chunks", "q-e-tok"], 1, 0],
    ["Show text live (end, flush)", ["e-render", "p-P1", "p-P2"], 1, 4],
    ["Assemble with join", ["e-join", "p-P3"], 1, 5],
    ["Honest completion (finish_reason)", ["s-e-finish", "a-board", "p-P6"], 1, 7],
    ["Handle errors & retries", ["q-e-err", "a-board", "m-chat"], 2, 0],
    ["Write a Python consumer", ["c-guided", "c-indep", "m-chat"], 4, 0],
  ];
  return `<div class="lx-card lx-report"><b>Mastery report</b><div class="lx-skills">${skills.map(([n, keys, si, sk]) => {
    const got = keys.filter(k => L.xp[k] != null).length, pct = Math.round(100 * got / keys.length);
    return `<div class="lx-skill"><span>${esc(n)}</span>${pbar(pct, pct === 100 ? "#10B981" : "linear-gradient(90deg,#7C3AED,#F59E0B)", 10)}<em>${pct === 100 ? "solid" : `<button type="button" class="lx-link" data-act="lx-revisit" data-i="${si}" data-k="${sk}">revisit</button>`}</em></div>`;
  }).join("")}</div><div class="lx-badges">${Object.entries(LX_BADGES).map(([k, b]) => `<div class="lx-bcard ${L.badges.includes(k) ? "on" : ""}"><span>${ic(b.ic, 18, "#fff")}</span><div><b>${esc(b.n)}</b><p>${esc(b.d)}</p></div></div>`).join("")}</div></div>`;
}

/* ---------- actions */
function lxAct(act, el) {
  const L = LS_(), step = lxCurStep(), a = step ? lxA(step.id) : null;
  if (act === "lx-next") { lxNext(); return; }
  if (act === "lx-back") { L.deck = null; const i = lxStageIdx(); L.step[i] = Math.max(0, L.step[i] - 1); lxScrollTop(); render(); return; }
  if (act === "lx-goto") { L.deck = null; const i = lxStageIdx(), k = +el.dataset.k; if (k <= lxMaxReach(i)) { L.step[i] = k; lxScrollTop(); render(); } return; }
  if (act === "lx-tab") { L.tab = el.dataset.t; L.helpOpen = true; render(); return; }
  if (act === "lx-helptog") { L.helpOpen = !L.helpOpen; render(); return; }
  if (act === "lx-deck") { L.deck = { k: step.id, i: 0 }; lxDeckDraw(); return; }
  if (act === "lx-deck-next" || act === "lx-deck-prev") { if (L.deck) { L.deck.i = Math.max(0, L.deck.i + (act === "lx-deck-next" ? 1 : -1)); lxDeckDraw(); } return; }
  if (act === "lx-deck-skip") { L.deck = null; lxDeckDraw(); return; }
  if (act === "lx-askv") { if (step.concept && LX_CONCEPTS[step.concept]) { L.deck = { k: "C:" + step.concept, i: 0 }; lxDeckDraw(); } return; }
  if (act === "lx-mq") { L.mq[step.id] = L.mq[step.id] === el.dataset.k ? null : el.dataset.k; render(); return; }
  if (act === "lx-hint") { L.hint[step.id] = (L.hint[step.id] || 0) + 1; L.tab = "coach"; render(); return; }
  if (act === "lx-quiz") { lxQuizAct(el); render(); return; }
  if (act === "lx-sort" || act === "lx-sort-check") { lxSortAct(act, el); render(); return; }
  if (act === "lx-review") { const i = +el.dataset.i; L.summary = -1; L.step[i] = 0; lxScrollTop(); render(); return; }
  if (act === "lx-revisit") { const i = +el.dataset.i; L.step[i] = +el.dataset.k || 0; L.summary = -1; lxJump(i); return; }
  if (act === "lx-stage-next") { L.summary = -1; lxJump(+el.dataset.i); return; }
  if (act === "lx-to-map") { L.summary = -1; L.deck = null; document.querySelectorAll(".lx-deckv").forEach(v => v.remove()); setXP(lxXP()); state.missionDone = true; state.unlocked36 = true; Object.assign(state.hub, { x: .64, y: .68, open: null, target: null, pending: null, near: null, talkI: 0 }); go("mapEnd"); return; }
  if (act === "lx-trailer") { state.intro = introInit(); go("intro"); return; }
  if (step && step.act && step.act[act]) { const r = step.act[act](el, a, step); if (r !== false) render(); return; }
  for (const st of LX_STAGES) for (const s of st.steps) if (s.act && s.act[act]) { const r = s.act[act](el, lxA(s.id), s); if (r !== false) render(); return; }
}

/* ---------- code editor (textarea with line numbers, Tab = 4 spaces, Enter keeps indent) */
function lxEditor(id, starter, opts = {}) {
  const L = LS_(); if (L.code[id] == null) L.code[id] = starter;
  const v = L.code[id], n = v.split("\n").length;
  return `<div class="lx-ed ${opts.cls || ""}" data-testid="editor-${id}"><div class="lx-edhd">${ic("code", 14, "#7C3AED")} <b>${esc(opts.file || "my_code.py")}</b><span class="sp"></span>${opts.reset !== false ? `<button type="button" class="lx-link" data-act="lx-ed-reset" data-ed="${id}">Reset code</button>` : ""}</div>
    <div class="lx-edbox"><pre class="lx-gut" aria-hidden="true">${Array.from({ length: Math.max(n, opts.rows || 12) }, (_, k) => k + 1).join("\n")}</pre><textarea data-ed="${id}" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" rows="${Math.max(n + 1, opts.rows || 12)}" aria-label="Python code editor">${esc(v)}</textarea></div></div>`;
}
const LX_STARTERS = {};
function lxMountEditors() {
  document.querySelectorAll("textarea[data-ed]").forEach(t => {
    if (t._lx) return; t._lx = 1;
    const sync = () => { LS_().code[t.dataset.ed] = t.value; const g = t.parentElement.querySelector(".lx-gut"); const n = t.value.split("\n").length; const want = Math.max(n, +t.getAttribute("rows") - 1); if (g && g._n !== want) { g._n = want; g.textContent = Array.from({ length: want }, (_, k) => k + 1).join("\n"); } if (n + 1 > +t.rows) t.rows = n + 1; };
    t.addEventListener("input", sync);
    t.addEventListener("keydown", e => {
      if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); document.execCommand("insertText", false, "    ") || ins(t, "    "); }
      else if (e.key === "Enter") {
        const s = t.selectionStart, before = t.value.slice(0, s), line = before.slice(before.lastIndexOf("\n") + 1);
        let ind = (line.match(/^\s*/) || [""])[0]; if (/:\s*$/.test(line)) ind += "    ";
        e.preventDefault(); document.execCommand("insertText", false, "\n" + ind) || ins(t, "\n" + ind);
      }
    });
  });
  function ins(t, s) { const a = t.selectionStart, b = t.selectionEnd; t.value = t.value.slice(0, a) + s + t.value.slice(b); t.selectionStart = t.selectionEnd = a + s.length; t.dispatchEvent(new Event("input")); return true; }
}
function lxCodeOf(id) { const t = document.querySelector(`textarea[data-ed="${id}"]`); if (t) LS_().code[id] = t.value; return LS_().code[id] || ""; }

/* ---------- running Python + showing results */
function lxPyBadge() {
  const s = PY.status;
  const t = { idle: ["gry", "Real Python · loads when you press Run"], loading: ["amb", "Loading Python… (first time takes ~10 s)"], ready: ["grn", "Real Python · ready"], error: ["red", "Python didn't load · press Run to retry"] }[s];
  return `<span class="chip ${t[0]} lx-pyb" data-testid="py-status">${ic(s === "loading" ? "spin" : "term", 12)} ${t[1]}</span>`;
}
function lxTests(results) {
  if (!results) return "";
  const pass = results.filter(r => r.pass).length;
  return `<div class="lx-tests" data-testid="tests"><div class="lx-tests-h"><b>Checks</b><span class="chip ${pass === results.length ? "grn" : "red"}">${pass} / ${results.length} passing</span></div>${results.map(r => `<div class="lx-t ${r.pass ? "pass" : "fail"}" data-testid="t-${r.id}"><span class="bx">${ic(r.pass ? "check" : "x", 11, "#fff")}</span><div><b>${esc(r.id)}</b> ${esc(r.name)}${r.why ? `<p>${esc(r.why)}</p>` : ""}</div></div>`).join("")}</div>`;
}
function lxChatText(s) {
  s = String(s || "");
  const m = s.trimEnd().match(/\n\((complete|truncated|partial|error)\)\s*$/);
  if (m) return { text: s.slice(0, m.index), status: m[1] };
  return { text: s, status: null };
}
function lxApplyChat(root, raw, done) {
  if (!root) return;
  const { text, status } = lxChatText(raw);
  const t = root.querySelector(".lx-ptext");
  const st = root.querySelector(".lx-pst");
  if (t) t.textContent = text.replace(/\n+$/, "");
  if (st) {
    const map = { complete: ["st-ok", "✓ complete"], truncated: ["st-am", "✂ truncated · hit the length limit"], partial: ["st-am", "◐ partial · not finished"], error: ["st-rd", "⚠ error · connection lost"] };
    if (done && !status && text.trim()) status = "complete";
    const v = (done && status && map[status]) ? map[status] : [done ? "st-ok" : "st-ok", done ? "● sent" : "● streaming"];
    st.className = "lx-pst " + v[0];
    st.textContent = v[1];
  }
}
function lxChatPreview(id, a, opts = {}) {
  const raw = a.demo ? (a.demo.screen || "") : "";
  const parsed = raw ? lxChatText(raw) : { text: "", status: null };
  if (a.demo && !parsed.status && parsed.text.trim()) parsed.status = "complete";
  return `<div class="lx-chatui" data-testid="chat-preview"><div class="lbl">Chat · live preview</div>${lxPhone(a.demo ? parsed.text : null, a.demo ? (parsed.status || "live") : "idle", { id: "chat-" + id, q: opts.q || "Where is my order?", caret: !parsed.status, spinner: !a.demo })}</div>`;
}
function lxPlayFrames(elId, demo, done) {
  const el = document.getElementById(elId); if (!el || !demo) { done && done(); return; }
  const frames = (demo.frames || []).filter((f, k, arr) => k === 0 || f !== arr[k - 1]);
  let k = 0;
  const out = el.querySelector(".lx-out") || el;
  const chat = document.querySelector("[data-testid=chat-preview] .lx-phone, [data-testid=chat-preview] .phone, #chat-" + (elId || "").replace(/^term-/, ""));
  const tick = () => {
    if (!document.body.contains(out) && !(chat && document.body.contains(chat))) return;
    if (k < frames.length) {
      if (document.body.contains(out)) out.innerHTML = esc(frames[k]) + '<span class="caret"></span>';
      if (chat) lxApplyChat(chat, frames[k], false);
      k++; setTimeout(tick, 380);
    } else {
      if (document.body.contains(out)) out.innerHTML = esc(demo.screen) + (demo.error ? `\n<span class="er">${esc(demo.error)}</span>` : "");
      if (chat) lxApplyChat(chat, demo.screen, true);
      done && done();
    }
  };
  tick();
}
PY.on(() => { const b = document.querySelector(".lx-pyb"); if (b) b.outerHTML = lxPyBadge(); });

/* ---------- context for the "Ask Vyapti" chat */
const LX = {
  ctx() {
    const i = lxStageIdx(), step = lxCurStep(); if (i < 0 || !step) return null;
    const hints = step.hints || [];
    return { where: `Stage ${i + 1} of 7 · ${STAGES[i]} · ${step.title}`, screen: step.title, objective: step.task, tip: step.mentor || "", answer: hints[hints.length - 1] || "" };
  },
};
