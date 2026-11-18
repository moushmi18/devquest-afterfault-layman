/* Discovery + Explore rebuilt: story beats ↔ code visuals, act-to-advance, one persistent machine */
Object.assign(ICONS, {
  wifi: '<path d="M2 9a15 15 0 0120 0M5.5 12.5a10 10 0 0113 0M9 16a5 5 0 016 0" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="12" cy="19.5" r="1.8" fill="currentColor"/>',
  boom: '<path d="M12 2l2 6 6-3-3 6 5 2-6 2 2 7-6-4-5 5 1-7-6-1 5-4-3-5 6 2z" fill="currentColor"/>',
  lens: '<circle cx="10" cy="10" r="6.5" stroke="currentColor" stroke-width="2.8" fill="none"/><path d="M15 15l6 6" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M10 7v6M7 10h6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  film: '<rect x="3" y="5" width="18" height="14" rx="3" fill="currentColor"/><path d="M3 9h18M3 15h18M8 5v4M16 5v4M8 15v4M16 15v4" stroke="#fff" stroke-width="1.6"/>',
  basket: '<path d="M3 9h18l-2 11H5z" fill="currentColor"/><path d="M7 9l5-6 5 6" stroke="currentColor" stroke-width="2.2" fill="none"/>',
  gate: '<path d="M4 21V8a8 8 0 0116 0v13" stroke="currentColor" stroke-width="3" fill="none"/><path d="M4 13h16" stroke="currentColor" stroke-width="2"/>',
  clock: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.6" fill="none"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
  chart: '<rect x="4" y="12" width="4" height="8" rx="1" fill="currentColor"/><rect x="10" y="7" width="4" height="13" rx="1" fill="currentColor"/><rect x="16" y="3" width="4" height="17" rx="1" fill="currentColor"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z" fill="currentColor"/><path d="M3 7l9 4 9-4M12 11v10" stroke="#fff" stroke-width="1.4" fill="none"/>',
  arrow: '<path d="M3 12h15M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
});
const W6 = ["Your ","order ","is ","on ","the ","way."];
const XV_OPTS = { stream:["False","True"], end:['"\\n"','""'], flush:["False","True"], sep:['" "','""'], fin:["None",'"length"','"stop"'] };
function dqInit() { return { step:0, raced:false, raceDone:false, racePick:null, pulls:0, flagged:false, suspect:null, wrong:0, checkPick:null }; }
function xqInit() { return { beat:0, zoom:false, zoomAnim:false, v:{stream:"False", end:'"\\n"', flush:"False", sep:'" "', fin:"None"}, tried:{}, check:{}, basket:false, parts:[null,null,null,null,null,null], gates:{g1:null,g2:null}, lie:false, bin:false, jam:false, r1:[], r2:[], rWrong:null, done:{}, taught:{} }; }
let xTimer = null;
function xClear() { if (xTimer) { clearTimeout(xTimer); xTimer = null; } }

/* ---------- generic drag (pointer, mouse+touch) + tap/keyboard fallback for Discovery/Explore */
const XD = { d:null, sel:null };
function xdActive() { return state.scene==="disc" || state.scene==="explore"; }
document.addEventListener("pointerdown", e => {
  if (!xdActive()) return;
  const el = e.target.closest("[data-xd]");
  if (!el || (e.button!=null && e.button>0)) return;
  e.preventDefault();
  XD.d = { id:el.dataset.xd, el, pid:e.pointerId, x0:e.clientX, y0:e.clientY, started:false };
}, {passive:false});
document.addEventListener("pointermove", e => {
  const d = XD.d; if (!d || e.pointerId!==d.pid) return;
  if (!d.started) {
    if (Math.hypot(e.clientX-d.x0, e.clientY-d.y0) < 5) return;
    const p0 = ddPt({clientX:d.x0, clientY:d.y0}), r = ddRect(d.el);
    d.ox = p0.x - r.x; d.oy = p0.y - r.y;
    const g = d.el.cloneNode(true); g.removeAttribute("data-xd"); g.classList.add("xd-ghost");
    g.style.width = r.w + "px"; ddApp().appendChild(g); d.g = g; d.started = true; d.el.classList.add("xd-src");
  }
  e.preventDefault();
  const p = ddPt(e);
  d.g.style.left = (p.x - d.ox) + "px"; d.g.style.top = (p.y - d.oy) + "px";
  let hit = null;
  document.querySelectorAll("[data-xt]").forEach(t => { const r = ddRect(t); const inn = p.x>=r.x-8 && p.x<=r.x+r.w+8 && p.y>=r.y-8 && p.y<=r.y+r.h+8; t.classList.toggle("xt-hot", inn && !hit); if (inn && !hit) hit = t; });
  d.t = hit;
}, {passive:false});
function xdEnd(e, cancel) {
  const d = XD.d; if (!d || (e && e.pointerId!==d.pid)) return;
  XD.d = null;
  if (!d.started) { if (!cancel) { XD.sel = XD.sel===d.id ? null : d.id; render(); } return; }
  d.g.remove(); d.el.classList.remove("xd-src");
  document.querySelectorAll(".xt-hot").forEach(t => t.classList.remove("xt-hot"));
  if (!cancel && d.t) xdDrop(d.id, d.t.dataset.xt); else render();
}
document.addEventListener("pointerup", e => xdEnd(e, false));
document.addEventListener("pointercancel", e => xdEnd(e, true));
document.addEventListener("click", e => {
  if (!xdActive() || !XD.sel) return;
  const t = e.target.closest("[data-xt]"); if (!t) return;
  const id = XD.sel; XD.sel = null; xdDrop(id, t.dataset.xt);
});
document.addEventListener("keydown", e => {
  if (!xdActive() || (e.key!=="Enter" && e.key!==" ")) return;
  const a = document.activeElement; if (!a || !a.closest) return;
  const s = a.closest("[data-xd]"), t = a.closest("[data-xt]");
  if (s) { e.preventDefault(); XD.sel = XD.sel===s.dataset.xd ? null : s.dataset.xd; render(); }
  else if (t && XD.sel) { e.preventDefault(); const id = XD.sel; XD.sel = null; xdDrop(id, t.dataset.xt); }
});
function xdDrop(id, tk) {
  const q = state.xq;
  if (state.scene==="explore") {
    const b = XBEATS[q.beat].id;
    if (b==="basket" && id==="basket" && tk==="beltEnd") { q.basket = true; q.done[q.beat] = true; }
    else if (b==="join" && id.startsWith("ch") && tk.startsWith("slot")) {
      const ci = +id.slice(2), si = +tk.slice(4);
      if (ci===si && q.parts[si]==null) q.parts[si] = ci; else q.badDrop = Date.now();
    } else if (b==="guard" && id.startsWith("g:") && tk.startsWith("gs")) {
      q.gates[tk.slice(2)] = id.slice(2);
      // a tool can sit in one slot only
      for (const k of ["g1","g2"]) if (k!==tk.slice(2) && q.gates[k]===id.slice(2)) q.gates[k] = null;
    }
  }
  render();
}

/* ---------- small shared pieces */
function bub(who, text) { return `<div class="xbub">${dl(who, text, state.avatar)}</div>`; }
function vyLine(on, off) { return state.aiOn ? on : off; }
function lens(x, y, label) { return `<button type="button" class="xlens" data-act="x-zoom" data-testid="x-zoom" style="left:${x}%;top:${y}%" aria-label="Zoom in">${ic("lens",26,"#fff")}<span>${label||"Zoom in"}</span></button>`; }
function evBtn(k) { const v = state.xq.v[k]; return `<button type="button" class="ev${state.xq.tried[k]?"":" pulse"}" data-act="x-ev" data-k="${k}" data-testid="ev-${k}">${esc(v)}</button>`; }
function xCode(lines, hi=[], title="stream_chat.py") {
  const rows = lines.map((l, i) => {
    const parts = l.split(/\{\{(\w+)\}\}/);
    const html = parts.map((p, j) => j%2 ? evBtn(p) : hlLine(p)).join("");
    return `<div class="ln ${hi.includes(i+1)?"foc":""}"><span class="n">${i+1}</span><span>${html||" "}</span></div>`;
  }).join("");
  return `<div class="code sm xcode"><div class="codehd"><span class="dots"><i></i><i></i><i></i></span>${esc(title)}<span class="sp"></span><span class="chip amb" style="font-size:9.5px">tap a value to change it</span></div>${rows}</div>`;
}
function fbox(label, val, sub="", cls="") { return `<div class="fx ${cls}"><b>${label}</b><div class="fxv">${val}</div>${sub?`<i>${sub}</i>`:""}</div>`; }
function farrow(cls="") { return `<span class="fxa ${cls}">${ic("arrow",22,"currentColor")}</span>`; }
function xCheck(key, q, ops, correct, unlocked) {
  const st = state.xq.check[key];
  if (!unlocked) return `<div class="xcheck locked" data-testid="xcheck-${key}">${ic("lock",14,"#9CA3AF")}<span>Check unlocks after you try the visual</span></div>`;
  const items = ops.map((o, i) => {
    let s = ""; if (st!=null) s = i===correct ? (st===correct?"ok":"") : (i===st ? "bad" : "dim");
    return opt("ABC"[i], o, s, "x-pick", `data-key="${key}" data-i="${i}" data-testid="xpick-${key}-${i}"`);
  }).join("");
  return `<div class="xcheck" data-testid="xcheck-${key}">${chip("CHECK","amb")}<b>${md(q)}</b><div class="opts" style="grid-template-columns:repeat(${ops.length},1fr);flex:1">${items}</div></div>`;
}

/* ================= DISCOVERY ================= */
function discLearn() {
  const terms = DISC_TEACH.terms.map(([k,v]) => `<div class="term-pill"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join("");
  return `<div class="xstage disc learn">
    <div class="learn-hero compact">
      <div class="learn-kicker">${ic("wave",16,"#fff")} Streaming responses · teach first</div>
      <h3>${esc(DISC_TEACH.title)}</h3>
      <p>${DISC_TEACH.lead}</p>
    </div>
    <div class="learn-grid">
      <div class="learn-card"><i>What</i><p>${DISC_TEACH.what}</p></div>
      <div class="learn-card"><i>Why</i><p>${DISC_TEACH.why}</p></div>
      <div class="learn-card"><i>How</i><p>${DISC_TEACH.how}</p></div>
    </div>
    <div class="row" style="gap:10px;align-items:stretch">
      <div class="learn-card f1"><i>Side-by-side</i>
        <div class="compare">
          <div class="cmp"><b>Non-streaming</b><span class="mini">Wait → whole reply</span><div class="b bot dimmy">${ic("spin",14)} …then all at once</div></div>
          <div class="cmp on"><b>Streaming</b><span class="mini">Words as they arrive</span><div class="b bot">Your order is on<span class="caret"></span></div></div>
        </div>
        <p class="mini" style="margin-top:6px">${esc(DISC_TEACH.real)}</p>
      </div>
      <div class="learn-card f1"><i>Technical · OpenAI-style</i>${simLabel("Illustrative")}
        ${codeBlock(DISC_TEACH.tech, "stream_chat.py · idea", {}, "xs")}
      </div>
    </div>
    <div class="terms-row compact">${terms}</div>
  </div>`;
}
function discRace() {
  const d = state.dq;
  const anim = d.raced && !d.raceDone;
  const fin = d.raceDone;
  const wordsB = W6.map((w, i) => `<span class="wd" style="${anim?`animation-delay:${0.25+i*0.5}s`:""}${fin?"opacity:1":""}${!d.raced?"opacity:0":""}">${w}</span>`).join("");
  const pick = d.racePick;
  const phone = (k, title, icon, body) => `<button type="button" class="xphone ${pick===k?"picked":""} ${fin?"can":""}" ${fin && !pick ? `data-act="dq-pick" data-k="${k}"` : ""} data-testid="race-${k}">
      <div class="ph-h"><span class="logo-dd">DD</span>${title}<span class="sp"></span>${ic(icon,16,"#7C3AED")}</div>
      <div class="b u">Where is my order?</div>${body}
      ${fin ? `<div class="xstamp">${k==="a"?"first word 3.2 s":"first word 0.2 s"}</div>` : ""}</button>`;
  const bodyA = !d.raced ? "" : anim ? `<div class="b bot spinbub">${ic("spin",18)}<span class="wd" style="animation-delay:3.1s;position:absolute;left:12px">Your order is on the way.</span></div>` : `<div class="b bot">Your order is on the way.</div>`;
  const bodyB = !d.raced ? "" : `<div class="b bot">${wordsB}${anim?'<span class="caret"></span>':""}</div>`;
  const after = pick ? `<div class="xreveal">${ic("flag",18,"#F59E0B")}<b>Same finish line.</b> B just started 3 s sooner.</div>` : fin ? `<div class="xprompt">${ic("eye",16,"#7C3AED")}Tap the bot that <b>felt</b> faster</div>` : "";
  return `<div class="xstage disc">
    <div class="xana">${ic("chat",16,"#fff")} Like ChatGPT typing as it thinks</div>
    <div class="row" style="gap:28px;justify-content:center;align-items:stretch;flex:1;padding:6px 0">
      ${phone("a","Bot A · all at once","clock",bodyA)}
      <div class="xvs">VS</div>
      ${phone("b","Bot B · live","wave",bodyB)}
    </div>
    <div class="row" style="justify-content:center;align-items:center;gap:12px;min-height:46px">${!d.raced ? btn(ic("play",16,"#fff")+" Send to both","dq-race","data-testid='dq-race'") : after}</div>
  </div>`;
}
function discFreeze() {
  const d = state.dq, n = Math.min(d.pulls, 5), cut = d.pulls >= 5;
  const words = W6.slice(0, n).map((w,i)=>`<span class="wd" style="opacity:1;${i===n-1?"animation:wdPop .3s":""}">${w}</span>`).join("");
  return `<div class="xstage disc freeze ${cut?"cut":""}">
    ${bub("rohan+", cut ? "Hello? It stopped at 'the'." : "Come on, where's my biryani?")}
    <div class="row" style="flex:1;gap:22px;align-items:center;justify-content:center">
      <button type="button" class="xphone big ${cut?"frozen":""}" data-act="dq-pull" data-testid="dq-pull">
        <div class="ph-h"><span class="logo-dd">DD</span>Dabba Dash support<span class="sp"></span><span class="st-ok">● live</span></div>
        <div class="b u">Where is my order?</div>
        <div class="b bot">${words}<span class="caret"></span></div>
        ${cut ? `<div class="xglitch">${ic("glitch",22,"#FCA5A5")}<img src="${ART}ila-face.jpg" alt=""></div>` : `<div class="xtap">${ic("play",14,"#fff")} Tap to pull the next chunk · ${n}/6</div>`}
      </button>
      <div class="col" style="width:300px;gap:12px">
        <div class="xboard ${d.flagged?"flag":""}"><div class="lbl">Ops wall · chat #4412</div>
          ${cut ? (d.flagged
            ? `<div class="xbig bad">${ic("x",26,"#fff")} Not finished</div>`
            : `<button type="button" class="xbig ok" data-act="dq-flag" data-testid="dq-flag">${ic("check",26,"#fff")} Delivered ✓<span>tap if it's lying</span></button>`)
            : `<div class="xbig wait">${ic("spin",22)} streaming…</div>`}
        </div>
        ${cut && d.flagged ? bub("tanvi","That's my chat too. Half a sentence, green tick.") : ""}
        ${cut && !d.flagged ? `<div class="xprompt">${ic("eye",16,"#7C3AED")}More taps do nothing. Check the ops wall.</div>` : ""}
      </div>
    </div></div>`;
}
function discVerdict() {
  const d = state.dq, ok = d.suspect==="flag";
  const sus = [["crash","boom","Bot crashed"],["wifi","wifi","Slow internet"],["flag","flag","No finish signal"]];
  const coach = (w) => `<div class="coach"><span>${w.trim()}</span><i></i><i></i></div>`;
  return `<div class="xstage disc">
    <div class="xana">${ic("flag",16,"#fff")} Finish signal missing — not a crash, not “slow Wi‑Fi”</div>
    <div class="train ${ok?"ok":""}">${ic("bolt",26,"#7C3AED")}<div class="engine">LLM</div>${W6.slice(0,5).map(coach).join("")}
      <div class="coach guard ${ok?"on":""}" data-testid="guard-van">${ok?`${ic("flag",18,"#fff")}<span>finish_reason</span>`:"<span>?</span>"}</div></div>
    <div class="row" style="gap:14px;justify-content:center">${sus.map(([k,icn,t])=>`<button type="button" class="suspect ${d.suspect===k?(k==="flag"?"ok":"bad shake"):""} ${ok&&k!=="flag"?"dim":""}" data-act="dq-sus" data-k="${k}" data-testid="sus-${k}">${ic(icn,34,"currentColor")}<b>${t}</b></button>`).join("")}</div>
    <div class="row" style="justify-content:center;min-height:52px;align-items:center;gap:14px">
      ${ok ? `<div class="xreveal">${ic("check",18,"#10B981")}<b>Nothing crashed.</b> Nobody checked for the finish signal.</div>`
        : d.suspect ? `<div class="xprompt bad">${ic("x",16,"#EF4444")}${d.suspect==="crash"?"Server's fine. Chunks were arriving.":"Rohan's Wi-Fi is fine. Words did arrive."}</div>` : `<div class="xprompt">${ic("search",16,"#7C3AED")}What was missing? Tap a suspect.</div>`}
    </div></div>`;
}
function discCheck() {
  const d = state.dq, c = DISC_CHECK;
  const picked = d.checkPick;
  const ok = picked === c.correct;
  const items = c.ops.map((o, i) => {
    let s = "";
    if (picked != null) s = i === c.correct ? "ok" : (i === picked ? "bad" : "dim");
    return opt("ABC"[i], o, s, "dq-check", `data-i="${i}" data-testid="dq-check-${i}"`);
  }).join("");
  return `<div class="xstage disc">
    <div class="xana">${ic("task",16,"#fff")} Quick check · only what you just learned</div>
    <div class="learn-card" style="max-width:920px;margin:0 auto">
      <i>Understanding check</i>
      <b style="display:block;margin:6px 0 10px;font:700 16px Poppins;color:#301768">${esc(c.q)}</b>
      <div class="opts one">${items}</div>
      ${picked != null ? `<div class="fb ${ok?"ok":"bad"}" style="margin-top:10px"><span class="ico">${ic(ok?"check":"x",15,"#fff")}</span><div>${esc(ok?c.ok:c.bad)}</div></div>` : ""}
    </div>
    <div class="row" style="justify-content:center;min-height:52px;align-items:center;gap:14px">
      ${ok ? `<div class="xxp">+5*</div>${btn("Continue to Explore "+ic("play",14,"#fff"),"to-explore","data-testid='to-explore'")}` : `<div class="xprompt">${ic("bulb",16,"#7C3AED")}Use the Learn + Race + Freeze ideas — no new jargon.</div>`}
    </div></div>`;
}
const DQ_STEPS = [
  ["Learn","What streaming is — and why it matters"],
  ["See","Two bots. Same question."],
  ["Interrupt","The reply that stopped"],
  ["Diagnose","What actually went wrong?"],
  ["Check","Prove you understand"],
];
function renderDisc() {
  const d = state.dq;
  const body = d.step===0 ? discLearn() : d.step===1 ? discRace() : d.step===2 ? discFreeze() : d.step===3 ? discVerdict() : discCheck();
  const tips = [
    ["Read What / Why / How first. Terms are plain English. Then we'll try it.","Read the cards, then continue."],
    ["Same question to both. Watch who talks first.","Press Send. Compare the two bots."],
    [d.pulls>=5 ? "Text stopped. Nothing said finished. Yet the wall says delivered." : "You are the stream. Pull chunks in.", d.pulls>=5 ? "The stream stopped. Flag the ops wall." : "Tap the phone to pull each chunk."],
    ["Quiet isn't done. What signal never came?","Pick the suspect: what was missing?"],
    ["Answer using only what Discovery taught.","Pick the honest diagnosis."],
  ][d.step];
  TIPS._dq = tips;
  const canNext = (d.step===0) || (d.step===1 && d.racePick) || (d.step===2 && d.flagged) || (d.step===3 && d.suspect==="flag");
  const nextLabel = d.step===0 ? "See it in action " : "Next ";
  const dots = DQ_STEPS.map((s,i)=>`<span class="${i===d.step?"c":(i<d.step?"d":"")}">${i+1} · ${s[0]}</span>`).join("");
  const obj = d.step===0 ? "Understand streaming before you touch any control." : "Find out why Rohan's reply froze — using what you just learned.";
  const main = `<div class="main"><div class="hd"><div><div class="kick">Stage 1 · Discovery · ${d.step+1}/5</div><h2>${DQ_STEPS[d.step][1]}</h2></div><div class="sp"></div><div class="stepdots">${dots}</div></div>
    ${body}
    <div class="row" style="justify-content:flex-end;min-height:44px">${canNext && d.step<4?btn(nextLabel+ic("play",14,"#fff"),"dq-next","data-testid='dq-next'"):""}</div></div>`;
  shell({cur:0, done:0, tag:"Discovery · "+DQ_STEPS[d.step][0]}, sidePanel(obj, "_dq", d.step===2?Math.min(d.pulls,5):null, (d.step===3&&d.suspect==="flag")||(d.step===4&&d.checkPick===DISC_CHECK.correct)?"speak":"idle")+main);
}
function dqAct(act, t) {
  const d = state.dq;
  if (act==="dq-race") { d.raced = true; render(); xClear(); xTimer = setTimeout(() => { d.raceDone = true; if (state.scene==="disc") render(); }, 3600); return true; }
  if (act==="dq-pick") { d.racePick = t.dataset.k; render(); return true; }
  if (act==="dq-pull") { if (d.pulls < 5) d.pulls++; else { d.pulls = 6; } render(); if (d.pulls>=5) { const p = document.querySelector('[data-testid="dq-pull"]'); if (p && d.pulls>5) { p.classList.add("shake"); } } return true; }
  if (act==="dq-flag") { d.flagged = true; render(); return true; }
  if (act==="dq-sus") { d.suspect = t.dataset.k; if (d.suspect==="flag") setXP(5); render(); return true; }
  if (act==="dq-check") { d.checkPick = +t.dataset.i; if (d.checkPick===DISC_CHECK.correct) setXP(5); render(); return true; }
  if (act==="dq-next") { d.step++; render(); return true; }
  return false;
}

/* ================= EXPLORE ================= */
const XBEATS = [
  {id:"open",   k:"story", t:"stream=True"},
  {id:"chunks", k:"code",  t:"Chunks & delta"},
  {id:"blank",  k:"story", t:"Buffering"},
  {id:"flush",  k:"code",  t:"end=\"\" + flush=True"},
  {id:"r1",     k:"recap", t:"Recap · live line"},
  {id:"basket", k:"story", t:"parts.append"},
  {id:"join",   k:"code",  t:"\"\".join(parts)"},
  {id:"cut",    k:"story", t:"Interrupted stream"},
  {id:"finish", k:"code",  t:"finish_reason"},
  {id:"jam",    k:"story", t:"Empty / usage chunks"},
  {id:"guard",  k:"code",  t:"Guards"},
  {id:"r2",     k:"recap", t:"Recap · whole consumer"},
];
function xLive() { const v = state.xq.v; return v.stream==="True" && v.end==='""' && v.flush==="True"; }
function goalInfo() {
  const q = state.xq, b = XBEATS[q.beat].id, v = q.v;
  if (b==="open") return v.stream==="True" ? [6,"live","grn"] : [0,"waiting","gry"];
  if (b==="chunks") return v.stream==="True" ? [6,"live","grn"] : [0,"waiting","gry"];
  if (b==="blank") return [0,"blank screen","red"];
  if (b==="flush") return xLive() ? [6,"live","grn"] : [0,"blank screen","red"];
  if (b==="r1") return q.r1.length>=3 ? [6,"live","grn"] : [0,"redo the moves","amb"];
  if (b==="basket") return q.basket ? [6,"live + saved","grn"] : [6,"live · not saved","amb"];
  if (b==="join") return q.parts.every(p=>p!=null) && v.sep==='""' ? [6,"saved whole","grn"] : [6,"live · not saved","amb"];
  if (b==="cut") return [5,"frozen","red"];
  if (b==="finish") return v.fin==='"stop"' ? [6,"complete ✓","grn"] : v.fin==='"length"' ? [6,"truncated","amb"] : [5,"partial","amb"];
  if (b==="jam") return [6,"jammed","red"];
  if (b==="guard") return q.gates.g1==="choices" && q.gates.g2==="piece" ? [6,"complete ✓ + usage","grn"] : [6,"jammed","red"];
  return q.r2.length>=6 ? [6,"WHOLE ✓","grn"] : [6,"redo the moves","amb"];
}
function goalBar() {
  const [n, st, cls] = goalInfo();
  const words = W6.map((w,i)=>`<span class="gw ${i<n?"on":""}">${w.trim()}</span>`).join("");
  return `<div class="xgoal" data-testid="x-goal">${ic("flag",16,"#F59E0B")}<b>GOAL</b><span class="mini" style="font-weight:700">Rohan's reply arrives whole</span><span class="sp"></span>${words}${chip(st,cls)}</div>`;
}
/* the persistent world machine: server → belt → phone, each beat adds a part */
function xWorld(o = {}) {
  const q = state.xq, v = q.v, b = XBEATS[q.beat].id;
  const on = v.stream==="True";
  const nC = o.cut ? 5 : 6;
  const T = 0.55, TR = 2.0;
  const crates = on ? W6.slice(0, nC).map((w, i) => `<span class="crate" style="animation-delay:${i*T}s;--end:${o.basketDrop?"drop":"fade"}">${w.trim()}</span>`).join("")
    + (o.flag ? `<span class="crate flagc" style="animation-delay:${nC*T}s">${ic("flag",14,"#fff")}</span>` : "")
    + (o.usage ? `<span class="crate usec ${o.jam?"jamc":""}" style="animation-delay:${(nC+1)*T}s">${ic("chart",14,"#fff")}</span>` : "")
    : (o.showBig ? `<span class="crate bigc" style="animation-delay:2.6s">whole reply</span>` : "");
  const phoneMode = o.phone || (on ? "live" : "wait");
  const pw = W6.slice(0, nC).map((w, i) => {
    const d = phoneMode==="live" ? i*T+TR : phoneMode==="dump" ? nC*T+TR : 999;
    return `<span class="wd" style="animation-delay:${d}s">${w}</span>`;
  }).join("");
  const phone = `<div class="wphone ${phoneMode}" data-testid="w-phone"><div class="ph-h"><span class="logo-dd">DD</span>Support</div><div class="b u">Where is my order?</div>
    ${phoneMode==="wait" ? `<div class="b bot">${ic("spin",16)}</div>` : `<div class="b bot">${pw}${o.cut||phoneMode!=="live"?'<span class="caret"></span>':""}</div>`}
    ${phoneMode==="blank" ? `<div class="wblank">${ic("eye",14,"#9CA3AF")} nothing on screen</div>` : ""}</div>`;
  const lever = `<button type="button" class="wlever ${on?"on":""} ${o.leverAct?"pulse":""}" ${o.leverAct?'data-act="x-lever"':""} data-testid="x-lever"><span class="knob"></span><code>stream=${v.stream}</code></button>`;
  const server = `<div class="wserver"><div class="leds">${"<i></i>".repeat(6)}</div><b>LLM server</b>${o.guardOn ? `<div class="wmeter">${ic("chart",12,"#fff")} usage 12/7/19</div>`:""}</div>`;
  const bin = o.bin ? `<button type="button" class="wbin ${q.bin?"open":""}" data-act="x-bin" data-testid="x-bin">${q.bin ? `<span class="lbl">held · not shown</span><div class="wrapt" style="gap:3px">${W6.map(w=>`<span class="mini-crate">${w.trim()}</span>`).join("")}</div>` : `${ic("box",18,"#fff")}<span>output buffer</span>`}</button>` : "";
  const basket = (q.basket || o.basketTarget) ? `<div class="wbasket ${q.basket?"on":""}" ${!q.basket&&o.basketTarget?'data-xt="beltEnd" tabindex="0" role="button" aria-label="belt end"':""} data-testid="w-basket">${q.basket?`${ic("basket",18,"#fff")}<code>parts</code>`:"drop here"}</div>` : "";
  const guard = o.guardOn ? `<div class="wguard">${ic("gate",22,"#7C3AED")}</div>` : "";
  const glitch = o.cut ? `<div class="wglitch">${ic("glitch",20,"#FCA5A5")}<img src="${ART}ila-face.jpg" alt="Ila"></div>` : "";
  const board = o.board ? `<button type="button" class="wboard ${q.lie?"bad":""}" ${q.lie?"":'data-act="x-lie"'} data-testid="x-lie">${q.lie?`${ic("x",16,"#fff")} not finished`:`${ic("check",16,"#fff")} Delivered ✓`}</button>` : "";
  const jam = o.jam ? `<button type="button" class="wjam ${q.jam?"open":""}" data-act="x-jam" data-testid="x-jam">${ic("boom",22,"#fff")}<span>${q.jam?'<code>choices: []</code> only usage':"IndexError"}</span></button>` : "";
  return `<div class="xworld ${on?"run":""} ${o.cut?"cut":""}" data-testid="x-world">
    <img class="wbg" src="${ART}retry-storm.jpg" alt="">
    ${server}${lever}
    <div class="wbelt"><div class="stripes"></div>${crates}</div>
    ${guard}${glitch}${board}${jam}${bin}${basket}${phone}
    ${o.extra||""}${o.bubble||""}${o.lens||""}</div>`;
}
function zoomWrap(world, diagram, code, lay="") {
  const q = state.xq;
  if (!q.zoom) return world;
  const w = q.zoomAnim ? `<div class="zoom-out">${world}</div>` : "";
  return `<div class="xzoom">${w}<div class="xdiag ${lay} ${q.zoomAnim?"zin":""}" data-testid="x-diagram"><div class="xdiag-art">${diagram}</div><div class="xdiag-code">${code}</div></div></div>`;
}
function chunkBox(i, cls="") { return `<div class="fx chunk ${cls}"><b>chunk ${i+1}</b><div class="fxv">"${esc(W6[i])}"</div><i>delta.content</i></div>`; }

function beatBody() {
  const q = state.xq, v = q.v, beat = XBEATS[q.beat];
  let stage = "", check = "", tip = ["",""], speak = "idle";
  switch (beat.id) {
    case "open": {
      stage = scKitchen(bub("rohan", v.stream==="True" ? "Words! It's actually talking now." : "Bot's still thinking. Ten minutes now."));
      tip = v.stream==="True" ? ["Pieces leave the server the moment they're written.","Chunks are streaming to the phone."] : ["The server waits to finish everything. Flip the stream lever.","Flip the lever to stream=True."];
      if (v.stream==="True") q.done[q.beat] = true;
      break; }
    case "chunks": {
      const many = v.stream==="True";
      const diag = `<div class="fxrow lay-fan">${fbox("stream", `<code>${many?"6 chunks":"1 reply"}</code>`, "client.chat…create()", "src")}${farrow()}
        ${many ? `<div class="fxlist">${W6.map((_,i)=>chunkBox(i)).join("")}</div>` : `<div class="fx big wait"><b>response</b><div class="fxv">"Your order is on the way."</div><i>${ic("clock",11,"currentColor")} after 3.2 s</i></div>`}</div>
        <div class="fxnote">${many?ic("bolt",14,"#F59E0B")+" first chunk in 0.2 s*":ic("clock",14,"#EF4444")+" nothing until the end"}</div>`;
      const code = xCode(['stream = client.chat.completions.create(', '    model=MODEL, messages=msgs,', '    stream={{stream}},', ')', 'for chunk in stream:', '    ...'], many?[5]:[3]);
      stage = zoomWrap(scDock(lens(36, 84, "Zoom into the pallet")), diag, code, "lay-fan");
      const unl = !!q.tried.stream && many;
      check = q.zoom ? xCheck("chunks", "`stream=True` sends…", ["one big reply", "small chunks, as written"], 1, unl) : "";
      tip = q.zoom ? (unl ? ["Same words. Delivered in pieces.","stream=True → many small chunks."] : ["Change `stream` to False, watch the belt, then back.","Tap the stream value. Compare. Set it back to True."]) : ["Each crate is a chunk. Zoom in.","Tap the lens on the pallet."];
      if (q.check.chunks===1 && many) q.done[q.beat] = true;
      break; }
    case "blank": {
      stage = scTank(bub("rohan", "Crates keep coming. My screen's still blank."), q.bin ? "" : `<span class="xhint" style="left:44%;top:20%">${ic("search",14,"#fff")} tap the tank</span>`);
      tip = q.bin ? ["Python holds printed text in a buffer until a newline or the end.","Words are held in the output buffer, not shown."] : ["Chunks crossed the internet and reached home. Find where they wait.","Tap the output buffer tank in the hallway."];
      if (q.bin) q.done[q.beat] = true;
      break; }
    case "flush": {
      const live = xLive(), nl = v.end==='"\\n"', held = v.flush==="False";
      const delays = W6.map((_, i) => held ? 6*0.5+0.2 : i*0.5+0.2);
      const screen = W6.map((w, i) => `<span class="wd" style="animation-delay:${delays[i]}s">${esc(w)}</span>${nl?"<br>":""}`).join("");
      const bufw = W6.map((w, i) => `<span class="wd" style="animation-delay:${i*0.5}s">${esc(w.trim())}</span>`).join("");
      const diag = `<div class="fxrow">${fbox("piece", `<code>"order "</code>`, "one chunk", "src")}${farrow()}
        <div class="fx ${held?"hold":""}"><b>output buffer</b><div class="fxv wrapt" style="gap:3px;min-height:40px">${held?bufw:'<span class="mini">passes straight through</span>'}</div><i>${held?"held until the end":"flushed every piece"}</i></div>${farrow(held?"blocked":"")}
        <div class="fx screen"><b>Rohan's screen</b><div class="fxv term">${screen}</div><i>${live?"one line, live":nl?"one word per line":"all at once, late"}</i></div></div>`;
      const code = xCode(['for chunk in stream:', '    piece = ...', '    print(piece, end={{end}}, flush={{flush}})'], [3], "show_live.py");
      stage = zoomWrap(scPanel(lens(50, 86, "Zoom behind the dials")), diag, code, "lay-pipe");
      const unl = live && q.tried.end && q.tried.flush;
      check = q.zoom ? xCheck("flush", "`flush=True` means…", ["push to the screen now", "add a new line"], 0, unl) : "";
      tip = q.zoom ? (live ? ["One line, every word the moment it lands.","end=\"\" keeps one line. flush=True shows it now."] : ["Break it, then fix it. Tap `end` and `flush`.","Set end to \"\" and flush to True."]) : ["Zoom behind the dials.","Tap the lens."];
      if (q.check.flush===0 && live) q.done[q.beat] = true;
      break; }
    case "r1": {
      const moves = [["stream","stream=True","Open the stream"],["end",'end=""',"Stay on one line"],["flush","flush=True","Push it now"]];
      const tiles = moves.map(([k, val, lab], i) => {
        const did = q.r1.includes(k), bad = q.rWrong===k;
        return `<button type="button" class="rtile ${did?"did":""} ${bad?"bad shake":""}" data-act="x-r1" data-k="${k}" data-testid="r1-${k}"><span class="rn">${did?ic("check",16,"#fff"):i+1}</span><code>${did?esc(val):"?"}</code><b>${lab}</b></button>`;
      }).join(farrow());
      const all = q.r1.length>=3;
      stage = `<div class="xrecap"><div class="rhd">${ic("refresh",18,"#B45309")}<b>From the start</b><span>Redo the moves in order. Fast.</span></div><div class="rrow">${tiles}</div>
        ${scMontage(XR1, (() => { const L = {stream:[0,1], end:[2,3], flush:[5]}; return q.r1.flatMap(k => L[k]||[]); })(), all, bub("rohan+", "Live, one line. Finally."))}</div>`;
      tip = all ? ["Halfway. The reply shows live. Next: keep it.","Recap done. Continue."] : ["Stream, line, flush. In that order.","Tap the three moves in order."];
      if (all) q.done[q.beat] = true; speak = all ? "speak" : "idle";
      break; }
    case "basket": {
      const tray = q.basket ? "" : `<div class="xtray"><span class="lbl">Drag onto the belt end on the desk</span><div class="tool ${XD.sel==="basket"?"sel":""}" data-xd="basket" tabindex="0" role="button" data-testid="tool-basket">${ic("basket",20,"#fff")}<code>parts = []</code></div></div>`;
      stage = `<div class="col" style="flex:1;gap:8px;min-height:0">${scPacking(bub("tanvi", q.basket ? "Every crate kept. Ops can log it." : "Ops needs the whole reply saved, not just shown."))}${tray}</div>`;
      tip = q.basket ? ["Shown and kept, in the same pass.","Chunks now drop into parts."] : ["Crates vanish after showing. Catch them.","Drag the parts basket to the belt end."];
      break; }
    case "join": {
      const placed = q.parts.filter(p=>p!=null).length, full = placed===6;
      const order = [3,0,5,2,4,1];
      const tray = order.filter(i => !q.parts.includes(i)).map(i => `<div class="fx chunk drag ${XD.sel==="ch"+i?"sel":""}" data-xd="ch${i}" tabindex="0" role="button" data-testid="drag-ch${i}"><b>chunk</b><div class="fxv">"${esc(W6[i])}"</div></div>`).join("");
      const slots = q.parts.map((p, i) => p!=null ? `<div class="fx slot on"><b>[${i}]</b><div class="fxv">"${esc(W6[p])}"</div></div>` : `<div class="fx slot" data-xt="slot${i}" tabindex="0" role="button" data-testid="slot-${i}"><b>[${i}]</b><div class="fxv">&nbsp;</div></div>`).join("");
      const sep = v.sep==='""' ? "" : " ";
      const joined = full ? W6.map(w => w.replace(/ /g, sep===" " ? "··" : "·")).join(sep===" " ? "·" : "") : "";
      const diag = `<div class="col" style="gap:10px;width:100%"><div class="fxtray ${q.badDrop && Date.now()-q.badDrop<600?"shake":""}">${tray || `<span class="mini">${ic("check",12,"#10B981")} all chunks placed</span>`}</div>
        <div class="fxrow"><div class="fxarr"><span class="lbl">parts</span><div class="fxlist">${slots}</div></div></div>
        ${full ? `<div class="fxrow">${fbox("join", `<code>${esc(v.sep)}.join(parts)</code>`, "", "src")}${farrow()}${fbox("text", `<code class="${sep?"bad":""}">${esc(joined)}</code>`, sep ? "· = space · doubled" : "one clean line", sep?"bad":"ok")}</div>` : ""}</div>`;
      const code = xCode(['parts = []', 'for chunk in stream:', '    ...', '    parts.append(piece)', 'text = {{sep}}.join(parts)'], full?[5]:[4], "keep_it.py");
      stage = zoomWrap(scCouple(lens(50, 84, "Zoom into the phone")), diag, code, "lay-couple");
      const unl = full && q.tried.sep && v.sep==='""';
      check = q.zoom ? xCheck("join", "Why join with `\"\"`?", ["chunks carry their own spaces", "Python needs it"], 0, unl) : "";
      tip = q.zoom ? (!full ? ["Drag each chunk into its slot, in order.","Drag chunks into parts[0]…[5]."] : unl ? ["One pass: shown, kept, joined.","Joined cleanly."] : ["Look at the spaces. Change the separator.","Tap the separator value."]) : ["Zoom into the phone.","Tap the lens."];
      if (q.check.join===0 && unl) q.done[q.beat] = true;
      break; }
    case "cut": {
      stage = scBridge(bub("tanvi", q.lie ? "Quiet isn't done. Someone has to check." : "Delivered? It stopped at 'the'."));
      tip = q.lie ? ["The words stopped. No finish flag ever arrived.","Flagged. No finish signal came."] : ["Ila's storm cut the Wi-Fi link. The board still says Delivered.","Tap the Delivered tick to flag it."];
      if (q.lie) q.done[q.beat] = true;
      break; }
    case "finish": {
      const f = v.fin, n = f==="None" ? 5 : 6;
      const status = f==='"stop"' ? ["complete ✓","ok"] : f==='"length"' ? ["truncated","amb"] : ["partial","bad"];
      const diag = `<div class="fxrow"><div class="fxlist">${W6.slice(0,n).map((_,i)=>chunkBox(i,"sm")).join("")}${f==="None"?`<div class="fx cutx">${ic("scissors",20,"#EF4444")}<i>cut</i></div>`:""}</div></div>
        <div class="fxrow">${fbox("last chunk", `<code>finish_reason: ${esc(f)}</code>`, f==="None"?"never arrived":"the flag", f==="None"?"bad":"flag")}${farrow()}${fbox("status", `<code>${status[0]}</code>`, "honest label", status[1])}</div>`;
      const code = xCode(['for chunk in stream:', '    ...', '    if choice.get("finish_reason"):', '        finish = {{fin}}', 'status = honest(finish)   # stop → complete'], [3,4], "honest.py");
      stage = zoomWrap(scSignal(lens(50, 84, "Zoom into the guard van")), diag, code, "lay-train");
      const triedN = (q.tried.finN||0);
      const unl = triedN >= 2;
      check = q.zoom ? xCheck("finish", "No flag came. Honest status?", ["complete", "partial"], 1, unl) : "";
      const fixed = q.check.finish===1 && f==='"stop"';
      tip = q.zoom ? (!unl ? ["Try what the server could send. Watch the status.","Tap finish_reason to try stop, length, None."] : q.check.finish===1 && !fixed ? ["Vyapti reconnects. Let the real flag through: stop.","Set finish_reason to \"stop\"."] : fixed ? ["Done means stop. Quiet means partial.","Fixed: stop → complete."] : ["Quiet isn't done.","Answer the check."]) : ["Zoom into the guard van.","Tap the lens."];
      if (fixed) q.done[q.beat] = true;
      break; }
    case "jam": {
      stage = scToll(bub("samar", q.jam ? "No choices at all. Just the scorecard." : "Jammed. Something odd came after the flag."));
      tip = q.jam ? ["The last chunk carries only token usage. No choices.","Usage-only chunk: choices is empty."] : ["The app gate jammed after the flag. Look closer.","Tap the jam."];
      if (q.jam) q.done[q.beat] = true;
      break; }
    case "guard": {
      const g = q.gates, ok1 = g.g1==="choices", ok2 = g.g2==="piece", brk = g.g1==="break" || g.g2==="break";
      const tools = [["choices",'if not chunk.get("choices"):'],["piece","if piece:"],["break","break"]].filter(([k]) => g.g1!==k && g.g2!==k)
        .map(([k, t]) => `<div class="tool code ${XD.sel==="g:"+k?"sel":""}" data-xd="g:${k}" tabindex="0" role="button" data-testid="tool-${k}"><code>${esc(t)}</code></div>`).join("");
      const slot = (key, label) => `<div class="fx gslot ${g[key]?"on":""}" data-xt="gs${key}" tabindex="0" role="button" data-testid="gslot-${key}"><b>${label}</b><div class="fxv"><code>${g[key]?esc({choices:'if not chunk.get("choices")',piece:"if piece",break:"break"}[g[key]]):"drop a guard"}</code></div></div>`;
      const filled = g.g1 && g.g2;
      const rowsData = [["usage-only", '{"choices": []}', brk ? "loop stopped" : ok1 ? "→ usage meter" : "IndexError 💥", brk ? "bad" : ok1 ? "ok" : "bad"],
        ["role-only", '{"role": "assistant"}', brk ? "loop stopped" : ok2 ? "skipped" : 'prints "None"', brk ? "bad" : ok2 ? "ok" : "bad"],
        ["blank", '{"content": ""}', brk ? "loop stopped" : ok2 ? "skipped" : "prints nothing", brk ? "bad" : "ok"],
        ["text", '{"content": "Your "}', brk ? "loop stopped" : "shown + kept", brk ? "bad" : "ok"]];
      const res = filled ? `<div class="fxres">${rowsData.map(([n, j, out, c]) => `<div class="rr ${c}"><b>${n}</b><code>${esc(j)}</code>${farrow()}<span>${esc(out)}</span></div>`).join("")}</div>` : "";
      const diag = `<div class="col" style="gap:8px;width:100%"><div class="fxtray">${tools || `<span class="mini">all guards placed</span>`}</div>
        <div class="fxrow">${fbox("chunk", "<code>{…}</code>", "", "src")}${farrow()}${slot("g1","gate 1")}${farrow()}${fbox("", '<code>choices[0]</code>')}${farrow()}${slot("g2","gate 2")}${farrow()}${fbox("", "<code>print + keep</code>")}</div>${res}</div>`;
      const code = xCode(['for chunk in stream:', `    ${g.g1?({choices:'if not chunk.get("choices"):',piece:"if piece:",break:"break"}[g.g1]):"# gate 1"}`, '    choice = chunk["choices"][0]', '    piece = choice["delta"].get("content")', `    ${g.g2?({choices:'if not chunk.get("choices"):',piece:"if piece:",break:"break"}[g.g2]):"# gate 2"}`, '        print(piece, end="", flush=True)'], [2,5], "guards.py");
      stage = zoomWrap(scCheck(lens(50, 80, "Zoom into the app gate")), diag, code, "lay-gates");
      const unl = filled && ok1 && ok2;
      check = q.zoom ? xCheck("guard", "Where does the usage-only chunk go?", ["usage meter", "Rohan's screen"], 0, unl) : "";
      tip = q.zoom ? (!filled ? ["Two gates. One stops the jam, one skips empty text.","Drag guards into gate 1 and gate 2."] : unl ? ["Odd crates pass safely. Usage gets logged.","Both gates correct."] : ["Check the results. Swap a guard.","Wrong guard. Drag a different one in."]) : ["Zoom into the app gate.","Tap the lens."];
      if (q.check.guard===0 && unl) q.done[q.beat] = true;
      break; }
    case "r2": {
      const moves = [["stream","stream=True"],["end",'end=""'],["flush","flush=True"],["parts","parts.append"],["sep",'"".join'],["guard","guards on"],["fin",'finish: "stop"']];
      const tiles = moves.map(([k, val], i) => { const did = q.r2.includes(k), bad = q.rWrong===k; return `<button type="button" class="rtile sm ${did?"did":""} ${bad?"bad shake":""}" data-act="x-r2" data-k="${k}" data-testid="r2-${k}"><span class="rn">${did?ic("check",14,"#fff"):i+1}</span><code>${did?esc(val):"?"}</code></button>`; }).join("");
      const all = q.r2.length>=7;
      stage = `<div class="xrecap"><div class="rhd">${ic("refresh",18,"#B45309")}<b>From the start · whole machine</b><span>Seven moves, in order.</span></div><div class="rrow wrap">${tiles}</div>
        ${scMontage(XR2, (() => { const L = {stream:[0,1], end:[2,3], flush:[5], parts:[6], sep:[7], guard:[9], fin:[4,8]}; return q.r2.flatMap(k => L[k]||[]); })(), all, bub("rohan+", "Whole reply. Honest tick. Thank you."))}
        ${all ? `<div class="xwin"><div><b>Your order is on the way.</b> <span>● complete · usage logged</span></div><div class="xxp">+10*</div>${btn("Continue to Assign "+ic("play",14,"#fff"),"to-assign","data-testid='to-assign'")}</div>` : ""}</div>`;
      tip = all ? ["That's 70% of the job. Next: the rainy nights.","Explore complete. Continue to Assign."] : ["Every move, from the lever to the flag.","Tap the seven moves in order."];
      speak = all ? "speak" : "idle";
      if (all) q.done[q.beat] = true;
      break; }
  }
  return { stage, check, tip, speak };
}
function renderExplore() {
  const q = state.xq, beat = XBEATS[q.beat];
  const taught = !!(q.taught && q.taught[beat.id]);
  const teach = teachCard(beat.id);
  const { stage, check, tip, speak } = taught ? beatBody() : { stage:"", check:"", tip:[XTEACH[beat.id]?XTEACH[beat.id].what:"Learn first.", "Read the card, then try it."], speak:"idle" };
  TIPS._xq = tip;
  const kind = beat.k==="story"?"Lab":beat.k==="code"?"Concept lab":"Recap";
  const dots = XBEATS.map((b, i) => `<span class="xdot ${b.k} ${i===q.beat?"c":(i<q.beat?"d":"")}" title="${esc(b.t)}">${ic(b.k==="story"?"film":b.k==="code"?"code":"refresh",12,"currentColor")}</span>`).join("");
  const done = !!q.done[q.beat];
  const next = taught && done && beat.id!=="r2" ? btn("Next "+ic("play",14,"#fff"),"x-next","data-testid='x-next'") : "";
  const body = taught
    ? `${teach}<div class="xbody">${stage}</div><div class="row xfoot">${check || `<div class="f1"></div>`}${next}</div>`
    : `<div class="xbody teach-only">${teach}</div>`;
  const main = `<div class="main xmain"><div class="hd"><div><div class="kick">Stage 2 · Explore · ${q.beat+1}/12 · ${kind}</div><h2>${beat.t}</h2></div><div class="sp"></div>${xMinimap()}</div>
    ${goalBar()}${simLabel("Explore demos are simulated in-browser")}
    ${body}</div>`;
  const [n] = goalInfo();
  const obj = taught ? "Change one thing, observe what happens, then explain it." : "Read what this control does before you touch it.";
  shell({cur:1, done:1, tag:"Explore · "+beat.t}, sidePanel(obj, "_xq", taught && n===6 && goalInfo()[2]==="grn" ? [6, goalInfo()[1].includes("✓")] : (taught?n:null), speak)+main);
  if (q.enter) { clearTimeout(q._et); q._et = setTimeout(() => { q.enter = false; }, 900); }
  if (q.zoomAnim) { clearTimeout(q._zt); q._zt = setTimeout(() => { q.zoomAnim = false; if (state.scene==="explore") render(); }, 950); }
}
function xAct(act, t) {
  const q = state.xq, beat = XBEATS[q.beat];
  if (act==="x-taught") { q.taught[beat.id] = true; render(); return true; }
  if (!q.taught[beat.id] && act!=="x-next") return true;
  if (act==="x-lever") { q.v.stream = "True"; render(); return true; }
  if (act==="x-zoom") { q.zoom = true; q.zoomAnim = true; render(); return true; }
  if (act==="x-ev") {
    const k = t.dataset.k, o = XV_OPTS[k], i = o.indexOf(q.v[k]);
    q.v[k] = o[(i+1) % o.length]; q.tried[k] = true;
    if (k==="fin") q.tried.finN = (q.tried.finN||0) + 1;
    render(); return true;
  }
  if (act==="x-pick") { const key = t.dataset.key, i = +t.dataset.i; if (q.check[key]==null || q.check[key]!==XCORRECT[key]) q.check[key] = i; render(); return true; }
  if (act==="x-bin") { q.bin = true; render(); return true; }
  if (act==="x-lie") { q.lie = true; render(); return true; }
  if (act==="x-jam") { q.jam = true; render(); return true; }
  if (act==="x-r1" || act==="x-r2") {
    const arr = act==="x-r1" ? q.r1 : q.r2, order = act==="x-r1" ? ["stream","end","flush"] : ["stream","end","flush","parts","sep","guard","fin"];
    const k = t.dataset.k;
    if (arr.includes(k)) return true;
    if (order[arr.length]===k) { arr.push(k); q.rWrong = null; } else q.rWrong = k;
    render(); return true;
  }
  if (act==="x-next") {
    if (!q.done[q.beat]) return true;
    q.beat = Math.min(XBEATS.length-1, q.beat+1); q.enter = true; q.panDone = false; q.zoom = false; q.zoomAnim = false; q.rWrong = null; XD.sel = null;
    render(); return true;
  }
  return false;
}
const XCORRECT = { chunks:1, flush:0, join:0, finish:1, guard:0 };
