/* Code · Micro — Scratch-style drag-and-drop block editor (pointer events, mouse + touch + keyboard) */
const DD_IND = 24;
const DD_BLOCKS = {
  given:   {k:"act",  src:'parts, finish, usage = [], None, None', pinned:true, name:"setup"},
  loop:    {k:"loop", c:true, src:'for chunk in stream:', name:"for chunk in stream"},
  guard:   {k:"dec",  c:true, src:'if not chunk.get("choices"):', name:"usage-only guard"},
  usage:   {k:"act",  src:'usage = chunk.get(@usage)', name:"store usage"},
  cont:    {k:"act",  src:'continue', name:"continue"},
  choice:  {k:"act",  src:'choice = chunk["choices"][0]', name:"choice"},
  piece:   {k:"act",  src:'piece = choice["delta"].get(@piece)', name:"piece"},
  ifpiece: {k:"dec",  c:true, src:'if piece:', name:"if piece"},
  print:   {k:"act",  src:'print(piece, end="", flush=@flush)', name:"live print"},
  append:  {k:"act",  src:'parts.append(piece)', name:"append"},
  iffin:   {k:"dec",  c:true, src:'if choice.get("finish_reason"):', name:"finish check"},
  fin:     {k:"act",  src:'finish = choice["finish_reason"]', name:"store finish"},
  join:    {k:"act",  src:'text = @join.join(parts)', name:"join"},
  yield:   {k:"act",  src:'yield piece', trap:true, name:"yield"},
  rawprint:{k:"act",  src:'print(piece)', trap:true, name:"plain print"},
};
/* palette order is deliberately not the answer order */
const DD_PALETTE = ["loop","piece","print","guard","join","append","yield","choice","iffin","usage","ifpiece","rawprint","fin","cont"];
const DD_REQUIRED = ["loop","guard","usage","cont","choice","piece","ifpiece","print","append","iffin","fin","join"];
const DD_PILLS = ['"usage"','"content"','"text"','True','False','""','" "'];
const DD_SLOT_ANS = {usage:'"usage"', piece:'"content"', flush:'True', join:'""'};

function ddPillName(v) { return v==='""' ? "empty" : v==='" "' ? "space" : v.replace(/[^a-zA-Z]/g,""); }
function ddInit() { return { lines:[{bid:"given",depth:0}], slots:{}, result:null, solved:false, pick:null }; }
const DD = { drag:null, focus:null };

function ddUsed(bid) { return state.dd.lines.some(l => l.bid===bid); }
function ddIsC(bid) { return !!DD_BLOCKS[bid].c; }
function ddRange(L, i) { let j=i+1; while (j<L.length && L[j].depth>L[i].depth) j++; return [i,j]; }
function ddNormalize(L) {
  L[0].depth = 0;
  for (let i=1;i<L.length;i++) {
    const max = L[i-1].depth + (ddIsC(L[i-1].bid)?1:0);
    if (L[i].depth > max) L[i].depth = max;
    if (L[i].depth < 0) L[i].depth = 0;
  }
  return L;
}
function ddAllowed(L, g) {
  const above = L[g-1], below = L[g];
  const maxD = above.depth + (ddIsC(above.bid)?1:0);
  const minD = below ? Math.min(below.depth, maxD) : 0;
  return [minD, maxD];
}
function ddInsert(L, g, sub, dep) {
  const delta = dep - sub[0].depth;
  const s = sub.map(l => ({bid:l.bid, depth:l.depth+delta}));
  return ddNormalize(L.slice(0,g).concat(s, L.slice(g)));
}
function ddChanged() { state.dd.result = null; }

/* ---------- markup */
function ddCode(bid, live) {
  const parts = DD_BLOCKS[bid].src.split(/@(\w+)/);
  let out = "";
  parts.forEach((p, i) => {
    if (i % 2 === 0) { out += hlLine(p); return; }
    const v = state.dd.slots[p];
    if (!live) { out += `<span class="dds">&nbsp;</span>`; return; }
    const hot = state.dd.pick ? " want" : "";
    out += v!=null
      ? `<span class="dds f" data-slot="${p}" data-v="${esc(v)}" tabindex="0" role="button" aria-label="slot ${p}: ${esc(v)}" data-testid="slot-${p}">${esc(v)}</span>`
      : `<span class="dds${hot}" data-slot="${p}" tabindex="0" role="button" aria-label="empty slot ${p}" data-testid="slot-${p}">&nbsp;</span>`;
  });
  return out;
}
function ddBlock(bid, live, extra="") {
  const b = DD_BLOCKS[bid];
  const err = live && state.dd.result && !state.dd.result.ok && (state.dd.result.bad||[]).includes(bid) ? " err" : "";
  const grip = b.pinned ? ic("lock",11,"currentColor") : `<span class="grip"></span>`;
  return `<div class="ddb k-${b.k}${b.c?" c":""}${b.pinned?" pin":""}${err}${extra}" data-bid="${bid}" tabindex="${b.pinned?-1:0}" role="button" aria-label="block ${esc(b.src.replace(/@\w+/g,"slot"))}" data-testid="${live?"ws":"pal"}-${bid}">${grip}<span class="cx">${ddCode(bid, live)}</span></div>`;
}
function ddPalette() {
  return DD_PALETTE.map(bid => ddBlock(bid, false, ddUsed(bid) ? " used" : "")).join("");
}
function ddLines() {
  const L = state.dd.lines, stack = [];
  let html = "";
  L.forEach((l, i) => {
    stack.length = l.depth;
    const rails = stack.map((pb, a) => `<i class="rl k-${DD_BLOCKS[pb].k}" style="left:${a*DD_IND+3}px"></i>`).join("");
    html += `<div class="ddl" data-i="${i}" style="padding-left:${l.depth*DD_IND}px">${rails}${ddBlock(l.bid, true)}</div>`;
    if (ddIsC(l.bid)) {
      stack[l.depth] = l.bid;
      const next = L[i+1];
      if (!next || next.depth <= l.depth) {
        const r2 = stack.slice(0, l.depth+1).map((pb, a) => `<i class="rl k-${DD_BLOCKS[pb].k}" style="left:${a*DD_IND+3}px"></i>`).join("");
        html += `<div class="ddph" style="padding-left:${(l.depth+1)*DD_IND}px">${r2}<span>drop blocks inside</span></div>`;
      }
    }
  });
  return html;
}
function ddPython() {
  const L = state.dd.lines;
  const rows = L.map(l => "    ".repeat(l.depth) + DD_BLOCKS[l.bid].src.replace(/@(\w+)/g, (_, s) => state.dd.slots[s]!=null ? state.dd.slots[s] : "___"));
  const marks = {};
  const r = state.dd.result;
  L.forEach((l, i) => { if (r && r.ok) marks[i+1] = "good"; else if (r && (r.bad||[]).includes(l.bid)) marks[i+1] = "bad"; });
  return codeBlock(rows.join("\n"), "line_keeper.py · live Python", marks, "xs dd-py");
}

function ddMain() {
  const d = state.dd, r = d.result;
  const placed = DD_REQUIRED.filter(ddUsed).length;
  const pills = DD_PILLS.map(v => `<span class="ddp${d.pick===v?" pk":""}" data-v="${esc(v)}" tabindex="0" role="button" aria-label="value ${esc(v)}" data-testid="pill-${ddPillName(v)}">${esc(v)}</span>`).join("");
  let right, foot;
  if (d.solved) {
    right = `<div class="term" style="font-size:12.5px"><span class="dim">$ run micro_line_keeper</span>
Your order is on the way.
<span class="ok">✓ streamed live · 6 pieces</span>
<span class="ok">✓ finish_reason: stop</span>
<span class="ok">✓ usage: 12 / 7 / 19</span></div>`;
    foot = `${fb("ok","Line Keeper built.", r && r.alt ? "Your order is one of the valid ones." : "Blocks in a valid order.").replace('class="fb ok"','class="fb ok" style="flex:1"')}${chip("Accepts more than one valid order","grn")}${btn("Next: Guided "+ic("play",14,"#fff"),"to-guided","data-testid='to-guided'")}`;
  } else {
    right = `<div class="card dd-pills"><div class="lbl">Values · drag into a slot</div><div class="wrapt" style="gap:6px">${pills}</div></div>`;
    const status = r && !r.ok
      ? fb("bad", r.title, r.msg).replace('class="fb bad"','class="fb bad" data-testid="dd-feedback" style="flex:1;padding:7px 12px"')
      : `<div class="mini" style="flex:1">Drag right to nest under a loop or if. Drag back to the palette to remove. Keyboard: Enter adds, arrows move, Delete removes.</div>`;
    foot = `${status}${chip(placed+" / "+DD_REQUIRED.length+" blocks","gry")}${btn("Reset","dd-reset","data-testid='dd-reset'","g sm")}${btn(ic("play",14,"#fff")+" Run","dd-run","data-testid='micro-run'","sm")}`;
  }
  return `<div class="main">${codehd("Micro","Build the Line Keeper")}
    <div class="dd" data-testid="dd">
      <div class="card dd-pal" data-testid="dd-palette"><div class="lbl">Blocks · drag into the editor</div><div class="dd-list">${ddPalette()}</div></div>
      <div class="card dd-ws" data-testid="dd-workspace"><div class="lbl" style="display:flex;gap:8px;align-items:center">Editor<span class="sp"></span>${chip("loop")}${chip("decision","amb")}${chip("action","gry")}</div><div class="dd-lines">${ddLines()}</div></div>
      <div class="col dd-right">${ddPython()}${right}</div>
    </div>
    <div class="row dd-foot" style="align-items:center;gap:10px">${foot}</div></div>`;
}

/* ---------- checker: semantic, so more than one valid order passes */
function ddTree() {
  const L = state.dd.lines, root = {bid:"root", kids:[]}, stack=[root];
  L.forEach(l => { const n = {bid:l.bid, kids:[]}; stack.length = l.depth+1; (stack[l.depth]||root).kids.push(n); stack[l.depth+1] = n; });
  return root;
}
function ddCheck() {
  const L = state.dd.lines, s = state.dd.slots;
  const has = b => L.some(l => l.bid===b);
  const bad = (title, msg, bids, tip) => ({ok:false, title, msg, bad:bids, tip});
  if (has("yield")) return bad("`yield` in the loop.", "consume() becomes a generator. Nothing prints until someone iterates it.", ["yield"]);
  if (has("rawprint")) return bad("Plain `print(piece)`.", "One chunk per line, held in the buffer. Customers see it late and broken.", ["rawprint"]);
  const missing = DD_REQUIRED.filter(b => !has(b));
  if (missing.length) return bad("Not yet.", `${missing.length} block${missing.length>1?"s":""} still in the palette.`, []);
  const root = ddTree();
  const top = root.kids.map(k => k.bid);
  const loop = root.kids.find(k => k.bid==="loop");
  const at = (n, b) => n.kids.findIndex(k => k.bid===b);
  if (!loop) return bad("Loop nested.", "`for chunk in stream:` goes at the top level.", ["loop"]);
  const inLoop = b => at(loop, b) >= 0;
  if (top.indexOf("join") < 0) return bad("Join is inside the loop.", "Join once, after the stream ends.", ["join"]);
  if (top.indexOf("join") < top.indexOf("loop")) return bad("Join runs too early.", "Join after the loop, not before it.", ["join"]);
  if (top.length !== 3) return bad("Stray block at the top.", "Only setup, the loop and the join live outside the loop.", top.filter(b => !["given","loop","join"].includes(b)));
  for (const b of ["guard","choice","piece","ifpiece","iffin"]) if (!inLoop(b)) return bad(`${DD_BLOCKS[b].name} is misplaced.`, "It belongs directly inside the loop.", [b]);
  const guard = loop.kids[at(loop,"guard")], ifp = loop.kids[at(loop,"ifpiece")], iff = loop.kids[at(loop,"iffin")];
  if (loop.kids.length !== 5) return bad("Extra block in the loop.", "Some blocks belong inside an `if`.", loop.kids.map(k=>k.bid).filter(b => !["guard","choice","piece","ifpiece","iffin"].includes(b)));
  const g = guard.kids.map(k=>k.bid);
  if (!(g.length===2 && g[0]==="usage" && g[1]==="cont")) {
    if (g.length===2 && g[0]==="cont") return bad("`continue` comes first.", "It skips the rest. Store usage before continuing.", ["cont","usage"]);
    return bad("Guard body is off.", "A usage-only chunk: store usage, then `continue`.", ["guard","usage","cont"]);
  }
  if (at(loop,"guard") > at(loop,"choice")) return bad("Guard after `choice`.", "A usage-only chunk has no choices. `[0]` crashes. Guard first.", ["guard","choice"]);
  if (at(loop,"piece") < at(loop,"choice")) return bad("`piece` before `choice`.", "You need the choice before you read its delta.", ["piece","choice"]);
  if (at(loop,"ifpiece") < at(loop,"piece")) return bad("`if piece` too early.", "Read the piece before you test it.", ["ifpiece","piece"]);
  if (at(loop,"iffin") < at(loop,"choice")) return bad("Finish check too early.", "`choice` doesn't exist yet.", ["iffin","choice"]);
  const pk = ifp.kids.map(k=>k.bid).sort().join(",");
  if (pk !== "append,print") return bad("`if piece:` body is off.", "Inside: show it live and keep it. Nothing else.", ["ifpiece","print","append"]);
  if (!(iff.kids.length===1 && iff.kids[0].bid==="fin")) return bad("Finish check body is off.", "Store `finish_reason` inside it.", ["iffin","fin"]);
  for (const k of ["usage","piece","flush","join"]) if (s[k]==null) return bad("Empty slot.", "Drag a value into every slot.", [{usage:"usage",piece:"piece",flush:"print",join:"join"}[k]]);
  if (s.flush==="False") return bad("`flush=False`.", "The terminal holds everything. That's the freeze from Discovery.", ["print"]);
  if (s.flush!=="True") return bad("flush needs a boolean.", "Live means flush every piece.", ["print"]);
  if (s.piece!=='"content"') return bad(`No ${s.piece} key in a delta.`, "Remember E2: text arrives in `delta.content`.", ["piece"]);
  if (s.usage!=='"usage"') return bad(`Wrong key: ${s.usage}.`, "The last chunk carries token counts under `usage`.", ["usage"]);
  if (s.join!=='""') return bad(`Joined with ${s.join}.`, "Chunks already carry their spaces. Join with an empty string.", ["join"]);
  // canonical order: guard, choice, piece, ifpiece(print, append), iffin
  const order = loop.kids.map(k=>k.bid).join(",");
  const alt = order !== "guard,choice,piece,ifpiece,iffin" || ifp.kids[0].bid !== "print";
  return {ok:true, alt};
}

/* ---------- geometry helpers (stage is CSS-scaled) */
function ddApp() { return document.getElementById("app"); }
function ddScale() { const a = ddApp(); return a.getBoundingClientRect().width / a.offsetWidth; }
function ddPt(e) { const a = ddApp(), r = a.getBoundingClientRect(), s = r.width / a.offsetWidth; return {x:(e.clientX-r.left)/s, y:(e.clientY-r.top)/s}; }
function ddRect(el) { const a = ddApp(), ar = a.getBoundingClientRect(), s = ar.width / a.offsetWidth, r = el.getBoundingClientRect(); return {x:(r.left-ar.left)/s, y:(r.top-ar.top)/s, w:r.width/s, h:r.height/s}; }

function ddActive() { return state.scene==="code" && state.codeTier==="micro" && state.dd && !state.dd.solved; }

/* ---------- pointer drag */
function ddDown(e) {
  if (!ddActive()) return;
  if (e.button != null && e.button > 0) return;
  const slotF = e.target.closest(".dd-ws .dds.f");
  const pill = e.target.closest(".ddp");
  const blk = e.target.closest(".ddb[data-bid]");
  let d = null;
  if (slotF) d = {kind:"pill", v:slotF.dataset.v, from:"slot", slot:slotF.dataset.slot, el:slotF};
  else if (pill) d = {kind:"pill", v:pill.dataset.v, from:"bank", el:pill};
  else if (blk) {
    const bid = blk.dataset.bid;
    if (DD_BLOCKS[bid].pinned) return;
    const inWs = !!blk.closest(".dd-ws");
    if (!inWs && ddUsed(bid)) return;
    d = {kind:"block", bid, from: inWs ? "ws" : "pal", el:blk};
    if (inWs) d.i = +blk.closest(".ddl").dataset.i;
  }
  if (!d) return;
  e.preventDefault();
  Object.assign(d, {pid:e.pointerId, x0:e.clientX, y0:e.clientY, started:false});
  DD.drag = d;
}
function ddStart(e) {
  const d = DD.drag, app = ddApp(), p = ddPt({clientX:d.x0, clientY:d.y0});
  const er = ddRect(d.el);
  d.ox = p.x - er.x; d.oy = p.y - er.y;
  const g = document.createElement("div");
  g.className = "dd-ghost" + (app.classList.contains("dark") ? " dk" : "");
  if (d.kind === "block" && d.from === "ws") {
    const [a, b] = ddRange(state.dd.lines, d.i);
    d.range = [a, b];
    const d0 = state.dd.lines[a].depth;
    for (let k=a;k<b;k++) {
      const ln = app.querySelector(`.dd-ws .ddl[data-i="${k}"]`);
      const c = ln.querySelector(".ddb").cloneNode(true);
      c.style.marginLeft = ((state.dd.lines[k].depth - d0) * DD_IND) + "px";
      g.appendChild(c);
      ln.classList.add("dragging");
    }
  } else {
    const c = d.el.cloneNode(true); c.classList.remove("used","pk","f"); if (d.kind==="pill") { c.className = "ddp"; c.textContent = d.v; }
    g.appendChild(c);
    if (d.from === "slot") { d.el.classList.add("lift"); }
    else d.el.classList.add("dragging");
  }
  app.appendChild(g);
  d.ghost = g;
  const m = document.createElement("div"); m.className = "dd-mark"; m.style.display = "none"; app.appendChild(m); d.mark = m;
  d.started = true;
  document.body.classList.add("dd-on");
  app.dataset.dragging = "1";
}
function ddTarget(p) {
  const d = DD.drag, app = ddApp();
  const ws = app.querySelector(".dd-ws"), wr = ddRect(ws);
  if (d.kind === "pill") {
    let best = null, bd = 1e9;
    app.querySelectorAll(".dd-ws .dds[data-slot]").forEach(s => {
      const r = ddRect(s);
      const cx = r.x + r.w/2, cy = r.y + r.h/2;
      const inside = p.x >= r.x-10 && p.x <= r.x+r.w+10 && p.y >= r.y-10 && p.y <= r.y+r.h+10;
      const dist = Math.hypot(p.x-cx, p.y-cy);
      if ((inside || dist < 44) && dist < bd) { bd = dist; best = s; }
    });
    return best ? {kind:"slot", slot:best.dataset.slot, el:best} : {kind: d.from==="slot" ? "trash" : "none"};
  }
  const inside = p.x >= wr.x-16 && p.x <= wr.x+wr.w+16 && p.y >= wr.y-12 && p.y <= wr.y+wr.h+12;
  if (!inside) return {kind: d.from==="ws" ? "trash" : "none"};
  const L = state.dd.lines;
  const [a, b] = d.range || [-1, -1];
  const rem = [];
  L.forEach((ln, k) => { if (k>=a && k<b) return; const el = ws.querySelector(`.ddl[data-i="${k}"]`); rem.push({k, r:ddRect(el)}); });
  const gy = p.y - d.oy + 12; // top of ghost + half a block
  let g = rem.length;
  for (let j=1;j<rem.length;j++) { if (gy < rem[j].r.y + rem[j].r.h/2) { g = j; break; } }
  const R = rem.map(o => L[o.k]);
  const [minD, maxD] = ddAllowed(R, g);
  const base = rem[0].r.x;
  const gx = p.x - d.ox;
  let dep = Math.round((gx - base) / DD_IND);
  dep = Math.max(minD, Math.min(maxD, dep));
  const y = g < rem.length ? rem[g].r.y : rem[g-1].r.y + rem[g-1].r.h;
  return {kind:"ins", g, dep, y, x: base + dep*DD_IND + 2, w: wr.x + wr.w - (base + dep*DD_IND) - 14, keep: rem.map(o => o.k)};
}
function ddMove(e) {
  const d = DD.drag;
  if (!d || e.pointerId !== d.pid) return;
  if (!d.started) {
    if (Math.hypot(e.clientX-d.x0, e.clientY-d.y0) < 5) return;
    ddStart(e);
  }
  e.preventDefault();
  const p = ddPt(e);
  d.ghost.style.left = (p.x - d.ox) + "px";
  d.ghost.style.top = (p.y - d.oy) + "px";
  const t = ddTarget(p);
  d.t = t;
  const app = ddApp();
  app.querySelectorAll(".dds.hot").forEach(s => s.classList.remove("hot"));
  const pal = app.querySelector(".dd-pal");
  pal.classList.toggle("trash", t.kind === "trash");
  d.ghost.classList.toggle("trash", t.kind === "trash");
  if (t.kind === "ins") {
    Object.assign(d.mark.style, {display:"block", left:t.x+"px", top:(t.y-3)+"px", width:Math.max(60,t.w)+"px"});
  } else d.mark.style.display = "none";
  if (t.kind === "slot") t.el.classList.add("hot");
}
function ddEnd(e, cancel) {
  const d = DD.drag;
  if (!d || (e && e.pointerId !== d.pid)) return;
  DD.drag = null;
  if (!d.started) {
    // tap without drag: pills and empty slots act like keyboard pick
    if (!cancel && d.kind === "pill" && d.from === "bank") { state.dd.pick = state.dd.pick === d.v ? null : d.v; render(); }
    return;
  }
  d.ghost.remove(); d.mark.remove();
  document.body.classList.remove("dd-on");
  delete ddApp().dataset.dragging;
  const t = cancel ? {kind:"none"} : (d.t || {kind:"none"});
  const dd = state.dd;
  if (d.kind === "pill") {
    if (t.kind === "slot") { if (d.from === "slot") delete dd.slots[d.slot]; dd.slots[t.slot] = d.v; ddChanged(); }
    else if (t.kind === "trash" && d.from === "slot") { delete dd.slots[d.slot]; ddChanged(); }
  } else if (t.kind === "ins") {
    const L = dd.lines;
    const sub = d.from === "ws" ? L.slice(d.range[0], d.range[1]) : [{bid:d.bid, depth:0}];
    const R = t.keep.map(k => L[k]);
    dd.lines = ddInsert(R, t.g, sub, t.dep);
    ddChanged();
    DD.focus = d.bid;
  } else if (t.kind === "trash") {
    const removed = dd.lines.slice(d.range[0], d.range[1]);
    dd.lines = ddNormalize(dd.lines.filter((_, k) => k < d.range[0] || k >= d.range[1]));
    ddClearSlots(removed);
    ddChanged();
  }
  render();
}
function ddClearSlots(lines) { lines.forEach(l => (DD_BLOCKS[l.bid].src.match(/@(\w+)/g)||[]).forEach(m => delete state.dd.slots[m.slice(1)])); }

/* ---------- keyboard */
function ddKey(e) {
  if (!ddActive()) return;
  const el = document.activeElement;
  if (!el || !el.closest || !el.closest(".dd")) return;
  const dd = state.dd, k = e.key;
  const pill = el.closest(".ddp"), slot = el.closest(".dd-ws .dds[data-slot]"), blk = el.closest(".ddb[data-bid]");
  const refocus = (sel) => { const n = document.querySelector(sel); if (n) n.focus(); };
  if (pill && (k === "Enter" || k === " ")) { e.preventDefault(); dd.pick = dd.pick === pill.dataset.v ? null : pill.dataset.v; render(); refocus(`.ddp[data-v='${CSS.escape(pill.dataset.v)}']`); return; }
  if (slot && (k === "Enter" || k === " ")) {
    e.preventDefault(); e.stopPropagation();
    const s = slot.dataset.slot;
    if (dd.pick) { dd.slots[s] = dd.pick; dd.pick = null; } else delete dd.slots[s];
    ddChanged(); render(); refocus(`.dd-ws .dds[data-slot="${s}"]`); return;
  }
  if (!blk || DD_BLOCKS[blk.dataset.bid].pinned) return;
  const bid = blk.dataset.bid;
  const inWs = !!blk.closest(".dd-ws");
  if (!inWs) {
    if ((k === "Enter" || k === " ") && !ddUsed(bid)) {
      e.preventDefault();
      const L = dd.lines, g = L.length;
      const [, maxD] = ddAllowed(L, g);
      dd.lines = ddInsert(L, g, [{bid, depth:0}], maxD);
      ddChanged(); render(); refocus(`.dd-ws .ddb[data-bid="${bid}"]`);
    }
    return;
  }
  const L = dd.lines, i = L.findIndex(l => l.bid === bid);
  const [a, b] = ddRange(L, i);
  const sub = L.slice(a, b);
  let R = L.filter((_, x) => x < a || x >= b);
  let next = null;
  if (k === "ArrowUp" || k === "ArrowDown") {
    const g = k === "ArrowUp" ? Math.max(1, a-1) : Math.min(R.length, a+1);
    const [mn, mx] = ddAllowed(R, g);
    next = ddInsert(R, g, sub, Math.max(mn, Math.min(mx, sub[0].depth)));
  } else if (k === "ArrowRight" || k === "ArrowLeft") {
    const [mn, mx] = ddAllowed(R, a);
    const dep = sub[0].depth + (k === "ArrowRight" ? 1 : -1);
    if (dep >= mn && dep <= mx) next = ddInsert(R, a, sub, dep);
  } else if (k === "Delete" || k === "Backspace") {
    next = ddNormalize(R); ddClearSlots(sub);
  } else return;
  e.preventDefault();
  if (next) { dd.lines = next; ddChanged(); render(); }
  if (k === "Delete" || k === "Backspace") refocus(`.dd-pal .ddb[data-bid="${bid}"]`);
  else refocus(`.dd-ws .ddb[data-bid="${bid}"]`);
}

document.addEventListener("pointerdown", ddDown, {passive:false});
document.addEventListener("pointermove", ddMove, {passive:false});
document.addEventListener("pointerup", e => ddEnd(e, false));
document.addEventListener("pointercancel", e => ddEnd(e, true));
document.addEventListener("keydown", ddKey);

/* tap a picked value, then tap an empty slot (touch / mouse fallback) */
document.addEventListener("click", e => {
  if (!ddActive() || !state.dd.pick) return;
  const s = e.target.closest(".dd-ws .dds[data-slot]");
  if (!s || s.classList.contains("f")) return;
  state.dd.slots[s.dataset.slot] = state.dd.pick; state.dd.pick = null; ddChanged(); render();
});
