/* World hub · The Retry Storm — walkable map (click/tap to walk, WASD/arrows, E to interact) */
Object.assign(ICONS, {
  chat: '<path d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1H10l-5 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z" fill="currentColor"/>',
  wave: '<path d="M12 13a1.6 1.6 0 100-3.2 1.6 1.6 0 000 3.2zM8 7.5a6 6 0 000 8M16 7.5a6 6 0 010 8M5 4.8a10 10 0 000 13.4M19 4.8a10 10 0 010 13.4" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M12 13l-3 8h6z" fill="currentColor"/>',
  doc: '<path d="M6 2h8l5 5v14a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z" fill="currentColor"/><path d="M8 12h8M8 16h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  note: '<path d="M4 4h16v11l-5 5H4z" fill="currentColor"/><path d="M15 20v-5h5" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M7 9h10M7 12.5h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  receipt: '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" fill="currentColor"/><path d="M9 8h6M9 12h6M9 16h3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  glitch: '<path d="M3 13l4-5 3 7 4-10 3 8 4-4" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
});

const HUB_NODES = [
  {id:"3.1", name:"The Status Lie",      topic:"REST & JSON",         icon:"eye",  x:.14, y:.80, fixed:"Status codes tell the truth again."},
  {id:"3.2", name:"The Rush Window",     topic:"API calls in Python", icon:"bolt", x:.33, y:.58, fixed:"Timeouts and retries hold in the rush."},
  {id:"3.3", name:"The Blank Reply",     topic:"Chat completions",    icon:"chat", x:.15, y:.33, fixed:"Empty replies are caught, not shipped."},
  {id:"3.4", name:"The Forgotten Brief", topic:"Multi-turn prompts",  icon:"task", x:.42, y:.15, fixed:"The bot remembers the whole chat now."},
  {id:"3.5", name:"Streaming Responses", topic:"The Unfinished Line",  icon:"wave", x:.64, y:.46, fixed:"Every reply finishes. Honest ticks only."},
  {id:"3.6", name:"The Offer Draft",     topic:"Parameter tuning",    icon:"doc",  x:.86, y:.20, fixed:""},
];
const HUB_LINES = {
  tanvi: [["Ops wall says all green.", "My biryani chat stopped at \"on the\". Green tick anyway."], ["Every reply finishes now.", "Honest ticks. Finally."]],
  rohan: [["Rush Gate held. Retries are clean.", "But the tower keeps cutting replies mid-word."], ["Tower's steady.", "Chat Street is quiet for once."]],
  samar: [["Someone opened the server room at 9:38.", "Badge log says I. Varghese."], ["Server room's locked now.", "Ila's moved on to the dials."]],
  sana:  [["Servers are fine. Load is fine.", "It's the replies that crack, right at the tower."], ["Replies hold.", "Now the tone sounds off. Too creative."]],
};
const HUB_ITEMS = [
  {id:"note", icon:"note", title:"Sticky note", x:.05, y:.56, text:'"ALL GREEN = ALL GOOD." — I.',
    on:"Ila's handwriting. She's marking broken replies as delivered.", off:"Ila's note. Broken replies are being marked delivered."},
  {id:"receipt", icon:"receipt", title:"Half-sent receipt", x:.80, y:.68, text:'"Your order is on the" · Delivered ✓',
    on:"Delivered, never finished. That's what 3.5 fixes.", off:"The reply stopped mid-sentence but shows delivered. Mission 3.5."},
];
const HUB_NPC_POS = [{x:.34, y:.82}, {x:.52, y:.72}];
const HUB_GLITCH = [{x:.73, y:.31, m:"3.5"}, {x:.55, y:.36, m:"3.5"}, {x:.77, y:.08, m:"3.6"}, {x:.94, y:.34, m:"3.6"}];
const HUB_R = 70;
let HUBK = {}, hubRAF = null, hubLast = 0;

function hubInit() { return { x:.46, y:.93, open:null, talkI:0, found:[], target:null, pending:null, near:null, walking:false }; }
function isHubScene() { return state.scene==="map" || state.scene==="mapEnd"; }
function hubPortrait() { return window.innerWidth < 760 && window.innerHeight > window.innerWidth; }
function hubNpcs() { return ["tanvi","rohan","samar","sana"].filter(k => k!==state.avatar).slice(0,2).map((k,i) => ({id:"npc-"+k, k, ...HUB_NPC_POS[i]})); }
function hubNodeState(n) {
  const after = !!state.missionDone;
  if (["3.1","3.2","3.3","3.4"].includes(n.id)) return "fixed";
  if (n.id==="3.5") return after ? "fixed" : "broken";
  return after ? "next" : "lock";
}
function hubThings() {
  return [
    ...HUB_NODES.map(n => ({type:"node", id:"node-"+n.id, x:n.x, y:n.y, n})),
    ...hubNpcs().map(c => ({type:"npc", id:c.id, x:c.x, y:c.y, k:c.k})),
    ...HUB_ITEMS.map(it => ({type:"item", id:"item-"+it.id, x:it.x, y:it.y, it})),
  ];
}
function hubThing(id) { return hubThings().find(t => t.id===id); }
function hubRestored() { return 4 + (state.missionDone ? 1 : 0); }

function hubMeter() {
  const n = hubRestored();
  const seg = [0,1,2,3,4,5].map(i => `<i class="${i<n?"on":""}${i===4&&state.missionDone?" new":""}"></i>`).join("");
  return `<div class="hub-meter" data-testid="hub-meter" data-restored="${n}" aria-label="${n} of 6 districts restored">${seg}</div><div class="mini"><b class="hub-n">${n} / 6</b> districts restored</div>`;
}

function hubNodeHTML(n) {
  const st = hubNodeState(n);
  const icn = st==="lock" ? ic("lock",20,"#9CA3AF") : ic(n.icon, 22, "#fff");
  const badge = st==="fixed" ? `<span class="nb ok">${ic("check",11,"#fff")}</span>` : st==="broken" ? `<span class="nb bad">${ic("glitch",11,"#fff")}</span>` : st==="next" ? `<span class="nb nx">?</span>` : "";
  const lab = {fixed:"RESTORED", broken:"BROKEN · CURRENT", lock:"LOCKED", next:"NEXT · TEASER"}[st];
  return `<div class="hub-halo ${st}" style="left:${n.x*100}%;top:${n.y*100}%"></div>
    <button type="button" class="hub-node ${st}" data-hub="node-${n.id}" data-testid="hub-node-${n.id}" aria-label="${n.id} ${esc(n.name)}, ${lab.toLowerCase()}" style="left:${n.x*100}%;top:${n.y*100}%">${icn}${badge}</button>
    <div class="hub-lab ${st}" style="left:${n.x*100}%;top:${n.y*100}%"><b>${n.id} · ${lab}</b><span>${esc(n.name)}</span></div>`;
}
function hubMapHTML() {
  const after = !!state.missionDone;
  const pts = HUB_NODES.map(n => `${n.x*1000},${n.y*1000}`);
  const seg = (a, b, cls) => `<polyline points="${pts[a]} ${pts[b]}" class="${cls}" vector-effect="non-scaling-stroke"/>`;
  let route = "";
  for (let i=0;i<5;i++) {
    const cls = i<3 ? "ok" : i===3 ? (after?"ok":"brk") : (after?"brk":"lk");
    route += seg(i, i+1, cls);
  }
  const nodes = HUB_NODES.map(hubNodeHTML).join("");
  const glitch = HUB_GLITCH.filter(g => !(after && g.m==="3.5")).map(g => `<span class="hub-glitch" style="left:${g.x*100}%;top:${g.y*100}%" title="Ila's interference">${ic("glitch",18,"currentColor")}</span>`).join("");
  const found = state.hub.found;
  const npcs = hubNpcs().map(c => `<button type="button" class="hub-npc${found.includes(c.id)?" seen":""}" data-hub="${c.id}" data-testid="hub-${c.id}" aria-label="Talk to ${CHAR[c.k].first}" style="left:${c.x*100}%;top:${c.y*100}%"><img src="${ART}${c.k}-face.jpg" alt=""><span class="bub">${found.includes(c.id)?ic("check",10,"#fff"):"…"}</span><em>${CHAR[c.k].first}</em></button>`).join("");
  const items = HUB_ITEMS.map(it => `<button type="button" class="hub-item${found.includes("item-"+it.id)?" seen":""}" data-hub="item-${it.id}" data-testid="hub-item-${it.id}" aria-label="Inspect ${esc(it.title)}" style="left:${it.x*100}%;top:${it.y*100}%">${ic(it.icon,18,"#fff")}</button>`).join("");
  const h = state.hub;
  const me = `<div class="hub-me${h.walking?" walk":""}" data-testid="hub-avatar" style="left:${h.x*100}%;top:${h.y*100}%"><img src="${ART}${state.avatar}-face.jpg" alt="You"><span class="hub-prompt" data-testid="hub-prompt"></span></div>`;
  const tgt = h.target ? `<div class="hub-tgt" style="left:${h.target.x*100}%;top:${h.target.y*100}%"></div>` : "";
  const banner = after ? `<div class="hub-banner" data-testid="hub-banner">${ic("check",14,"#fff")} 3.5 restored · the tower is steady</div>` : "";
  return `<div class="hub-map" data-testid="hub-map">
    <img class="hub-bg" src="${ART}retry-storm.jpg" alt=""><div class="hub-veil"></div>
    <svg class="hub-route" viewBox="0 0 1000 1000" preserveAspectRatio="none">${route}</svg>
    ${glitch}${nodes}${items}${npcs}<div class="hub-tgt-wrap">${tgt}</div>${me}${banner}
    <div class="hub-help">${ic("compass",13,"currentColor")} Tap or click to walk · WASD / arrows · E to interact</div>
  </div>`;
}

function hubVy(on, off) {
  const ai = state.aiOn;
  return `<div class="hub-vy ${ai?"":"off"}"><img class="orb" src="${ART}${ai?"vyapti-idle":"vyapti-off"}.jpg" alt=""><div><b>${ai?"VYAPTI":"HINT · AI OFF"}</b>${md(ai?on:off)}</div></div>`;
}
function hubNearHTML() {
  const h = state.hub, after = !!state.missionDone;
  const id = h.open || h.near;
  const t = id ? hubThing(id) : null;
  if (!t) {
    return `<div class="lbl">Nearby</div><div class="hub-idle">Nothing close. Walk toward a glowing district.<span class="hub-idle-k">Tap or click the map to walk · WASD / arrows · E to interact</span></div>
      ${hubVy(after ? "Tower's steady. The dials at 3.6 are next." : "The tower at **3.5** is flickering. That's where replies break.",
              after ? "3.5 restored. 3.6 is a teaser." : "Next: walk to **3.5 · The Unfinished Line**.")}`;
  }
  if (t.type==="node") {
    const n = t.n, st = hubNodeState(n);
    const chipc = {fixed:["RESTORED","grn"], broken:["BROKEN · CURRENT","red"], lock:["LOCKED","gry"], next:["TEASER","amb"]}[st];
    let line = st==="fixed" ? n.fixed : st==="broken" ? "Replies freeze mid-sentence. Ops says all good." : st==="lock" ? "Finish 3.5 to unlock." : "Someone is turning the dials.";
    let action = "";
    if (st==="broken") action = btn(ic("play",14,"#fff")+" Enter mission", "play-mission", "data-testid='hub-enter'");
    else if (st==="fixed") action = `<span class="chip gry">Replay later · demo</span>`;
    else if (st==="next") action = btn("Coming in 3.6", "noop", "", "dis sm");
    return `<div class="lbl">Nearby · district</div>
      <div class="hub-card"><div class="hub-ic ${st}">${st==="lock"?ic("lock",20,"#9CA3AF"):ic(n.icon,22,"#fff")}</div><div class="f1"><b>${n.id} · ${esc(n.name)}</b><span class="mini">${esc(n.topic)}</span></div></div>
      <div class="row" style="gap:6px;align-items:center">${chip(chipc[0],chipc[1])}</div>
      <div class="hub-say">${esc(line)}</div>${action}`;
  }
  if (t.type==="npc") {
    const lines = HUB_LINES[t.k][after?1:0];
    if (h.open!==t.id) return `<div class="lbl">Nearby · cast</div><div class="hub-card"><img class="hub-face" src="${ART}${t.k}-face.jpg" alt=""><div class="f1"><b>${CHAR[t.k].name}</b><span class="mini">${CHAR[t.k].branch}</span></div></div>${btn(ic("chat",14,"#fff")+" Talk","hub-open","data-testid='hub-talk'","sm")}`;
    const i = Math.min(h.talkI, lines.length-1), last = i>=lines.length-1;
    return `<div class="lbl">Talking · ${CHAR[t.k].first}</div><div class="dlg">${dl(t.k, lines[i])}</div>
      <div class="row" style="gap:8px">${btn(last?"Done":"Next","hub-next","data-testid='hub-next'","sm")}<span class="mini" style="align-self:center">${i+1} / ${lines.length}</span></div>`;
  }
  const it = t.it;
  if (h.open!==t.id) return `<div class="lbl">Nearby · story item</div><div class="hub-card"><div class="hub-ic item">${ic(it.icon,20,"#fff")}</div><div class="f1"><b>${esc(it.title)}</b><span class="mini">Something's off here.</span></div></div>${btn(ic("search",14,"#fff")+" Inspect","hub-open","data-testid='hub-inspect'","sm")}`;
  return `<div class="lbl hub-lblx">Found · story item<button type="button" class="hub-x" data-act="hub-close" data-testid="hub-close" aria-label="Close">${ic("x",12,"currentColor")}</button></div><div class="hub-card"><div class="hub-ic item">${ic(it.icon,20,"#fff")}</div><div class="f1"><b>${esc(it.title)}</b></div></div>
    <div class="hub-quote">${esc(it.text)}</div>${hubVy(it.on, it.off)}`;
}
function hubFoundHTML() {
  const f = state.hub.found;
  const all = [...hubNpcs().map(c => ({id:c.id, html:`<img src="${ART}${c.k}-face.jpg" alt="${CHAR[c.k].first}">`})), ...HUB_ITEMS.map(it => ({id:"item-"+it.id, html:ic(it.icon,14,"#fff")}))];
  return `<div class="hub-found" data-testid="hub-found"><span class="lbl">Found ${f.length} / ${all.length}</span><span class="sp"></span>${all.map(a => `<span class="fd${f.includes(a.id)?" on":""}" title="${a.id}">${a.html}</span>`).join("")}</div>`;
}

function renderHub() {
  const app = document.getElementById("app");
  const after = !!state.missionDone;
  const world = `<div class="card hub-world"><div class="kick">Module 3 · World</div><h2>The Retry Storm</h2><div class="mini">APIs &amp; LLM integration</div>${hubMeter()}</div>`;
  const side = `<div class="hub-side">${world}<div class="card hub-near" id="hub-near" data-testid="hub-near">${hubNearHTML()}</div>${hubFoundHTML()}</div>`;
  app.innerHTML = topbar(null, "Afterfault · Module 3 hub") + `<div class="hub">${hubMapHTML()}${side}</div>` + tagEl(after ? "Ending · World hub, 3.5 restored" : "Entry · World hub");
  hubPrompt();
  if (!hubRAF) { hubLast = performance.now(); hubRAF = requestAnimationFrame(hubLoop); }
}

function hubPrompt() {
  const el = document.querySelector(".hub-prompt");
  if (!el) return;
  const h = state.hub, t = h.near ? hubThing(h.near) : null;
  let label = "";
  if (t && !h.open) {
    if (t.type==="npc") label = "Talk";
    else if (t.type==="item") label = "Inspect";
    else if (hubNodeState(t.n)==="broken") label = "Enter";
  }
  el.innerHTML = label ? `<kbd>E</kbd>${label}` : "";
  el.style.display = label ? "" : "none";
}

function hubLoop(t) {
  if (!isHubScene()) { hubRAF = null; return; }
  const dt = Math.min(0.05, Math.max(0, (t - hubLast) / 1000)); hubLast = t;
  const map = document.querySelector(".hub-map");
  const meEl = document.querySelector(".hub-me");
  if (!map || !meEl) { hubRAF = requestAnimationFrame(hubLoop); return; }
  const W = map.offsetWidth, H = map.offsetHeight, h = state.hub, sp = 300;
  let vx = (HUBK.r?1:0) - (HUBK.l?1:0), vy = (HUBK.d?1:0) - (HUBK.u?1:0);
  let moving = false;
  if (vx || vy) {
    h.target = null; h.pending = null;
    const n = Math.hypot(vx, vy);
    h.x += vx/n*sp*dt/W; h.y += vy/n*sp*dt/H; moving = true;
  } else if (h.target) {
    const dx = (h.target.x - h.x)*W, dy = (h.target.y - h.y)*H, dist = Math.hypot(dx, dy), stop = h.target.stop || 0;
    if (dist <= stop + 1.5) {
      const pend = h.pending; h.target = null; h.pending = null;
      const tg = document.querySelector(".hub-tgt"); if (tg) tg.remove();
      if (pend) { const th = hubThing(pend); if (th && th.type!=="node") { hubOpen(pend); return requestAnimationFrame(hubLoop); } }
    } else {
      const step = Math.min(sp*dt, dist - stop);
      h.x += dx/dist*step/W; h.y += dy/dist*step/H; moving = true;
    }
  }
  h.x = Math.max(.03, Math.min(.97, h.x)); h.y = Math.max(.05, Math.min(.95, h.y));
  meEl.style.left = (h.x*100) + "%"; meEl.style.top = (h.y*100) + "%";
  if (moving !== h.walking) { h.walking = moving; meEl.classList.toggle("walk", moving); }
  // proximity
  let best = null, bd = 1e9;
  hubThings().forEach(th => { const d = Math.hypot((th.x-h.x)*W, (th.y-h.y)*H); if (d < bd) { bd = d; best = th; } });
  const near = best && bd <= HUB_R ? best.id : null;
  let changed = false;
  if (h.open) { const o = hubThing(h.open); if (!o || Math.hypot((o.x-h.x)*W, (o.y-h.y)*H) > HUB_R + 24) { h.open = null; h.talkI = 0; changed = true; } }
  if (near !== h.near) { h.near = near; changed = true; if (h.open && near && near !== h.open) { h.open = null; h.talkI = 0; } }
  if (changed) { const p = document.getElementById("hub-near"); if (p) p.innerHTML = hubNearHTML(); hubPrompt(); document.getElementById("app").dataset.hubNear = h.near || ""; }
  hubRAF = requestAnimationFrame(hubLoop);
}

function hubOpen(id) {
  const h = state.hub, t = hubThing(id);
  if (!t) return;
  if (t.type==="node") { if (hubNodeState(t.n)==="broken") { go("avatar"); } return; }
  h.open = id; h.talkI = 0; h.near = id;
  if (!h.found.includes(id)) h.found.push(id);
  render();
}
function hubInteract() {
  const h = state.hub;
  if (h.open) { const t = hubThing(h.open); if (t && t.type==="npc") hubAct("hub-next"); else hubAct("hub-close"); return; }
  if (h.near) hubOpen(h.near);
}
function hubAct(act) {
  const h = state.hub;
  if (act==="hub-open") { if (h.near) hubOpen(h.near); return; }
  if (act==="hub-close") { h.open = null; h.talkI = 0; render(); return; }
  if (act==="hub-next") {
    const t = h.open && hubThing(h.open);
    if (!t) return;
    const lines = HUB_LINES[t.k][state.missionDone?1:0];
    if (h.talkI >= lines.length-1) { h.open = null; h.talkI = 0; } else h.talkI++;
    render(); return;
  }
}
function hubWalkTo(x, y, stop=0, pending=null) {
  const h = state.hub;
  h.target = {x, y, stop}; h.pending = pending;
  const wrap = document.querySelector(".hub-tgt-wrap");
  if (wrap) wrap.innerHTML = `<div class="hub-tgt" style="left:${x*100}%;top:${y*100}%"></div>`;
}

document.addEventListener("click", e => {
  if (!isHubScene()) return;
  const map = e.target.closest(".hub-map");
  if (!map) return;
  const hb = e.target.closest("[data-hub]");
  if (hb) {
    const t = hubThing(hb.dataset.hub);
    if (!t) return;
    const W = map.offsetWidth, H = map.offsetHeight, h = state.hub;
    const d = Math.hypot((t.x-h.x)*W, (t.y-h.y)*H);
    if (d <= HUB_R) { if (t.type!=="node") hubOpen(t.id); return; }
    hubWalkTo(t.x, t.y, 40, t.id);
    return;
  }
  const r = map.getBoundingClientRect();
  hubWalkTo((e.clientX - r.left)/r.width, (e.clientY - r.top)/r.height, 0, null);
});
const HUB_KEYMAP = {ArrowUp:"u", w:"u", W:"u", ArrowDown:"d", s:"d", S:"d", ArrowLeft:"l", a:"l", A:"l", ArrowRight:"r", d:"r", D:"r"};
document.addEventListener("keydown", e => {
  if (!isHubScene() || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = HUB_KEYMAP[e.key];
  if (k) { HUBK[k] = true; e.preventDefault(); return; }
  const focusBtn = document.activeElement && document.activeElement.tagName === "BUTTON";
  if (e.key==="e" || e.key==="E" || ((e.key==="Enter" || e.key===" ") && !focusBtn)) { e.preventDefault(); hubInteract(); }
  if (e.key==="Escape") hubAct("hub-close");
});
document.addEventListener("keyup", e => { const k = HUB_KEYMAP[e.key]; if (k) HUBK[k] = false; });
window.addEventListener("blur", () => { HUBK = {}; });
