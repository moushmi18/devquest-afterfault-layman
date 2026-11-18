/* DevQuest Afterfault demo — icons, markup, chrome */
const ART = "art/";
const STAGES = ["Discovery","Explore","Assign","Predictions","Code","Debug","Mastery"];
const STAGE_ICON = ["search","compass","task","eye","code","bug","crown"];
const CHAR = {
  tanvi: { name: "Tanvi Shah", first: "Tanvi", branch: "CSE · lead analyst" },
  rohan: { name: "Rohan Iyer", first: "Rohan", branch: "ECE · comms & instrumentation" },
  samar: { name: "Samar Kulkarni", first: "Samar", branch: "Mechanical · physical systems" },
  sana: { name: "Sana Qureshi", first: "Sana", branch: "Civil · structural risk" },
};
const ICONS = {
  check: '<path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  x: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" stroke-width="2.6" fill="none"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor"/>',
  heart: '<path d="M12 21s-8-5.2-8-11a4.6 4.6 0 018-3 4.6 4.6 0 018 3c0 5.8-8 11-8 11z" fill="currentColor"/>',
  play: '<path d="M7 4l13 8-13 8z" fill="currentColor"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>',
  step: '<path d="M5 4l10 8-10 8z" fill="currentColor"/><rect x="16" y="4" width="3" height="16" rx="1" fill="currentColor"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="2.8" fill="none"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  compass: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.6" fill="none"/><path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor"/>',
  task: '<rect x="5" y="3" width="14" height="18" rx="3" stroke="currentColor" stroke-width="2.4" fill="none"/><path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="2.4" fill="none"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5" stroke="currentColor" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  bug: '<rect x="7" y="8" width="10" height="12" rx="5" fill="currentColor"/><path d="M9 6l1.5 2M15 6l-1.5 2M3 12h4M17 12h4M4 18l3-1.5M20 18l-3-1.5M4 7l3 2M20 7l-3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="currentColor"/>',
  star: '<path d="M12 2.5l2.9 6.2 6.6.7-5 4.5 1.4 6.6L12 17.2l-5.9 3.3 1.4-6.6-5-4.5 6.6-.7z" fill="currentColor"/>',
  refresh: '<path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linejoin="round"/>',
  term: '<rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" stroke-width="2.4" fill="none"/><path d="M7 9l3 3-3 3M12 15h5" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.6 10.8c.6.5 1.1 1.4 1.1 2.2h5c0-.8.5-1.7 1.1-2.2A6 6 0 0012 3z" stroke="currentColor" stroke-width="2.3" fill="none" stroke-linecap="round"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" stroke="currentColor" stroke-width="2.3" fill="none" stroke-linejoin="round"/><path d="M9 4v14M15 6v14" stroke="currentColor" stroke-width="2.3"/>',
  shield: '<path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z" fill="currentColor"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="2" fill="currentColor"/><path d="M12 9v12M3 13h18" stroke="#fff" stroke-width="2"/><path d="M12 9C9 9 7 7.5 8 5.5S12 6 12 9zm0 0c3 0 5-1.5 4-3.5S12 6 12 9z" fill="currentColor"/>',
  scissors: '<circle cx="6" cy="7" r="3" stroke="currentColor" stroke-width="2.3" fill="none"/><circle cx="6" cy="17" r="3" stroke="currentColor" stroke-width="2.3" fill="none"/><path d="M8.5 8.5L20 19M8.5 15.5L20 5" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linejoin="round"/>',
  hex: '<path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" fill="url(#hx)"/><path d="M12 7l4.33 2.5v5L12 17l-4.33-2.5v-5z" fill="#fff"/>',
  dot: '<circle cx="12" cy="12" r="5" fill="currentColor"/>',
  spin: '<circle cx="12" cy="12" r="8" stroke="#E5E7EB" stroke-width="3.5" fill="none"/><path d="M12 4a8 8 0 018 8" stroke="#7C3AED" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
  sun: '<circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  moon: '<path d="M20 14.5A7.5 7.5 0 119.5 4 6 6 0 0020 14.5z" fill="currentColor"/>',
};

function ic(name, size=16, color="currentColor", style="") {
  const defs = name==="hex"
    ? '<defs><linearGradient id="hx" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7C3AED"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs>'
    : "";
  const cls = name==="spin" ? " spin" : "";
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" style="color:${color};flex:none;${style}">${defs}${ICONS[name]||""}</svg>`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function md(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|[\s(“"])\*([^*\s][^*]*?)\*(?=[\s.,;:!?)"”]|$)/g, '$1<i>$2</i>')
    .replace(/`([^`]+)`/g, '<code class="inline">$1</code>');
}

const KW = /\b(for|in|if|elif|else|not|return|def|import|from|try|except|as|while|True|False|None|and|or|continue|break|yield|pass|class|with|is)\b/;
const TOK = /(?<c>#.*$)|(?<s>f?"(?:[^"\\]|\\.)*"|f?'(?:[^'\\]|\\.)*')|(?<k>for|in|if|elif|else|not|return|def|import|from|try|except|as|while|True|False|None|and|or|continue|break|yield|pass|class|with|is)\b|(?<m>\b\d+(?:\.\d+)?\b)|(?<fn>\b[A-Za-z_]\w*(?=\())/g;

function hlLine(line) {
  const re = /\{\{([^}]*)\}\}|(?:#.*$)|(?:f?"(?:[^"\\]|\\.)*"|f?'(?:[^'\\]|\\.)*')|(?:\b(?:for|in|if|elif|else|not|return|def|import|from|try|except|as|while|True|False|None|and|or|continue|break|yield|pass|class|with|is)\b)|(?:\b\d+(?:\.\d+)?\b)|(?:\b[A-Za-z_]\w*(?=\())/g;
  let out = "", i = 0, m;
  while ((m = re.exec(line))) {
    out += esc(line.slice(i, m.index));
    i = m.index + m[0].length;
    if (m[1] != null) {
      const parts = m[1].split("|");
      const cls = parts[1] || "";
      const txt = parts[2] != null ? parts[2] : "[" + parts[0] + "]";
      const n = parts[0];
      out += `<span class="slot ${cls}" data-act="slot" data-n="${esc(n)}">${esc(txt)}</span>`;
      continue;
    }
    const t = m[0];
    let g = "fn";
    if (t.startsWith("#")) g = "c";
    else if (t.startsWith("f\"") || t.startsWith("f'") || t.startsWith("\"") || t.startsWith("'")) g = "s";
    else if (KW.test(t) && t.match(KW)[0] === t) g = "k";
    else if (/^\d/.test(t)) g = "m";
    out += `<span class="${g}">${esc(t)}</span>`;
  }
  out += esc(line.slice(i));
  return out;
}

function codeBlock(src, title, marks={}, cls="", start=1) {
  const rows = src.replace(/^\n/,"").replace(/\n$/,"").split("\n").map((l,i) => {
    const n = i + start;
    const mk = marks[n] || "";
    return `<div class="ln ${mk}" data-ln="${n}"><span class="n">${n}</span><span>${hlLine(l) || " "}</span></div>`;
  }).join("");
  const hd = title != null
    ? `<div class="codehd"><span class="dots"><i></i><i></i><i></i></span>${esc(title)}</div>`
    : "";
  return `<div class="code ${cls}">${hd}${rows}</div>`;
}

function btn(label, act, extra="", cls="") {
  return `<button type="button" class="btn ${cls}" data-act="${act}" ${extra}>${label}</button>`;
}

function opt(L, text, state="", act="pick", extra="") {
  let mark = "";
  if (state==="ok") mark = ic("check",18,"#10B981","margin-left:auto");
  if (state==="bad") mark = ic("x",18,"#EF4444","margin-left:auto");
  return `<button type="button" class="opt ${state}" data-act="${act}" data-l="${L}" ${extra}><span class="L">${L}</span><span>${md(text)}</span>${mark}</button>`;
}

function fb(kind, title, text) {
  const icn = {ok:"check",bad:"x",am:"bulb",pu:"bulb"}[kind];
  return `<div class="fb ${kind}"><span class="ico">${ic(icn,17,"#fff")}</span><div><b>${md(title)}</b> ${md(text)}</div></div>`;
}

function testRow(id, name, state="pend", hidden=false, note="") {
  const icn = state==="pass" ? ic("check",12,"#fff") : state==="fail" ? ic("x",12,"#fff") : "";
  const nt = note ? `<span style="color:#B91C1C;font-weight:600;margin-left:6px">${md(note)}</span>` : "";
  return `<div class="t ${state}" data-testid="test-${id}"><span class="bx">${icn}</span><b>${id}</b><span>${md(name)}</span>${nt}<span class="h">${hidden?"hidden":"visible"}</span></div>`;
}

function pbar(pct, color="linear-gradient(90deg,#7C3AED,#F59E0B)", h=12) {
  return `<div class="pbar" style="height:${h}px"><div style="width:${pct}%;background:${color}"></div></div>`;
}

function stepdots(cur, done) {
  const labs = ["E1","E2","E3","R1","E4","E5","E6","R2"];
  return `<div class="stepdots">${labs.map((l,i) => {
    const c = i===cur ? "c" : (i<done ? "d" : "");
    return `<span class="${c}">${l}</span>`;
  }).join("")}</div>`;
}

function theLine(nWords, done=false) {
  if (nWords == null) return "";
  const words = "Your order is on the way.".split(" ");
  const got = words.slice(0, nWords).join(" ");
  const rest = words.slice(nWords).join(" ");
  const pct = Math.round(100 * nWords / words.length);
  const dot = done ? ' <span style="color:#F59E0B">●</span>' : "";
  return `<div class="line"><i>THE LINE</i><div class="tx">${esc(got)}<span class="caret"></span> <u>${esc(rest)}</u>${dot}</div><div class="bar"><div style="width:${pct}%"></div></div></div>`;
}

function dl(who, text, me) {
  const imgs = {tanvi:"tanvi-face",rohan:"rohan-face",samar:"samar-face",sana:"sana-face",ila:"ila-face",vyapti:"vyapti-speak",
    "tanvi+":"tanvi-happy","rohan+":"rohan-happy","samar+":"samar-happy","sana+":"sana-happy","ila+":"ila-happy"};
  const isMe = who === "me" || who === me || who === me+"+";
  let key = who;
  if (who === "me") key = me;
  if (who === "me+") key = me+"+";
  const name = who.startsWith("vyapti") ? "VYAPTI" : who.startsWith("ila") ? "ILA" : (CHAR[key.replace("+","")]||CHAR[me]).first.toUpperCase();
  const c = who.startsWith("vyapti") ? "vy" : who.startsWith("ila") ? "ila" : (isMe ? "me" : "");
  const imgKey = key in imgs ? key : (isMe ? (who.endsWith("+") ? me+"+" : me) : key);
  const orbi = who.startsWith("vyapti") ? "orbi" : "";
  const you = isMe ? " · YOU" : "";
  return `<div class="dl ${c}"><img class="${orbi}" src="${ART}${imgs[imgKey]||imgs[me]}.jpg" alt=""><div class="bb"><b>${name}${you}</b>${md(text)}</div></div>`;
}

function chip(text, cls="") { return `<span class="chip ${cls}">${text}</span>`; }
