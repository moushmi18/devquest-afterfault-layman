/* Layman help layer. Sits on top of the existing game; never edits story text. */
(function () {
const G = {}; LM_GLOSS.forEach(g => G[g[0]] = {k:g[0], t:g[1], grp:g[2], d:g[3], a:g[4]});
const LS = { get(k, d) { try { const v = localStorage.getItem("dqlm." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
             set(k, v) { try { localStorage.setItem("dqlm." + k, JSON.stringify(v)); } catch (e) {} } };
const pref = { terms: LS.get("terms", true), explain: LS.get("explain", false) };

/* ---------- plain-text jargon rules (first occurrence per screen gets a dotted underline) */
const TERM_RULES = [
 [/finish[_ ]reason|finish signal/i,"finish_reason"],[/\bkeep-alives?\b/i,"keepalive"],[/\[DONE\]/,"done"],[/\bSSE\b/,"sse"],
 [/\bmax tokens\b|\btoken limit\b/i,"maxtokens"],[/\btokens?\b/i,"token"],[/\bstream(?:s|ing|ed)?\b/i,"streaming"],[/\bchunks?\b/i,"chunk"],
 [/\bflush(?:ed)?\b/i,"flush"],[/\b(?:output )?buffer\b/i,"buffer"],[/\bLLM\b/,"llm"],[/\bAPIs?\b/,"api"],[/\bdelta\b/,"delta"],
 [/\brole-only\b/i,"roleonly"],[/\busage\b/i,"usage"],[/\bNone\b/,"none"],[/\bKeyError\b/,"keyerror"],[/\bTypeError\b/,"typeerror"],
 [/\bIndexError\b/,"indexerror"],[/\bConnectionError\b/,"connerror"],[/\bretry storm\b/i,"storm"],[/\bretr(?:y|ies|ying)\b/i,"retry"],
 [/\brate-limit\w*|\b429\b/i,"ratelimit"],[/\btruncated\b/i,"truncated"],[/\bpartial\b/i,"partial"],[/\btemperature\b/i,"temperature"],
 [/\bCLI\b/,"cli"],[/\bterminal\b/i,"terminal"],[/\bstderr\b/,"stderr"],[/\bconsumer\b/i,"consumer"],[/\bRegenerate\b/i,"regenerate"],
 [/\bhistory\b/i,"history"],[/\bLine Keeper\b/i,"linekeeper"],[/\bops wall\b/i,"opswall"],[/\bAll[- ]Good\b/i,"allgood"],
 [/\bhonest (?:status|label)s?\b/i,"honest"],[/\b(?:single|one) pass\b/i,"singlepass"],[/\bnewline\b/i,"newline"],[/\bPython\b/,"python"],
 [/\bguard(?:s|ed)?\b/i,"guard"],[/\bVyapti\b/,"@vyapti"],[/\bIla(?:'s)?\b/,"@ila"],[/\bTanvi\b/,"@tanvi"],[/\bRohan(?:'s)?\b/,"@rohan"],
 [/\bSamar\b/,"@samar"],[/\bSana\b/,"@sana"],
];
const CODE_RULES = [
 [/finish_reason/,"finish_reason"],[/flush/,"flush"],[/end=/,"end"],[/stream=/,"streamtrue"],[/"stop"|^stop$/,"stop"],[/"length"|^length$/,"length"],
 [/\.get\(/,"get"],[/^None$/,"none"],[/\[DONE\]/,"done"],[/keep-alive/,"keepalive"],[/delta/,"delta"],[/content/,"content"],[/choices/,"choices"],
 [/usage/,"usage"],[/KeyError/,"keyerror"],[/append|parts/,"append"],[/join/,"join"],[/temperature/,"temperature"],[/if piece/,"guard"],
 [/break|continue/,"breakcont"],[/try|except/,"tryexcept"],
];
const SKIP = "h1,h2,h3,.kick,.lbl,.ava,.hub-world,.lm-sw,script,style,svg,button,[data-act],[data-hub],input,textarea,.code,.term,.top,.hub-map,.rail,.lm-term,.lm-star,kbd,.ddb,.dds,.ddp,.xd-ghost,[data-xd],[data-xt]";

const app = () => document.getElementById("app");
function wrapTerms(root) {
  if (!pref.terms) return;
  const seen = new Set();
  root.querySelectorAll("code.inline").forEach(c => {
    if (c.closest(SKIP) || c.dataset.lm) return;
    const r = CODE_RULES.find(([re]) => re.test(c.textContent));
    if (r) { c.dataset.lm = r[1]; c.classList.add("lm-term", "lm-code"); }
  });
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode(n) {
    if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
    const p = n.parentElement; if (!p || p.closest(SKIP) || p.closest("code")) return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT; } });
  const nodes = []; while (tw.nextNode()) nodes.push(tw.currentNode);
  nodes.forEach(n => {
    let txt = n.nodeValue, best = null;
    for (const [re, k] of TERM_RULES) {
      if (seen.has(k)) continue;
      const m = txt.match(re); if (m && (!best || m.index < best.i)) best = {i:m.index, s:m[0], k};
    }
    if (!best) return;
    seen.add(best.k);
    const span = document.createElement("span"); span.className = "lm-term"; span.dataset.lm = best.k; span.textContent = best.s;
    const after = n.splitText(best.i); after.nodeValue = after.nodeValue.slice(best.s.length);
    n.parentNode.insertBefore(span, after);
  });
}
/* ---------- * = sample number */
function wrapStars(root) {
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode(n) {
    if (n.nodeValue.indexOf("*") < 0) return NodeFilter.FILTER_REJECT;
    const p = n.parentElement; if (!p || p.closest(".code,.term,.lm-sw,script,style,code")) return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT; } });
  const nodes = []; while (tw.nextNode()) nodes.push(tw.currentNode);
  nodes.forEach(n => {
    const re = /[\w.)]\*/g; let m, parts = [], last = 0, s = n.nodeValue;
    while ((m = re.exec(s))) { parts.push(s.slice(last, m.index + 1)); last = m.index + 2; }
    if (!parts.length) return;
    const frag = document.createElement("span"); frag.className = "lm-sw";
    parts.forEach(t => { frag.appendChild(document.createTextNode(t)); const st = document.createElement("span"); st.className = "lm-star"; st.dataset.lm = "star"; st.textContent = "*"; frag.appendChild(st); });
    frag.appendChild(document.createTextNode(s.slice(last)));
    n.parentNode.replaceChild(frag, n);
  });
}
/* ---------- explain-this-line */
function noteFor(t) { const r = LM_LINES.find(([re]) => re.test(t)); return r ? r[1] : ""; }
function decorateCode(root) {
  root.querySelectorAll(".code").forEach(code => {
    const lns = code.querySelectorAll(".ln");
    if (!lns.length) return;
    code.classList.toggle("lm-exp", pref.explain);
    lns.forEach(ln => { if (ln.dataset.lmNote == null) { const t = (ln.lastElementChild || ln).textContent; ln.dataset.lmNote = noteFor(t.replace(/\u00a0/g, " ")); } });
    const hd = code.querySelector(".codehd");
    if (hd && !hd.querySelector(".lm-xbtn")) {
      const b = document.createElement("span"); b.className = "chip lm-xbtn" + (pref.explain ? " dk" : ""); b.setAttribute("role", "button"); b.tabIndex = 0;
      b.textContent = pref.explain ? "✓ Explain lines" : "💡 Explain lines"; b.title = "Show a plain-English note for each line";
      hd.appendChild(b);
    }
  });
  root.querySelectorAll(".ddb[data-bid]").forEach(b => { if (!b.title) { const n = noteFor(b.textContent.replace(/\u00a0/g, "___")); if (n) b.title = n; } });
}
/* ---------- alt text + map/stage hints */
const ALT = { "retry-storm":"Illustrated city of the Retry Storm", "discovery-tanvi":"Tanvi looking at her phone", "vyapti-speak":"Vyapti, the AI mentor orb", "vyapti-idle":"Vyapti, the AI mentor orb", "vyapti-off":"Vyapti, mentor switched off" };
function fixImgs(root) {
  root.querySelectorAll("img").forEach(img => {
    if (img.getAttribute("alt")) return;
    const f = (img.getAttribute("src") || "").split("/").pop().replace(".jpg", "");
    const who = f.split("-")[0];
    img.alt = ALT[f] || (LM_CAST[who] ? LM_CAST[who][0] : "illustration");
  });
  root.querySelectorAll(".fd[title^='npc-'],.fd[title^='item-']").forEach(el => {
    const id = el.title; el.title = id.startsWith("npc-") ? LM_CAST[id.slice(4)][0] : (id === "item-note" ? "Sticky note" : "Half-sent receipt");
  });
  root.querySelectorAll(".rail .st").forEach((st, i) => { st.dataset.lmHint = i; });
  const near = root.querySelector(".hub-near .hub-card b");
  if (near && !root.querySelector(".lm-learn")) {
    const m = near.textContent.match(/^(3\.\d)/);
    if (m && LM_NODE_HINT[m[1]]) { const d = document.createElement("div"); d.className = "mini lm-learn"; d.innerHTML = "<b>What you'll learn:</b> " + LM_NODE_HINT[m[1]]; near.closest(".hub-card").after(d); }
  }
  root.querySelectorAll(".hub-node[data-hub]").forEach(n => { const id = n.dataset.hub.slice(5); n.dataset.lmNode = id; });
}

/* ---------- popover */
const root = document.createElement("div"); root.id = "lm-root"; document.body.appendChild(root);
const pop = document.createElement("div"); pop.id = "lm-pop"; pop.hidden = true; root.appendChild(pop);
function place(el, anchor) {
  const r = anchor.getBoundingClientRect(); el.hidden = false;
  const w = el.offsetWidth, h = el.offsetHeight, vw = innerWidth, vh = innerHeight;
  let x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), vw - w - 8), y = r.bottom + 8;
  if (y + h > vh - 44) y = Math.max(8, r.top - h - 8);
  el.style.left = x + "px"; el.style.top = y + "px";
}
function castHTML(k) { const c = LM_CAST[k]; return `<div class="lm-cast"><img src="${ART}${c[1]}.jpg" alt="${c[0]}"><div><b>${c[0]}</b><p>${c[2]}</p></div></div>`; }
function termHTML(k) {
  if (k[0] === "@") return castHTML(k.slice(1));
  const g = G[k]; if (!g) return "";
  return `<b class="lm-pt">${esc(g.t)}</b><p>${esc(g.d)}</p>${g.a ? `<div class="lm-ana"><i>Like:</i> ${esc(g.a)}</div>` : ""}<button type="button" class="lm-link" data-lm-gloss="${k}">Open glossary →</button>`;
}
let popFor = null;
function showPop(anchor, html) { pop.innerHTML = html; popFor = anchor; place(pop, anchor); }
function hidePop() { pop.hidden = true; popFor = null; }

/* ---------- modal + panels */
function modal(html, cls = "") {
  closeModal();
  const m = document.createElement("div"); m.className = "lm-veil"; m.innerHTML = `<div class="lm-modal card ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  root.appendChild(m); return m;
}
function closeModal() { root.querySelectorAll(".lm-veil").forEach(v => { if (v._t) clearInterval(v._t); v.remove(); }); }

const WELCOME = [
 ["What is this?", `<p><b>DevQuest</b> is a learning game. In this demo mission, <b>The Unfinished Line</b>, you play a junior engineer at <b>Dabba Dash</b>, a made-up food delivery app.</p><p>Its support chatbot keeps stopping mid-sentence (<i>"Your order is on the…"</i>) while the team's dashboard says <b>"All good"</b>. Your job: find out why, and fix it.</p><p class="lm-soft">No coding experience needed. Every technical word has a tap-to-explain.</p>`],
 ["The one big idea", `<p>AI chatbots send their replies <b>piece by piece</b> (this is called <i>streaming</i>), like live cricket commentary, ball by ball.</p><p>A reply only counts as <b>finished</b> when it sends its own <b>finish signal</b>. If the words just stop, it isn't done, it's broken. Quiet isn't done.</p>${tryitHTML()}`],
 ["7 short stages", `<ol class="lm-stages">${STAGES.map((s, i) => `<li><b>${s}</b> ${LM_STAGE_HINT[i]}</li>`).join("")}</ol>`],
 ["How to play", `<ol class="lm-steps"><li>On the map, walk to the glowing <b>3.5</b> tower (tap the map, or use the arrow keys) and press <b>Enter mission</b>.</li><li>Pick who's on shift and watch the short intro.</li><li>Work through the stages shown along the top. Each one ends with a short <b>"What you just learned"</b> recap.</li><li>Your progress saves on this device, so a refresh won't lose it. <b>Restart</b> clears it.</li></ol><p class="lm-soft">A <b>*</b> next to a number (like <b>0* XP</b>) means it's a sample value for this demo, not an error.</p>`],
 ["Who's who", `<div class="lm-castgrid">${Object.keys(LM_CAST).map(castHTML).join("")}</div>`],
 ["Help is always here", `<ul class="lm-steps"><li><span class="lm-term">Dotted words</span>: tap or hover for a plain-English meaning.</li><li><b>Help</b> (bottom bar): reopen this guide, take a quick tour of the screen, see recaps.</li><li><b>Glossary</b>: every term, with an everyday comparison.</li><li><span class="chip">💡 Explain lines</span> on code panels: a simple note for each line of code.</li></ul>`],
];
function welcome(i = 0) {
  const [t, body] = WELCOME[i], last = i === WELCOME.length - 1;
  const m = modal(`<div class="kick">Welcome · ${i + 1} of ${WELCOME.length}</div><h2>${t}</h2><div class="lm-body">${body}</div>
    <div class="lm-dots">${WELCOME.map((_, j) => `<i class="${j === i ? "on" : ""}"></i>`).join("")}</div>
    <div class="row lm-foot"><button type="button" class="btn g sm" data-lm="wskip">${last ? "Close" : "Skip"}</button><span class="sp"></span>${i ? `<button type="button" class="btn g sm" data-lm="wprev">Back</button>` : ""}${last ? `<button type="button" class="btn g sm" data-lm="tour">Quick tour</button><button type="button" class="btn sm" data-lm="wskip">Start playing</button>` : `<button type="button" class="btn sm" data-lm="wnext">Next</button>`}</div>`, "lm-welcome");
  m.dataset.i = i; LS.set("welcomed2", true); armTry(m);
}
/* try-it widget */
function tryitHTML() {
  return `<div class="lm-try card"><div class="row" style="align-items:center;gap:8px"><b class="pop" style="color:#301768;font-size:14px">Try it</b><span class="mini">watch a reply arrive word by word</span></div>
   <div class="phone lm-tphone"><div class="b u">Where is my order?</div><div class="b bot lm-tout">&nbsp;</div><div class="lm-tstat"></div></div>
   <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><button type="button" class="tog lm-tfin" aria-pressed="true">Finish signal arrives <div class="sw"></div></button><button type="button" class="btn sm" data-lm="tplay">▶ Send reply</button></div></div>`;
}
function armTry(scope) {
  const w = scope.querySelector(".lm-try"); if (!w) return;
  w.querySelector(".lm-tfin").onclick = e => { const b = e.currentTarget, on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on); b.querySelector(".sw").classList.toggle("off", !on); };
}
function playTry(w) {
  const fin = w.querySelector(".lm-tfin").getAttribute("aria-pressed") === "true";
  const out = w.querySelector(".lm-tout"), st = w.querySelector(".lm-tstat"), words = fin ? GOAL_WORDS : GOAL_WORDS.slice(0, 5);
  const v = w.closest(".lm-veil"); if (v && v._t) clearInterval(v._t);
  let i = 0; out.innerHTML = '<span class="caret"></span>'; st.innerHTML = '<span class="chip">● streaming</span>';
  const t = setInterval(() => {
    if (i < words.length) { out.innerHTML = esc(words.slice(0, ++i).join(" ")) + '<span class="caret"></span>'; return; }
    clearInterval(t); out.innerHTML = esc(words.join(" ")) + (fin ? "" : '<span class="caret"></span>');
    st.innerHTML = fin ? '<span class="chip grn">complete ✓</span><span class="mini">finish_reason: "stop" arrived, so it really is done.</span>'
                       : '<span class="chip amb">partial</span><span class="mini">The words stopped but no finish signal came. Quiet isn\'t done, so no green tick.</span>';
  }, 380);
  if (v) v._t = t;
}
/* recap */
function recap(i, nextMode) {
  const r = LM_RECAP[i], nx = i < 6 ? `<div class="mini lm-next"><b>Next up · ${STAGES[i + 1]}:</b> ${LM_STAGE_HINT[i + 1]}</div>` : "";
  const m = modal(`<div class="kick">Stage ${i + 1} · ${r.s} ${nextMode ? "complete" : "recap"}</div><h2>What you just learned</h2>
   <ul class="lm-pts">${r.pts.map(p => `<li>${ic("check", 14, "#10B981")}<span>${esc(p)}</span></li>`).join("")}</ul>
   <div class="lm-ana"><i>In everyday words:</i> ${esc(r.ana)}</div>${r.tryit ? tryitHTML() : ""}${nx}
   <div class="row lm-foot"><span class="sp"></span><button type="button" class="btn sm" data-lm="close">${nextMode ? "Continue" : "Close"}</button></div>`, "lm-recap");
  armTry(m); fireTerms(m);
}
function fireTerms(scope) { const b = scope.querySelector(".lm-body") || scope.querySelector(".lm-modal"); if (b) wrapTerms(b); }
/* glossary drawer */
function glossary(focus) {
  closeModal(); hidePop();
  const groups = [...new Set(LM_GLOSS.map(g => g[2]))];
  const m = modal(`<div class="row" style="align-items:center"><div><div class="kick">Plain English</div><h2>Glossary</h2></div><span class="sp"></span><button type="button" class="btn g sm" data-lm="close">Close</button></div>
   <input class="lm-search" type="search" placeholder="Search a word, e.g. token" aria-label="Search the glossary">
   <div class="lm-glist">${groups.map(gp => `<div class="lbl">${gp}</div>` + LM_GLOSS.filter(g => g[2] === gp).map(g => `<div class="lm-gi" id="lm-g-${g[0]}"><b class="lm-pt">${esc(g[1])}</b><p>${esc(g[3])}</p><div class="lm-ana"><i>Like:</i> ${esc(g[4])}</div></div>`).join("")).join("")}
   <div class="lbl">People</div>${Object.keys(LM_CAST).map(castHTML).join("")}</div>`, "lm-drawer");
  const s = m.querySelector(".lm-search");
  s.oninput = () => { const q = s.value.toLowerCase(); m.querySelectorAll(".lm-gi").forEach(el => el.hidden = q && !el.textContent.toLowerCase().includes(q)); };
  if (focus) { const el = m.querySelector("#lm-g-" + focus); if (el) { el.classList.add("hl"); setTimeout(() => el.scrollIntoView({block:"center"}), 30); } }
}
/* help menu */
function helpMenu(anchor) {
  showPop(anchor, `<b class="lm-pt">Help</b><div class="lm-menu">
   <button type="button" data-lm="welcome">What is this game?</button><button type="button" data-lm="tour">Quick tour of the screen</button>
   <button type="button" data-lm="gloss">Glossary</button><button type="button" data-lm="try">Try it: the finish signal</button>
   <button type="button" data-lm="recaps">Stage recaps</button>
   <button type="button" data-lm="tg-explain">${pref.explain ? "✓" : "○"} Explain code lines</button><button type="button" data-lm="tg-terms">${pref.terms ? "✓" : "○"} Dotted word hints</button></div>`);
}
/* tour */
const TOUR = [
 [".wm","DevQuest","The learning game. This screen is one mission inside it."],[".mpill","Where you are","The module or mission you're in right now."],
 [".hearts","Hearts","Lives for the final stage. A wrong answer costs one. No real penalty."],[".xp","XP","Your progress points. The * means sample numbers for this demo."],
 [".tog","AI Mentor","On: Vyapti gives friendly coaching tips. Off: short plain instructions."],[".theme-tog","Dark / Light","Switch the colour theme."],
 [".meav","You","The character you picked."],[".rail","The 7 stages","Your path through the mission. Hover a stage to see what it teaches."],
 [".side .obj","Objective","What to do on this screen."],[".side .line","The Line","The reply you're fixing. It fills up as more of it arrives safely."],
 [".side .vy","Vyapti's tip","Stuck? Read the hint here."],[".hub-near","Nearby","What's close to you on the map. Walk to 3.5 to start."],
 [".hub-found","Found","People and clues you've discovered on the map."],["#lm-helpbtn","Help","Reopen the guide, glossary, recaps or this tour any time."],
];
let tourI = 0, tourSteps = [];
function tour() {
  closeModal(); hidePop();
  tourSteps = TOUR.filter(([s]) => { const el = document.querySelector(s); return el && el.getBoundingClientRect().width > 0; }); tourI = 0; tourShow();
}
function tourShow() {
  root.querySelectorAll(".lm-ring,.lm-tbub").forEach(e => e.remove());
  if (tourI >= tourSteps.length) return;
  const [s, t, d] = tourSteps[tourI], el = document.querySelector(s), r = el.getBoundingClientRect();
  const ring = document.createElement("div"); ring.className = "lm-ring";
  Object.assign(ring.style, {left: r.left - 4 + "px", top: r.top - 4 + "px", width: r.width + 8 + "px", height: r.height + 8 + "px"});
  const b = document.createElement("div"); b.className = "lm-tbub card";
  b.innerHTML = `<div class="kick">Tour · ${tourI + 1} of ${tourSteps.length}</div><b class="lm-pt">${t}</b><p>${d}</p><div class="row lm-foot"><button type="button" class="btn g sm" data-lm="tend">End</button><span class="sp"></span><button type="button" class="btn sm" data-lm="tnext">${tourI === tourSteps.length - 1 ? "Done" : "Next"}</button></div>`;
  root.append(ring, b); place(b, ring);
}

/* ---------- save / restore progress */
const SAVE_KEY = "dqlm.save.v1";
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state, (k, v) => (k === "_xpPop" || k[0] === "_" && typeof v === "number") ? undefined : v)); } catch (e) {}
}
function restore() {
  let s; try { s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch (e) {}
  if (!s || typeof s !== "object" || !s.scene) return;
  const base = initialState();
  for (const k in s) { if (!(k in base)) continue; const b = base[k], v = s[k]; base[k] = (b && v && typeof b === "object" && !Array.isArray(b)) ? Object.assign(b, v) : v; }
  base.exPlaying = false; base.shakeBoss = false; base._xpPop = false; base.bugToast = null;
  if (base.testStates && base.testStates.includes("pend")) { base.testStates = null; base.testsDone = false; }
  if (base.dq && base.dq.raced) base.dq.raceDone = true;
  Object.assign(base.hub, {walking:false, target:null, pending:null});
  if (base.xq) { base.xq.zoomAnim = false; base.xq.enter = false; }
  if (base.scene === "intro") base.intro = introInit();
  state = base;
}
restore();
const _restart = restart; restart = function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} _restart(); };
let jumped = false; const _jump = jumpStage; jumpStage = function (i) { jumped = true; _jump(i); };

/* ---------- per-render pass via MutationObserver */
const SCN = {disc:0, explore:1, assign:2, pred:3, code:4, debug:5, boss:6, rewards:7, cliff:7, mapEnd:7};
let prevStage = null, saveT = null, mo;
function pass() {
  const a = app(); if (!a) return;
  mo.disconnect();
  try { fixImgs(a); decorateCode(a); wrapStars(a); wrapTerms(a); mobileStrip(); } catch (e) { console.warn("layman pass", e); }
  mo.observe(a, {childList:true, subtree:true});
  const cur = SCN[state.scene] != null ? SCN[state.scene] : null;
  if (prevStage != null && cur != null && cur === prevStage + 1 && !jumped && !root.querySelector(".lm-veil")) recap(prevStage, true);
  if (cur != null || state.scene === "map") prevStage = cur;
  jumped = false;
  clearTimeout(saveT); saveT = setTimeout(save, 300);
}
let raf = 0; mo = new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; pass(); }); });
function boot() {
  const a = app(); if (!a) return;
  prevStage = SCN[state.scene] != null ? SCN[state.scene] : null;
  mo.observe(a, {childList:true, subtree:true}); pass();
  const bar = document.getElementById("demo-bar");
  const box = document.createElement("span"); box.className = "lm-bar";
  box.innerHTML = `<button type="button" class="btn sm lm-whatbtn" data-lm="welcome" title="Open the welcome guide">What is this?</button><button type="button" class="btn sm g" id="lm-helpbtn" data-lm="help">? Help</button><button type="button" class="btn sm g lm-glossbtn" data-lm="gloss">Glossary</button>`;
  bar.insertBefore(box, bar.querySelector("[data-act=restart]"));
  if (!LS.get("welcomed2", false)) welcome(0);
  if (typeof fit === "function") fit();
}
document.addEventListener("DOMContentLoaded", boot);
addEventListener("pagehide", save);

/* Legacy pan-canvas helpers removed — true fluid layout lives in css/responsive.css + app.js fit(). */
function mobileStrip() {
  const el = document.getElementById("lm-mob");
  if (el) el.hidden = true;
}
document.body.classList.remove("lm-phone");

/* ---------- events */
let hoverT = null;
function hintFor(el) {
  if (el.matches(".lm-term,.lm-star")) return termHTML(el.dataset.lm);
  if (el.dataset.lmHint != null) { const i = +el.dataset.lmHint; return `<div class="kick">Stage ${i + 1} · ${STAGES[i]}</div><p>${LM_STAGE_HINT[i]}</p>`; }
  if (el.dataset.lmNode) return `<b class="lm-pt">${el.dataset.lmNode}</b><p>${LM_NODE_HINT[el.dataset.lmNode] || ""}</p>`;
  if (el.matches(".lm-exp .ln")) return `<div class="kick">Line ${el.dataset.ln || (el.querySelector(".n") || {}).textContent || ""}</div><p>${esc(el.dataset.lmNote || "Continues the line above.")}</p>`;
  return "";
}
const HOVER_SEL = ".lm-term,.lm-star,[data-lm-hint],[data-lm-node],.lm-exp .ln";
document.addEventListener("mouseover", e => {
  const el = e.target.closest(HOVER_SEL); clearTimeout(hoverT);
  if (!el || el === popFor) return;
  hoverT = setTimeout(() => { const h = hintFor(el); if (h) showPop(el, h); }, el.matches("[data-lm-hint],[data-lm-node]") ? 350 : 150);
});
document.addEventListener("mouseout", e => { const el = e.target.closest(HOVER_SEL); if (el && !el.contains(e.relatedTarget)) clearTimeout(hoverT); });
document.addEventListener("click", e => {
  const t = e.target;
  // locked stage on the rail: explain, offer preview (the demo let locks open silently)
  const lock = t.closest(".rail .st.lock");
  if (lock) { e.stopImmediatePropagation(); e.preventDefault(); const i = +lock.dataset.i;
    showPop(lock, `<div class="kick">Locked · Stage ${i + 1}</div><b class="lm-pt">${STAGES[i]}</b><p>${LM_STAGE_HINT[i]}</p><p class="lm-soft">Finish the earlier stages to unlock it, or peek ahead (demo).</p><div class="row lm-foot"><span class="sp"></span><button type="button" class="btn g sm" data-lm="close">OK</button><button type="button" class="btn sm" data-lm="peek" data-i="${i}">Preview anyway</button></div>`); return; }
  const term = t.closest(".lm-term,.lm-star");
  if (term && !t.closest(".lm-modal .lm-steps")) { e.stopImmediatePropagation(); showPop(term, termHTML(term.dataset.lm)); return; }
  const xb = t.closest(".lm-xbtn");
  if (xb) { e.stopImmediatePropagation(); setExplain(!pref.explain); return; }
  const ln = t.closest(".lm-exp .ln");
  if (ln && !ln.closest(".debug-find")) { e.stopImmediatePropagation(); showPop(ln, hintFor(ln)); return; }
  const g = t.closest("[data-lm-gloss]"); if (g) { glossary(g.dataset.lmGloss); return; }
  const b = t.closest("[data-lm]");
  if (b) { e.stopImmediatePropagation(); const a = b.dataset.lm, v = b.closest(".lm-veil");
    if (a === "help") return pop.hidden || popFor !== b ? helpMenu(b) : hidePop();
    hidePop();
    if (a === "wnext" || a === "wprev") return welcome(+v.dataset.i + (a === "wnext" ? 1 : -1));
    if (a === "wskip" || a === "close") return closeModal();
    if (a === "welcome") return welcome(0);
    if (a === "gloss") return glossary();
    if (a === "tour") return tour();
    if (a === "tnext") { tourI++; return tourShow(); }
    if (a === "tend") { tourI = 1e9; return tourShow(); }
    if (a === "tplay") return playTry(b.closest(".lm-try"));
    if (a === "try") { const m = modal(`<div class="kick">Try it</div><h2>Is the reply finished?</h2><p class="lm-soft">Send the reply with and without the finish signal and compare the label.</p>${tryitHTML()}<div class="row lm-foot"><span class="sp"></span><button type="button" class="btn sm" data-lm="close">Close</button></div>`); return armTry(m); }
    if (a === "recaps") return modal(`<div class="kick">Recaps</div><h2>What each stage teaches</h2><div class="lm-menu">${LM_RECAP.map((r, i) => `<button type="button" data-lm="recap" data-i="${i}">Stage ${i + 1} · ${r.s}</button>`).join("")}</div><div class="row lm-foot"><span class="sp"></span><button type="button" class="btn sm" data-lm="close">Close</button></div>`);
    if (a === "recap") return recap(+b.dataset.i, false);
    if (a === "peek") return jumpStage(+b.dataset.i);
    if (a === "tg-explain") return setExplain(!pref.explain);
    if (a === "tg-terms") { pref.terms = !pref.terms; LS.set("terms", pref.terms); document.body.classList.toggle("lm-noterms", !pref.terms); return pass(); }
    return; }
  if (!t.closest("#lm-pop")) hidePop();
  if (t.classList.contains("lm-veil")) closeModal();
}, true);
function setExplain(on) { pref.explain = on; LS.set("explain", on); document.querySelectorAll(".lm-xbtn").forEach(x => x.remove()); pass(); }
document.addEventListener("keydown", e => { if (e.key === "Escape") { hidePop(); closeModal(); tourI = 1e9; tourShow(); } });
document.body.classList.toggle("lm-noterms", !pref.terms);
})();
