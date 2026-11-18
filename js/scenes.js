/* Explore locations: one Dabba Dash journey (server kitchen → … → Rohan's phone), a new scene per beat.
   Each scene keeps the beat's single action + test ids; the camera, composition and metaphor change. */
Object.assign(ICONS, {
  tank: '<rect x="6" y="3" width="12" height="18" rx="5" stroke="currentColor" stroke-width="2.4" fill="none"/><path d="M7 13h10v3a4 4 0 01-4 4h-2a4 4 0 01-4-4z" fill="currentColor"/>',
  dial: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.4" fill="none"/><path d="M12 12l5-4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3" fill="currentColor"/><rect x="8" y="5" width="8" height="12" rx="1" fill="#fff"/>',
  puzzle: '<path d="M4 8h4a2 2 0 114 0h4v4a2 2 0 110 4v4H4v-4a2 2 0 100-4z" fill="currentColor"/>',
  bridge: '<path d="M2 15h20M4 15v5M20 15v5M2 15c4-7 16-7 20 0" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M8 11v4M12 10v5M16 11v4" stroke="currentColor" stroke-width="2"/>',
  signal: '<rect x="8" y="2" width="8" height="14" rx="3" fill="currentColor"/><circle cx="12" cy="6" r="2" fill="#fff"/><circle cx="12" cy="11.5" r="2" fill="#fff" opacity=".5"/><path d="M12 16v6M8 22h8" stroke="currentColor" stroke-width="2.4"/>',
  toll: '<rect x="3" y="6" width="6" height="15" rx="1.5" fill="currentColor"/><path d="M9 10h12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 2"/>',
  scan: '<path d="M5 21V7a7 7 0 0114 0v14" stroke="currentColor" stroke-width="2.6" fill="none"/><path d="M8 14h8" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>',
  chef: '<path d="M7 12a4 4 0 01.6-7.9A5 5 0 0117 5a4 4 0 010 7v3H7z" fill="currentColor"/><rect x="7" y="16" width="10" height="4" rx="1" fill="currentColor"/>',
  ff: '<path d="M3 5l8 7-8 7zM12 5l8 7-8 7z" fill="currentColor"/>',
});
/* the real network journey of a chunk: Server → Internet → Wi-Fi → Home → Phone (10 rooms) */
Object.assign(ICONS, {
  fibre: '<path d="M2 12c3-6 5 6 8 0s5 6 8 0 3-3 4-2" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
  isp: '<path d="M3 21V9l9-6 9 6v12z" fill="currentColor"/><rect x="9" y="12" width="6" height="9" rx="1" fill="#fff"/>',
  rack: '<rect x="5" y="2" width="14" height="20" rx="2" fill="currentColor"/><path d="M8 7h8M8 12h8M8 17h8" stroke="#fff" stroke-width="1.8"/>',
});
const XLOC = [
  {id:"server",   ic:"rack",   n:"LLM server room",    g:0},
  {id:"dispatch", ic:"box",    n:"Dispatch bay",       g:0},
  {id:"tunnel",   ic:"fibre",  n:"Fibre tunnel",       g:1},
  {id:"isp",      ic:"isp",    n:"Building · ISP box", g:1},
  {id:"wifi",     ic:"wifi",   n:"Wi-Fi router room",  g:2},
  {id:"hall",     ic:"tank",   n:"Hallway",            g:3},
  {id:"desk",     ic:"basket", n:"Rohan's desk",       g:3},
  {id:"pjoin",    ic:"phone",  n:"Phone · join",       g:4},
  {id:"pfin",     ic:"signal", n:"Phone · finish flag",g:4},
  {id:"pgate",    ic:"scan",   n:"Phone · app gate",   g:4},
];
const XGROUPS = ["Server","Internet","Wi-Fi","Home","Phone"];
/* rooms visited in each beat (last = where the camera rests).
   Order must match XBEATS: open,sse,chunks,blank,endline,flush,r1,basket,join,cut,finish,jam,guard,r2 */
const XBEAT_PATH = [
  [0],           // open
  [1],           // sse
  [2, 3, 4, 5],  // chunks
  [5],           // blank
  [],            // endline (concept)
  [5],           // flush
  [],            // r1 recap
  [6],           // basket
  [7],           // join
  [4],           // cut
  [8],           // finish
  [9],           // jam
  [9],           // guard
  [],            // r2 recap
];
/* indices: 4=endline, 6=r1, 13=r2 → empty paths */
const XBEAT_LOC = XBEAT_PATH.map((p, i) => {
  if (p.length) return p[p.length - 1];
  if (i === 6) return -1;   // r1
  if (i === 13) return -2;  // r2
  return -1;                // endline / other concept overlays
});
const XR1 = [0,1,2,3,5], XR2 = [0,1,2,3,4,5,6,7,8,9];
const XENTER = ["fade","slide","fade","zoom","fade","zoom","ff","slide","zoom","storm","zoom","slide","zoom","ff"];

function xMinimap() {
  const q = state.xq, cur = XBEAT_LOC[q.beat] ?? -1, recap = cur < 0;
  const seen = new Set();
  for (let b = 0; b < q.beat; b++) (XBEAT_PATH[b] || []).forEach(r => seen.add(r));
  (XBEAT_PATH[q.beat] || []).slice(0, -1).forEach(r => seen.add(r));
  const groups = XGROUPS.map((g, gi) => {
    const pins = XLOC.map((l, i) => [l, i]).filter(([l]) => l.g===gi).map(([l, i]) => {
      const c = i===cur ? "c" : (seen.has(i) || (recap && (cur===-2 || XR1.includes(i)))) ? "d" : "";
      return `<span class="mpin ${c}" title="${esc(l.n)}" data-testid="mm-${l.id}">${ic(l.ic, 11, "currentColor")}</span>`;
    }).join("");
    const on = XLOC.some((l, i) => l.g===gi && i===cur);
    return `<div class="mgrp ${on?"on":""}"><b>${g}</b><div class="mpins">${pins}</div></div>`;
  }).join(`<i class="mseg"></i>`);
  const replay = recap ? `<span class="mrun"></span>` : "";
  return `<div class="xmini ${recap?"replay":""}" data-testid="x-minimap">${groups}${replay}</div>`;
}
/* little phone that rides along in the corner of every scene: the journey's end is always visible */
function pip(mode) {
  const n = mode==="cut" ? 5 : 6, T = 0.5;
  const body = mode==="wait" ? ic("spin", 14) : mode==="blank" ? `<span class="pdots"><i></i><i></i><i></i></span>`
    : W6.slice(0, n).map((w, i) => `<span class="wd" style="animation-delay:${mode==="live"?0.3+i*0.3:0}s">${esc(w)}</span>`).join("") + (mode==="cut" ? '<span class="caret"></span>' : "");
  return `<div class="spip ${mode}" data-testid="x-pip">${ic("phone",12,"currentColor")}<div class="pb">${body}</div>${mode==="whole"?ic("check",12,"#10B981"):""}</div>`;
}
function xScene(loc, inner, o = {}) {
  const q = state.xq, l = XLOC[loc] || {id:o.id||"montage", ic:"ff", n:o.name||"Replay"};
  const enter = q.enter ? `enter-${XENTER[q.beat] || "fade"}` : "";
  return `<div class="xscene loc-${l.id} ${o.cls||""} ${enter}" data-testid="x-world">
    <div class="sbadge">${ic(l.ic,14,"currentColor")}<span>${esc(l.n)}</span></div>
    ${inner}${o.pip ? pip(o.pip) : ""}${o.bubble||""}${o.lens||""}</div>`;
}
const crateRow = (n, cls, T=0.45, d0=0) => W6.slice(0, n).map((w, i) => `<span class="mv ${cls}" style="animation-delay:${d0+i*T}s;--i:${i}">${esc(w.trim())}</span>`).join("");

const door = (side, cls="") => `<div class="rdoor ${side} ${cls}"></div>`;
const beltRun = (cls, n=6, T=0.5, extra="") => `<div class="rbelt ${cls}"><div class="stripes"></div>${W6.slice(0,n).map((w,i)=>`<span class="mv bc" style="animation-delay:${i*T}s">${esc(w.trim())}</span>`).join("")}${extra}</div>`;

/* 1 · LLM server room — wide; the lever opens the line and crates leave through the wall */
function scKitchen(bubble) {
  const on = state.xq.v.stream==="True";
  return xScene(0, `<div class="srvrows">${"<div class='srvrack'><i></i><i></i><i></i><i></i></div>".repeat(4)}</div><div class="srvfloor"></div>
    <button type="button" class="klever ${on?"on":"pulse"}" ${on?"":'data-act="x-lever"'} data-testid="x-lever" aria-label="stream lever"><span class="kstick"></span><span class="kbase"></span><code>stream=${state.xq.v.stream}</code></button>
    ${on ? beltRun("b-srv") : `<div class="rbelt b-srv idle"><div class="stripes"></div><span class="srvcook">${ic("clock",14,"#fff")}<i class="kbar"></i></span></div>`}${door("r")}`,
    { pip: on ? "live" : "wait", bubble });
}
/* 2 · data-centre dispatch bay — top-down; one pallet or six chunk crates */
function scDock(lensHtml) {
  const on = state.xq.v.stream==="True";
  return xScene(1, `<div class="dgrid"></div><div class="dhaz"></div><div class="dwall"><span class="dslot">${ic("fibre",22,"#FBBF24")}</span></div>
    <div class="dpallet ${on?"split":""}">${on ? crateRow(6,"dc",0.35) : `<span class="dbig">whole reply</span>`}</div>`,
    { pip: on ? "live" : "wait", lens: lensHtml });
}
/* 3 · across the internet — the camera travels through doorways: fibre tunnel → ISP box → router → hallway tank */
function scTank(bubble, hint) {
  const q = state.xq, settle = q.panDone;
  if (!settle && !q._pt) q._pt = setTimeout(() => { q._pt = null; if (state.scene!=="explore" || XBEATS[state.xq.beat].id!=="blank") return; q.panDone = true; render(); }, 4300);
  const pulses = n => Array.from({length:n}, (_, i) => `<i class="pls" style="animation-delay:${i*.35}s"></i>`).join("");
  return xScene(5, `<div class="pan ${settle?"done":""}" data-testid="x-pan">
      <div class="pp p-tunnel"><div class="ribs"></div><div class="fibre">${pulses(8)}</div><span class="ptag">${ic("fibre",14,"currentColor")} Fibre tunnel</span>${door("r","glow")}</div>
      <div class="pp p-isp">${door("l")}<div class="brick"></div><div class="ispbox"><i></i><i></i><i></i><b>ISP</b></div><div class="fibre short">${pulses(4)}</div><span class="ptag">${ic("isp",14,"currentColor")} Building · ISP box</span>${door("r")}</div>
      <div class="pp p-router">${door("l")}<div class="router calm"><i class="ant a1"></i><i class="ant a2"></i><span class="wave w1"></span><span class="wave w2"></span><span class="wave w3"></span></div>${beltRun("b-router",6,.4)}<span class="ptag">${ic("wifi",14,"currentColor")} Wi-Fi router</span>${door("r")}</div>
      <div class="pp p-hall">${door("l")}<div class="wallpaper"></div><div class="hframe"></div>${beltRun("b-hall",6,.4)}
        <button type="button" class="ttank ${q.bin?"open":""}" data-act="x-bin" data-testid="x-bin" aria-label="output buffer">
          <div class="tfill"></div><div class="twords">${W6.map((w,i)=>`<span class="mini-crate" style="animation-delay:${i*.4}s">${esc(w.trim())}</span>`).join("")}</div>
          <span class="tlab">${ic("tank",14,"currentColor")} ${q.bin?"held · not shown":"output buffer"}</span></button>
        <div class="tgauge"><i style="transform:rotate(${q.bin?70:40}deg)"></i></div>${door("r","room")}${settle?(hint||""):""}</div>
    </div>`, { pip: "blank", bubble: settle ? bubble : "", cls: "journey" });
}
/* 4 · hallway close-up — the dial panel on the wall, fed by the tank pipe */
function scPanel(lensHtml) {
  const v = state.xq.v, endOk = v.end==='""', flOk = v.flush==="True";
  return xScene(5, `<div class="wallpaper"></div><div class="hpipe"></div><div class="htank-edge"></div>
    <div class="pface wallp"><div class="pscrews"><i></i><i></i><i></i><i></i></div>
    <div class="pdial ${endOk?"ok":""}"><div class="pknob" style="transform:rotate(${endOk?40:-40}deg)"></div><b>end</b><code>${esc(v.end)}</code></div>
    <div class="pdial ${flOk?"ok":""}"><div class="pknob" style="transform:rotate(${flOk?40:-40}deg)"></div><b>flush</b><code>${esc(v.flush)}</code></div>
    <div class="pgauge"><div class="pneedle" style="transform:rotate(${flOk?-30:60}deg)"></div><span>${ic("tank",14,"currentColor")}</span></div>
    <div class="pscreen">${flOk&&endOk ? W6.map((w,i)=>`<span class="wd" style="animation-delay:${i*.4}s">${esc(w)}</span>`).join("") : '<span class="pdots"><i></i><i></i><i></i></span>'}</div></div>`,
    { pip: flOk && endOk ? "live" : "blank", lens: lensHtml, cls: "hall-close" });
}
/* 6 · Rohan's room desk — the belt comes through the wall onto the desk; catch the crates in parts */
function scPacking(bubble) {
  const q = state.xq;
  const target = `<div class="kbasket ${q.basket?"on":""}" ${q.basket?"":'data-xt="beltEnd" tabindex="0" role="button" aria-label="belt end on the desk"'} data-testid="w-basket">${q.basket?`${ic("basket",22,"#fff")}<code>parts</code><span class="kcount">6</span>`:ic("basket",26,"#F59E0B")}</div>`;
  return xScene(6, `<div class="rwin"><div class="rcity"></div><div class="irain"></div></div><div class="rlamp"></div><div class="rbed"></div>${door("l","hole")}
    <div class="rdesk"></div><div class="rbelt b-desk"><div class="stripes"></div></div>
    ${crateRow(6, q.basket ? "pc keep" : "pc lose", 0.5)}${target}`, { pip: "live", bubble });
}
/* 7 · phone close-up — the words wait inside the phone to be coupled */
function scCouple(lensHtml) {
  const q = state.xq, order = [3,0,5,2,4,1];
  return xScene(7, `<div class="ph-room"></div><div class="xphonebig"><div class="pnotch"></div><div class="pscreen2"><div class="ytracks"><i></i><i></i></div>${order.map((w, k) => `<span class="ycar ${q.parts.includes(w)?"in":""}" style="--x:${8+(k%3)*31}%;--y:${k<3?18:58}%">${esc(W6[w].trim())}</span>`).join("")}</div></div>${beltRun("b-port",0)}`,
    { lens: lensHtml, cls: "phone-close" });
}
/* 8 · Wi-Fi router room — Ila's storm cuts the link here */
function scBridge(bubble) {
  const q = state.xq;
  return xScene(4, `<div class="rwin storm"><div class="irain"></div><div class="bflash"></div></div><div class="shelf"></div>
    <div class="router"><i class="ant a1"></i><i class="ant a2"></i><span class="wave w1"></span><span class="wave w2"></span><span class="wave w3"></span></div>
    <div class="rbelt b-wifi cut"><div class="stripes"></div>${W6.slice(0,5).map((w,i)=>`<span class="bcar2" style="--x:${4+i*8}%">${esc(w.trim())}</span>`).join("")}<i class="bgap2"></i></div>
    <div class="bila"><img src="${ART}ila-face.jpg" alt="Ila">${ic("scissors",18,"#FCA5A5")}</div>
    <button type="button" class="wboard bboard ${q.lie?"bad":""}" ${q.lie?"":'data-act="x-lie"'} data-testid="x-lie">${q.lie?`${ic("x",16,"#fff")} not finished`:`${ic("check",16,"#fff")} Delivered ✓`}</button>`,
    { pip: "cut", bubble, cls: "stormy" });
}
/* 9 · phone (landscape) — a tiny train + guard van + signal read the finish flag */
function scSignal(lensHtml) {
  const f = state.xq.v.fin, lamp = f==='"stop"' ? "g" : f==='"length"' ? "a" : "r";
  return xScene(8, `<div class="ph-room alt"></div><div class="xphoneland"><div class="pscreen2"><div class="rhills"></div><div class="rtrack"></div>
    <div class="rtrain"><span class="engine">LLM</span>${W6.slice(0, f==="None"?5:6).map(w=>`<span class="coach"><i></i><i></i>${esc(w.trim())}</span>`).join("")}<span class="coach guard ${f!=="None"?"on":""}">${f!=="None"?ic("flag",14,"#fff"):"?"}</span></div>
    <div class="rsig ${lamp}"><i class="r"></i><i class="a"></i><i class="g"></i></div></div></div>`,
    { lens: lensHtml, cls: "phone-close" });
}
/* 10 · phone app gate (wide) — an empty usage crate jams the gate into the app */
function scToll(bubble) {
  const q = state.xq;
  return xScene(9, `<div class="ph-room"></div>${beltRun("b-gate",6,.3,`<span class="mv bc flagc" style="animation-delay:1.8s">${ic("flag",12,"#fff")}</span>`)}
    <div class="xphonebig right"><div class="pnotch"></div><div class="pscreen2 apps"><div class="agrid">${"<i></i>".repeat(8)}</div><div class="agate"><span class="abar"></span>${ic("scan",26,"currentColor")}</div><span class="aempty">${ic("chart",14,"#fff")}</span></div></div>
    <button type="button" class="wjam tjam ${q.jam?"open":""}" data-act="x-jam" data-testid="x-jam">${ic("boom",20,"#fff")}<span>${q.jam?'<code>choices: []</code>':"IndexError"}</span></button>`,
    { pip: "whole", bubble });
}
/* 11 · inside the app gate (close-up) — two scanner arches */
function scCheck(lensHtml) {
  const g = state.xq.gates, ok = g.g1==="choices" && g.g2==="piece";
  return xScene(9, `<div class="bezel"></div><div class="clane"></div><div class="carch a1 ${g.g1?"on":""}">${ic("scan",34,"currentColor")}<b>1</b></div><div class="carch a2 ${g.g2?"on":""}">${ic("scan",34,"currentColor")}<b>2</b></div>
    <span class="ccr usec" style="--x:8%">${ic("chart",12,"#fff")}</span><span class="ccr" style="--x:16%">""</span><span class="ccr" style="--x:24%">Your</span>`,
    { pip: ok ? "whole" : "live", lens: lensHtml, cls: "gate-close" });
}
/* recaps — fast-forward montage over the route, ending on Rohan's phone */
function scMontage(list, lit, done, bubble) {
  const long = list.length > 5;
  const cards = list.map(i => { const l = XLOC[i]; return `<div class="mcard loc-${l.id} ${lit.includes(i)?"lit":""}" data-testid="mc-${l.id}">${ic(l.ic,18,"currentColor")}</div>`; }).join(`<span class="fxa">${ic("ff",14,"currentColor")}</span>`);
  if (!done) return xScene(-1, `<div class="mstrip ${long?"long":""}">${cards}</div>`, { id:"montage", name:"Replay the route", cls:"montage" });
  return xScene(-1, `<div class="mstrip small ${long?"long":""}">${cards}</div>
    <div class="bigphone live center"><div class="ph-h"><span class="logo-dd">DD</span>Support<span class="sp"></span><span class="st-ok">● live</span></div><div class="b u">Where is my order?</div>
      <div class="b bot">${W6.map((w,i)=>`<span class="wd" style="animation-delay:${.3+i*.35}s">${esc(w)}</span>`).join("")}${long?ic("check",14,"#10B981"):""}</div></div>`,
    { id:"montage", name:"Rohan's phone", cls:"montage closeup", bubble });
}
